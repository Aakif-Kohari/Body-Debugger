import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Layout from '../components/Layout';
import {
  Flame, Plus, Loader2, Sparkles, ChevronDown, ChevronUp,
  Apple, CheckCircle2, XCircle, BarChart3, Zap, Droplets, Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { apiService } from '../services/api';

interface MacroBarProps { label: string; value: number; max: number; color: string; }

function MacroBar({ label, value, max, color }: MacroBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-text-muted">{label}</span>
        <span className="text-xs font-bold text-text-main">{value}g</span>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

interface NutritionResult {
  meal_description: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  items: Array<{ name: string; calories: number; protein: number; carbs: number; fat: number }>;
  status: string;
}

interface MealLog {
  _id?: string;
  meal_description: string;
  meal_type: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  date: string;
  created_at?: string;
  items?: any[];
}

const MEAL_TYPES = [
  { id: 'breakfast', label: '🌅 Breakfast', time: '6–11am' },
  { id: 'lunch', label: '☀️ Lunch', time: '11am–3pm' },
  { id: 'dinner', label: '🌙 Dinner', time: '6–10pm' },
  { id: 'snack', label: '🍎 Snack', time: 'Anytime' },
];

const MACRO_GOALS = { protein: 120, carbs: 250, fat: 65 };

export default function FoodTrackerPage() {
  const [mealDescription, setMealDescription] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [nutritionResult, setNutritionResult] = useState<NutritionResult | null>(null);
  const [todayLogs, setTodayLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const loadFood = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.getTodayFood();
      const allLogs: MealLog[] = [
        ...(data.breakfast || []),
        ...(data.lunch || []),
        ...(data.dinner || []),
        ...(data.snacks || []),
      ].sort((a: MealLog, b: MealLog) => (b.created_at || '').localeCompare(a.created_at || ''));
      setTodayLogs(allLogs);
    } catch (e) {
      setError('Could not load today\'s food.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFood(); }, [loadFood]);

  const handleAnalyze = async () => {
    if (!mealDescription.trim()) return;
    setIsAnalyzing(true);
    setNutritionResult(null);
    setError(null);
    try {
      const result = await apiService.request('/api/food/estimate', {
        method: 'POST',
        body: JSON.stringify({ meal_description: mealDescription }),
      });
      setNutritionResult(result);
    } catch (e: any) {
      setError(e.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogMeal = async () => {
    if (!nutritionResult) return;
    setIsLogging(true);
    setError(null);
    try {
      await apiService.request('/api/food/log', {
        method: 'POST',
        body: JSON.stringify({
          meal_description: mealDescription,
          meal_type: mealType,
        }),
      });
      setSuccessMsg(`✅ ${mealType} logged! +50 pts`);
      setNutritionResult(null);
      setMealDescription('');
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadFood();
    } catch (e: any) {
      setError(e.message || 'Could not log meal.');
    } finally {
      setIsLogging(false);
    }
  };

  const [waterLogging, setWaterLogging] = useState(false);
  const logWater = async (ml: number) => {
    setWaterLogging(true);
    try {
      await apiService.logWater(ml);
      setSuccessMsg(`💧 ${ml}ml water logged!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setError('Failed to log water');
    } finally {
      setWaterLogging(false);
    }
  };

  const handleDeleteMeal = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this meal?")) return;
    try {
      await apiService.deleteMeal(id);
      setSuccessMsg("🗑️ Meal deleted successfully");
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadFood();
    } catch (err: any) {
      setError("Failed to delete meal");
    }
  };

  const totalCals = todayLogs.reduce((s, l) => s + (l.total_calories || 0), 0);
  const totalProtein = todayLogs.reduce((s, l) => s + (l.total_protein || 0), 0);
  const totalCarbs = todayLogs.reduce((s, l) => s + (l.total_carbs || 0), 0);
  const totalFat = todayLogs.reduce((s, l) => s + (l.total_fat || 0), 0);
  const calGoal = 2000;
  const calPct = Math.min(100, Math.round((totalCals / calGoal) * 100));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-main" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Fuel Tracker
          </h1>
          <p className="text-text-muted text-sm mt-0.5">AI-powered nutrition analysis</p>
        </div>

        {/* Today's Overview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-subtle uppercase tracking-wider">Today's Intake</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-4xl font-black text-text-main" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {loading ? '—' : totalCals}
                </span>
                <span className="text-sm text-text-muted font-medium">/ {calGoal} kcal</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-text-subtle">{calGoal - totalCals > 0 ? `${calGoal - totalCals} remaining` : 'Goal reached!'}</p>
              <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block",
                calPct >= 100 ? 'bg-red-50 text-red-500 dark:bg-red-400/10' :
                calPct >= 70 ? 'bg-orange-50 text-orange-500 dark:bg-orange-400/10' :
                'bg-green-50 text-green-600 dark:bg-green-400/10')}>
                {calPct}% of goal
              </span>
            </div>
          </div>

          {/* Calorie bar */}
          <div className="h-2.5 bg-border rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", calPct >= 100 ? 'bg-red-400' : 'grad-teal')}
              initial={{ width: 0 }}
              animate={{ width: `${calPct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>

          {/* Macro summary */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            {[
              { label: 'Protein', val: totalProtein, color: '#0284c7' },
              { label: 'Carbs', val: totalCarbs, color: '#ea580c' },
              { label: 'Fat', val: totalFat, color: '#ec4899' },
            ].map(m => (
              <div key={m.label} className="text-center">
                <p className="text-lg font-bold text-text-main" style={{ fontFamily: 'Space Grotesk, sans-serif', color: m.color }}>
                  {loading ? '—' : `${Math.round(m.val)}g`}
                </p>
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{m.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Water Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card p-5 space-y-3"
          style={{ borderColor: 'rgba(2, 132, 199, 0.2)', backgroundColor: 'rgba(2, 132, 199, 0.02)' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0">
               <Droplets size={16} className="text-sky-500" />
            </div>
            <div>
               <h3 className="font-bold text-sm text-text-main">Hydration Quick Add</h3>
               <p className="text-xs text-text-muted">Log drinks alongside your food</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
             {[100, 250, 500, 1000].map(ml => (
                <button
                   key={ml}
                   disabled={waterLogging}
                   onClick={() => logWater(ml)}
                   className="py-2.5 rounded-xl text-xs font-semibold border text-center transition-all hover:bg-sky-500/10 active:scale-95 text-sky-600 border-sky-500/20"
                >
                   + {ml >= 1000 ? `${ml/1000}L` : `${ml}ml`}
                </button>
             ))}
          </div>
        </motion.div>

        {/* Add Meal Form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-5 space-y-4"
        >
          <h2 className="font-semibold text-text-main flex items-center gap-2">
            <Sparkles size={16} className="text-primary-teal" />
            Analyze a Meal
          </h2>

          {/* Meal type selector */}
          <div className="grid grid-cols-4 gap-2">
            {MEAL_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => setMealType(t.id)}
                className={cn(
                  "py-2.5 px-2 rounded-xl text-xs font-semibold transition-all text-center border",
                  mealType === t.id
                    ? 'grad-teal border-transparent text-white shadow-md'
                    : 'border-border text-text-muted hover:border-primary-teal hover:text-primary-teal'
                )}
              >
                <span className="block text-base leading-none mb-1">{t.label.split(' ')[0]}</span>
                {t.label.split(' ').slice(1).join(' ')}
              </button>
            ))}
          </div>

          {/* Text input */}
          <textarea
            value={mealDescription}
            onChange={e => setMealDescription(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAnalyze(); }}
            placeholder="Describe what you ate... e.g. 'Dal chawal with sabzi and raita'"
            className="input-field resize-none"
            rows={3}
          />

          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAnalyze}
            disabled={!mealDescription.trim() || isAnalyzing}
            className="btn-primary w-full py-3"
          >
            {isAnalyzing ? (
              <><Loader2 size={16} className="animate-spin" /> Analyzing with AI...</>
            ) : (
              <><Sparkles size={16} /> Analyze Nutrition</>
            )}
          </motion.button>
        </motion.div>

        {/* Nutrition Result */}
        <AnimatePresence>
          {nutritionResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="card p-5 space-y-5"
              style={{ borderColor: 'rgba(13,148,136,0.3)' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-primary-teal uppercase tracking-wider">AI Analysis</p>
                  <h3 className="font-bold text-text-main mt-0.5 leading-snug">{nutritionResult.meal_description}</h3>
                </div>
                <button onClick={() => setNutritionResult(null)} className="text-text-subtle hover:text-text-main">
                  <XCircle size={18} />
                </button>
              </div>

              {/* Calories highlight */}
              <div className="text-center py-3 rounded-xl" style={{ background: 'rgba(234,88,12,0.06)', border: '1px solid rgba(234,88,12,0.15)' }}>
                <p className="text-4xl font-black text-orange-500" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {nutritionResult.total_calories}
                </p>
                <p className="text-xs font-semibold text-text-muted mt-1">Total Calories</p>
              </div>

              {/* Macro bars */}
              <div className="space-y-3">
                <MacroBar label="Protein" value={Math.round(nutritionResult.total_protein)} max={MACRO_GOALS.protein} color="#0284c7" />
                <MacroBar label="Carbohydrates" value={Math.round(nutritionResult.total_carbs)} max={MACRO_GOALS.carbs} color="#ea580c" />
                <MacroBar label="Fat" value={Math.round(nutritionResult.total_fat)} max={MACRO_GOALS.fat} color="#ec4899" />
              </div>

              {/* Items breakdown */}
              {nutritionResult.items && nutritionResult.items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Breakdown by Item</p>
                  {nutritionResult.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-text-main font-medium">{item.name}</span>
                      <span className="text-sm font-bold text-orange-500">{item.calories} cal</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleLogMeal}
                  disabled={isLogging}
                  className="btn-primary flex-1 py-3"
                >
                  {isLogging ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16} /> Log This Meal</>}
                </motion.button>
                <button
                  onClick={() => { setNutritionResult(null); setMealDescription(''); }}
                  className="btn-secondary px-4"
                >
                  Redo
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Today's Meals Log */}
        {(todayLogs.length > 0 || loading) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card p-5 space-y-4"
          >
            <h2 className="font-semibold text-text-main flex items-center gap-2">
              <Apple size={16} className="text-orange-500" />
              Today's Meals
              <span className="ml-auto text-xs text-text-muted">{todayLogs.length} logged</span>
            </h2>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {todayLogs.map((log, i) => {
                  const key = log._id || String(i);
                  const isExpanded = expandedLog === key;
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <div
                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-primary-teal/5 transition-colors"
                        style={{ border: '1px solid var(--border)' }}
                        onClick={() => setExpandedLog(isExpanded ? null : key)}
                      >
                        <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-400/10 flex items-center justify-center flex-shrink-0">
                          <Flame size={16} className="text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-main capitalize truncate">
                            {log.meal_description || log.meal_type}
                          </p>
                          <p className="text-xs text-text-muted">
                            {log.meal_type} {log.created_at ? ` · ${new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : ''} · {log.total_calories} kcal
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold"
                            style={{ color: '#ea580c' }}>
                            {log.total_calories}
                          </span>
                          <button 
                            onClick={(e) => handleDeleteMeal(key, e)}
                            className="p-1 rounded opacity-50 hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 transition-all text-text-muted ml-1"
                          >
                             <Trash2 size={14} />
                          </button>
                          {isExpanded ? <ChevronUp size={14} className="text-text-muted ml-1" /> : <ChevronDown size={14} className="text-text-muted ml-1" />}
                        </div>
                      </div>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="grid grid-cols-3 gap-3 p-3 rounded-b-xl"
                              style={{ background: 'var(--surface)' }}>
                              {[
                                { label: 'Protein', val: log.total_protein, color: '#0284c7' },
                                { label: 'Carbs', val: log.total_carbs, color: '#ea580c' },
                                { label: 'Fat', val: log.total_fat, color: '#ec4899' },
                              ].map(m => (
                                <div key={m.label} className="text-center">
                                  <p className="text-base font-bold" style={{ color: m.color }}>{Math.round(m.val)}g</p>
                                  <p className="text-xs text-text-muted">{m.label}</p>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Notifications */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
              <XCircle size={16} />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)}>✕</button>
            </motion.div>
          )}
          {successMsg && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)', color: '#0d9488' }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
