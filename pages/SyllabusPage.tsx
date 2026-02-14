
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TopicStatus } from '../types';

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
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">
      <header className="space-y-4 px-2">
        <h1 className="serif text-6xl text-emerald-900 italic">Curriculum Map</h1>
        <p className="text-slate-500 max-w-xl text-lg font-light leading-relaxed">
          Your journey is broken down into small, manageable pieces. 
          Focus on the map, and the path will reveal itself.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {subjects.map(subject => {
          const subjectTopics = topics.filter(t => t.subject_id === subject.id);
          const subjectSuggestions = suggestions[subject.id] || [];
          const doneCount = subjectTopics.filter(t => t.status === TopicStatus.DONE).length;
          const progressPercent = Math.round((doneCount / (subjectTopics.length || 1)) * 100);
          const isFetching = fetchingIds.has(subject.id);
          
          return (
            <div key={subject.id} className="bg-white border border-slate-100 rounded-[2rem] p-10 space-y-8 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <h3 className="text-3xl font-semibold text-slate-800 tracking-tight">{subject.name}</h3>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">
                    {doneCount} / {subjectTopics.length}
                  </span>
                </div>
                <div className="w-full bg-slate-50 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-1000" 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                {subjectTopics.map((topic, index) => (
                  <div 
                    key={topic.id} 
                    style={{ animationDelay: `${index * 50}ms` }}
                    className="group flex items-center justify-between p-4 -mx-4 rounded-2xl hover:bg-emerald-50/40 hover:translate-x-1 transition-all duration-300 animate-in fade-in slide-in-from-left-4 fill-mode-both"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 transition-all duration-500 border-2 ${
                        topic.status === TopicStatus.DONE 
                          ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-200' 
                          : 'bg-white border-slate-200 group-hover:border-emerald-300'
                      }`}></div>
                      <span className={`text-base transition-all duration-300 ${
                        topic.status === TopicStatus.DONE ? 'text-slate-400 line-through' : 'text-slate-600 font-medium'
                      }`}>
                        {topic.name}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
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
              <div className="pt-6 border-t border-slate-50 space-y-6">
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
                  <div className="bg-emerald-50/30 rounded-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-500">
                    <p className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-widest mb-2">AI Recommended (Not Added Yet)</p>
                    <div className="space-y-3">
                      {subjectSuggestions.map((s, i) => (
                        <div key={i} className="flex items-center justify-between group/suggest p-2 -mx-2 rounded-xl hover:bg-white transition-colors">
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
                              className="p-1.5 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-all shadow-sm"
                              title="Add to Syllabus"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                            </button>
                            <button 
                              onClick={() => rejectSuggestion(subject.id, s.name)}
                              className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-all"
                              title="Discard"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
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
