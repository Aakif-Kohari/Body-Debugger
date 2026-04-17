import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import IntroPage from './pages/IntroPage';
import Dashboard from './pages/Dashboard';
import LabReportPage from './pages/LabReportPage';
import FoodTrackerPage from './pages/FoodTrackerPage';
import SleepTrackerPage from './pages/SleepTrackerPage';
import RecordsPage from './pages/RecordsPage';
import ChatBot from './components/ChatBot';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-health-lightest text-health-dark">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<IntroPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/lab-report" element={<LabReportPage />} />
            <Route path="/food" element={<FoodTrackerPage />} />
            <Route path="/sleep" element={<SleepTrackerPage />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
        
        {/* Floating Chatbot - visible on all pages except Intro if desired, but let's keep it global for now */}
        <ChatBot />
      </div>
    </Router>
  );
}
