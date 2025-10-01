import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/common/Layout';
import { Card } from '../components/common/Card';
import { supabase } from '../lib/supabase';
import { Achievement, UserAchievement } from '../types';
import { Award, Lock } from 'lucide-react';
import { LoadingSpinner } from '../components/common/Loading';

export function AchievementsPage() {
  const { user } = useAuth();
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAchievements();
    }
  }, [user]);

  const loadAchievements = async () => {
    try {
      setLoading(true);

      const [achievementsData, userAchievementsData] = await Promise.all([
        supabase.from('achievements').select('*').order('points', { ascending: true }),
        supabase
          .from('user_achievements')
          .select('*, achievement:achievements(*)')
          .eq('user_id', user!.id),
      ]);

      if (achievementsData.data) {
        setAllAchievements(achievementsData.data as Achievement[]);
      }

      if (userAchievementsData.data) {
        setUserAchievements(userAchievementsData.data as UserAchievement[]);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const isUnlocked = (achievementId: string) => {
    return userAchievements.some((ua) => ua.achievement_id === achievementId);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      consistency: 'bg-primary-100 text-primary-700',
      milestone: 'bg-accent-100 text-accent-700',
      challenge: 'bg-yellow-100 text-yellow-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const totalPoints = userAchievements.reduce((sum, ua) => {
    const achievement = ua.achievement as Achievement;
    return sum + (achievement?.points || 0);
  }, 0);

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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Achievements</h1>
          <p className="text-gray-600 mt-1">Track your progress and unlock badges</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award size={32} className="text-primary-600" />
              </div>
              <p className="text-sm text-gray-600">Unlocked</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {userAchievements.length}/{allAchievements.length}
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">⭐</span>
              </div>
              <p className="text-sm text-gray-600">Total Points</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalPoints}</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="bg-accent-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">🎯</span>
              </div>
              <p className="text-sm text-gray-600">Completion</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {allAchievements.length > 0
                  ? Math.round((userAchievements.length / allAchievements.length) * 100)
                  : 0}
                %
              </p>
            </div>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">All Achievements</h2>

          {allAchievements.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-gray-600">No achievements available yet</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allAchievements.map((achievement) => {
                const unlocked = isUnlocked(achievement.id);
                return (
                  <Card
                    key={achievement.id}
                    className={`${
                      unlocked ? 'border-2 border-primary-200' : 'opacity-75'
                    } transition-all`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div
                          className={`w-16 h-16 rounded-wellnest flex items-center justify-center text-3xl ${
                            unlocked ? 'bg-primary-100 animate-badge-unlock' : 'bg-gray-100'
                          }`}
                        >
                          {unlocked ? achievement.icon : <Lock className="text-gray-400" />}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-wellnest text-sm font-medium capitalize ${getCategoryColor(
                            achievement.category
                          )}`}
                        >
                          {achievement.category}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {achievement.name}
                        </h3>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="text-sm">
                          <span className="text-gray-600">Criteria:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {achievement.criteria_value}{' '}
                            {achievement.criteria_type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-sm font-medium">
                          {achievement.points} pts
                        </div>
                      </div>

                      {unlocked && (
                        <div className="bg-primary-50 text-primary-700 p-2 rounded-wellnest text-center text-sm font-medium">
                          Unlocked!
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
