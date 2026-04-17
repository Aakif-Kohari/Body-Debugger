import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Layout from '../components/Layout';
import {
  Droplets, Flame, Moon, TrendingUp, Plus, Loader2, Star, Trophy,
  Activity, Heart, Zap, Target, ChevronRight, RefreshCw, Check
} from 'lucide-react';
import { cn } from '../lib/utils';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface DashboardData {
  waterTotal: number;
  waterGoal: number;
  sleepHours: number;
  sleepGoal: number;
  calories: number;
  calorieGoal: number;
  points: number;
  level: number;
  rank: string;
  nextLevelAt: number;
}

const QUICK_WATERS = [150, 250, 500];

function CircleProgress({ value, max, color, size = 80, strokeWidth = 7 }: {
  value: number; max: number; color: string; size?: number; strokeWidth?: number;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--border)" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${circ}`}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
    </svg>
  );
}

function StatCard({ icon: Icon, label, value, unit, goal, color, bgColor, onClick, loading }: {
  icon: React.ElementType; label: string; value: number; unit: string;
  goal: number; color: string; bgColor: string; onClick?: () => void; loading?: boolean;
}) {
  const pct = Math.min(100, Math.round((value / goal) * 100));
  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={cn("card p-5 space-y-4 relative overflow-hidden", onClick ? "cursor-pointer" : "")}
    >
      <div className="flex items-start justify-between">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bgColor)}>
          <Icon size={20} className={color} />
        </div>
        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", bgColor, color)}>
          {pct}%
        </span>
      </div>

      <div>
        <p className="text-xs font-semibold text-text-subtle uppercase tracking-wider mb-1">{label}</p>
        {loading ? (
          <div className="skeleton h-8 w-20 rounded" />
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-text-main" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {value}
            </span>
            <span className="text-xs text-text-muted font-medium">{unit}</span>
          </div>
        )}
        <p className="text-xs text-text-subtle mt-0.5">Goal: {goal} {unit}</p>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color.includes('#') ? color : undefined }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>

      {onClick && (
        <div className="absolute bottom-3 right-3">
          <Plus size={14} className={cn("opacity-40", color)} />
        </div>
      )}
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    waterTotal: 0, waterGoal: 3000,
    sleepHours: 0, sleepGoal: 8,
    calories: 0, calorieGoal: 2000,
    points: 0, level: 1, rank: 'Novice', nextLevelAt: 500
  });
  const [loading, setLoading] = useState(true);
  const [waterLogging, setWaterLogging] = useState(false);
  const [waterSuccess, setWaterSuccess] = useState(false);
  const [showWaterPicker, setShowWaterPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [waterData, sleepData, foodData, pointsData] = await Promise.allSettled([
        apiService.getTodayWater(),
        apiService.getSleepHistory(1),
        apiService.getTodayFood(),
        apiService.getPoints(),
      ]);

      const water = waterData.status === 'fulfilled' ? waterData.value : null;
      const sleep = sleepData.status === 'fulfilled' ? sleepData.value : null;
      const food = foodData.status === 'fulfilled' ? foodData.value : null;
      const pts = pointsData.status === 'fulfilled' ? pointsData.value : null;

      // Calculate total calories from all logged meals
      const totalCalories =
        (food?.breakfast?.reduce((s: number, l: any) => s + (l?.total_calories || 0), 0) || 0) +
        (food?.lunch?.reduce((s: number, l: any) => s + (l?.total_calories || 0), 0) || 0) +
        (food?.dinner?.reduce((s: number, l: any) => s + (l?.total_calories || 0), 0) || 0);

      setData({
        waterTotal: water?.total_ml || 0,
        waterGoal: water?.goal_ml || 3000,
        sleepHours: sleep?.logs?.[0]?.duration_hours || 0,
        sleepGoal: sleep?.goal_hours || 8,
        calories: food?.total_calories || totalCalories,
        calorieGoal: 2000,
        points: pts?.points || 0,
        level: pts?.level || 1,
        rank: pts?.rank || 'Novice',
        nextLevelAt: pts?.next_level_at || 500,
      });
    } catch (e) {
      setError('Could not load health data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const logWater = async (ml: number) => {
    setWaterLogging(true);
    setShowWaterPicker(false);
    try {
      await apiService.logWater(ml);
      setWaterSuccess(true);
      await loadData();
      setTimeout(() => setWaterSuccess(false), 2000);
    } catch {
      setError('Failed to log water');
    } finally {
      setWaterLogging(false);
    }
  };

  const healthScore = Math.round(
    (Math.min(1, data.waterTotal / data.waterGoal) * 35) +
    (Math.min(1, data.sleepHours / data.sleepGoal) * 35) +
    (Math.min(1, data.calories / data.calorieGoal) * 30)
  );

  const scoreColor = healthScore >= 70 ? '#0d9488' : healthScore >= 40 ? '#eab308' : '#ef4444';
  const scoreLabel = healthScore >= 80 ? '🏆 Peak Form' : healthScore >= 60 ? '✅ On Track' : healthScore >= 40 ? '⚡ Getting There' : '🔋 Needs Boost';

  return (
    <Layout>
      <div className="space-y-6">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-text-main" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {user?.name ? `Hey, ${user.name.split(' ')[0]}! 👋` : 'Good day!'}
            </h1>
            <p className="text-text-muted text-sm mt-0.5">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <motion.button
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.4 }}
            onClick={loadData}
            disabled={loading}
            className="w-9 h-9 rounded-xl card flex items-center justify-center text-text-muted hover:text-primary-teal transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </motion.button>
        </motion.div>

        {/* Health Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, var(--primary-teal), var(--accent-blue), var(--accent-purple))',
            backgroundSize: '200% 200%',
          }}
        >
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">HEALTH SCORE</p>
              <div className="flex items-baseline gap-1">
                <motion.span
                  key={healthScore}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-6xl font-black text-white"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  {loading ? '--' : healthScore}
                </motion.span>
                <span className="text-white/50 text-xl font-bold">/100</span>
              </div>
              <p className="text-white/90 text-sm font-semibold">{scoreLabel}</p>
            </div>

            <div className="relative">
              <CircleProgress value={healthScore} max={100} color="white" size={90} strokeWidth={7} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity size={22} className="text-white/90" />
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-4 flex gap-3">
            {/* Gamification pills */}
            <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
              <Star size={12} className="text-yellow-300" />
              <span className="text-white text-xs font-bold">{data.points} pts</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
              <Trophy size={12} className="text-purple-300" />
              <span className="text-white text-xs font-bold">Lv {data.level} · {data.rank}</span>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
          >
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-400 ml-2">✕</button>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Water */}
          <div className="relative">
            <StatCard
              icon={Droplets}
              label="Hydration"
              value={Math.round(data.waterTotal / 1000 * 10) / 10}
              unit="L"
              goal={Math.round(data.waterGoal / 1000 * 10) / 10}
              color="#0284c7"
              bgColor="bg-blue-50 dark:bg-blue-400/10"
              onClick={() => setShowWaterPicker(!showWaterPicker)}
              loading={loading}
            />
            <AnimatePresence>
              {showWaterPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="absolute top-full mt-2 left-0 right-0 card p-3 z-20 shadow-xl"
                >
                  <p className="text-xs font-semibold text-text-muted mb-2">Quick Add Water</p>
                  <div className="grid grid-cols-3 gap-2">
                    {QUICK_WATERS.map(ml => (
                      <button
                        key={ml}
                        onClick={() => logWater(ml)}
                        disabled={waterLogging}
                        className="py-2 rounded-lg text-xs font-bold transition-all"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: '#0284c7' }}
                      >
                        {ml < 1000 ? `${ml}ml` : `${ml / 1000}L`}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {waterSuccess && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0 }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: '#0d9488' }}
              >
                <Check size={12} className="text-white" />
              </motion.div>
            )}
          </div>

          <StatCard
            icon={Moon}
            label="Sleep"
            value={data.sleepHours}
            unit="hrs"
            goal={data.sleepGoal}
            color="#7c3aed"
            bgColor="bg-purple-50 dark:bg-purple-400/10"
            loading={loading}
          />
          <StatCard
            icon={Flame}
            label="Calories In"
            value={data.calories}
            unit="kcal"
            goal={data.calorieGoal}
            color="#ea580c"
            bgColor="bg-orange-50 dark:bg-orange-400/10"
            loading={loading}
          />

          {/* XP Card */}
          <motion.div whileHover={{ y: -4 }} className="card p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-yellow-50 dark:bg-yellow-400/10 flex items-center justify-center">
                <Zap size={20} className="text-yellow-500" />
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-50 dark:bg-yellow-400/10 text-yellow-500">
                Lv {data.level}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-subtle uppercase tracking-wider mb-1">Health XP</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-text-main" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {data.points}
                </span>
                <span className="text-xs text-text-muted font-medium">pts</span>
              </div>
              <p className="text-xs text-text-subtle mt-0.5">{data.nextLevelAt - data.points} to next level</p>
            </div>
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-400"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, ((data.points % 500) / 500) * 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Droplets, label: 'Log Water', sub: '250ml glass', color: '#0284c7', bg: 'rgba(2,132,199,0.08)', onClick: () => logWater(250) },
              { icon: Flame, label: 'Log Meal', sub: 'AI powered', color: '#ea580c', bg: 'rgba(234,88,12,0.08)', href: '/food' },
              { icon: Moon, label: 'Log Sleep', sub: 'Track rest', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', href: '/sleep' },
              { icon: Heart, label: 'Lab Report', sub: 'Upload & analyze', color: '#ec4899', bg: 'rgba(236,72,153,0.08)', href: '/lab-report' },
            ].map((action, i) => (
              <motion.button
                key={i}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={action.onClick || (() => window.location.href = action.href!)}
                className="card p-4 text-left flex items-center gap-3 hover:border-current transition-all group"
                style={{ borderColor: 'var(--border)' } as any}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{ background: action.bg }}>
                  <action.icon size={18} style={{ color: action.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-main truncate">{action.label}</p>
                  <p className="text-xs text-text-muted truncate">{action.sub}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
