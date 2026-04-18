import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Layout from '../components/Layout';
import { apiService } from '../services/api';
import { Network, Brain, Heart, Activity, AlertTriangle, CheckCircle, HelpCircle, ActivitySquare, Wind, Target, Dumbbell, RefreshCw, Clock } from 'lucide-react';

interface OrganStatus {
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';
  reason: string;
  color: string;
}

interface TwinData {
  organs: {
    Brain: OrganStatus;
    Lungs: OrganStatus;
    Heart: OrganStatus;
    Liver: OrganStatus;
    Stomach: OrganStatus;
    Joints: OrganStatus;
  };
}

export default function DigitalTwinPage() {
  const [data, setData] = useState<TwinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrgan, setSelectedOrgan] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  // --- BIO-TEMPORAL SIMULATOR STATE ---
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSleep, setSimSleep] = useState(8);
  const [simWater, setSimWater] = useState(2500);
  const [simActivity, setSimActivity] = useState(150); 

  const fetchData = async (silent = false) => {
    try {
      if (silent) setSyncing(true);
      else setLoading(true);
      const res = await apiService.getDigitalTwin();
      setData(res);
      setLastSynced(new Date());
      setSecondsAgo(0);
      setError(null);
    } catch (e) {
      if (!silent) setError("Failed to synchronize Digital Twin matrix.");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  // --- LOCAL PROJECTION ENGINE (LPE) ---
  const getSimulatedData = (): TwinData => {
    const twin: TwinData = {
      organs: {
        Brain:   { status: "OPTIMAL", reason: "Projected brain health is excellent with disciplined sleep.", color: "#10b981" },
        Lungs:   { status: "OPTIMAL", reason: "Respiratory capacity matches your activity level.", color: "#10b981" },
        Heart:   { status: "OPTIMAL", reason: "Cardiovascular resilience is steady.", color: "#10b981" },
        Liver:   { status: "OPTIMAL", reason: "Toxin filtration is efficient.", color: "#10b981" },
        Stomach: { status: "OPTIMAL", reason: "Metabolism is firing perfectly.", color: "#10b981" },
        Joints:  { status: "OPTIMAL", reason: "Joint lubrication and mobility are peak.", color: "#10b981" }
      }
    };

    if (simSleep < 5) {
      twin.organs.Brain = { status: "CRITICAL", reason: `At ${simSleep}h sleep, your cognitive function drops significantly. High fatigue projected.`, color: "#ef4444" };
    } else if (simSleep < 7) {
      twin.organs.Brain = { status: "WARNING", reason: `${simSleep}h sleep is sub-optimal. Long-term cognitive drift detected.`, color: "#eab308" };
    }

    if (simWater < 1200) {
      twin.organs.Stomach = { status: "CRITICAL", reason: "Severe dehydration. Metabolic processes are failing.", color: "#ef4444" };
      twin.organs.Liver = { status: "WARNING", reason: "Toxin buildup due to low filtration volume.", color: "#eab308" };
    } else if (simWater < 2000) {
      twin.organs.Stomach = { status: "WARNING", reason: "Dehydration drift. Digestion is becoming sluggish.", color: "#eab308" };
    }

    if (simActivity < 50) {
      twin.organs.Joints = { status: "WARNING", reason: "Sedentary lifestyle projected to cause joint stiffness.", color: "#eab308" };
      twin.organs.Heart = { status: "WARNING", reason: "Low cardio load. Heart efficiency declining.", color: "#eab308" };
    }

    return twin;
  };

  const activeData = isSimulating ? getSimulatedData() : data;

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const pollInterval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(pollInterval);
  }, []);
  useEffect(() => {
    const tick = setInterval(() => {
      if (lastSynced) setSecondsAgo(Math.floor((Date.now() - lastSynced.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [lastSynced]);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'OPTIMAL': return <CheckCircle size={14} className="text-emerald-400" />;
      case 'WARNING': return <AlertTriangle size={14} className="text-yellow-400" />;
      case 'CRITICAL': return <AlertTriangle size={14} className="text-red-400" />;
      default: return <HelpCircle size={14} className="text-gray-400" />;
    }
  };

  const organs = [
    { id: 'Brain',   label: 'Neurological / Sleep',  icon: Brain,          y: '10%', x: '50%' },
    { id: 'Lungs',   label: 'Respiratory System',     icon: Wind,           y: '24%', x: '43%' },
    { id: 'Heart',   label: 'Cardiovascular',         icon: Heart,          y: '26%', x: '57%' },
    { id: 'Liver',   label: 'Toxin Filtration',       icon: Target,         y: '36%', x: '43%' },
    { id: 'Stomach', label: 'Metabolism / Hydration', icon: ActivitySquare, y: '39%', x: '57%' },
    { id: 'Joints',  label: 'Musculoskeletal',        icon: Dumbbell,       y: '58%', x: '50%' },
  ];

  return (
    <Layout>
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Network className="text-blue-400" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Biological Digital Twin</h1>
            <p className="text-text-muted text-sm">Real-time mapping of your lifestyle data onto your physiological matrix.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div 
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all border ${isSimulating ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'}`}
          >
            <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-purple-400 animate-pulse' : 'bg-white/20'}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{isSimulating ? 'Simulator' : 'Live Mode'}</span>
          </div>

          {!isSimulating && (
            <div className="flex flex-col items-end gap-1 shrink-0">
              <button
                onClick={() => fetchData(true)}
                disabled={syncing || loading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all text-xs font-semibold disabled:opacity-50"
              >
                <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div className="card border-red-500/20 bg-red-500/5 p-4 text-red-400 text-sm">{error}</div>
      ) : loading || !activeData ? (
        <div className="h-96 flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
          <p className="text-blue-400 font-semibold animate-pulse tracking-widest text-xs uppercase">Connecting to physiological stream...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start pb-10">
          
          {/* LEFT COLUMN */}
          <div className="space-y-4">
            <div className="card overflow-hidden border-blue-500/20 bg-gradient-to-b from-[#020a18] to-black p-0">
              <div className="relative w-full">
                <motion.div
                  animate={{ top: ['0%', '100%'] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
                  className="absolute left-0 right-0 h-px bg-cyan-400/60 shadow-[0_0_12px_4px_rgba(34,211,238,0.4)] z-20 pointer-events-none"
                />
                <img
                  src="/human_twin.png"
                  alt="3D Human Scan"
                  className="w-full h-auto block relative z-0 select-none"
                  draggable={false}
                  style={{ filter: 'drop-shadow(0 0 18px rgba(56,189,248,0.15))' }}
                />

                <div className="absolute inset-0 z-30">
                  {organs.map((organ) => {
                    const statusData = (activeData as TwinData).organs[organ.id as keyof typeof data.organs];
                    const Icon = organ.icon;
                    const isSelected = selectedOrgan === organ.id;

                    return (
                      <motion.button
                        key={organ.id}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedOrgan(isSelected ? null : organ.id)}
                        style={{ top: organ.y, left: organ.x, transform: 'translate(-50%, -50%)' }}
                        className="absolute group outline-none"
                      >
                        {statusData.status !== 'OPTIMAL' && (
                          <div className="absolute -inset-2 rounded-full animate-ping opacity-40 border-2" style={{ borderColor: statusData.color }} />
                        )}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 backdrop-blur-sm transition-all duration-200 ${isSelected ? 'scale-125' : ''}`}
                          style={{
                            backgroundColor: `${statusData.color}25`,
                            borderColor: isSelected ? 'white' : `${statusData.color}90`,
                            boxShadow: `0 0 12px ${statusData.color}40`
                          }}
                        >
                          <Icon size={14} style={{ color: isSelected ? 'white' : statusData.color }} />
                        </div>
                        <div
                          className="absolute left-[38px] top-1/2 -translate-y-1/2 w-48 bg-black/95 rounded-lg border p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl"
                          style={{ borderColor: `${statusData.color}50` }}
                        >
                          <p className="text-[11px] font-bold text-white uppercase mb-1">{organ.id}</p>
                          <span className="text-[10px] text-white/70 leading-snug block">{statusData.reason}</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            <AnimatePresence>
              {isSimulating && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="card border-purple-500/30 bg-purple-500/5 p-4 space-y-4">
                    <h3 className="text-[10px] font-bold text-purple-300 uppercase tracking-[0.2em] mb-2">Simulation Engine</h3>
                    <div className="space-y-4">
                      {[{ label: 'Sleep Rhythm', val: simSleep, set: setSimSleep, min: 3, max: 11, unit: 'h' },
                        { label: 'Hydration', val: simWater, set: setSimWater, min: 500, max: 4500, unit: 'ml' },
                        { label: 'Activity Load', val: simActivity, set: setSimActivity, min: 0, max: 600, unit: 'xp' }].map((s) => (
                        <div key={s.label} className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold text-white/50 lowercase">
                            <span>{s.label}</span>
                            <span className="text-white">{s.val}{s.unit}</span>
                          </div>
                          <input type="range" min={s.min} max={s.max} value={s.val} onChange={(e) => s.set(parseFloat(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
              <Activity size={14} className="text-blue-500" /> Matrix Status
            </h2>
            {organs.map((organ) => {
              const statusData = (activeData as TwinData).organs[organ.id as keyof typeof data.organs];
              const isSelected = selectedOrgan === organ.id;
              return (
                <div key={organ.id} onClick={() => setSelectedOrgan(isSelected ? null : organ.id)} className={`rounded-xl border p-4 transition-all cursor-pointer ${isSelected ? 'bg-white/5' : 'bg-white/[0.02] hover:bg-white/5'}`} style={{ borderColor: isSelected ? `${statusData.color}60` : 'rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${statusData.color}10` }}>
                        <organ.icon size={18} style={{ color: statusData.color }} />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-sm tracking-wide">{organ.id}</h3>
                        <p className="text-[10px] text-text-muted uppercase tracking-tighter">{organ.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/5" style={{ backgroundColor: `${statusData.color}10` }}>
                      <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: statusData.color }}>{statusData.status}</span>
                    </div>
                  </div>
                  { (isSelected || (selectedOrgan === null && statusData.status !== 'OPTIMAL')) && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <p className="text-[11px] leading-relaxed text-text-muted italic">{statusData.reason}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Layout>
  );
}
