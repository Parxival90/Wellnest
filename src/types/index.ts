export type HabitType = 'exercise' | 'water' | 'sleep' | 'mood';

export type HabitFrequency = 'daily' | 'weekly' | 'custom';

export type UserRole = 'user' | 'admin';

export type AchievementCategory = 'consistency' | 'milestone' | 'challenge';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  full_name?: string;
  avatar_url?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme?: 'light' | 'dark';
  notifications_enabled?: boolean;
  reminder_time?: string;
  timezone?: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  type: HabitType;
  target_value: number;
  frequency: HabitFrequency;
  icon?: string;
  color?: string;
  reminder_enabled: boolean;
  reminder_time?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  value: number;
  completed: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  criteria_type: 'streak' | 'total_logs' | 'consistency' | 'milestone';
  criteria_value: number;
  points: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress?: number;
  achievement?: Achievement;
}

export interface HabitWithLogs extends Habit {
  logs?: HabitLog[];
  current_streak?: number;
  best_streak?: number;
  completion_rate?: number;
}

export interface DashboardStats {
  total_habits: number;
  active_habits: number;
  today_completed: number;
  today_total: number;
  current_week_completion: number;
  total_achievements: number;
  wellness_score: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface StreakInfo {
  current: number;
  best: number;
  start_date?: string;
}
