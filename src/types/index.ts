export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  age?: number;
  healthGoals?: string[];
}

export interface HealthLog {
  id: string;
  userId: string;
  type: 'water' | 'sleep' | 'food' | 'screen' | 'mood';
  value: number; // glasses, hours, calories, minutes, mood index
  notes?: string;
  timestamp: Date;
}

export interface LabReport {
  id: string;
  userId: string;
  imageUrl?: string;
  summary: string;
  results: LabValue[];
  lifestyleTips: string[];
  doctorQuestions: string[];
  timestamp: Date;
}

export interface LabValue {
  name: string;
  value: string;
  unit: string;
  range: string;
  status: 'normal' | 'low' | 'high';
  meaning: string;
  tip: string;
}

export interface DailyStats {
  water: number;
  sleep: number;
  calories: number;
  screenTime: number;
  mood: number;
}
