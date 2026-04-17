import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import IntroPage from './pages/IntroPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import LabReportPage from './pages/LabReportPage';
import FoodTrackerPage from './pages/FoodTrackerPage';
import SleepTrackerPage from './pages/SleepTrackerPage';
import RecordsPage from './pages/RecordsPage';
import ChatBot from './components/ChatBot';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-health-lightest flex items-center justify-center">
        <div className="text-health-primary text-xl">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// Public Route Component (redirects to dashboard if already authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-health-lightest flex items-center justify-center">
        <div className="text-health-primary text-xl">Loading...</div>
      </div>
    );
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-health-lightest text-health-dark">
          <AppRoutes />

          {/* Floating Chatbot - only show for authenticated users */}
          <ProtectedRoute>
            <ChatBot />
          </ProtectedRoute>
        </div>
      </Router>
    </AuthProvider>
  );
}
