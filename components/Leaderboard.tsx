import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { ScoreEntry } from '../types';
import { Character } from './Character';

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
    <div className="flex flex-col h-full bg-indigo-50">
      <div className="p-6 bg-indigo-600 text-white shadow-lg z-10">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-indigo-500 rounded-full hover:bg-indigo-400 transition-colors">
                <i className="fa-solid fa-arrow-left"></i>
            </button>
            <h2 className="text-2xl font-black">Top Climbers</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-indigo-400">
             <i className="fa-solid fa-spinner fa-spin text-4xl mb-4"></i>
             <p>Loading scores...</p>
          </div>
        ) : (
          scores.map((entry, index) => (
            <div 
                key={entry.id} 
                className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 transform transition-all hover:scale-[1.02]"
            >
              <div className={`
                w-10 h-10 flex items-center justify-center rounded-full font-black text-lg
                ${index === 0 ? 'bg-yellow-400 text-yellow-900' : 
                  index === 1 ? 'bg-slate-300 text-slate-800' : 
                  index === 2 ? 'bg-amber-600 text-amber-100' : 'bg-slate-100 text-slate-500'}
              `}>
                {index + 1}
              </div>
              
              <div className="relative">
                  {/* Mini Character Icon */}
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: entry.characterColor }}>
                      <div className="flex gap-1">
                          <div className="w-1 h-1 bg-black rounded-full"></div>
                          <div className="w-1 h-1 bg-black rounded-full"></div>
                      </div>
                  </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 truncate">{entry.displayName}</h3>
                <p className="text-xs text-slate-400">Rank #{index + 1}</p>
              </div>

              <div className="text-2xl font-black text-indigo-600">
                {entry.score}
              </div>
            </div>
          ))
        )}
        
        {!loading && scores.length === 0 && (
            <div className="text-center p-8 text-slate-400">
                <i className="fa-regular fa-folder-open text-4xl mb-4"></i>
                <p>No scores yet. Be the first!</p>
            </div>
        )}
      </div>
    </div>
  );
};
