import { HabitLog } from '../types';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';

export function calculateStreak(logs: HabitLog[]): { current: number; best: number } {
  if (!logs || logs.length === 0) {
    return { current: 0, best: 0 };
  }

  const sortedLogs = [...logs]
    .filter(log => log.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sortedLogs.length === 0) {
    return { current: 0, best: 0 };
  }

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

  const mostRecentLog = sortedLogs[0];
  const mostRecentDate = mostRecentLog.date;

  if (mostRecentDate === todayStr || mostRecentDate === yesterdayStr) {
    currentStreak = 1;
    tempStreak = 1;

    for (let i = 1; i < sortedLogs.length; i++) {
      const currentDate = parseISO(sortedLogs[i].date);
      const previousDate = parseISO(sortedLogs[i - 1].date);
      const dayDiff = differenceInDays(previousDate, currentDate);

      if (dayDiff === 1) {
        currentStreak++;
        tempStreak++;
      } else {
        break;
      }
    }
  }

  tempStreak = 1;
  for (let i = 1; i < sortedLogs.length; i++) {
    const currentDate = parseISO(sortedLogs[i].date);
    const previousDate = parseISO(sortedLogs[i - 1].date);
    const dayDiff = differenceInDays(previousDate, currentDate);

    if (dayDiff === 1) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  bestStreak = Math.max(bestStreak, currentStreak, tempStreak);

  return { current: currentStreak, best: bestStreak };
}

export function calculateCompletionRate(logs: HabitLog[], days: number = 30): number {
  if (!logs || logs.length === 0) return 0;

  const cutoffDate = subDays(new Date(), days);
  const recentLogs = logs.filter(log => new Date(log.date) >= cutoffDate);

  const completed = recentLogs.filter(log => log.completed).length;
  const rate = (completed / Math.min(days, recentLogs.length)) * 100;

  return Math.round(rate);
}
