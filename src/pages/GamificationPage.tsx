import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Layout from '../components/Layout';
import {
  Trophy, Star, Zap, Crown, TrendingUp, Target, Gift,
  Flame, Droplets, Moon, FlaskConical, MessageCircle, Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { apiService } from '../services/api';

const ACTIVITY_POINTS: Record<string, { icon: React.ElementType; label: string; pts: number; color: string }> = {
  food_log: { icon: Flame, label: 'Log a Meal', pts: 50, color: '#ea580c' },
  water_log: { icon: Droplets, label: 'Drink Water', pts: 10, color: '#0284c7' },
  sleep_log: { icon: Moon, label: 'Log Sleep', pts: 40, color: '#7c3aed' },
  lab_report: { icon: FlaskConical, label: 'Upload Lab Report', pts: 200, color: '#ec4899' },
  symptom_check: { icon: MessageCircle, label: 'Check a Symptom', pts: 30, color: '#0d9488' },
};

const RANK_THRESHOLDS = [
  { name: 'Novice', min: 0, icon: '🌱', color: '#64748b' },
  { name: 'Health Seeker', min: 500, icon: '⚡', color: '#0d9488' },
  { name: 'Vitality Master', min: 1500, icon: '🔥', color: '#ea580c' },
  { name: 'Elite Human', min: 3000, icon: '💎', color: '#7c3aed' },
  { name: 'Anti-Gravity Legend', min: 6000, icon: '👑', color: '#eab308' },
];

function getRankInfo(points: number) {
  let rank = RANK_THRESHOLDS[0];
  for (const r of RANK_THRESHOLDS) {
    if (points >= r.min) rank = r;
  }
  const nextRank = RANK_THRESHOLDS.find(r => r.min > points) || rank;
  const progress = nextRank === rank ? 100 : Math.round(((points - rank.min) / (nextRank.min - rank.min)) * 100);
  return { rank, nextRank, progress };
}

export default function GamificationPage() {
  const [stats, setStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [pts, lb] = await Promise.allSettled([
        apiService.getPoints(),
        apiService.getLeaderboard(5),
      ]);
      if (pts.status === 'fulfilled') setStats(pts.value);
      if (lb.status === 'fulfilled') setLeaderboard(lb.value.leaderboard || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const points = stats?.points || 0;
  const level = stats?.level || 1;
  const { rank, nextRank, progress } = getRankInfo(points);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-main" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Health XP
          </h1>
          <p className="text-text-muted text-sm mt-0.5">Earn points by staying healthy</p>
        </div>

        {/* Rank Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl p-6 text-white"
          style={{ background: `linear-gradient(135deg, ${rank.color}, ${rank.color}88)` }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Current Rank</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-3xl">{rank.icon}</span>
                  <h2 className="text-xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {rank.name}
                  </h2>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs uppercase tracking-widest">Level</p>
                <p className="text-4xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{level}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-white/80">{points} pts</span>
                <span className="text-white/60">{nextRank.min} pts for {nextRank.icon} {nextRank.name}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Star, label: 'Total XP', val: loading ? '—' : `${points}`, color: '#eab308' },
            { icon: Zap, label: 'Level', val: loading ? '—' : `${level}`, color: '#0d9488' },
            { icon: Target, label: 'Next Up', val: loading ? '—' : `${Math.max(0, nextRank.min - points)}`, color: '#7c3aed' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card p-4 text-center"
            >
              <s.icon size={18} className="mx-auto mb-2" style={{ color: s.color }} />
              <p className="text-xl font-black text-text-main" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {s.val}
              </p>
              <p className="text-xs text-text-muted font-semibold">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* How to Earn */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-text-main flex items-center gap-2">
            <Gift size={16} className="text-primary-teal" />
            How to Earn Points
          </h2>
          <div className="space-y-2">
            {Object.entries(ACTIVITY_POINTS).map(([key, activity]) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${activity.color}15` }}>
                    <activity.icon size={15} style={{ color: activity.color }} />
                  </div>
                  <span className="text-sm font-medium text-text-main">{activity.label}</span>
                </div>
                <span className="text-sm font-bold" style={{ color: activity.color }}>+{activity.pts}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-text-main flex items-center gap-2">
              <Trophy size={16} className="text-yellow-500" />
              Top Performers
            </h2>
            <div className="space-y-2">
              {leaderboard.map((entry: any, i: number) => {
                const { rank: entryRank } = getRankInfo(entry.points || 0);
                return (
                  <motion.div
                    key={entry._id || i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl",
                      i === 0 ? "bg-yellow-50 dark:bg-yellow-400/10 border border-yellow-200 dark:border-yellow-400/20" : ""
                    )}
                    style={i !== 0 ? { border: '1px solid var(--border)' } : {}}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-black",
                      i === 0 ? 'bg-yellow-400 text-white' :
                      i === 1 ? 'bg-slate-300 text-white' :
                      i === 2 ? 'bg-orange-400 text-white' : 'bg-border text-text-muted'
                    )}>
                      {i === 0 ? '👑' : `#${i + 1}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-main truncate">
                        {entry.user_id?.replace('user_', 'User ').slice(0, 20) || `Player ${i + 1}`}
                        <span className="ml-1">{entryRank.icon}</span>
                      </p>
                      <p className="text-xs text-text-muted">{entryRank.name}</p>
                    </div>
                    <span className="text-sm font-bold text-yellow-500">{entry.points || 0} pts</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rank Ladder */}
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-text-main flex items-center gap-2">
            <TrendingUp size={16} className="text-text-muted" />
            Rank Ladder
          </h2>
          <div className="space-y-2">
            {RANK_THRESHOLDS.map((r, i) => {
              const isCurrentRank = r.name === rank.name;
              return (
                <div key={r.name}
                  className={cn("flex items-center gap-3 p-3 rounded-xl transition-all",
                    isCurrentRank ? "ring-2" : "")}
                  style={{
                    background: isCurrentRank ? `${r.color}10` : 'var(--surface)',
                    border: `1px solid ${isCurrentRank ? r.color + '40' : 'var(--border)'}`,
                    ringColor: isCurrentRank ? r.color : undefined
                  } as any}
                >
                  <span className="text-xl">{r.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-main">{r.name}</p>
                    <p className="text-xs text-text-muted">{r.min.toLocaleString()}+ pts</p>
                  </div>
                  {isCurrentRank && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ background: r.color }}>YOU</span>
                  )}
                  {points >= r.min && !isCurrentRank && (
                    <span className="text-xs text-primary-teal font-bold">✓</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
