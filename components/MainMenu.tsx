import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { Character } from './Character';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface MainMenuProps {
  user: UserProfile;
  selectedColor: string;
  onColorChange: (color: string) => void;
  onStart: () => void;
  onShowLeaderboard: () => void;
  onLogout: () => void;
  showInstallButton: boolean;
  onInstall: () => void;
}

const COLORS = [
  '#F87171', // Red
  '#FB923C', // Orange
  '#FACC15', // Yellow
  '#4ADE80', // Green
  '#60A5FA', // Blue
  '#A78BFA', // Purple
  '#F472B6', // Pink
  '#94A3B8', // Slate
];

export const MainMenu: React.FC<MainMenuProps> = ({ 
  user, 
  selectedColor, 
  onColorChange, 
  onStart, 
  onShowLeaderboard,
  onLogout,
  showInstallButton,
  onInstall
}) => {
  const [highScore, setHighScore] = useState<number>(0);

  useEffect(() => {
    const fetchHighScore = async () => {
      try {
        const docRef = doc(db, "scores", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setHighScore(docSnap.data().score || 0);
        }
      } catch (e) {
        console.error("Error fetching high score", e);
      }
    };
    fetchHighScore();
  }, [user.uid]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Infinite Stair Climber',
          text: `I scored ${highScore} on Infinite Stair Climber! Can you beat me?`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Game link copied to clipboard!');
    }
  };

  return (
    <div className="flex flex-col h-full bg-sky-50 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>

      <header className="flex justify-between items-center p-6 z-10">
        <div className="flex items-center gap-2">
          {user.photoURL ? (
            <img src={user.photoURL} alt="User" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm">
              {user.displayName?.charAt(0) || user.email?.charAt(0) || 'P'}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Player</span>
            <span className="text-sm font-bold text-slate-800 truncate max-w-[150px]">{user.displayName || user.email?.split('@')[0]}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleShare} className="w-10 h-10 rounded-full bg-white text-indigo-500 shadow-sm flex items-center justify-center hover:bg-indigo-50 transition-colors">
            <i className="fa-solid fa-share-nodes"></i>
          </button>
          <button onClick={onLogout} className="w-10 h-10 rounded-full bg-white text-slate-400 shadow-sm flex items-center justify-center hover:text-red-500 hover:bg-red-50 transition-colors">
            <i className="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center z-10 p-4 gap-4">
        
        {/* High Score Badge */}
        <div className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-2xl border border-white shadow-sm flex flex-col items-center animate-fade-in">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Best Score</span>
           <span className="text-3xl font-black text-indigo-600">{highScore}</span>
        </div>

        {/* Character Preview */}
        <div className="relative group cursor-pointer py-6" onClick={onStart}>
             <div className="absolute inset-0 bg-white/50 rounded-full blur-2xl transform group-hover:scale-110 transition-transform"></div>
             <Character color={selectedColor} facing="right" className="transform scale-150 group-hover:-translate-y-2 transition-transform" />
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-xl font-black text-slate-800">Select Character</h2>
        </div>

        {/* Color Grid */}
        <div className="grid grid-cols-4 gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-3xl border border-white/50 shadow-xl max-w-xs">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`w-10 h-10 rounded-xl transition-transform transform hover:scale-110 flex items-center justify-center ${selectedColor === color ? 'ring-4 ring-offset-2 ring-indigo-500 scale-110' : ''}`}
              style={{ backgroundColor: color }}
            >
              {selectedColor === color && <i className="fa-solid fa-check text-white text-sm drop-shadow-md"></i>}
            </button>
          ))}
        </div>

        <div className="w-full max-w-xs space-y-3 mt-4">
          <button
            onClick={onStart}
            className="w-full bg-green-500 hover:bg-green-600 text-white text-xl font-black py-4 px-8 rounded-2xl shadow-[0_6px_0_0_rgba(22,163,74,1)] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-3 group"
          >
            <i className="fa-solid fa-play group-hover:scale-110 transition-transform"></i> PLAY
          </button>
          
          <button
            onClick={onShowLeaderboard}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-lg font-bold py-3 px-8 rounded-2xl shadow-[0_4px_0_0_rgba(79,70,229,1)] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center gap-3"
          >
             <i className="fa-solid fa-trophy"></i> RANKING
          </button>

          {showInstallButton && (
             <button
              onClick={onInstall}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold py-3 px-8 rounded-2xl shadow-[0_4px_0_0_rgba(15,23,42,1)] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-download"></i> INSTALL APP
            </button>
          )}
        </div>

      </main>
    </div>
  );
};