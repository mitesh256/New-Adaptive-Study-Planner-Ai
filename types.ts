
export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export enum TopicStatus {
  PENDING = 'pending',
  DONE = 'done'
}

export interface UserProfile {
  id: string;
  email: string;
  exam_date: string;
  daily_available_hours: number;
  preferred_study_time: string;
  onboarding_completed: boolean;
}

export interface Topic {
  id: string;
  subject_id: string;
  name: string;
  difficulty: Difficulty;
  estimated_hours: number;
  status: TopicStatus;
  is_hard_marked: boolean;
  exposure_count: number;
  confidence_score: number; // Mastery percentage 0-100
}

export interface TopicSuggestion {
  name: string;
  difficulty: Difficulty;
  estimated_hours: number;
  subject_id: string;
  suggested_flag: true;
}

export interface Subject {
  id: string;
  name: string;
}

export interface PlanItem {
  subject_id: string;
  topic_id: string;
  allocated_time: number;
  reason: string;
}

export interface DailyPlan {
  date: string; // ISO YYYY-MM-DD
  mentor_message: string;
  reasoning: string;
  items: PlanItem[];
  completed: boolean;
  preview_flag?: boolean;
}

export interface AppState {
  profile: UserProfile | null;
  subjects: Subject[];
  topics: Topic[];
  todayPlan: DailyPlan | null;
  history: DailyPlan[];
  tomorrowPreview: DailyPlan | null;
}

export interface AuthResponse {
  token: string;
}
