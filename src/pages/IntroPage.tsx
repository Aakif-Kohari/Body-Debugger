import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Activity, Heart, Brain, Shield, ArrowRight, Star } from 'lucide-react';

const features = [
  { icon: Activity, title: "Smart Tracking", desc: "Log food, water, and sleep with AI-powered analysis", color: "#0d9488" },
  { icon: Brain, title: "AI Health Coach", desc: "Get personalized insights and symptom analysis", color: "#7c3aed" },
  { icon: Heart, title: "Lab Reports", desc: "Upload and decode your medical test results instantly", color: "#ec4899" },
  { icon: Shield, title: "Health Vault", desc: "Securely store all your medical documents in one place", color: "#0284c7" },
];

export default function IntroPage() {
  const [currentFeature, setCurrentFeature] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFeature(i => (i + 1) % features.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #0d9488, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-10 text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-3xl grad-hero flex items-center justify-center shadow-2xl"
          >
            <Zap size={40} className="text-white" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-text-main" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Body<span className="text-gradient">Debug</span>
            </h1>
            <p className="text-text-muted text-sm mt-1 font-medium">Your AI Health Operating System</p>
          </div>
        </motion.div>

        {/* Feature Carousel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card p-6 space-y-4"
        >
          <div className="flex justify-center gap-1.5">
            {features.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentFeature(i)}
                className="w-6 h-1.5 rounded-full transition-all duration-300"
                style={{ background: i === currentFeature ? 'var(--primary-teal)' : 'var(--border)' }}
              />
            ))}
          </div>

          <motion.div
            key={currentFeature}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-start gap-4 text-left"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${features[currentFeature].color}15` }}>
              {React.createElement(features[currentFeature].icon, {
                size: 22, style: { color: features[currentFeature].color }
              })}
            </div>
            <div>
              <p className="font-bold text-text-main">{features[currentFeature].title}</p>
              <p className="text-sm text-text-muted mt-0.5">{features[currentFeature].desc}</p>
            </div>
          </motion.div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <Link
            to="/register"
            className="btn-primary w-full py-4 text-base justify-center rounded-2xl"
          >
            Get Started Free <ArrowRight size={18} />
          </Link>
          <Link
            to="/login"
            className="btn-secondary w-full py-4 text-base justify-center rounded-2xl"
          >
            I Already Have an Account
          </Link>
        </motion.div>

        <p className="text-xs text-text-subtle">
          No credit card required · Your data stays private
        </p>
      </div>
    </div>
  );
}
