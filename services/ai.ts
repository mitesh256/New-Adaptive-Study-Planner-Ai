
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { UserProfile, Subject, Topic, DailyPlan, Difficulty, TopicStatus, PlanItem, TopicSuggestion } from '../types';

// Initialize with the mandatory pattern
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * A helper to perform retries with exponential backoff.
 * Useful for handling 429 (Resource Exhausted) and temporary 5xx errors.
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      // Only retry on rate limits or server errors
      const status = error?.status || (error?.message?.includes('429') ? 429 : 500);
      if (status === 429 || (status >= 500 && status <= 599)) {
        const delayMs = initialDelay * Math.pow(2, i);
        console.warn(`AI API error (${status}). Retrying in ${delayMs}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const suggestRelatedTopics = async (
  profile: UserProfile,
  subject: Subject,
  existingTopics: Topic[]
): Promise<TopicSuggestion[]> => {
  const existingNames = existingTopics.map(t => t.name).join(', ');
  
  const prompt = `
    You are a senior academic mentor. Based on the subject "${subject.name}" and the following existing topics already in the syllabus: [${existingNames}], suggest 3-5 new, academically relevant topics that would naturally extend the student's learning journey.
    
    Strict Guidelines:
    1. Suggestions must strictly belong to the domain of "${subject.name}".
    2. Do NOT suggest topics already in the syllabus.
    3. Topic names should be concise and academic.
    4. Provide a difficulty (easy, medium, or hard) and an estimated_hours (1-10) for each.
    5. No motivational or conversational text in the JSON response.
  `;

  try {
    // Explicitly type the result of withRetry to fix "Property 'text' does not exist on type 'unknown'"
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] },
              estimated_hours: { type: Type.NUMBER }
            },
            required: ["name", "difficulty", "estimated_hours"]
          }
        }
      }
    }));

    const suggestions = JSON.parse(response.text || '[]');
    return suggestions.map((s: any) => ({
      ...s,
      subject_id: subject.id,
      suggested_flag: true
    }));
  } catch (error) {
    console.error("Failed to generate topic suggestions:", error);
    return [];
  }
};

export const generateDailyPlan = async (
  profile: UserProfile,
  subjects: Subject[],
  topics: Topic[],
  history: DailyPlan[],
  targetDateStr?: string
): Promise<DailyPlan> => {
  const today = new Date().toISOString().split('T')[0];
  const dateToPlan = targetDateStr || today;
  const isPreview = dateToPlan !== today;
  
  // 1. DETERMINISTIC BACKEND PRE-PROCESSING
  const pendingTopics = topics.filter(t => t.status === TopicStatus.PENDING);
  const completedTopics = topics.filter(t => t.status === TopicStatus.DONE);
  
  const examDate = new Date(profile.exam_date);
  const targetDateObj = new Date(dateToPlan);
  const daysToExam = Math.max(0, Math.ceil((examDate.getTime() - targetDateObj.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Light day detection
  const dayBeforeTarget = new Date(targetDateObj);
  dayBeforeTarget.setDate(dayBeforeTarget.getDate() - 1);
  const dayBeforeStr = dayBeforeTarget.toISOString().split('T')[0];
  const dayBeforePlan = history.find(p => p.date === dayBeforeStr);
  const missedPreviousDay = dayBeforePlan && !dayBeforePlan.completed;

  // Exam mode detection (< 10 days)
  const isExamMode = daysToExam <= 10;

  // Identify prioritized topics
  const priorityTopics = pendingTopics
    .filter(t => t.is_hard_marked)
    .sort((a, b) => b.exposure_count - a.exposure_count);

  const prompt = `
    System Instruction: You are a senior teacher guiding a student gently. Your tone is calm, non-judgmental, and sustainable.
    
    Context:
    - Target Planning Date: ${dateToPlan} (Current Date: ${today})
    - Days to Exam: ${daysToExam}
    - Daily Limit: ${profile.daily_available_hours} hours
    - Preferred Time: ${profile.preferred_study_time}
    - Missed Previous Day: ${missedPreviousDay ? "Yes (Reduce load, be extra supportive)" : "No"}
    - Exam Mode: ${isExamMode ? "Active (Focus on revision, shorter sessions, reassurance)" : "Inactive (Mix learning and progress)"}
    
    Available Syllabus (Pending): ${JSON.stringify(pendingTopics.map(t => ({ id: t.id, name: t.name, difficulty: t.difficulty })))}
    Completed Topics (For Revision): ${JSON.stringify(completedTopics.map(t => ({ id: t.id, name: t.name })))}
    Priority (Marked Hard): ${JSON.stringify(priorityTopics.map(t => t.name))}

    Strict Requirements:
    1. Only use topic IDs provided. NEVER hallucinate topic IDs or names.
    2. Total allocated_time must be <= ${profile.daily_available_hours}.
    3. Include at most 1 HARD difficulty topic per day.
    4. If Missed Previous Day is true, reduce total time by 30%.
    5. If Exam Mode is active, prioritize revision of Completed Topics over new ones.
    6. Return a JSON object matching the provided schema.
  `;

  try {
    // Explicitly type the result of withRetry to fix "Property 'text' does not exist on type 'unknown'"
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mentor_message: { type: Type.STRING, description: "A gentle, teacher-like message for the student." },
            reasoning: { type: Type.STRING, description: "The AI's logic for choosing these topics." },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic_id: { type: Type.STRING },
                  allocated_time: { type: Type.NUMBER },
                  reason: { type: Type.STRING }
                },
                required: ["topic_id", "allocated_time", "reason"]
              }
            }
          },
          required: ["mentor_message", "reasoning", "items"]
        }
      }
    }));

    const draft = JSON.parse(response.text || '{}');
    
    // 2. DETERMINISTIC VALIDATION LAYER (MANDATORY)
    const finalItems: PlanItem[] = [];
    let currentTime = 0;
    let hardCount = 0;
    const timeLimit = missedPreviousDay ? profile.daily_available_hours * 0.7 : profile.daily_available_hours;

    for (const item of (draft.items || [])) {
      const topic = topics.find(t => t.id === item.topic_id);
      if (!topic) continue; 
      
      if (topic.difficulty === Difficulty.HARD) {
        if (hardCount >= 1) continue;
        hardCount++;
      }

      if (currentTime + item.allocated_time <= timeLimit) {
        finalItems.push({
          subject_id: topic.subject_id,
          topic_id: topic.id,
          allocated_time: item.allocated_time,
          reason: item.reason
        });
        currentTime += item.allocated_time;
      }
    }

    return {
      date: dateToPlan,
      mentor_message: draft.mentor_message || "Let's take a steady step forward.",
      reasoning: draft.reasoning || "A balanced selection from your syllabus.",
      items: finalItems,
      completed: false,
      preview_flag: isPreview
    };

  } catch (error: any) {
    console.error("AI Generation failed definitively:", error);
    return {
      date: dateToPlan,
      mentor_message: "I'm here for you. Technology can be unpredictable, but our journey continues. Let's focus on one simple step while things stabilize.",
      reasoning: "Fallback triggered after definitive API failure.",
      items: pendingTopics[0] ? [{
        topic_id: pendingTopics[0].id,
        subject_id: pendingTopics[0].subject_id,
        allocated_time: Math.min(1.5, profile.daily_available_hours),
        reason: "Picking the next logical step from your syllabus."
      }] : [],
      completed: false,
      preview_flag: isPreview
    };
  }
};
