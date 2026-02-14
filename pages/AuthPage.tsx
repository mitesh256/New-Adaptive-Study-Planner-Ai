
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { refreshData } = useApp();
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.login(email);
      await refreshData();
      navigate('/onboarding');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-sm border border-slate-200">
        <div className="text-center mb-10">
          <h2 className="serif text-4xl text-emerald-900 mb-2 italic">Welcome</h2>
          <p className="text-slate-500">Sign in to continue your study journey.</p>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-700 text-white rounded-xl font-semibold hover:bg-emerald-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Entering...' : 'Continue'}
          </button>
        </form>
        
        <p className="mt-8 text-center text-xs text-slate-400">
          By continuing, you agree to our human-centered study approach.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
