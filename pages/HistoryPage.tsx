
import React from 'react';
import { useApp } from '../context/AppContext';

const HistoryPage: React.FC = () => {
  const { history, subjects, topics } = useApp();

  const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <header className="space-y-4">
        <h1 className="serif text-5xl text-emerald-900 italic">Looking Back</h1>
        <p className="text-slate-500 max-w-xl">Every day spent learning is a brick in your future. Be proud of your presence.</p>
      </header>

      <div className="space-y-8">
        {sortedHistory.length === 0 ? (
          <div className="p-20 text-center text-slate-400 italic">No past sessions recorded yet.</div>
        ) : (
          sortedHistory.map((day, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
                <div>
                  <p className="text-xs font-bold text-emerald-700 tracking-widest uppercase mb-1">{day.date}</p>
                  <h3 className="serif text-2xl text-slate-800">"{day.mentor_message}"</h3>
                </div>
                {day.completed ? (
                  <span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                    Completed
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full">
                    Partial
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {day.items.map((item, i) => {
                  const topic = topics.find(t => t.id === item.topic_id);
                  const subject = subjects.find(s => s.id === item.subject_id);
                  return (
                    <div key={i} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subject?.name}</p>
                      <p className="text-slate-800 font-medium">{topic?.name}</p>
                      <p className="text-xs text-slate-500 mt-1 italic">{item.reason}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
