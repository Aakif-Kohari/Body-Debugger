import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Layout from '../components/Layout';
import { Moon, Plus, Trash2, Clock, Activity, TrendingUp, Star } from 'lucide-react';
import { cn } from '../lib/utils';
import { storageService } from '../services/storage';

export default function SleepTrackerPage() {
  const [bedtime, setBedtime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [quality, setQuality] = useState(5);
  const [notes, setNotes] = useState('');
  const [sleepLogs, setSleepLogs] = useState(storageService.getLogs().filter(l => l.type === 'sleep'));

  useEffect(() => {
    setSleepLogs(storageService.getLogs().filter(l => l.type === 'sleep'));
  }, []);

  const calculateDuration = () => {
    const [bedHour, bedMin] = bedtime.split(':').map(Number);
    const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
    
    let duration = (wakeHour + (wakeMin / 60)) - (bedHour + (bedMin / 60));
    if (duration < 0) duration += 24;
    return Math.round(duration * 10) / 10;
  };

  const handleLogSleep = () => {
    const duration = calculateDuration();
    
    storageService.addLog({
      userId: 'demo',
      type: 'sleep',
      value: duration,
      notes: `${bedtime} to ${wakeTime} (Quality: ${quality}/10)`
    });

    setSleepLogs(storageService.getLogs().filter(l => l.type === 'sleep'));
    setBedtime('22:00');
    setWakeTime('06:30');
    setQuality(5);
    setNotes('');
  };

  const avgSleep = sleepLogs.length > 0 
    ? (sleepLogs.reduce((sum, log) => sum + log.value, 0) / sleepLogs.length).toFixed(1)
    : '0';

  const qualityAvg = sleepLogs.length > 0
    ? Math.round(sleepLogs.reduce((sum, log) => {
        const quality = parseInt(log.notes?.split('Quality: ')[1]?.split('/')[0] || '5');
        return sum + quality;
      }, 0) / sleepLogs.length)
    : 0;

  const duration = calculateDuration();

  return (
    <Layout>
      <div className="p-6 space-y-8 max-w-4xl mx-auto text-text-main">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight">Sleep Sanctuary</h1>
          <p className="text-text-muted">Track your rest. Improve your health.</p>
        </div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[2.5rem] p-8 border-white/10 shadow-2xl"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <p className="text-xs uppercase font-black text-text-muted tracking-widest">Avg Sleep</p>
              <p className="text-3xl font-black text-indigo-400">{avgSleep}h</p>
              <p className="text-xs text-text-muted">last 7 days</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase font-black text-text-muted tracking-widest">Quality</p>
              <p className="text-3xl font-black text-primary-teal">{qualityAvg}</p>
              <p className="text-xs text-text-muted">/10</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase font-black text-text-muted tracking-widest">Total Logs</p>
              <p className="text-3xl font-black text-accent-blue">{sleepLogs.length}</p>
              <p className="text-xs text-text-muted">nights</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase font-black text-text-muted tracking-widest">Goal</p>
              <p className="text-3xl font-black text-accent-pink">8h</p>
              <p className="text-xs text-text-muted">target</p>
            </div>
          </div>
        </motion.div>

        {/* Sleep Logger */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[2.5rem] p-8 space-y-6 border-white/10 shadow-2xl"
        >
          <h2 className="text-xl font-black">How did you sleep?</h2>

          <div className="space-y-6">
            {/* Bedtime & Wake Time */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-black text-text-muted uppercase tracking-widest mb-3">
                  <Clock size={16} className="inline mr-2" />
                  Bedtime
                </label>
                <input
                  type="time"
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-lg font-bold focus:outline-none focus:border-primary-teal/50 transition-all text-text-main"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-text-muted uppercase tracking-widest mb-3">
                  <Moon size={16} className="inline mr-2" />
                  Wake Time
                </label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-lg font-bold focus:outline-none focus:border-primary-teal/50 transition-all text-text-main"
                />
              </div>
            </div>

            {/* Duration Preview */}
            <div className="bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-2xl p-6 border border-indigo-400/20">
              <p className="text-sm text-text-muted uppercase font-black tracking-widest mb-2">Sleep Duration</p>
              <p className="text-4xl font-black text-indigo-400">{duration}h</p>
            </div>

            {/* Quality Rating */}
            <div>
              <label className="block text-sm font-black text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                <Star size={16} />
                Sleep Quality
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, rgb(99, 102, 241) 0%, rgb(99, 102, 241) ${(quality / 10) * 100}%, rgb(255, 255, 255) ${(quality / 10) * 100}%, rgb(255, 255, 255) 100%)`
                  }}
                />
                <div className="bg-indigo-400 text-bg-dark rounded-xl px-4 py-2 font-black text-lg min-w-[60px] text-center">
                  {quality}/10
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-black text-text-muted uppercase tracking-widest mb-3">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Had coffee late, felt restless..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-primary-teal/50 transition-all placeholder:text-text-muted/30 font-bold text-text-main"
                rows={2}
              />
            </div>

            {/* Log Button */}
            <button
              onClick={handleLogSleep}
              className="w-full py-5 rounded-2xl font-black bg-indigo-400 text-bg-dark hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center gap-3 text-lg"
            >
              <Moon size={24} />
              Log Sleep
            </button>
          </div>
        </motion.div>

        {/* Sleep History */}
        {sleepLogs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[2.5rem] p-8 space-y-4 border-white/10 shadow-2xl"
          >
            <h2 className="text-xl font-black flex items-center gap-2">
              <TrendingUp size={24} className="text-indigo-400" />
              Recent Sleep
            </h2>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {sleepLogs.reverse().map((log) => (
                <div key={log.id} className="bg-white/5 rounded-2xl p-5 flex items-center justify-between border border-white/10 hover:border-indigo-400/30 transition-all">
                  <div className="flex-1">
                    <p className="font-bold">{log.notes?.split(' (')[0]}</p>
                    <p className="text-xs text-text-muted">
                      {log.value}h • Quality: {log.notes?.split('Quality: ')[1]?.split('/')[0]}
                    </p>
                  </div>
                  <button className="p-2 hover:bg-red-400/10 rounded-lg transition-colors text-red-400">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
