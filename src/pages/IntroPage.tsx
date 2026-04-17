import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Activity, Beaker, Apple, Moon, Droplets, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function IntroPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-6 bg-bg-main selection:bg-primary-teal/20 transition-colors duration-300">
      <div className="w-full max-w-lg z-10 flex flex-col gap-14">
        {/* Hero Section */}
        <div className="text-left space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-4 mb-6"
          >
            <div className="w-4 h-4 bg-primary-teal rounded-full shadow-[0_0_20px_#0d9488]" />
            <span className="text-sm font-black tracking-[0.3em] uppercase text-primary-teal">Body Debugger OS</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-7xl font-black leading-[0.95] tracking-tighter text-text-main"
          >
            Your Health,<br />
            <span className="bg-gradient-to-r from-primary-teal to-accent-blue bg-clip-text text-transparent">Decoded.</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-text-muted text-xl font-medium leading-relaxed max-w-sm"
          >
            Stop staring at complex lab reports. We translate your bio-data into actionable insights. One seamless health platform for the modern student.
          </motion.p>
        </div>

        {/* Feature Grid - Premium Cards */}
        <div className="grid grid-cols-2 gap-6">
          {[
            { icon: <Beaker size={28} />, label: "Bio-Report Analysis", tag: "AI POWERED" },
            { icon: <Activity size={28} />, label: "Metabolic Tracker", tag: "NEW" },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
              className="premium-card p-8 flex flex-col gap-4 group relative"
            >
              {feature.tag && (
                <div className="absolute -top-3 -right-3 grad-teal px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest shadow-xl">
                  {feature.tag}
                </div>
              )}
              <div className="w-12 h-12 rounded-2xl bg-primary-teal/10 flex items-center justify-center text-primary-teal group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <p className="font-extrabold text-lg leading-tight tracking-tight text-text-main">{feature.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Action Button - Premium */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex justify-start"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="grad-teal px-10 py-5 rounded-3xl flex items-center gap-4 font-black text-xl hover:scale-[1.05] active:scale-[0.95] transition-all group shadow-2xl shadow-primary-teal/30"
          >
            Initialize Sync
            <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </motion.div>
      </div>

      <div className="absolute bottom-12 text-center w-full text-[11px] font-black text-text-muted tracking-[0.2em] uppercase opacity-30">
        Trusted by 10k+ Pioneers • HIPAA Compliant • Nexus OS v2.0
      </div>
    </div>
  );
}
