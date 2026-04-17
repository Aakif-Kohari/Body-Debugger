import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Activity, Beaker, Apple, Moon, Droplets, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function IntroPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-6 text-text-main">
      <div className="w-full max-w-lg z-10 flex flex-col gap-12">
        {/* Hero Section */}
        <div className="text-left space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="w-3 h-3 bg-primary-teal rounded-full shadow-[0_0_15px_#2dd4bf]" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-primary-teal">Body Debugger</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl font-extrabold leading-[1.1] tracking-tight bg-gradient-to-br from-white to-text-muted bg-clip-text text-transparent"
          >
            Your Health,<br />Decoded.
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-text-muted text-lg leading-relaxed max-w-sm"
          >
            Stop staring at blood reports you don't understand. Body Debugger translates your data into plain English and connects it to your daily habits. One health OS for the modern Indian student.
          </motion.p>
        </div>

        {/* Feature Grid - Glassmorphism */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: <Beaker size={24} />, label: "Lab Report Translator", tag: "AI POWERED" },
            { icon: <Moon size={24} />, label: "Sooja Bhai! Sleep", tag: "NEW" },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
              className="glass p-6 rounded-[2.5rem] flex flex-col gap-3 group relative"
            >
              {feature.tag && (
                <div className="absolute -top-3 -right-3 bg-primary-teal text-bg-dark px-3 py-1 rounded-full text-[10px] font-black shadow-[0_10px_20px_rgba(45,212,191,0.3)]">
                  {feature.tag}
                </div>
              )}
              <div className="w-10 h-10 rounded-full bg-primary-teal/10 flex items-center justify-center text-primary-teal">
                {feature.icon}
              </div>
              <p className="font-bold leading-tight">{feature.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Action Button - Neumorphism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex justify-start"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="neu-button px-8 py-4 rounded-2xl flex items-center gap-3 font-bold text-lg text-primary-teal active:scale-95 transition-all group"
          >
            Start Onboarding
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>

      <div className="absolute bottom-10 text-center w-full text-[10px] text-text-muted tracking-widest uppercase opacity-50">
        Trusted by 5,000+ Students • Secure HIPAA-Compliant Vault • v1.0.4
      </div>
    </div>
  );
}
