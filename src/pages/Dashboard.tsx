import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Layout from '../components/Layout';
import { Droplets, Flame, Moon, Smartphone, TrendingUp, ChevronRight, Plus, Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { apiService } from '../services/api';

interface DashboardStats {
  water: number;
  sleep: number;
  calories: number;
  screenTime: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    water: 0,
    sleep: 0,
    calories: 0,
    screenTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load data from multiple endpoints
      const [foodData, waterData, sleepData] = await Promise.all([
        apiService.getTodayFood(),
        apiService.getTodayWater(),
        apiService.getSleepHistory(1)
      ]);

      // Calculate stats from API data
      const calories = foodData.logs?.reduce((sum: number, log: any) => sum + log.total_calories, 0) || 0;
      const water = waterData.total_glasses || 0;
      const sleep = sleepData.logs?.[0]?.duration_hours || 0;
      const screenTime = 0; // This would need to be tracked separately

      setStats({
        water,
        sleep,
        calories,
        screenTime
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const uiStats: Array<{
    label: string;
    value: string;
    unit: string;
    icon: LucideIcon;
    color: string;
    bg: string;
    progress: number;
  }> = [
    { label: "Hydration", value: stats.water.toString(), unit: "glasses", icon: Droplets, color: "text-blue-400", bg: "bg-blue-400/10", progress: (stats.water / 8) * 100 },
    { label: "Sleep", value: stats.sleep.toString(), unit: "hours", icon: Moon, color: "text-indigo-400", bg: "bg-indigo-400/10", progress: (stats.sleep / 8) * 100 },
    { label: "Fuel", value: stats.calories.toString(), unit: "kcal", icon: Flame, color: "text-orange-400", bg: "bg-orange-400/10", progress: (stats.calories / 2000) * 100 },
    { label: "Screen", value: stats.screenTime.toString(), unit: "hours", icon: Smartphone, color: "text-purple-400", bg: "bg-purple-400/10", progress: (stats.screenTime / 6) * 100 },
  ];

  const handleQuickAddWater = async () => {
    try {
      setError(null);
      await apiService.logWater(250); // 250ml glass
      await loadDashboardData(); // Refresh data
    } catch (err) {
      console.error('Failed to log water:', err);
      setError('Failed to log water');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3 text-health-primary">
            <Loader2 size={24} className="animate-spin" />
            <span>Loading your health data...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-8 max-w-2xl mx-auto text-text-main">
        {/* Header */}
        <div className="flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary-teal to-accent-blue bg-clip-text text-transparent">
              Namaste!
            </h1>
            <p className="text-text-muted text-sm font-medium">Your systems are functioning normally.</p>
          </motion.div>
          <motion.div 
            whileHover={{ rotate: 15 }}
            className="w-14 h-14 rounded-3xl glass flex items-center justify-center text-primary-teal shadow-xl border-primary-teal/10"
          >
            <TrendingUp size={28} />
          </motion.div>
        </div>

        {/* Health Score Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="premium-card p-10 relative overflow-hidden group"
        >
          <div className="flex justify-between items-start z-10 relative">
            <div className="space-y-1">
              <span className="text-[12px] font-black uppercase tracking-[0.2em] text-primary-teal/70">Bio-Sync Score</span>
              <div className="flex items-baseline gap-2">
                <span className="text-8xl font-black tracking-tighter text-text-main">
                  {Math.min(100, Math.round((uiStats.reduce((acc, curr) => acc + Math.min(100, curr.progress), 0) / 4)))}
                </span>
                <span className="text-2xl font-bold text-text-muted opacity-30">/100</span>
              </div>
            </div>
            <div className="grad-teal px-6 py-2 rounded-full text-[12px] font-black tracking-widest animate-pulse">
              OPTIMIZED
            </div>
          </div>
          
          <div className="mt-10 relative z-10">
            <p className="text-base font-medium text-text-muted leading-relaxed max-w-[85%]">
              {stats.water < 4 
                ? "Hydration levels are sub-optimal. Bio-metrics suggest a 15% drop in cognitive focus." 
                : "Your neurological and metabolic sync is at peak performance today. Keep up the high activity."}
            </p>
          </div>

          {/* Decorative background circle */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary-teal/10 rounded-full blur-[120px] -mr-32 -mt-32 transition-colors group-hover:bg-primary-teal/20" />
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-5">
          <motion.button 
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleQuickAddWater}
            className="premium-card p-6 flex items-center justify-between group active:scale-95 text-primary-teal"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-teal/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Droplets size={24} />
              </div>
              <span className="font-extrabold text-base tracking-tight">Log Water</span>
            </div>
            <Plus size={20} className="opacity-40" />
          </motion.button>
          
          <motion.button 
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="premium-card p-6 flex items-center justify-between group active:scale-95 text-accent-blue"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent-blue/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Flame size={24} />
              </div>
              <span className="font-extrabold text-base tracking-tight">Record Meal</span>
            </div>
            <Plus size={20} className="opacity-40" />
          </motion.button>
        </div>

        {/* Individual Stats Grid */}
        <div className="grid grid-cols-2 gap-5 text-text-main">
          {uiStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className="premium-card p-6 space-y-5 border-primary-teal/5"
            >
              <div className="flex items-center justify-between">
                <div className={cn("p-3 rounded-2xl", stat.bg)}>
                  <stat.icon size={22} className={stat.color} />
                </div>
                <ChevronRight size={18} className="text-text-muted opacity-20" />
              </div>
              
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black tracking-tighter">{stat.value}</span>
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-tighter">{stat.unit}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-health-lightest dark:bg-health-dark/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, stat.progress)}%` }}
                  className={cn("h-full rounded-full shadow-sm", stat.color.replace('text', 'bg'))}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="premium-card p-6 border-red-500/20 bg-red-500/5 text-center"
          >
            <p className="text-red-500 font-bold tracking-tight">{error}</p>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
