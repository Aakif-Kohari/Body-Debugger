import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import IntroPage from './pages/IntroPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import LabReportPage from './pages/LabReportPage';
import FoodTrackerPage from './pages/FoodTrackerPage';
import SleepTrackerPage from './pages/SleepTrackerPage';
import RecordsPage from './pages/RecordsPage';
import ChatBot from './components/ChatBot';
import GamificationPage from './pages/GamificationPage';
import DigitalTwinPage from './pages/DigitalTwinPage';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="text-primary-teal text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// Public Route Component
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="text-primary-teal text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className="fixed top-6 right-6 z-50 p-3 rounded-2xl glass text-primary-teal hover:text-accent-blue transition-colors shadow-xl"
      aria-label="Toggle Theme"
    >
      {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
    </motion.button>
  );
}

function AppRoutes() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<PublicRoute><IntroPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/lab-report" element={<ProtectedRoute><LabReportPage /></ProtectedRoute>} />
        <Route path="/food" element={<ProtectedRoute><FoodTrackerPage /></ProtectedRoute>} />
        <Route path="/sleep" element={<ProtectedRoute><SleepTrackerPage /></ProtectedRoute>} />
        <Route path="/records" element={<ProtectedRoute><RecordsPage /></ProtectedRoute>} />
        <Route path="/xp" element={<ProtectedRoute><GamificationPage /></ProtectedRoute>} />
        <Route path="/digital-twin" element={<ProtectedRoute><DigitalTwinPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-bg-main text-text-main font-sans selection:bg-primary-teal/20">
      <ThemeToggle />
      <AppRoutes />

      {/* Floating Chatbot - only show for authenticated users */}
      {isAuthenticated && <ChatBot />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}
