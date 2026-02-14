
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const Navbar: React.FC = () => {
  const { profile, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  if (!profile?.onboarding_completed) return null;

  const navItems = [
    { label: 'Today', path: '/dashboard' },
    { label: 'Syllabus', path: '/syllabus' },
    { label: 'History', path: '/history' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <span className="serif text-2xl font-bold text-emerald-800 italic">AS</span>
            <span className="font-semibold text-slate-700 tracking-tight">AdaptiveStudy</span>
          </Link>
          
          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'text-emerald-600'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-xs text-slate-400 hidden sm:block">{profile.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
