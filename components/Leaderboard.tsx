import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { ScoreEntry } from '../types';

interface LeaderboardProps {
  onBack: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const q = query(collection(db, "scores"), orderBy("score", "desc"), limit(20));
        const querySnapshot = await getDocs(q);
        const fetchedScores: ScoreEntry[] = [];
        querySnapshot.forEach((doc) => {
          fetchedScores.push({ id: doc.id, ...doc.data() } as ScoreEntry);
        });
        setScores(fetchedScores);
      } catch (error) {
        console.error("Error fetching leaderboard: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-6 bg-indigo-600 text-white shadow-lg z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-indigo-500 rounded-full hover:bg-indigo-400 transition-colors shadow-sm">
                <i className="fa-solid fa-arrow-left"></i>
            </button>
            <h2 className="text-2xl font-black italic tracking-wide">HALL OF FAME</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-indigo-400">
             <i className="fa-solid fa-circle-notch fa-spin text-4xl mb-4"></i>
             <p className="font-bold">Loading Rankings...</p>
          </div>
        ) : (
          scores.map((entry, index) => (
            <div 
                key={entry.id} 
                className={`
                    relative p-4 rounded-xl shadow-sm flex items-center gap-4 transform transition-all
                    ${index === 0 ? 'bg-gradient-to-r from-yellow-50 to-white border-2 border-yellow-200' : 'bg-white'}
                `}
            >
              {/* Rank Badge */}
              <div className={`
                w-12 h-12 flex items-center justify-center rounded-xl font-black text-xl shadow-inner
                ${index === 0 ? 'bg-yellow-400 text-yellow-900' : 
                  index === 1 ? 'bg-slate-300 text-slate-800' : 
                  index === 2 ? 'bg-amber-600 text-amber-100' : 'bg-slate-100 text-slate-400'}
              `}>
                {index === 0 ? <i className="fa-solid fa-crown"></i> : index + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.characterColor }}></div>
                    <h3 className="font-bold text-slate-800 truncate text-lg">{entry.displayName}</h3>
                </div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{index === 0 ? 'Champion' : `Rank ${index + 1}`}</p>
              </div>

              <div className="text-3xl font-black text-indigo-600 tracking-tighter">
                {entry.score}
              </div>
            </div>
          ))
        )}
        
        {!loading && scores.length === 0 && (
            <div className="text-center p-12 text-slate-400">
                <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fa-solid fa-trophy text-3xl text-slate-400"></i>
                </div>
                <p className="font-bold">No records yet.</p>
                <p className="text-sm">Be the first to claim the throne!</p>
            </div>
        )}
      </div>
    </div>
  );
};