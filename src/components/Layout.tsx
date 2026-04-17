import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Beaker, Apple, Moon, FileText, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { icon: <Home size={20} />, label: "Home", path: "/dashboard" },
    { icon: <Beaker size={20} />, label: "Labs", path: "/lab-report" },
    { icon: <Apple size={20} />, label: "Food", path: "/food" },
    { icon: <Moon size={20} />, label: "Sleep", path: "/sleep" },
    { icon: <FileText size={20} />, label: "Files", path: "/records" },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 text-text-main">
      <main className="flex-1">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-6 right-6 h-16 glass rounded-2xl flex items-center justify-around px-4 shadow-2xl z-40">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-1 transition-all",
              isActive ? "text-primary-teal scale-110 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]" : "text-text-muted hover:text-text-main"
            )}
          >
            {item.icon}
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
          </NavLink>
        ))}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 transition-all text-text-muted hover:text-red-400 hover:scale-110"
          title="Logout"
        >
          <LogOut size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Logout</span>
        </button>
      </nav>
    </div>
  );
}
