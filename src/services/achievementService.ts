import { supabase } from '../lib/supabase';
import { habitService } from './habitService';
import { calculateStreak } from '../utils/streakCalculator';

export const achievementService = {
  async checkAndUnlockAchievements(userId: string) {
    try {
      const { data: achievements } = await supabase
        .from('achievements')
        .select('*');

      if (!achievements) return;

      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId);

      const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);

      const habits = await habitService.getHabits(userId);

      let totalLogs = 0;
      let maxStreak = 0;

      for (const habit of habits) {
        const logs = await habitService.getHabitLogs(habit.id);
        totalLogs += logs.length;
        const streak = calculateStreak(logs);
        maxStreak = Math.max(maxStreak, streak.current);
      }

      const newUnlocks = [];

      for (const achievement of achievements) {
        if (unlockedIds.has(achievement.id)) continue;

        let shouldUnlock = false;

        switch (achievement.criteria_type) {
          case 'total_logs':
            shouldUnlock = totalLogs >= achievement.criteria_value;
            break;
          case 'streak':
            shouldUnlock = maxStreak >= achievement.criteria_value;
            break;
          case 'consistency':
            break;
          case 'milestone':
            break;
        }

        if (shouldUnlock) {
          newUnlocks.push({
            user_id: userId,
            achievement_id: achievement.id,
            progress: 100,
          });
        }
      }

      if (newUnlocks.length > 0) {
        await supabase.from('user_achievements').insert(newUnlocks);
        return newUnlocks;
      }

      return [];
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  },

  async getUserAchievements(userId: string) {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*, achievement:achievements(*)')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  },

  async getAllAchievements() {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('points', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
