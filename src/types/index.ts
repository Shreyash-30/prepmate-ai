export type MasteryLevel = 'strong' | 'improving' | 'weak' | 'not_started';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  onboarded: boolean;
}

export interface Task {
  id: string;
  title: string;
  type: 'practice' | 'revision' | 'learn' | 'mock';
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_minutes: number;
  completed: boolean;
  due_date: string;
}

export interface TopicProgress {
  id: string;
  name: string;
  category: string;
  mastery: MasteryLevel;
  problems_solved: number;
  total_problems: number;
  last_practiced: string;
  confidence: number; // 0-100
}

export interface ReadinessScore {
  overall: number;
  dsa: number;
  os: number;
  dbms: number;
  cn: number;
  oops: number;
}

export interface DailyActivity {
  date: string;
  problems_solved: number;
  hours_studied: number;
  topics_covered: number;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  platform: string;
  solved: boolean;
  url?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface MockInterviewSession {
  id: string;
  status: 'pending' | 'in_progress' | 'completed';
  duration_minutes: number;
  problems: Problem[];
  score?: number;
  feedback?: string;
}
