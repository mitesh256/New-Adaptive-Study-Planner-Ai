
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Difficulty, TopicStatus, Subject, Topic } from '../types';

const OnboardingPage: React.FC = () => {
  const { profile, refreshData } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Step 1 State
  const [examDate, setExamDate] = useState('');
  const [hours, setHours] = useState(4);
  const [timePref, setTimePref] = useState('morning');

  // Step 2 State
  const [subjects, setSubjects] = useState<string[]>(['Mathematics']);
  const [tempTopics, setTempTopics] = useState<{name: string, subject: string, difficulty: Difficulty, hours: number}[]>([]);

  useEffect(() => {
    // Initial entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const nextStep = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setIsVisible(false);
    
    // The progress bar fills up first (intentional delay for calm feel)
    setTimeout(() => {
      setStep(2);
      // Wait a beat before showing new content
      setTimeout(() => {
        setIsVisible(true);
        setIsTransitioning(false);
      }, 50);
    }, 600);
  };

  const prevStep = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setIsVisible(false);
    
    setTimeout(() => {
      setStep(1);
      setTimeout(() => {
        setIsVisible(true);
        setIsTransitioning(false);
      }, 50);
    }, 600);
  };

  const addSubject = () => setSubjects([...subjects, '']);
  const updateSubject = (index: number, val: string) => {
    const next = [...subjects];
    next[index] = val;
    setSubjects(next);
  };

  const addTopic = () => setTempTopics([...tempTopics, { name: '', subject: subjects[0] || '', difficulty: Difficulty.MEDIUM, hours: 2 }]);
  const updateTopic = (index: number, field: string, val: any) => {
    const next = [...tempTopics];
    (next[index] as any)[field] = val;
    setTempTopics(next);
  };

  const handleComplete = async () => {
    setLoading(true);
    const mappedSubjects: Subject[] = subjects.filter(s => s.trim()).map((s, i) => ({ id: `s${i}`, name: s }));
    const mappedTopics: Topic[] = tempTopics.filter(t => t.name.trim()).map((t, i) => ({
      id: `t${i}`,
      subject_id: mappedSubjects.find(s => s.name === t.subject)?.id || (mappedSubjects[0]?.id || 's0'),
      name: t.name,
      difficulty: t.difficulty,
      estimated_hours: t.hours,
      status: TopicStatus.PENDING,
      is_hard_marked: t.difficulty === Difficulty.HARD,
      exposure_count: 0
    }));

    try {
      await api.updateOnboarding({
        exam_date: examDate,
        daily_available_hours: hours,
        preferred_study_time: timePref
      }, mappedSubjects, mappedTopics);
      await refreshData();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // Logic for the progress bar percentage
  const getProgressWidth = () => {
    if (step === 1) {
      return isTransitioning ? '100%' : '50%';
    }
    return isTransitioning ? '50%' : '100%';
  };

  const hoursContext = useMemo(() => {
    if (hours <= 2) return { label: 'Sustainable', sub: 'A gentle touch to keep the momentum going.', color: 'text-emerald-600' };
    if (hours <= 5) return { label: 'Steady Focus', sub: 'A balanced commitment for consistent growth.', color: 'text-emerald-700' };
    if (hours <= 8) return { label: 'Deep Study', sub: 'A serious pace for significant progress.', color: 'text-amber-700' };
    return { label: 'High Intensity', sub: 'A demanding path. Remember to breathe.', color: 'text-rose-700' };
  }, [hours]);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden relative min-h-[600px] flex flex-col">
        
        {/* Animated Progress Bar Container */}
        <div className="absolute top-0 left-0 w-full h-2 bg-slate-100/50 z-10">
          <div 
            className="h-full bg-emerald-600 transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) relative"
            style={{ width: getProgressWidth() }}
          >
            <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-emerald-400/30 to-transparent blur-sm" />
          </div>
        </div>

        <div className={`flex-grow flex flex-col p-8 md:p-14 transition-all duration-700 ease-out transform ${
          isVisible 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-4 scale-[0.99]'
        }`}>
          
          <div className="flex justify-between items-center mb-12">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-800/60 mb-1">
                Your Path
              </span>
              <span className="text-sm font-semibold text-emerald-900">
                Phase {step} of 2
              </span>
            </div>
            <div className="flex gap-2">
              <div className={`w-10 h-1.5 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-emerald-600' : 'bg-slate-100'}`} />
              <div className={`w-10 h-1.5 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-emerald-600' : 'bg-slate-100'}`} />
            </div>
          </div>

          <div className="flex-grow">
            {step === 1 ? (
              <div className="space-y-12">
                <header className="space-y-4">
                  <h1 className="serif text-4xl md:text-5xl text-emerald-900 italic leading-tight">Define your pace.</h1>
                  <p className="text-slate-500 text-lg font-light leading-relaxed">Let's set a sustainable foundation. When is your goal, and how much energy can we dedicate to it each day?</p>
                </header>

                <div className="grid grid-cols-1 gap-12">
                  <div className="group relative">
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 transition-colors group-focus-within:text-emerald-700">Exam Date</label>
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full px-8 py-5 rounded-[1.5rem] border border-slate-100 bg-slate-50/30 focus:bg-white focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-600 hover:border-emerald-200 outline-none transition-all text-xl font-medium"
                    />
                  </div>

                  <div className="space-y-8">
                    <div className="group">
                      <div className="flex justify-between items-end mb-6">
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Daily Study Hours</label>
                        <div className="text-right">
                          <span className={`text-3xl font-light ${hoursContext.color}`}>{hours}</span>
                          <span className="text-sm text-slate-400 ml-1">hours</span>
                        </div>
                      </div>
                      
                      {/* Illustrative Time Graphic */}
                      <div className="relative h-24 bg-slate-50 rounded-[2rem] border border-slate-100/50 flex items-center px-10 mb-8 overflow-hidden group/graphic">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-transparent opacity-0 group-focus-within/graphic:opacity-100 transition-opacity duration-700" />
                        
                        <div className="relative w-full h-4 bg-slate-200/50 rounded-full overflow-hidden">
                          {/* 24 Hour Gridlines */}
                          <div className="absolute inset-0 flex justify-between px-0.5 pointer-events-none opacity-20">
                            {[...Array(24)].map((_, i) => (
                              <div key={i} className="w-px h-full bg-slate-400" />
                            ))}
                          </div>
                          {/* Selected Hours Block */}
                          <div 
                            className="h-full bg-emerald-600 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-[0_0_15px_rgba(5,150,105,0.4)]"
                            style={{ width: `${(hours / 24) * 100}%` }}
                          />
                        </div>
                        
                        <div className="absolute bottom-3 left-10 right-10 flex justify-between items-center">
                          <p className={`text-xs font-bold uppercase tracking-widest transition-colors duration-500 ${hoursContext.color}`}>
                            {hoursContext.label}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium italic">
                            {hoursContext.sub}
                          </p>
                        </div>
                      </div>

                      <input
                        type="range"
                        min="1"
                        max="12"
                        step="0.5"
                        value={hours}
                        onChange={(e) => setHours(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-700 transition-all hover:accent-emerald-600"
                      />
                      <div className="flex justify-between mt-4 px-1">
                        <span className="text-[10px] font-bold text-slate-300 uppercase">1h</span>
                        <span className="text-[10px] font-bold text-slate-300 uppercase">6h</span>
                        <span className="text-[10px] font-bold text-slate-300 uppercase">12h</span>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Preferred Focus Window</label>
                      <div className="relative">
                        <select
                          value={timePref}
                          onChange={(e) => setTimePref(e.target.value)}
                          className="w-full px-8 py-5 rounded-[1.5rem] border border-slate-100 bg-slate-50/30 focus:bg-white focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-600 hover:border-emerald-200 outline-none transition-all text-xl font-medium appearance-none cursor-pointer"
                        >
                          <option value="morning">Morning Clarity (6am - 12pm)</option>
                          <option value="afternoon">Afternoon Flow (12pm - 6pm)</option>
                          <option value="evening">Evening Quiet (6pm - 12am)</option>
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-800/40">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <button
                    onClick={nextStep}
                    disabled={!examDate || isTransitioning}
                    className="w-full py-6 bg-emerald-800 text-white rounded-[1.75rem] font-bold text-xl hover:bg-emerald-900 transition-all shadow-xl shadow-emerald-900/10 disabled:opacity-20 hover:-translate-y-0.5 active:scale-[0.98]"
                  >
                    Confirm and Map Syllabus
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-12">
                <header className="space-y-4">
                  <h1 className="serif text-4xl md:text-5xl text-emerald-900 italic leading-tight">Outline your journey.</h1>
                  <p className="text-slate-500 text-lg font-light leading-relaxed">Break your goal into subjects and topics. I'll handle the scheduling so you can focus on the learning.</p>
                </header>

                <div className="space-y-12 max-h-[45vh] overflow-y-auto pr-4 custom-scrollbar px-1">
                  <section className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Core Subjects</h3>
                      <div className="h-px bg-slate-100 flex-grow mx-4" />
                    </div>
                    <div className="space-y-4">
                      {subjects.map((s, i) => (
                        <div key={i} className="animate-in slide-in-from-left duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                          <input
                            value={s}
                            onChange={(e) => updateSubject(i, e.target.value)}
                            placeholder="e.g. Organic Chemistry, Macroeconomics..."
                            className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/20 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-600 hover:border-emerald-200 outline-none transition-all"
                          />
                        </div>
                      ))}
                      <button 
                        onClick={addSubject} 
                        className="group flex items-center gap-3 text-emerald-700 text-sm font-bold hover:text-emerald-900 transition-all px-2 py-2"
                      >
                        <span className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">+</span>
                        Add another subject
                      </button>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Knowledge Blocks</h3>
                      <div className="h-px bg-slate-100 flex-grow mx-4" />
                    </div>
                    <div className="space-y-6">
                      {tempTopics.map((t, i) => (
                        <div key={i} className="p-8 bg-slate-50/40 rounded-[2.5rem] border border-slate-100 space-y-6 transition-all hover:bg-white hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5 animate-in zoom-in-95 duration-400">
                          <input
                            value={t.name}
                            onChange={(e) => updateTopic(i, 'name', e.target.value)}
                            placeholder="Topic Name (e.g. Cellular Respiration)"
                            className="w-full px-6 py-4 rounded-xl border border-slate-100/50 bg-white focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-600 hover:border-emerald-200 outline-none transition-all font-medium"
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <select
                              value={t.subject}
                              onChange={(e) => updateTopic(i, 'subject', e.target.value)}
                              className="px-5 py-4 rounded-xl border border-slate-100/50 bg-white text-sm focus:border-emerald-600 hover:border-emerald-200 outline-none transition-all cursor-pointer"
                            >
                              <option value="">Subject...</option>
                              {subjects.filter(s => s.trim()).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <select
                              value={t.difficulty}
                              onChange={(e) => updateTopic(i, 'difficulty', e.target.value)}
                              className="px-5 py-4 rounded-xl border border-slate-100/50 bg-white text-sm focus:border-emerald-600 hover:border-emerald-200 outline-none transition-all cursor-pointer"
                            >
                              <option value={Difficulty.EASY}>Easy Pace</option>
                              <option value={Difficulty.MEDIUM}>Medium Depth</option>
                              <option value={Difficulty.HARD}>Hard Challenge</option>
                            </select>
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={addTopic} 
                        className="w-full py-8 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 text-sm font-semibold hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50/20 transition-all flex flex-col items-center justify-center gap-2"
                      >
                        <span className="text-2xl font-light">+</span>
                        Add a specific topic
                      </button>
                    </div>
                  </section>
                </div>

                <div className="flex gap-6 pt-6">
                  <button
                    onClick={prevStep}
                    disabled={isTransitioning}
                    className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[1.5rem] font-bold text-lg hover:bg-slate-200 transition-all active:scale-[0.98]"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={loading || tempTopics.filter(t => t.name.trim()).length === 0}
                    className="flex-[2] relative py-5 bg-emerald-800 text-white rounded-[1.5rem] font-bold text-lg hover:bg-emerald-900 transition-all shadow-xl shadow-emerald-900/10 disabled:opacity-30 overflow-hidden active:scale-[0.98] group"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-4">
                        <div className="w-5 h-5 border-2 border-emerald-300 border-t-white rounded-full animate-spin" />
                        <span>Creating your path...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span>Begin Journey</span>
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Persisting Success / Redirecting Screen */}
        {loading && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-30 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-700">
            <div className="relative">
              <div className="w-24 h-24 bg-emerald-700 rounded-3xl flex items-center justify-center text-white serif text-5xl italic animate-pulse shadow-2xl shadow-emerald-900/20">M</div>
              <div className="absolute -inset-4 border-2 border-emerald-100 rounded-[2.5rem] animate-ping opacity-20" />
            </div>
            <div className="text-center space-y-3 px-12">
              <p className="serif text-3xl text-emerald-900 italic">"I'm setting everything in place."</p>
              <p className="text-slate-400 font-light max-w-sm">I am organizing your subjects and analyzing your goals to create your first sustainable daily plan.</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #e2e8f0;
        }
        @keyframes cubic-bezier {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }
        .cubic-bezier {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #065f46;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          border: 2px solid white;
          transition: transform 0.2s ease-in-out;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default OnboardingPage;
