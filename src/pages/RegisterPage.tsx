import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Calendar, Target, ArrowRight, Eye, EyeOff, Plus, X, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

const HEALTH_GOALS = [
  'Weight Loss',
  'Muscle Gain',
  'Better Sleep',
  'Stress Management',
  'Heart Health',
  'Diabetes Management',
  'General Wellness',
  'Athletic Performance'
];

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    age: '',
    healthGoals: [] as string[]
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleHealthGoal = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      healthGoals: prev.healthGoals.includes(goal)
        ? prev.healthGoals.filter(g => g !== goal)
        : [...prev.healthGoals, goal]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.age || parseInt(formData.age) < 13) {
      setError('Please enter a valid age (13+)');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        age: parseInt(formData.age),
        healthGoals: formData.healthGoals
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-4 selection:bg-primary-teal/20 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md py-8"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0, rotate: 20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 grad-teal rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary-teal/30"
          >
            <User size={40} className="text-white" />
          </motion.div>
          <h1 className="text-4xl font-black text-text-main mb-2 tracking-tight">Join Nexus.Bio</h1>
          <p className="text-text-muted font-medium">Create your unique health identity</p>
        </div>

        {/* Register Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="premium-card p-10 max-h-[80vh] overflow-y-auto no-scrollbar"
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
              <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Identity Name</label>
              <div className="relative">
                <User size={20} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-primary-teal opacity-50" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full pl-14 pr-5 py-4 bg-primary-teal/5 border border-primary-teal/10 rounded-2xl focus:outline-none focus:border-primary-teal/50 focus:bg-primary-teal/10 transition-all font-bold text-text-main placeholder:text-text-muted/30"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Universal Email</label>
              <div className="relative">
                <Mail size={20} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-primary-teal opacity-50" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-14 pr-5 py-4 bg-primary-teal/5 border border-primary-teal/10 rounded-2xl focus:outline-none focus:border-primary-teal/50 focus:bg-primary-teal/10 transition-all font-bold text-text-main placeholder:text-text-muted/30"
                  placeholder="name@gmail.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Age</label>
                <div className="relative">
                  <Calendar size={20} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-primary-teal opacity-50" />
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    className="w-full pl-14 pr-4 py-4 bg-primary-teal/5 border border-primary-teal/10 rounded-2xl focus:outline-none focus:border-primary-teal/50 transition-all font-bold text-text-main placeholder:text-text-muted/30"
                    placeholder="25"
                    min="13"
                    max="120"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">New Access Key</label>
              <div className="relative">
                <Lock size={20} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-primary-teal opacity-50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full pl-14 pr-12 py-4 bg-primary-teal/5 border border-primary-teal/10 rounded-2xl focus:outline-none focus:border-primary-teal/50 transition-all font-bold text-text-main placeholder:text-text-muted/30"
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

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Verify Key</label>
              <div className="relative">
                <Lock size={20} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-primary-teal opacity-50" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full pl-14 pr-12 py-4 bg-primary-teal/5 border border-primary-teal/10 rounded-2xl focus:outline-none focus:border-primary-teal/50 transition-all font-bold text-text-main placeholder:text-text-muted/30"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-5 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-primary-teal transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1 flex items-center gap-2">
                <Target size={14} className="text-primary-teal" />
                Health Objectives
              </label>
              <div className="flex flex-wrap gap-2">
                {HEALTH_GOALS.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleHealthGoal(goal)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border",
                      formData.healthGoals.includes(goal)
                        ? "bg-primary-teal text-white border-primary-teal shadow-lg shadow-primary-teal/20"
                        : "bg-primary-teal/5 text-text-muted border-primary-teal/5 hover:border-primary-teal/20 hover:text-text-main"
                    )}
                  >
                    {formData.healthGoals.includes(goal) ? (
                      <X size={12} />
                    ) : (
                      <Plus size={12} />
                    )}
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full py-5 rounded-3xl font-black text-white transition-all flex items-center justify-center gap-3 text-lg shadow-xl mt-4",
                isLoading
                  ? "bg-text-muted/50 cursor-not-allowed"
                  : "grad-teal hover:scale-[1.02] active:scale-[0.98] hover:shadow-primary-teal/40"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Generating ID...
                </>
              ) : (
                <>
                  Initialize Account
                  <ArrowRight size={22} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center pb-2">
            <p className="text-text-muted font-medium">
              Already Synced?{' '}
              <Link
                to="/login"
                className="text-primary-teal font-extrabold hover:text-accent-blue transition-colors underline decoration-primary-teal/30 underline-offset-4"
              >
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>);
}
