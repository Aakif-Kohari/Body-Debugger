import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  Activity, 
  Heart, 
  Brain, 
  Shield, 
  ArrowRight, 
  Network, 
  Clock, 
  Target, 
  Stethoscope,
  Dumbbell,
  Search,
  Lock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const FeatureCard = ({ icon: Icon, title, desc, color }: { icon: any, title: string, desc: string, color: string }) => (
  <motion.div 
    variants={itemVariants}
    whileHover={{ y: -5 }}
    className="glass p-8 rounded-[2.5rem] border-white/5 space-y-4 hover:border-white/10 transition-all text-left"
  >
    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
      <Icon size={28} style={{ color }} />
    </div>
    <div className="space-y-2">
      <h3 className="text-xl font-black text-white tracking-tight">{title}</h3>
      <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
    </div>
  </motion.div>
);

export default function IntroPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-bg-main overflow-x-hidden selection:bg-primary-teal/30">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary-teal/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-accent-blue/10 rounded-full blur-[120px]" />
      </div>

      <nav className="fixed top-0 left-0 right-0 h-20 z-50 flex items-center justify-between px-6 lg:px-12 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl grad-hero flex items-center justify-center shadow-lg">
            <Zap size={22} className="text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white">Body<span className="text-primary-teal">Debug</span></span>
        </div>
        <div className="flex items-center gap-4">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="text-sm font-bold text-text-muted hover:text-white transition-colors">Login</Link>
              <Link to="/register" className="btn-primary py-2 px-6 rounded-xl text-sm">Join Now</Link>
            </>
          ) : (
            <Link to="/dashboard" className="btn-primary py-2 px-6 rounded-xl text-sm">Dashboard</Link>
          )}
        </div>
      </nav>

      <main className="relative z-10 pt-32 lg:pt-48 space-y-32 lg:space-y-64 pb-32 px-6">
        
        {/* HERO SECTION */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="max-w-4xl mx-auto text-center space-y-12"
        >
          <div className="space-y-6">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary-teal text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              <Activity size={12} className="animate-pulse" />
              The Bio-Temporal Era is Here
            </motion.div>
            <motion.h1 
              variants={itemVariants}
              className="text-5xl lg:text-8xl font-black tracking-tight leading-[0.9] text-white"
            >
              Your Body,<br /> 
              <span className="text-gradient">Now Debugged.</span>
            </motion.h1>
            <motion.p 
              variants={itemVariants}
              className="text-lg lg:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed"
            >
              Body Debugger is your personal AI health operating system. We map your bio-markers, nutrition, and sleep onto a 3D digital matrix to predict your future health today.
            </motion.p>
          </div>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isAuthenticated ? (
              <>
                <Link to="/register" className="btn-primary py-5 px-10 text-lg rounded-2xl w-full sm:w-auto min-w-[200px]">
                  Initialize Your Twin <ArrowRight size={20} />
                </Link>
                <Link to="/login" className="btn-secondary py-5 px-10 text-lg rounded-2xl w-full sm:w-auto min-w-[200px]">
                  Existing Journey
                </Link>
              </>
            ) : (
              <Link to="/dashboard" className="btn-primary py-5 px-10 text-lg rounded-2xl w-full sm:w-auto min-w-[200px]">
                Return to Dashboard <ArrowRight size={20} />
              </Link>
            )}
          </motion.div>
        </motion.section>

        {/* FEATURE: DIGITAL TWIN */}
        <section className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary-teal/10 flex items-center justify-center text-primary-teal border border-primary-teal/20">
              <Network size={28} />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">Biological Digital Twin</h2>
              <p className="text-lg text-text-muted leading-relaxed">
                Experience a 3D physiological avatar that lives and reacts with you. By integrating your health data points, we visualize exactly how your lifestyle affects every organ in real-time.
              </p>
            </div>
            <ul className="space-y-4">
              {[
                { icon: Brain, text: "Neurological & Sleep Syncing" },
                { icon: Heart, text: "Cardiovascular resilience mapping" },
                { icon: Activity, text: "Metabolic and physical load tracking" }
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-white font-bold">
                  <div className="w-2 h-2 rounded-full bg-primary-teal shadow-[0_0_10px_rgba(45,212,191,0.5)]" />
                  {item.text}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-primary-teal/20 rounded-full blur-[100px] opacity-30" />
            <img 
              src="/human_twin.png" 
              alt="Digital Twin Preview" 
              className="w-full h-auto relative z-10 select-none pointer-events-none drop-shadow-[0_0_80px_rgba(45,212,191,0.2)]" 
            />
          </motion.div>
        </section>

        {/* GRID FEATURES */}
        <section className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-6">
            <h2 className="text-4xl lg:text-5xl font-black text-white">Clinical Performance,<br />Consumer UX.</h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">We combine world-class AI models with high-frequency health tracking to provide a forensic overview of your biology.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={Search} 
              color="#2dd4bf"
              title="Lab Translator" 
              desc="Upload clinical blood tests and get instant, plain-English decoding of every biomarker. No more medical confusion."
            />
            <FeatureCard 
              icon={Clock} 
              color="#38bdf8"
              title="Bio-Simulator" 
              desc="The 'What-If' engine. Simulate how changing your sleep or water intake today affects your heart health in 10 years."
            />
            <FeatureCard 
              icon={Target} 
              color="#a78bfa"
              title="Time Machine" 
              desc="See your future health trajectory. Predict potential issues before they become symptoms with our temporal forecasting."
            />
            <FeatureCard 
              icon={Dumbbell} 
              color="#f472b6"
              title="Activity Matrix" 
              desc="Real-time syncing of physical activity with physiological impact. Understand exactly how much each XP point helps you."
            />
            <FeatureCard 
              icon={Shield} 
              color="#fb923c"
              title="Health Vault" 
              desc="Sensitive medical data deserves extreme security. Secure, localized storage for all your clinical records and reports."
            />
            <FeatureCard 
              icon={Stethoscope} 
              color="#f87171"
              title="Symptom AI" 
              desc="24/7 access to an AI health coach that understands your specific Digital Twin context for personalized advice."
            />
          </div>
        </section>

        {/* TRUST SECTION */}
        <section className="max-w-4xl mx-auto bg-primary-teal/5 border border-primary-teal/10 rounded-[3rem] p-12 lg:p-20 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-teal/10 rounded-full blur-3xl" />
          <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mx-auto text-primary-teal mb-6">
            <Lock size={32} />
          </div>
          <h2 className="text-3xl lg:text-5xl font-black text-white">Medical-Grade Privacy</h2>
          <p className="text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
            Your biological profile is your most sensitive data. Body Debugger uses high-level encryption and secure MongoDB clusters to ensure your "Digital Twin" belongs to you, and only you.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all">
             <div className="flex items-center gap-2 font-black text-white italic"><Shield size={18} /> HIPAA Compliant Architecture</div>
             <div className="flex items-center gap-2 font-black text-white italic"><Shield size={18} /> 256-bit AES Encryption</div>
          </div>
        </section>

        {/* FINAL CTA */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center space-y-10"
        >
          <div className="space-y-4">
            <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tight">Ready to Initialize<br />Your Twin?</h2>
            <p className="text-lg text-text-muted italic">"The best time to debug your health was 10 years ago. The second best time is today."</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link to={isAuthenticated ? "/dashboard" : "/register"} className="btn-primary py-6 px-12 text-xl rounded-3xl w-full sm:w-auto shadow-[0_20px_50px_rgba(45,212,191,0.3)]">
              {isAuthenticated ? "Enter Dashboard" : "Get Started for Free"}
            </Link>
          </div>
          <p className="text-[10px] uppercase font-black tracking-[0.3em] text-text-subtle pt-10">
            Advanced agentic cooling system online. Welcome to the future of wellness.
          </p>
        </motion.section>

      </main>

      <footer className="h-48 flex flex-col items-center justify-center border-t border-white/5 space-y-4">
        <div className="flex items-center gap-2 opacity-30">
          <Zap size={20} className="text-primary-teal" />
          <span className="font-black text-white">BodyDebug v1.0</span>
        </div>
        <p className="text-xs text-text-subtle font-medium">&copy; 2026 Body Debugger AI Labs. All rights reserved.</p>
      </footer>
    </div>
  );
}
