import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Layout from '../components/Layout';
import { Moon, Plus, BarChart3, TrendingUp, Clock, Loader2, CheckCircle2, XCircle, Zap, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { apiService } from '../services/api';

interface SleepEntry {
  _id?: string;
  date: string;
  bedtime: string;
  wake_time: string;
  duration_hours: number;
}

function SleepBar({ hours, goal = 8 }: { hours: number; goal?: number }) {
  const pct = Math.min(100, (hours / goal) * 100);
  const color = hours >= goal ? '#0d9488' : hours >= goal * 0.75 ? '#eab308' : '#ef4444';
  return (
    <div className="space-y-1">
      <div className="h-3 bg-border rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
      <div className="flex justify-between">
        <span className="text-xs font-bold" style={{ color }}>{hours}h</span>
        <span className="text-xs text-text-muted">Goal: {goal}h</span>
      </div>
    </div>
  );
}

function SleepQualityBadge({ hours }: { hours: number }) {
  if (hours >= 8) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-400/10 text-green-600">Excellent 😴</span>;
  if (hours >= 6) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-50 dark:bg-yellow-400/10 text-yellow-600">Fair 😑</span>;
  return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-400/10 text-red-500">Poor 😵</span>;
}

export default function SleepTrackerPage() {
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [isLogging, setIsLogging] = useState(false);
  const [logs, setLogs] = useState<SleepEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [goalHours, setGoalHours] = useState(8);

  const loadSleep = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.getSleepHistory(7);
      setLogs(data.logs || []);
      if (data.goal_hours) setGoalHours(data.goal_hours);
    } catch {
      setError('Could not load sleep data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSleep(); }, [loadSleep]);

  // Calculate duration from times
  const computeDuration = (): number => {
    const [bh, bm] = bedtime.split(':').map(Number);
    const [wh, wm] = wakeTime.split(':').map(Number);
    let diff = (wh * 60 + wm) - (bh * 60 + bm);
    if (diff < 0) diff += 24 * 60; // next day
    return Math.round((diff / 60) * 10) / 10;
  };

  const previewHours = computeDuration();

  const handleLog = async () => {
    setIsLogging(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      // Assemble ISO datetimes 
      const bedISO = `${today}T${bedtime}:00`;
      const wakeISO = previewHours <= 0
        ? `${new Date(Date.now() + 86400000).toISOString().split('T')[0]}T${wakeTime}:00`
        : `${today}T${wakeTime}:00`;

      await apiService.logSleep({
        bedtime: bedISO,
        wake_time: wakeISO,
        duration_hours: previewHours,
        quality: previewHours >= goalHours ? 10 : Math.round((previewHours / goalHours) * 10),
      });
      setSuccessMsg("Sleep logged successfully! +40 pts earned");
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadSleep();
    } catch (e: any) {
      setError(e.message || 'Could not log sleep.');
    } finally {
      setIsLogging(false);
    }
  };

  const handleDeleteSleep = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this sleep log?")) return;
    try {
      await apiService.deleteSleep(id);
      setSuccessMsg("🗑️ Sleep log deleted successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadSleep();
    } catch (err: any) {
      console.error(err);
      setError(`Failed: ${err.message || "Could not delete sleep log"}`);
    }
  };

  const avgSleep = logs.length
    ? Math.round((logs.reduce((s, l) => s + l.duration_hours, 0) / logs.length) * 10) / 10
    : 0;

  const weekBars = (logs.slice(0, 7)).reverse().map((l, i) => ({
    day: l.date ? new Date(l.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' }) : `D${i}`,
    hours: l.duration_hours,
  }));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-main" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Sleep Tracker
          </h1>
          <p className="text-text-muted text-sm mt-0.5">Monitor and improve your rest</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Last Night', val: logs[0]?.duration_hours || 0, unit: 'h', color: '#7c3aed' },
            { label: '7-day Avg', val: avgSleep, unit: 'h', color: '#0d9488' },
            { label: 'Goal', val: goalHours, unit: 'h', color: '#0284c7' },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className="text-2xl font-black text-text-main" style={{ fontFamily: 'Space Grotesk, sans-serif', color: s.color }}>
                {loading ? '—' : s.val}
                <span className="text-sm">{s.unit}</span>
              </p>
              <p className="text-xs text-text-muted font-semibold mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Weekly chart */}
        {weekBars.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-5"
          >
            <h2 className="font-semibold text-text-main text-sm mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-purple-500" />
              7-Day Sleep Pattern
            </h2>
            <div className="flex items-end gap-2 h-32 mt-2">
              {weekBars.map((d, i) => {
                const pct = Math.min(100, (d.hours / goalHours) * 100);
                const color = d.hours >= goalHours ? '#0d9488' : d.hours >= goalHours * 0.75 ? '#eab308' : '#ef4444';
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      className="w-full rounded-t-lg"
                      style={{ background: color, minHeight: 4 }}
                      initial={{ height: 0 }}
                      animate={{ height: `${pct * 1.2}px` }}
                      transition={{ duration: 0.6, delay: i * 0.08 }}
                      title={`${d.hours}h`}
                    />
                    <span className="text-[9px] font-bold text-text-muted">{d.day}</span>
                  </div>
                );
              })}
              {/* Fill remaining days */}
              {Array.from({ length: Math.max(0, 7 - weekBars.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full h-1 bg-border rounded-t-lg" />
                  <span className="text-[9px] font-bold text-text-subtle">—</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(13,148,136,0.3)' }} />
              <span className="text-[10px] text-text-muted">Goal line: {goalHours}h</span>
            </div>
          </motion.div>
        )}

        {/* Log Sleep Form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-5 space-y-5"
        >
          <h2 className="font-semibold text-text-main flex items-center gap-2">
            <Moon size={16} className="text-purple-500" />
            Log Last Night's Sleep
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-muted">🌙 Bedtime</label>
              <input
                type="time"
                value={bedtime}
                onChange={e => setBedtime(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-muted">☀️ Wake Time</label>
              <input
                type="time"
                value={wakeTime}
                onChange={e => setWakeTime(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* Preview */}
          {previewHours > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl p-4 space-y-2"
              style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-purple-500">Sleep Preview</span>
                <SleepQualityBadge hours={previewHours} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-purple-500" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {previewHours}
                </span>
                <span className="text-sm text-purple-400">hours</span>
              </div>
              <SleepBar hours={previewHours} goal={goalHours} />
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleLog}
            disabled={isLogging || previewHours <= 0}
            className="btn-primary w-full py-3"
            style={previewHours <= 0 ? { opacity: 0.5 } : {}}
          >
            {isLogging ? <Loader2 size={16} className="animate-spin" /> : <><Moon size={16} /> Log Sleep (+40 pts)</>}
          </motion.button>
        </motion.div>

        {/* History */}
        {logs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card p-5 space-y-3"
          >
            <h2 className="font-semibold text-text-main flex items-center gap-2">
              <Clock size={16} className="text-text-muted" />
              Recent History
            </h2>
            <div className="space-y-2">
              {logs.slice(0, 5).map((log, i) => (
                <motion.div
                  key={log._id || i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ border: '1px solid var(--border)' }}
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-400/10 flex items-center justify-center">
                    <Moon size={14} className="text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-main">{log.date}</p>
                    <p className="text-xs text-text-muted">
                      {log.bedtime?.split('T')[1]?.slice(0, 5) || '—'} → {log.wake_time?.split('T')[1]?.slice(0, 5) || '—'}
                    </p>
                  </div>
                  <SleepQualityBadge hours={log.duration_hours} />
                  <button 
                     onClick={(e) => handleDeleteSleep(log._id!, e)}
                     className="p-1 rounded opacity-50 hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 transition-all text-text-muted ml-1"
                  >
                     <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Notifications */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
              <XCircle size={16} /> {error}
              <button onClick={() => setError(null)} className="ml-auto">✕</button>
            </motion.div>
          )}
          {successMsg && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)', color: '#0d9488' }}>
              <CheckCircle2 size={16} /> {successMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
