import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Layout from '../components/Layout';
import { Flame, Plus, Trash2, BarChart3, TrendingUp, Apple, Leaf } from 'lucide-react';
import { cn } from '../lib/utils';
import { apiService } from '../services/api';

interface FoodLog {
  id: string;
  meal_type: string;
  items: any[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  timestamp: string;
}

export default function FoodTrackerPage() {
  const [mealDescription, setMealDescription] = useState('');
  const [mealType, setMealType] = useState('breakfast');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nutritionData, setNutritionData] = useState<any>(null);
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTodayFood();
  }, []);

  const loadTodayFood = async () => {
    try {
      setLoading(true);
      const data = await apiService.getTodayFood();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to load food logs:', err);
      setError('Failed to load food logs');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!mealDescription.trim()) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const data = await apiService.estimateNutrition(mealDescription);
      setNutritionData({
        itemName: mealDescription,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        breakdown: data.breakdown || `Your ${mealDescription} contains a balanced mix of macronutrients.`
      });
    } catch (err) {
      console.error('Failed to analyze nutrition:', err);
      setError('Failed to analyze nutrition. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogFood = async () => {
    if (!nutritionData) return;

    try {
      setError(null);
      await apiService.logFood({
        meal_type: mealType,
        items: [{
          name: mealDescription,
          calories: nutritionData.calories,
          protein: nutritionData.protein,
          carbs: nutritionData.carbs,
          fat: nutritionData.fat
        }],
        total_calories: nutritionData.calories,
        total_protein: nutritionData.protein,
        total_carbs: nutritionData.carbs,
        total_fat: nutritionData.fat
      });

      // Reload today's food logs
      await loadTodayFood();

      // Reset form
      setMealDescription('');
      setNutritionData(null);
    } catch (err) {
      console.error('Failed to log food:', err);
      setError('Failed to log food. Please try again.');
    }
  };

  const totalCalories = logs.reduce((sum: number, log: FoodLog) => sum + log.total_calories, 0);

  if (loading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-health-primary text-xl">Loading food logs...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-8 max-w-4xl mx-auto text-text-main">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight">Fuel Tracker</h1>
          <p className="text-text-muted">Log what you eat. We'll decode the nutrition.</p>
        </div>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[2.5rem] p-8 border-white/10 shadow-2xl"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <p className="text-xs uppercase font-black text-text-muted tracking-widest">Today's Intake</p>
              <p className="text-3xl font-black text-orange-400">{totalCalories}</p>
              <p className="text-xs text-text-muted">kcal</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase font-black text-text-muted tracking-widest">Meals Logged</p>
              <p className="text-3xl font-black text-accent-blue">{logs.length}</p>
              <p className="text-xs text-text-muted">entries</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase font-black text-text-muted tracking-widest">Goal</p>
              <p className="text-3xl font-black text-primary-teal">2000</p>
              <p className="text-xs text-text-muted">kcal</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase font-black text-text-muted tracking-widest">Remaining</p>
              <p className={cn("text-3xl font-black", totalCalories > 2000 ? "text-red-400" : "text-green-400")}>
                {Math.max(0, 2000 - totalCalories)}
              </p>
              <p className="text-xs text-text-muted">kcal</p>
            </div>
          </div>
        </motion.div>

        {/* Input Section */}
        {!nutritionData ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[2.5rem] p-8 space-y-6 border-white/10 shadow-2xl"
          >
            <h2 className="text-xl font-black">What did you eat?</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {['breakfast', 'lunch', 'dinner'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setMealType(type)}
                    className={cn(
                      "p-4 rounded-2xl font-bold capitalize transition-all",
                      mealType === type 
                        ? "bg-primary-teal text-bg-dark shadow-lg shadow-primary-teal/20" 
                        : "bg-white/5 text-text-muted border border-white/10"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <textarea
                value={mealDescription}
                onChange={(e) => setMealDescription(e.target.value)}
                placeholder="e.g. 2 rotis, dal curry, steamed broccoli with oil"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm focus:outline-none focus:border-primary-teal/50 transition-all placeholder:text-text-muted/30 font-bold text-text-main"
                rows={3}
              />

              <button
                onClick={handleAnalyze}
                disabled={!mealDescription.trim() || isAnalyzing}
                className={cn(
                  "w-full py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-lg",
                  mealDescription.trim() && !isAnalyzing
                    ? "bg-orange-400 text-bg-dark hover:shadow-[0_0_30px_rgba(251,146,60,0.3)]"
                    : "bg-white/5 text-text-muted/20 cursor-not-allowed"
                )}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-bg-dark border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Flame size={20} />
                    Analyze Nutrition
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-[2.5rem] p-8 space-y-6 border-white/10 shadow-2xl"
          >
            <h2 className="text-2xl font-black">{mealDescription}</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-2xl p-5 text-center">
                <p className="text-3xl font-black text-orange-400">{nutritionData.calories}</p>
                <p className="text-xs text-text-muted font-black uppercase mt-2">Calories</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-5 text-center">
                <p className="text-3xl font-black text-accent-blue">{nutritionData.protein}g</p>
                <p className="text-xs text-text-muted font-black uppercase mt-2">Protein</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-5 text-center">
                <p className="text-3xl font-black text-primary-teal">{nutritionData.carbs}g</p>
                <p className="text-xs text-text-muted font-black uppercase mt-2">Carbs</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-5 text-center">
                <p className="text-3xl font-black text-accent-pink">{nutritionData.fat}g</p>
                <p className="text-xs text-text-muted font-black uppercase mt-2">Fat</p>
              </div>
            </div>

            <p className="text-sm text-text-muted leading-relaxed">{nutritionData.breakdown}</p>

            <div className="flex gap-4">
              <button
                onClick={handleLogFood}
                className="flex-1 py-4 rounded-2xl font-black bg-primary-teal text-bg-dark hover:shadow-[0_0_30px_rgba(45,212,191,0.3)] transition-all"
              >
                <Plus size={20} className="mx-auto" />
                Log This Meal
              </button>
              <button
                onClick={() => { setNutritionData(null); setMealDescription(''); }}
                className="flex-1 py-4 rounded-2xl font-black bg-white/5 border border-white/10 text-text-muted hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* Food Log History */}
        {logs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[2.5rem] p-8 space-y-4 border-white/10 shadow-2xl"
          >
            <h2 className="text-xl font-black flex items-center gap-2">
              <Apple size={24} className="text-orange-400" />
              Today's Meals
            </h2>

            <div className="space-y-3">
              {logs.map((log: FoodLog) => (
                <div key={log.id} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/10">
                  <div className="flex-1">
                    <p className="font-bold capitalize">{log.meal_type}: {log.items[0]?.name || 'Food'}</p>
                    <p className="text-xs text-text-muted">{log.total_calories} calories</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-orange-400">{log.total_calories} cal</p>
                    <p className="text-xs text-text-muted">P:{log.total_protein}g C:{log.total_carbs}g F:{log.total_fat}g</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[2.5rem] p-6 border-red-400/20 bg-red-400/5"
          >
            <p className="text-red-400 font-bold">{error}</p>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
