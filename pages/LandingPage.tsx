
import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6">
      <div className="max-w-3xl text-center space-y-8">
        <h1 className="serif text-6xl md:text-8xl text-emerald-900 leading-tight">
          A calm mentor for your <span className="italic">learning journey</span>.
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
          AdaptiveStudy.ai builds sustainable study plans that adapt to your progress, 
          not the other way around. No pressure. No streaks. Just steady growth.
        </p>
        <div className="pt-8">
          <Link
            to="/auth"
            className="px-8 py-4 bg-emerald-700 text-white rounded-full font-semibold text-lg hover:bg-emerald-800 transition-all shadow-lg hover:shadow-xl"
          >
            Begin your journey
          </Link>
        </div>
      </div>
      
      <footer className="mt-24 text-slate-400 text-sm">
        Designed for sustainable learning. &copy; 2024 AdaptiveStudy.ai
      </footer>
    </div>
  );
};

export default LandingPage;
