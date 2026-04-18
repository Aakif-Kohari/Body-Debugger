import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FlaskConical, UtensilsCrossed, Moon, FolderHeart, LogOut, Zap, Trophy, User
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: "Home", path: "/dashboard" },
  { icon: FlaskConical, label: "Labs", path: "/lab-report" },
  { icon: UtensilsCrossed, label: "Food", path: "/food" },
  { icon: Moon, label: "Sleep", path: "/sleep" },
  { icon: Trophy, label: "XP", path: "/xp" },
  { icon: User, label: "Twin", path: "/digital-twin" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen pb-28">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 px-4 md:px-8 py-3 glass border-b border-border/50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl grad-teal flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-base tracking-tight text-text-main">
              Body<span className="text-gradient">Debug</span>
            </span>
          </div>

          {user && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full grad-hero flex items-center justify-center text-white text-xs font-bold">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-semibold text-text-main hidden sm:block">{user.name}</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-lg mx-auto px-4 pb-4">
          <div className="glass rounded-2xl px-2 py-2 flex items-center justify-around shadow-2xl border border-border/70">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[54px]",
                  isActive
                    ? "text-white bg-gradient-to-br from-primary-teal to-accent-blue shadow-lg"
                    : "text-text-muted hover:text-primary-teal hover:bg-primary-teal/5"
                )}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}

            <button
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[54px] text-text-muted hover:text-red-400 hover:bg-red-400/5"
              title="Logout"
            >
              <LogOut size={18} strokeWidth={2} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Logout</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
