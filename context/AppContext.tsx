
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, UserProfile, Subject, Topic, DailyPlan, TopicStatus, TopicSuggestion } from '../types';
import { api } from '../services/api';
import { generateDailyPlan, suggestRelatedTopics } from '../services/ai';

interface AppContextType extends AppState {
  loading: boolean;
  suggestions: Record<string, TopicSuggestion[]>;
  refreshData: () => Promise<void>;
  markTopicDone: (topicId: string) => Promise<void>;
  markTopicHard: (topicId: string) => Promise<void>;
  getTodayPlan: (force?: boolean) => Promise<void>;
  getTomorrowPreview: () => Promise<void>;
  fetchSuggestions: (subjectId: string) => Promise<void>;
  approveSuggestion: (subjectId: string, suggestion: TopicSuggestion) => Promise<void>;
  rejectSuggestion: (subjectId: string, topicName: string) => void;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    profile: null,
    subjects: [],
    topics: [],
    todayPlan: null,
    history: [],
    tomorrowPreview: null
  });
  const [suggestions, setSuggestions] = useState<Record<string, TopicSuggestion[]>>({});
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    try {
      const token = localStorage.getItem('as_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const profile = await api.getProfile();
      if (profile.onboarding_completed) {
        const { subjects, topics } = await api.getSyllabus();
        const history = await api.getPlans();
        const today = new Date().toISOString().split('T')[0];
        const todayPlan = history.find(p => p.date === today) || null;

        // Ensure confidence_score exists for all topics
        const normalizedTopics = topics.map(t => ({
          ...t,
          confidence_score: t.confidence_score ?? (t.status === TopicStatus.DONE ? 100 : 0)
        }));

        setState({ profile, subjects, topics: normalizedTopics, todayPlan, history, tomorrowPreview: null });
      } else {
        setState(prev => ({ ...prev, profile, tomorrowPreview: null }));
      }
    } catch (err) {
      console.error("Failed to refresh data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getTodayPlan = async (force = false) => {
    if (!state.profile) return;
    const today = new Date().toISOString().split('T')[0];
    
    if (state.todayPlan && !force) return;

    setLoading(true);
    const newPlan = await generateDailyPlan(
      state.profile,
      state.subjects,
      state.topics,
      state.history
    );
    await api.savePlan(newPlan);
    
    const updatedHistory = await api.getPlans();
    setState(prev => ({ 
      ...prev, 
      todayPlan: newPlan, 
      history: updatedHistory,
      tomorrowPreview: null
    }));
    setLoading(false);
  };

  const getTomorrowPreview = async () => {
    if (!state.profile || !state.todayPlan || !state.todayPlan.completed) return;
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const alreadyExists = state.history.some(p => p.date === tomorrowStr);
    if (alreadyExists) return;

    setLoading(true);
    try {
      const preview = await generateDailyPlan(
        state.profile,
        state.subjects,
        state.topics,
        state.history,
        tomorrowStr
      );
      setState(prev => ({ ...prev, tomorrowPreview: preview }));
    } catch (error) {
      console.error("Failed to generate preview", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async (subjectId: string) => {
    if (!state.profile) return;
    const subject = state.subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const existingTopics = state.topics.filter(t => t.subject_id === subjectId);
    const newSuggestions = await suggestRelatedTopics(state.profile, subject, existingTopics);
    
    const filteredSuggestions = newSuggestions.filter(s => 
      !state.topics.some(t => t.name.toLowerCase() === s.name.toLowerCase() && t.subject_id === subjectId)
    );

    setSuggestions(prev => ({
      ...prev,
      [subjectId]: filteredSuggestions
    }));
  };

  const approveSuggestion = async (subjectId: string, suggestion: TopicSuggestion) => {
    const newTopic: Topic = {
      id: `topic-${Date.now()}`,
      subject_id: subjectId,
      name: suggestion.name,
      difficulty: suggestion.difficulty,
      estimated_hours: suggestion.estimated_hours,
      status: TopicStatus.PENDING,
      is_hard_marked: false,
      exposure_count: 0,
      confidence_score: 0
    };

    await api.addTopic(newTopic);
    
    setState(prev => ({
      ...prev,
      topics: [...prev.topics, newTopic]
    }));

    rejectSuggestion(subjectId, suggestion.name);
  };

  const rejectSuggestion = (subjectId: string, topicName: string) => {
    setSuggestions(prev => ({
      ...prev,
      [subjectId]: (prev[subjectId] || []).filter(s => s.name !== topicName)
    }));
  };

  const markTopicDone = async (topicId: string) => {
    const targetTopic = state.topics.find(t => t.id === topicId);
    if (!targetTopic) return;

    const nextConfidence = Math.min(100, (targetTopic.confidence_score || 0) + 100);

    setState(prev => ({
      ...prev,
      topics: prev.topics.map(t => t.id === topicId ? { 
        ...t, 
        status: TopicStatus.DONE, 
        exposure_count: t.exposure_count + 1,
        confidence_score: nextConfidence
      } : t)
    }));

    await api.updateTopic(topicId, { status: TopicStatus.DONE, confidence_score: nextConfidence });
    
    if (state.todayPlan) {
      const currentTopics = state.topics.map(t => t.id === topicId ? { ...t, status: TopicStatus.DONE } : t);
      const allDone = state.todayPlan.items.every(item => {
        const t = currentTopics.find(top => top.id === item.topic_id);
        return t?.status === TopicStatus.DONE;
      });
      if (allDone) {
        const updatedPlan = { ...state.todayPlan, completed: true };
        await api.savePlan(updatedPlan);
        setState(prev => ({ ...prev, todayPlan: updatedPlan }));
      }
    }
  };

  const markTopicHard = async (topicId: string) => {
    const topic = state.topics.find(t => t.id === topicId);
    if (!topic) return;
    
    const nextHardMarked = !topic.is_hard_marked;
    
    setState(prev => ({
      ...prev,
      topics: prev.topics.map(t => t.id === topicId ? { ...t, is_hard_marked: nextHardMarked } : t)
    }));
    await api.updateTopic(topicId, { is_hard_marked: nextHardMarked });
  };

  const logout = async () => {
    await api.logout();
    setState({ profile: null, subjects: [], topics: [], todayPlan: null, history: [], tomorrowPreview: null });
    setSuggestions({});
  };

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return (
    <AppContext.Provider value={{ 
      ...state, 
      loading, 
      suggestions,
      refreshData, 
      markTopicDone, 
      markTopicHard, 
      getTodayPlan,
      getTomorrowPreview,
      fetchSuggestions,
      approveSuggestion,
      rejectSuggestion,
      logout 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
