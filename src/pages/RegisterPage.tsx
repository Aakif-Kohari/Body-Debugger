import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Calendar, Target, ArrowRight, Eye, EyeOff, Plus, X } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-health-lightest via-white to-health-light flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-gradient-to-r from-primary-teal to-accent-blue rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <User size={32} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-black text-health-dark mb-2">Join Body Debugger</h1>
          <p className="text-health-muted">Create your account to start your health journey</p>
        </div>

        {/* Register Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 max-h-[80vh] overflow-y-auto"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-health-dark">Full Name</label>
              <div className="relative">
                <User size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-health-muted" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/50 border border-white/30 rounded-2xl focus:outline-none focus:border-primary-teal/50 transition-all font-bold text-health-dark placeholder:text-health-muted/50"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-health-dark">Email</label>
              <div className="relative">
                <Mail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-health-muted" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/50 border border-white/30 rounded-2xl focus:outline-none focus:border-primary-teal/50 transition-all font-bold text-health-dark placeholder:text-health-muted/50"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-health-dark">Age</label>
                <div className="relative">
                  <Calendar size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-health-muted" />
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/50 border border-white/30 rounded-2xl focus:outline-none focus:border-primary-teal/50 transition-all font-bold text-health-dark placeholder:text-health-muted/50"
                    placeholder="25"
                    min="13"
                    max="120"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-health-dark">Password</label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-health-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white/50 border border-white/30 rounded-2xl focus:outline-none focus:border-primary-teal/50 transition-all font-bold text-health-dark placeholder:text-health-muted/50"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-health-muted hover:text-health-dark transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-health-dark">Confirm Password</label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-health-muted" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white/50 border border-white/30 rounded-2xl focus:outline-none focus:border-primary-teal/50 transition-all font-bold text-health-dark placeholder:text-health-muted/50"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-health-muted hover:text-health-dark transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-health-dark flex items-center gap-2">
                <Target size={16} />
                Health Goals (Optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {HEALTH_GOALS.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleHealthGoal(goal)}
                    className={cn(
                      "px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                      formData.healthGoals.includes(goal)
                        ? "bg-primary-teal text-white"
                        : "bg-white/50 text-health-dark border border-white/30 hover:border-primary-teal/50"
                    )}
                  >
                    {formData.healthGoals.includes(goal) ? (
                      <X size={14} />
                    ) : (
                      <Plus size={14} />
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
                "w-full py-4 rounded-2xl font-black text-white transition-all flex items-center justify-center gap-2",
                isLoading
                  ? "bg-health-muted cursor-not-allowed"
                  : "bg-gradient-to-r from-primary-teal to-accent-blue hover:shadow-lg hover:shadow-primary-teal/25"
              )}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-health-muted">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary-teal font-bold hover:text-accent-blue transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}