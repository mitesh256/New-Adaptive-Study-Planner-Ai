
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TopicStatus, Difficulty } from '../types';

const SyllabusPage: React.FC = () => {
  const { subjects, topics, markTopicHard, suggestions, fetchSuggestions, approveSuggestion, rejectSuggestion } = useApp();
  const [fetchingIds, setFetchingIds] = useState<Set<string>>(new Set());

  const handleFetchSuggestions = async (subjectId: string) => {
    setFetchingIds(prev => new Set(prev).add(subjectId));
    await fetchSuggestions(subjectId);
    setFetchingIds(prev => {
      const next = new Set(prev);
      next.delete(subjectId);
      return next;
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">
      <header className="space-y-4 px-2">
        <h1 className="serif text-6xl text-emerald-900 italic">Curriculum Map</h1>
        <p className="text-slate-500 max-w-xl text-lg font-light leading-relaxed">
          Your journey is broken down into small, manageable pieces. 
          Analyze your progress and discover new paths to mastery.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {subjects.map(subject => {
          const subjectTopics = topics.filter(t => t.subject_id === subject.id);
          const subjectSuggestions = suggestions[subject.id] || [];
          
          const stats = useMemo(() => {
            const total = subjectTopics.length;
            const completed = subjectTopics.filter(t => t.status === TopicStatus.DONE).length;
            const hard = subjectTopics.filter(t => t.is_hard_marked).length;
            const remainingHours = subjectTopics
              .filter(t => t.status === TopicStatus.PENDING)
              .reduce((acc, t) => acc + t.estimated_hours, 0);
            const percentage = total > 0 ? (completed / total) * 100 : 0;
            
            const diffCounts = {
              [Difficulty.EASY]: subjectTopics.filter(t => t.difficulty === Difficulty.EASY).length,
              [Difficulty.MEDIUM]: subjectTopics.filter(t => t.difficulty === Difficulty.MEDIUM).length,
              [Difficulty.HARD]: subjectTopics.filter(t => t.difficulty === Difficulty.HARD).length,
            };

            return { total, completed, hard, remainingHours, percentage, diffCounts };
          }, [subjectTopics]);

          const isFetching = fetchingIds.has(subject.id);
          
          return (
            <div key={subject.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-10 space-y-10 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
              {/* Header & Overall Stats */}
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-semibold text-slate-800 tracking-tight">{subject.name}</h3>
                    <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest">
                      {stats.remainingHours.toFixed(1)} hours remaining
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-light text-emerald-700">{Math.round(stats.percentage)}%</span>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mastery</p>
                  </div>
                </div>

                <div className="w-full bg-slate-50 rounded-full h-2 overflow-hidden border border-slate-100/50">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1)" 
                    style={{ width: `${stats.percentage}%` }}
                  ></div>
                </div>

                <div className="flex justify-between gap-4 pt-2">
                  <div className="flex-1 bg-slate-50/50 rounded-2xl p-4 border border-slate-50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total</p>
                    <p className="text-xl font-semibold text-slate-700">{stats.total}</p>
                  </div>
                  <div className="flex-1 bg-emerald-50/30 rounded-2xl p-4 border border-emerald-50">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1">Done</p>
                    <p className="text-xl font-semibold text-emerald-800">{stats.completed}</p>
                  </div>
                  <div className="flex-1 bg-amber-50/30 rounded-2xl p-4 border border-amber-50">
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Hard</p>
                    <p className="text-xl font-semibold text-amber-800">{stats.hard}</p>
                  </div>
                </div>
              </div>

              {/* Difficulty Distribution - Minimalist Chart */}
              <div className="flex items-center gap-8 py-4 border-y border-slate-50">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="14" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
                    {/* Simplified segments logic for visual feedback */}
                    {stats.total > 0 && (
                      <>
                        <circle cx="16" cy="16" r="14" fill="transparent" stroke="#10b981" strokeWidth="4" 
                          strokeDasharray={`${(stats.diffCounts[Difficulty.EASY] / stats.total) * 88} 88`} 
                          strokeDashoffset="0" />
                        <circle cx="16" cy="16" r="14" fill="transparent" stroke="#3b82f6" strokeWidth="4" 
                          strokeDasharray={`${(stats.diffCounts[Difficulty.MEDIUM] / stats.total) * 88} 88`} 
                          strokeDashoffset={`-${(stats.diffCounts[Difficulty.EASY] / stats.total) * 88}`} />
                        <circle cx="16" cy="16" r="14" fill="transparent" stroke="#ef4444" strokeWidth="4" 
                          strokeDasharray={`${(stats.diffCounts[Difficulty.HARD] / stats.total) * 88} 88`} 
                          strokeDashoffset={`-${((stats.diffCounts[Difficulty.EASY] + stats.diffCounts[Difficulty.MEDIUM]) / stats.total) * 88}`} />
                      </>
                    )}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-400">DIFF</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs text-slate-500 font-medium">Easy: {stats.diffCounts[Difficulty.EASY]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs text-slate-500 font-medium">Medium: {stats.diffCounts[Difficulty.MEDIUM]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs text-slate-500 font-medium">Hard: {stats.diffCounts[Difficulty.HARD]}</span>
                  </div>
                </div>
              </div>

              {/* Topic List */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-4 px-1">Syllabus Breakdown</h4>
                {subjectTopics.map((topic, index) => (
                  <div 
                    key={topic.id} 
                    style={{ animationDelay: `${index * 50}ms` }}
                    className="group flex items-center justify-between p-4 -mx-4 rounded-2xl border border-transparent hover:border-emerald-100/50 hover:bg-emerald-50/60 hover:shadow-lg hover:shadow-emerald-900/5 hover:translate-x-1 transition-all duration-300 animate-in fade-in slide-in-from-left-4 fill-mode-both"
                  >
                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                      {/* Topic Confidence Indicator Ring */}
                      <div className="relative w-8 h-8 flex-shrink-0">
                         <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
                          <circle cx="16" cy="16" r="14" fill="transparent" stroke="#f1f5f9" strokeWidth="3" />
                          <circle cx="16" cy="16" r="14" fill="transparent" stroke={topic.status === TopicStatus.DONE ? "#10b981" : "#cbd5e1"} strokeWidth="3" 
                            strokeDasharray={`${((topic.confidence_score || 0) / 100) * 88} 88`} 
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                           <span className="text-[8px] font-bold text-slate-400">{topic.confidence_score || 0}%</span>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <span className={`text-base block truncate transition-all duration-300 ${
                          topic.status === TopicStatus.DONE ? 'text-slate-400 line-through' : 'text-slate-600 font-medium'
                        }`}>
                          {topic.name}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-tighter">Est. {topic.estimated_hours}h</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 ml-4">
                      {topic.is_hard_marked && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md uppercase tracking-tighter animate-pulse">Hard</span>
                      )}
                      <button 
                        onClick={() => markTopicHard(topic.id)}
                        className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest transition-all ${
                          topic.is_hard_marked 
                          ? 'bg-amber-100 text-amber-800 shadow-sm' 
                          : 'bg-white text-slate-400 border border-slate-100 opacity-0 group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-600'
                        }`}
                      >
                        {topic.is_hard_marked ? 'Marked' : 'Hard?'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Suggestions Area */}
              <div className="pt-8 border-t border-slate-50 space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Discover More</h4>
                  <button 
                    onClick={() => handleFetchSuggestions(subject.id)}
                    disabled={isFetching}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-50 transition-all flex items-center gap-2 group/btn"
                  >
                    {isFetching ? (
                      <>
                        <div className="w-3 h-3 border-2 border-emerald-200 border-t-emerald-700 rounded-full animate-spin"></div>
                        Consulting Mentor...
                      </>
                    ) : (
                      <>
                        <span className="group-hover/btn:underline underline-offset-4">Suggest Related Topics</span>
                        <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                      </>
                    )}
                  </button>
                </div>

                {subjectSuggestions.length > 0 && (
                  <div className="bg-emerald-50/30 rounded-[2rem] p-8 space-y-6 animate-in fade-in zoom-in-95 duration-500">
                    <p className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-widest mb-2 border-b border-emerald-100 pb-2">AI Recommended (Awaiting Approval)</p>
                    <div className="space-y-4">
                      {subjectSuggestions.map((s, i) => (
                        <div key={i} className="flex items-center justify-between group/suggest p-3 -mx-2 rounded-2xl hover:bg-white transition-all shadow-none hover:shadow-sm">
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-slate-700">{s.name}</p>
                            <div className="flex gap-2">
                              <span className="text-[8px] font-bold uppercase text-slate-400">{s.difficulty}</span>
                              <span className="text-[8px] font-bold uppercase text-slate-400">• {s.estimated_hours}h</span>
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover/suggest:opacity-100 transition-opacity">
                            <button 
                              onClick={() => approveSuggestion(subject.id, s)}
                              className="p-2 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/10"
                              title="Add to Syllabus"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                            </button>
                            <button 
                              onClick={() => rejectSuggestion(subject.id, s.name)}
                              className="p-2 bg-white border border-slate-100 text-slate-400 rounded-xl hover:bg-slate-50 hover:text-slate-600 transition-all"
                              title="Discard"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {subjects.length === 0 && (
        <div className="text-center py-32 space-y-4">
          <p className="serif text-3xl text-slate-300 italic">No subjects added yet.</p>
          <button className="text-emerald-700 font-medium underline underline-offset-4">Return to setup</button>
        </div>
      )}
    </div>
  );
};

export default SyllabusPage;
