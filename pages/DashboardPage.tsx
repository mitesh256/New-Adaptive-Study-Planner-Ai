
import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TopicStatus } from '../types';

const DashboardPage: React.FC = () => {
  const { profile, todayPlan, tomorrowPreview, topics, subjects, getTodayPlan, getTomorrowPreview, markTopicDone, markTopicHard, loading } = useApp();
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (profile && !todayPlan && !loading) {
      getTodayPlan();
    }
  }, [profile, todayPlan, getTodayPlan, loading]);

  const stats = useMemo(() => {
    if (!todayPlan) return { total: 0, completed: 0, remaining: 0 };
    const total = todayPlan.items.reduce((acc, item) => acc + item.allocated_time, 0);
    const completed = todayPlan.items.reduce((acc, item) => {
      const topic = topics.find(t => t.id === item.topic_id);
      return topic?.status === TopicStatus.DONE ? acc + item.allocated_time : acc;
    }, 0);
    return { total, completed, remaining: Math.max(0, total - completed) };
  }, [todayPlan, topics]);

  const handleRegenerate = async () => {
    if (window.confirm("Would you like me to reconsider today's focus? This will replace your current plan.")) {
      setIsGenerating(true);
      await getTodayPlan(true);
      setIsGenerating(false);
    }
  };

  const handlePreview = async () => {
    setIsGenerating(true);
    await getTomorrowPreview();
    setIsGenerating(false);
  };

  if (loading || isGenerating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-8 bg-slate-50">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-emerald-100 rounded-full"></div>
          <div className="absolute top-0 w-20 h-20 border-4 border-transparent border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
        <div className="text-center space-y-2">
          <p className="serif text-3xl text-emerald-900 italic">Finding the right path...</p>
          <p className="text-slate-400 text-sm">Reviewing your syllabus and progress to find the right pace.</p>
        </div>
      </div>
    );
  }

  if (!todayPlan) return null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
      {/* Calm Mentor Message */}
      <section className="relative overflow-hidden bg-white border border-slate-200 rounded-[2.5rem] p-10 md:p-14 shadow-sm">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-emerald-50 rounded-full opacity-50 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="w-16 h-16 bg-emerald-700 rounded-2xl rotate-3 flex-shrink-0 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <span className="serif text-3xl italic">M</span>
          </div>
          <div className="space-y-4 max-w-2xl">
            <h2 className="serif text-4xl text-emerald-900 leading-tight">
              Hello, {profile?.email.split('@')[0]}.
            </h2>
            <blockquote className="text-2xl text-slate-600 font-light leading-relaxed italic">
              "{todayPlan.mentor_message}"
            </blockquote>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Daily Plan List */}
        <div className="lg:col-span-2 space-y-12">
          <section className="space-y-8">
            <div className="flex justify-between items-center px-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Current Focus</h3>
                <p className="text-slate-500 text-sm">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button 
                onClick={handleRegenerate}
                className="text-xs font-medium text-slate-400 hover:text-emerald-700 transition-colors uppercase tracking-wider underline underline-offset-8"
              >
                Reset Plan
              </button>
            </div>

            <div className="space-y-6">
              {todayPlan.items.length === 0 ? (
                <div className="text-center py-20 bg-white border-2 border-dashed border-slate-100 rounded-3xl">
                  <p className="text-slate-400 italic">Today is for rest. Re-plan whenever you're ready.</p>
                </div>
              ) : (
                todayPlan.items.map((item, idx) => {
                  const topic = topics.find(t => t.id === item.topic_id);
                  const subject = subjects.find(s => s.id === item.subject_id);
                  const isDone = topic?.status === TopicStatus.DONE;

                  return (
                    <div 
                      key={idx} 
                      className={`group bg-white border transition-all duration-500 rounded-3xl p-8 ${
                        isDone ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                        <div className="space-y-3 flex-grow">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 px-3 py-1 bg-emerald-100 rounded-full">
                              {subject?.name}
                            </span>
                            {topic?.is_hard_marked && (
                              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 px-3 py-1 bg-amber-100 rounded-full">
                                Hard Topic
                              </span>
                            )}
                          </div>
                          <h4 className={`text-2xl font-semibold tracking-tight ${isDone ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                            {topic?.name}
                          </h4>
                          <p className={`text-base leading-relaxed ${isDone ? 'text-slate-400' : 'text-slate-500'}`}>
                            {item.reason}
                          </p>
                        </div>
                        
                        <div className="flex flex-row md:flex-col items-center md:items-end gap-4">
                          <div className="flex items-center text-slate-400 text-sm whitespace-nowrap">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            {item.allocated_time} hours
                          </div>
                          <button
                            disabled={isDone}
                            onClick={() => topic && markTopicDone(topic.id)}
                            className={`w-full md:w-auto px-6 py-3 rounded-2xl text-sm font-semibold transition-all ${
                              isDone 
                              ? 'bg-emerald-100 text-emerald-800 cursor-default' 
                              : 'bg-slate-900 text-white hover:bg-emerald-700 active:scale-95'
                            }`}
                          >
                            {isDone ? 'Done ✓' : 'Complete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Tomorrow Preview Section */}
          <section className="space-y-8 pt-8 border-t border-slate-100">
            {todayPlan.completed && !tomorrowPreview && (
              <div className="flex flex-col items-center py-12 px-6 bg-emerald-50/30 border border-emerald-100 rounded-[2.5rem] text-center space-y-6">
                <div className="space-y-2">
                  <h4 className="serif text-2xl text-emerald-900 italic">You've finished today's steps.</h4>
                  <p className="text-emerald-700/60 text-sm">Would you like a tentative look at what tomorrow might bring?</p>
                </div>
                <button 
                  onClick={handlePreview}
                  className="px-8 py-3 bg-white border border-emerald-200 text-emerald-800 rounded-full text-sm font-semibold hover:bg-emerald-50 transition-all shadow-sm"
                >
                  Preview Tomorrow
                </button>
              </div>
            )}

            {tomorrowPreview && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                <div className="flex justify-between items-center px-2">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600 mb-1">Tentative Preview</h3>
                    <p className="text-slate-400 text-xs italic">This may change tomorrow based on your syllabus state.</p>
                  </div>
                </div>

                <div className="relative opacity-80 filter grayscale-[20%] group">
                  <div className="absolute inset-0 bg-slate-50/10 pointer-events-none z-10 border-2 border-dashed border-emerald-100 rounded-[2.5rem]"></div>
                  <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 space-y-8">
                     <p className="text-emerald-900/60 italic text-lg leading-relaxed border-l-2 border-emerald-200 pl-6">
                      "{tomorrowPreview.mentor_message}"
                    </p>
                    <div className="space-y-4">
                      {tomorrowPreview.items.map((item, idx) => {
                        const topic = topics.find(t => t.id === item.topic_id);
                        const subject = subjects.find(s => s.id === item.subject_id);
                        return (
                          <div key={idx} className="flex justify-between items-center py-4 border-b border-slate-50 last:border-0">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{subject?.name}</p>
                              <p className="text-slate-700 font-medium">{topic?.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-400">{item.allocated_time} hours</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar Status */}
        <aside className="space-y-8">
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 space-y-10 shadow-2xl shadow-slate-200">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 mb-6">Today's Progress</h4>
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-3xl font-light">{stats.remaining.toFixed(1)} <span className="text-sm text-slate-400 font-normal">hrs</span></p>
                    <p className="text-xs text-slate-500 uppercase">Remaining</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-3xl font-light">{Math.round((stats.completed / (stats.total || 1)) * 100)}%</p>
                    <p className="text-xs text-slate-500 uppercase">Energy Spent</p>
                  </div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-700 ease-out" 
                    style={{ width: `${(stats.completed / (stats.total || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-800 flex justify-between items-center">
              <div>
                <p className="text-2xl font-light text-emerald-400">
                  {Math.max(0, Math.ceil((new Date(profile?.exam_date || '').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-widest">Days to Exam</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-light text-white">
                  {topics.filter(t => t.status === TopicStatus.DONE).length}
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-widest">Mastered</p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-100 rounded-[2rem] p-8 space-y-4">
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-widest">The Mentor's View</h4>
            <p className="text-emerald-900/70 text-sm leading-relaxed italic">
              "You are doing exactly enough. Learning is not a race; it is a conversation with yourself. Take the next step when you feel ready."
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DashboardPage;
