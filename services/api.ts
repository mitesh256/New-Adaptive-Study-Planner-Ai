
import { 
  UserProfile, 
  Subject, 
  Topic, 
  DailyPlan, 
  AuthResponse, 
  TopicStatus,
  Difficulty 
} from '../types';
import { STORAGE_KEYS } from '../constants';

// Simulated latency helper
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

class ApiService {
  private getStorage<T>(key: string, defaultValue: T): T {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  }

  private setStorage<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async login(email: string): Promise<AuthResponse> {
    await delay(800);
    const token = `mock-jwt-${btoa(email)}`;
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    
    // Ensure profile exists or create skeleton
    let profile = this.getStorage<UserProfile | null>(STORAGE_KEYS.PROFILE, null);
    if (!profile) {
      profile = {
        id: 'u1',
        email,
        exam_date: '',
        daily_available_hours: 4,
        preferred_study_time: 'morning',
        onboarding_completed: false
      };
      this.setStorage(STORAGE_KEYS.PROFILE, profile);
    }
    
    return { token };
  }

  async logout() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  }

  async getProfile(): Promise<UserProfile> {
    await delay(500);
    const profile = this.getStorage<UserProfile | null>(STORAGE_KEYS.PROFILE, null);
    if (!profile) throw new Error('Not authenticated');
    return profile;
  }

  async updateOnboarding(data: Partial<UserProfile>, subjects: Subject[], topics: Topic[]): Promise<UserProfile> {
    await delay(1000);
    const profile = await this.getProfile();
    const updatedProfile = { ...profile, ...data, onboarding_completed: true };
    
    this.setStorage(STORAGE_KEYS.PROFILE, updatedProfile);
    this.setStorage(STORAGE_KEYS.SYLLABUS, subjects);
    this.setStorage(STORAGE_KEYS.TOPICS, topics);
    
    return updatedProfile;
  }

  async getSyllabus(): Promise<{ subjects: Subject[], topics: Topic[] }> {
    const subjects = this.getStorage<Subject[]>(STORAGE_KEYS.SYLLABUS, []);
    const topics = this.getStorage<Topic[]>(STORAGE_KEYS.TOPICS, []);
    return { subjects, topics };
  }

  async getPlans(): Promise<DailyPlan[]> {
    return this.getStorage<DailyPlan[]>(STORAGE_KEYS.PLANS, []);
  }

  async savePlan(plan: DailyPlan): Promise<void> {
    const plans = await this.getPlans();
    const existingIndex = plans.findIndex(p => p.date === plan.date);
    if (existingIndex > -1) {
      plans[existingIndex] = plan;
    } else {
      plans.push(plan);
    }
    this.setStorage(STORAGE_KEYS.PLANS, plans);
  }

  async addTopic(topic: Topic): Promise<void> {
    await delay(500);
    const topics = this.getStorage<Topic[]>(STORAGE_KEYS.TOPICS, []);
    topics.push(topic);
    this.setStorage(STORAGE_KEYS.TOPICS, topics);
  }

  async updateTopic(topicId: string, updates: Partial<Topic>): Promise<Topic> {
    await delay(300);
    const topics = this.getStorage<Topic[]>(STORAGE_KEYS.TOPICS, []);
    const index = topics.findIndex(t => t.id === topicId);
    if (index === -1) throw new Error('Topic not found');
    
    topics[index] = { ...topics[index], ...updates };
    this.setStorage(STORAGE_KEYS.TOPICS, topics);
    return topics[index];
  }
}

export const api = new ApiService();
