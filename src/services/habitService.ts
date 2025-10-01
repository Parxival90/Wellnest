import { supabase } from '../lib/supabase';
import { Habit, HabitLog } from '../types';

export const habitService = {
  async getHabits(userId: string) {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Habit[];
  },

  async getHabitById(habitId: string) {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('id', habitId)
      .maybeSingle();

    if (error) throw error;
    return data as Habit | null;
  },

  async createHabit(habit: Omit<Habit, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('habits')
      .insert(habit)
      .select()
      .single();

    if (error) throw error;
    return data as Habit;
  },

  async updateHabit(habitId: string, updates: Partial<Habit>) {
    const { data, error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', habitId)
      .select()
      .single();

    if (error) throw error;
    return data as Habit;
  },

  async deleteHabit(habitId: string) {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId);

    if (error) throw error;
  },

  async archiveHabit(habitId: string) {
    const { error } = await supabase
      .from('habits')
      .update({ is_archived: true })
      .eq('id', habitId);

    if (error) throw error;
  },

  async getHabitLogs(habitId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .order('date', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as HabitLog[];
  },

  async getTodayLog(habitId: string, userId: string, date: string) {
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle();

    if (error) throw error;
    return data as HabitLog | null;
  },

  async createOrUpdateLog(log: Omit<HabitLog, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('habit_logs')
      .upsert(log, { onConflict: 'habit_id,date' })
      .select()
      .single();

    if (error) throw error;
    return data as HabitLog;
  },

  async getUserLogsForDate(userId: string, date: string) {
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*, habits(*)')
      .eq('user_id', userId)
      .eq('date', date);

    if (error) throw error;
    return data;
  },
};
