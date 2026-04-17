import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Calendar, Target, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-4 selection:bg-primary-teal/20 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 grad-teal rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary-teal/30"
          >
            <User size={40} className="text-white" />
          </motion.div>
          <h1 className="text-4xl font-black text-text-main mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-text-muted font-medium">Access your Bio-Sync Dashboard</p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="premium-card p-10"
        >
          <form onSubmit={handleSubmit} className="space-y-7">
            {error && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4"
              >
                <p className="text-red-500 text-sm font-bold text-center">{error}</p>
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Email Terminal</label>
              <div className="relative">
                <Mail size={20} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-primary-teal opacity-50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 bg-primary-teal/5 border border-primary-teal/10 rounded-2xl focus:outline-none focus:border-primary-teal/50 focus:bg-primary-teal/10 transition-all font-bold text-text-main placeholder:text-text-muted/30"
                  placeholder="name@nexus.bio"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Access Key</label>
              <div className="relative">
                <Lock size={20} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-primary-teal opacity-50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-12 py-4 bg-primary-teal/5 border border-primary-teal/10 rounded-2xl focus:outline-none focus:border-primary-teal/50 focus:bg-primary-teal/10 transition-all font-bold text-text-main placeholder:text-text-muted/30"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-primary-teal transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full py-5 rounded-3xl font-black text-white transition-all flex items-center justify-center gap-3 text-lg shadow-xl",
                isLoading
                  ? "bg-text-muted/50 cursor-not-allowed"
                  : "grad-teal hover:scale-[1.02] active:scale-[0.98] hover:shadow-primary-teal/40"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Initialize Sync
                  <ArrowRight size={22} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-text-muted font-medium">
              New User?{' '}
              <Link
                to="/register"
                className="text-primary-teal font-extrabold hover:text-accent-blue transition-colors underline decoration-primary-teal/30 underline-offset-4"
              >
                Create Bio-ID
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}