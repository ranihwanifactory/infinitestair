import React from 'react';
import { UserProfile } from '../types';
import { Character } from './Character';

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
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Infinite Stair Climber',
          text: 'Come join me on Infinite Stair Climber! Can you beat my high score?',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Could show a toast here, but for simplicity:
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
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Welcome</span>
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

      <main className="flex-1 flex flex-col items-center justify-center z-10 p-4 gap-6">
        
        {/* Character Preview */}
        <div className="relative group cursor-pointer py-4" onClick={onStart}>
             <div className="absolute inset-0 bg-white/50 rounded-full blur-2xl transform group-hover:scale-110 transition-transform"></div>
             <Character color={selectedColor} facing="right" className="transform scale-150 group-hover:-translate-y-2 transition-transform" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-slate-800">Choose Your Hero</h2>
          <p className="text-slate-500">Tap a color to select</p>
        </div>

        {/* Color Grid */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-3xl border border-white/50 shadow-xl">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`w-12 h-12 rounded-xl transition-transform transform hover:scale-110 flex items-center justify-center ${selectedColor === color ? 'ring-4 ring-offset-2 ring-indigo-500 scale-110' : ''}`}
              style={{ backgroundColor: color }}
            >
              {selectedColor === color && <i className="fa-solid fa-check text-white text-lg drop-shadow-md"></i>}
            </button>
          ))}
        </div>

        <div className="w-full max-w-xs space-y-3">
          <button
            onClick={onStart}
            className="w-full bg-green-500 hover:bg-green-600 text-white text-xl font-black py-4 px-8 rounded-2xl shadow-[0_6px_0_0_rgba(22,163,74,1)] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-3"
          >
            <i className="fa-solid fa-play"></i> START GAME
          </button>
          
          <button
            onClick={onShowLeaderboard}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-lg font-bold py-3 px-8 rounded-2xl shadow-[0_4px_0_0_rgba(79,70,229,1)] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center gap-3"
          >
             <i className="fa-solid fa-trophy"></i> LEADERBOARD
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