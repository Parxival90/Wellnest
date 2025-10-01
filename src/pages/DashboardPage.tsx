import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/common/Layout';
import { Card } from '../components/common/Card';
import { habitService } from '../services/habitService';
import { Habit, DashboardStats } from '../types';
import { format } from 'date-fns';
import { Target, TrendingUp, Award, Calendar } from 'lucide-react';
import { LoadingSpinner } from '../components/common/Loading';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_habits: 0,
    active_habits: 0,
    today_completed: 0,
    today_total: 0,
    current_week_completion: 0,
    total_achievements: 0,
    wellness_score: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');

      const [habitsData, logsData] = await Promise.all([
        habitService.getHabits(user!.id),
        habitService.getUserLogsForDate(user!.id, today),
      ]);

      setHabits(habitsData);
      setTodayLogs(logsData || []);

      const completedToday = logsData?.filter(log => log.completed).length || 0;
      const totalToday = habitsData.length;

      setStats({
        total_habits: habitsData.length,
        active_habits: habitsData.length,
        today_completed: completedToday,
        today_total: totalToday,
        current_week_completion: totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0,
        total_achievements: 0,
        wellness_score: totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHabitIcon = (type: string) => {
    const icons: Record<string, string> = {
      exercise: '💪',
      water: '💧',
      sleep: '😴',
      mood: '😊',
    };
    return icons[type] || '📊';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.full_name || 'there'}!
          </h1>
          <p className="text-gray-600 mt-1">Track your progress and build healthy habits</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Habits</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.active_habits}</p>
              </div>
              <div className="bg-primary-100 p-3 rounded-wellnest">
                <Target size={24} className="text-primary-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Progress</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.today_completed}/{stats.today_total}
                </p>
              </div>
              <div className="bg-accent-100 p-3 rounded-wellnest">
                <Calendar size={24} className="text-accent-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.current_week_completion}%</p>
              </div>
              <div className="bg-green-100 p-3 rounded-wellnest">
                <TrendingUp size={24} className="text-green-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Wellness Score</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.wellness_score}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-wellnest">
                <Award size={24} className="text-yellow-600" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Habits</h2>
            {habits.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No habits yet. Start building your routine!</p>
                <button
                  onClick={() => navigate('/habits')}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Create your first habit →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {habits.slice(0, 5).map((habit) => {
                  const log = todayLogs.find(l => l.habit_id === habit.id);
                  return (
                    <div
                      key={habit.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-wellnest"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getHabitIcon(habit.type)}</span>
                        <div>
                          <p className="font-medium text-gray-900">{habit.name}</p>
                          <p className="text-sm text-gray-600">
                            Target: {habit.target_value}{' '}
                            {habit.type === 'water' ? 'glasses' : habit.type === 'sleep' ? 'hours' : habit.type === 'exercise' ? 'minutes' : 'rating'}
                          </p>
                        </div>
                      </div>
                      {log?.completed ? (
                        <div className="bg-primary-100 text-primary-700 px-3 py-1 rounded-wellnest text-sm font-medium">
                          Completed
                        </div>
                      ) : (
                        <button
                          onClick={() => navigate('/habits')}
                          className="text-gray-600 hover:text-primary-600 text-sm font-medium"
                        >
                          Log →
                        </button>
                      )}
                    </div>
                  );
                })}
                {habits.length > 5 && (
                  <button
                    onClick={() => navigate('/habits')}
                    className="w-full text-center text-primary-600 hover:text-primary-700 font-medium text-sm py-2"
                  >
                    View all habits →
                  </button>
                )}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/habits')}
                className="w-full p-4 bg-primary-50 hover:bg-primary-100 rounded-wellnest text-left transition-colors"
              >
                <p className="font-medium text-primary-900">Create New Habit</p>
                <p className="text-sm text-primary-700 mt-1">Start tracking a new wellness goal</p>
              </button>
              <button
                onClick={() => navigate('/habits')}
                className="w-full p-4 bg-accent-50 hover:bg-accent-100 rounded-wellnest text-left transition-colors"
              >
                <p className="font-medium text-accent-900">Log Today's Activities</p>
                <p className="text-sm text-accent-700 mt-1">Update your habit progress</p>
              </button>
              <button
                onClick={() => navigate('/achievements')}
                className="w-full p-4 bg-yellow-50 hover:bg-yellow-100 rounded-wellnest text-left transition-colors"
              >
                <p className="font-medium text-yellow-900">View Achievements</p>
                <p className="text-sm text-yellow-700 mt-1">Check your earned badges</p>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
