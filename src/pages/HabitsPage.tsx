import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/common/Layout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { habitService } from '../services/habitService';
import { achievementService } from '../services/achievementService';
import { Habit, HabitType, HabitFrequency } from '../types';
import { Plus, CreditCard as Edit2, Trash2, TrendingUp } from 'lucide-react';
import { LoadingSpinner } from '../components/common/Loading';
import { format } from 'date-fns';
import { calculateStreak, calculateCompletionRate } from '../utils/streakCalculator';

export function HabitsPage() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [habitStats, setHabitStats] = useState<Record<string, any>>({});

  const [formData, setFormData] = useState({
    name: '',
    type: 'exercise' as HabitType,
    target_value: 0,
    frequency: 'daily' as HabitFrequency,
  });

  const [logValue, setLogValue] = useState(0);
  const [logNotes, setLogNotes] = useState('');

  useEffect(() => {
    if (user) {
      loadHabits();
    }
  }, [user]);

  const loadHabits = async () => {
    try {
      setLoading(true);
      const data = await habitService.getHabits(user!.id);
      setHabits(data);

      const statsMap: Record<string, any> = {};
      for (const habit of data) {
        const logs = await habitService.getHabitLogs(habit.id);
        const streak = calculateStreak(logs);
        const completionRate = calculateCompletionRate(logs);
        statsMap[habit.id] = { streak, completionRate, totalLogs: logs.length };
      }
      setHabitStats(statsMap);
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHabit = async () => {
    try {
      await habitService.createHabit({
        ...formData,
        user_id: user!.id,
        reminder_enabled: false,
        is_archived: false,
      });
      setShowCreateModal(false);
      setFormData({ name: '', type: 'exercise', target_value: 0, frequency: 'daily' });
      loadHabits();
    } catch (error) {
      console.error('Error creating habit:', error);
    }
  };

  const handleUpdateHabit = async () => {
    if (!selectedHabit) return;

    try {
      await habitService.updateHabit(selectedHabit.id, formData);
      setShowEditModal(false);
      setSelectedHabit(null);
      setFormData({ name: '', type: 'exercise', target_value: 0, frequency: 'daily' });
      loadHabits();
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!confirm('Are you sure you want to delete this habit?')) return;

    try {
      await habitService.deleteHabit(habitId);
      loadHabits();
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  const handleLogHabit = async () => {
    if (!selectedHabit) return;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const completed = logValue >= selectedHabit.target_value;

      await habitService.createOrUpdateLog({
        habit_id: selectedHabit.id,
        user_id: user!.id,
        date: today,
        value: logValue,
        completed,
        notes: logNotes,
      });

      await achievementService.checkAndUnlockAchievements(user!.id);

      setShowLogModal(false);
      setSelectedHabit(null);
      setLogValue(0);
      setLogNotes('');
      loadHabits();
    } catch (error) {
      console.error('Error logging habit:', error);
    }
  };

  const openCreateModal = () => {
    setFormData({ name: '', type: 'exercise', target_value: 0, frequency: 'daily' });
    setShowCreateModal(true);
  };

  const openEditModal = (habit: Habit) => {
    setSelectedHabit(habit);
    setFormData({
      name: habit.name,
      type: habit.type,
      target_value: habit.target_value,
      frequency: habit.frequency,
    });
    setShowEditModal(true);
  };

  const openLogModal = (habit: Habit) => {
    setSelectedHabit(habit);
    setLogValue(0);
    setLogNotes('');
    setShowLogModal(true);
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

  const getUnitLabel = (type: HabitType) => {
    const units: Record<HabitType, string> = {
      exercise: 'minutes',
      water: 'glasses',
      sleep: 'hours',
      mood: 'rating (1-5)',
    };
    return units[type];
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Habits</h1>
            <p className="text-gray-600 mt-1">Manage and track your daily routines</p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus size={20} className="mr-2" />
            Create Habit
          </Button>
        </div>

        {habits.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus size={32} className="text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No habits yet</h3>
              <p className="text-gray-600 mb-6">Start building your wellness routine by creating your first habit</p>
              <Button onClick={openCreateModal}>Create Your First Habit</Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.map((habit) => {
              const stats = habitStats[habit.id] || { streak: { current: 0, best: 0 }, completionRate: 0, totalLogs: 0 };
              return (
                <Card key={habit.id} hover>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{getHabitIcon(habit.type)}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{habit.name}</h3>
                          <p className="text-sm text-gray-600 capitalize">{habit.type}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(habit)}
                          className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteHabit(habit.id)}
                          className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Target</span>
                        <span className="font-medium text-gray-900">
                          {habit.target_value} {getUnitLabel(habit.type)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Current Streak</span>
                        <span className="font-medium text-primary-600">{stats.streak.current} days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Best Streak</span>
                        <span className="font-medium text-gray-900">{stats.streak.best} days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Completion Rate</span>
                        <span className="font-medium text-gray-900">{stats.completionRate}%</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => openLogModal(habit)}
                      className="w-full"
                      variant="secondary"
                    >
                      <TrendingUp size={18} className="mr-2" />
                      Log Today
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Habit"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateHabit}>Create Habit</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Habit Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Morning Run"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Habit Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as HabitType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-wellnest focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="exercise">Exercise</option>
              <option value="water">Water Intake</option>
              <option value="sleep">Sleep</option>
              <option value="mood">Mood</option>
            </select>
          </div>

          <Input
            label={`Target Value (${getUnitLabel(formData.type)})`}
            type="number"
            value={formData.target_value}
            onChange={(e) => setFormData({ ...formData, target_value: Number(e.target.value) })}
            placeholder="0"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value as HabitFrequency })}
              className="w-full px-3 py-2 border border-gray-300 rounded-wellnest focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Habit"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateHabit}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Habit Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Morning Run"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Habit Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as HabitType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-wellnest focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="exercise">Exercise</option>
              <option value="water">Water Intake</option>
              <option value="sleep">Sleep</option>
              <option value="mood">Mood</option>
            </select>
          </div>

          <Input
            label={`Target Value (${getUnitLabel(formData.type)})`}
            type="number"
            value={formData.target_value}
            onChange={(e) => setFormData({ ...formData, target_value: Number(e.target.value) })}
            placeholder="0"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value as HabitFrequency })}
              className="w-full px-3 py-2 border border-gray-300 rounded-wellnest focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        title={`Log: ${selectedHabit?.name}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowLogModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogHabit}>Save Log</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-wellnest">
            <p className="text-sm text-gray-600">Target</p>
            <p className="text-lg font-semibold text-gray-900">
              {selectedHabit?.target_value} {selectedHabit && getUnitLabel(selectedHabit.type)}
            </p>
          </div>

          <Input
            label="Value"
            type="number"
            value={logValue}
            onChange={(e) => setLogValue(Number(e.target.value))}
            placeholder="0"
            helperText={`Enter your ${selectedHabit && getUnitLabel(selectedHabit.type)}`}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-wellnest focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="How did it go?"
            />
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
