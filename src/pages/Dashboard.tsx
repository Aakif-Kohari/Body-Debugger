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
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Namaste, Said!</h1>
            <p className="text-text-muted text-sm">Your systems are functioning normally.</p>
          </div>
          <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-primary-teal border-white/5 shadow-2xl">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Health Score Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[2.5rem] p-8 relative overflow-hidden group border-white/10 shadow-2xl"
        >
          <div className="flex justify-between items-start z-10 relative">
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-widest text-text-muted">Personal Health Score</span>
              <div className="flex items-baseline gap-2">
                <span className="text-7xl font-black text-white">
                  {Math.min(100, Math.round((uiStats.reduce((acc, curr) => acc + Math.min(100, curr.progress), 0) / 4)))}
                </span>
                <span className="text-xl font-bold text-text-muted opacity-40">/100</span>
              </div>
            </div>
            <div className="bg-primary-teal text-bg-dark px-4 py-1.5 rounded-full text-[11px] font-black shadow-[0_10px_20px_rgba(45,212,191,0.4)]">
              STABLE
            </div>
          </div>
          
          <div className="mt-8 relative z-10">
            <p className="text-sm font-medium text-text-muted leading-relaxed max-w-[80%]">
              {stats.water < 4 ? "Hydration critical. Your focus levels will suffer if you don't refill now." : "Hydration levels are optimal. System performance is high."}
            </p>
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-teal/5 rounded-full blur-[100px] -mr-32 -mt-32" />
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleQuickAddWater}
            className="neu-button p-5 rounded-2xl flex items-center justify-between group active:scale-95 transition-all text-primary-teal"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-teal/10 flex items-center justify-center">
                <Droplets size={20} />
              </div>
              <span className="font-bold text-sm">Add Water</span>
            </div>
            <Plus size={18} />
          </button>
          <button className="neu-button p-5 rounded-2xl flex items-center justify-between group active:scale-95 transition-all text-accent-blue">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center">
                <Flame size={20} />
              </div>
              <span className="font-bold text-sm">Log Food</span>
            </div>
            <Plus size={18} />
          </button>
        </div>

        {/* Individual Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {uiStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-5 rounded-3xl space-y-4 border-white/5 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className={cn("p-2 rounded-xl", stat.bg)}>
                  <stat.icon size={18} className={stat.color} />
                </div>
                <ChevronRight size={14} className="text-text-muted opacity-30" />
              </div>
              
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{stat.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black">{stat.value}</span>
                  <span className="text-[10px] font-bold text-text-muted">{stat.unit}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, stat.progress)}%` }}
                  className={cn("h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]", stat.color.replace('text', 'bg'))}
                />
              </div>
            </motion.div>
          ))}
        </div>

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
