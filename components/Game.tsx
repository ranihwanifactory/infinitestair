import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile, Direction } from '../types';
import { Character } from './Character';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface GameProps {
  user: UserProfile;
  characterColor: string;
  onGameOver: () => void;
}

// Game Constants
const INITIAL_TIME = 100; // Percentage
const TIME_DECAY = 0.5; // Base decay per tick
const TIME_BONUS = 3.5; // Time added per step
const MAX_TIME = 100;

// Sound Synthesizer
const playSound = (type: 'jump' | 'turn' | 'gameover') => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;

  if (type === 'jump') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'turn') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'gameover') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(50, now + 0.5);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);
    osc.start(now);
    osc.stop(now + 0.5);
  }
};

export const Game: React.FC<GameProps> = ({ user, characterColor, onGameOver }) => {
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(INITIAL_TIME);
  const [isDead, setIsDead] = useState(false);
  const [steps, setSteps] = useState<Direction[]>([]); // The visible stair path
  const [playerFacing, setPlayerFacing] = useState<Direction>('right');
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Background gradient based on score
  const getBackgroundClass = () => {
    if (score < 50) return 'bg-gradient-to-b from-sky-400 to-sky-100';
    if (score < 100) return 'bg-gradient-to-b from-indigo-500 to-pink-400';
    return 'bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900'; // Space
  };

  // Initialize Stairs
  useEffect(() => {
    const initialSteps: Direction[] = [];
    let currentDir: Direction = 'right';
    // Generate initial steps
    for (let i = 0; i < 20; i++) {
        // 50/50 chance to switch direction after the first few
        if (i > 3 && Math.random() > 0.5) {
            currentDir = currentDir === 'left' ? 'right' : 'left';
        }
        initialSteps.push(currentDir);
    }
    setSteps(initialSteps);
    setTimer(100);
    setScore(0);
    setIsDead(false);
    setPlayerFacing('right');
  }, []);

  // Timer Logic
  useEffect(() => {
    if (isDead) return;
    
    const interval = setInterval(() => {
      setTimer((prev) => {
        // Decay speeds up slightly as score increases
        const currentDecay = TIME_DECAY + (Math.min(score, 200) * 0.002);
        const nextTime = prev - currentDecay;
        if (nextTime <= 0) {
          handleDeath();
          return 0;
        }
        return nextTime;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isDead, score]);

  const handleDeath = async () => {
    if (isDead) return; // Prevent double death
    setIsDead(true);
    playSound('gameover');
    
    // Save score
    try {
      await addDoc(collection(db, "scores"), {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || "Anonymous",
        score: score,
        characterColor: characterColor,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Error saving score", e);
    }
  };

  const advanceGame = (newFacing: Direction) => {
    const nextStepDirection = steps[0];

    // Check if the move is valid
    if (newFacing === nextStepDirection) {
        // Correct Move
        setScore(s => s + 1);
        setTimer(t => Math.min(MAX_TIME, t + TIME_BONUS));
        
        // Add animation trigger
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 50);

        // Update stairs: Remove current, add new at end
        setSteps(prev => {
            const next = prev.slice(1);
            let lastDir = next[next.length - 1];
            
            // Logic for generating new stairs: clusters of same direction
            // 70% chance to continue same direction, 30% to switch
            if (Math.random() > 0.7) {
                lastDir = lastDir === 'left' ? 'right' : 'left';
            }
            next.push(lastDir);
            return next;
        });

    } else {
        // Wrong Direction
        handleDeath();
    }
  };

  const handleClimb = useCallback(() => {
    if (isDead) return;
    playSound('jump');
    // Climb moves in the CURRENT facing direction
    advanceGame(playerFacing);
  }, [isDead, playerFacing, steps, score]);

  const handleTurn = useCallback(() => {
    if (isDead) return;
    playSound('turn');
    // Turn switches direction THEN moves
    const newFacing = playerFacing === 'left' ? 'right' : 'left';
    setPlayerFacing(newFacing);
    advanceGame(newFacing);
  }, [isDead, playerFacing, steps, score]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.repeat) return; // Prevent holding down key
        
        // Climb: Up Arrow, Right Arrow, Z
        if (['ArrowUp', 'ArrowRight', 'z', 'Z'].includes(e.key)) {
            handleClimb();
        }
        // Turn: Down Arrow, Left Arrow, X
        else if (['ArrowDown', 'ArrowLeft', 'x', 'X'].includes(e.key)) {
            handleTurn();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClimb, handleTurn]);

  // Render logic
  const renderStairs = () => {
    let currentX = 0;
    let currentY = 0;
    const elements = [];

    // The starting platform
    elements.push(
        <div key="start" className="absolute w-[80px] h-[40px] bg-slate-100 border-4 border-slate-300 rounded-lg shadow-lg"
             style={{ bottom: '120px', left: 'calc(50% - 40px)', zIndex: 20 }} />
    );

    // Render upcoming steps
    // We only render a certain amount to keep DOM light
    steps.slice(0, 10).forEach((dir, index) => {
        if (dir === 'left') {
            currentX -= 60; // Move Left
        } else {
            currentX += 60; // Move Right
        }
        currentY += 50; // Move Up

        elements.push(
            <div 
                key={index} 
                className={`absolute w-[80px] h-[40px] bg-white border-4 rounded-lg shadow-lg transition-all duration-100 
                  ${dir === 'left' ? 'rounded-tr-none' : 'rounded-tl-none'}
                  border-indigo-100
                `}
                style={{ 
                    bottom: `${120 + currentY}px`, 
                    left: `calc(50% - 40px + ${currentX}px)`,
                    zIndex: 20 - index
                }}
            >
              {/* Stair Top Pattern */}
              <div className="w-full h-full bg-indigo-50/50"></div>
            </div>
        );
    });

    return elements;
  };

  return (
    <div className={`relative h-full w-full overflow-hidden flex flex-col transition-colors duration-1000 ${getBackgroundClass()}`}>
        
        {/* Sky Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {score < 100 ? (
               <>
                 <div className="absolute top-10 left-[-20%] w-32 h-12 bg-white/20 blur-md rounded-full animate-cloud-slow"></div>
                 <div className="absolute top-40 left-[-40%] w-48 h-16 bg-white/10 blur-xl rounded-full animate-cloud-fast"></div>
               </>
            ) : (
                <>
                  <div className="absolute top-10 right-10 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <div className="absolute top-1/3 left-1/4 w-1 h-1 bg-white rounded-full opacity-50"></div>
                  <div className="absolute top-20 left-1/2 w-3 h-3 bg-yellow-100 rounded-full blur-sm opacity-80"></div>
                </>
            )}
        </div>

        {/* HUD */}
        <div className="absolute top-0 left-0 right-0 p-6 z-50 flex flex-col gap-2">
            <div className="flex justify-between items-center">
                 <div className="bg-black/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
                    <span className="text-sm font-bold text-white uppercase tracking-wider block">Score</span>
                    <span className="text-4xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">{score}</span>
                 </div>
                 {/* High Score Preview could go here */}
            </div>
            
            {/* Timer Bar */}
            <div className="relative w-full h-6 bg-black/30 rounded-full overflow-hidden border-2 border-white/30 backdrop-blur-sm mt-2">
                <div 
                    className={`h-full transition-all duration-100 ease-linear ${timer < 30 ? 'bg-red-500 animate-pulse' : 'bg-yellow-400'}`}
                    style={{ width: `${timer}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <i className="fa-solid fa-bolt text-xs text-white/50"></i>
                </div>
            </div>
        </div>

        {/* Game World - Fixed Player, Moving World */}
        <div className="flex-1 relative mt-0 overflow-visible">
            <div className="absolute inset-0 flex items-end justify-center pb-32 transition-transform duration-75">
                 {renderStairs()}
            </div>

            {/* Player */}
            <div 
                className={`absolute bottom-[160px] left-[calc(50%-40px)] z-30 transition-transform duration-75 ${isAnimating ? 'scale-110 -translate-y-2' : 'scale-100'}`}
            >
                <Character 
                    color={characterColor} 
                    facing={playerFacing} 
                    isDead={isDead} 
                    className="drop-shadow-2xl"
                />
            </div>
            
            {/* Fog/Clouds at bottom */}
             <div className="absolute bottom-0 w-full h-48 bg-gradient-to-t from-white/40 to-transparent z-40 pointer-events-none"></div>
        </div>

        {/* Controls */}
        <div className="h-auto pb-8 pt-4 px-4 z-50 bg-white/10 backdrop-blur-md border-t border-white/20">
            <div className="flex gap-4 max-w-md mx-auto">
                {/* Turn Button */}
                <button 
                    className="flex-1 bg-gradient-to-b from-indigo-500 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 active:translate-y-2 active:border-b-0 border-b-8 border-indigo-900 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 transition-all shadow-xl group touch-manipulation"
                    onPointerDown={(e) => { e.preventDefault(); handleTurn(); }}
                >
                    <i className="fa-solid fa-arrow-rotate-left text-4xl text-white group-hover:scale-110 transition-transform"></i>
                    <span className="font-black text-white uppercase tracking-wider text-sm">Turn</span>
                    <div className="flex gap-2 text-[10px] text-indigo-200 bg-black/20 px-2 py-1 rounded">
                         <span><i className="fa-solid fa-arrow-left"></i> Left</span>
                         <span><i className="fa-solid fa-arrow-down"></i> Down</span>
                         <span className="font-bold border border-indigo-200/30 px-1 rounded">X</span>
                    </div>
                </button>

                {/* Climb Button */}
                <button 
                    className="flex-1 bg-gradient-to-b from-pink-500 to-pink-700 hover:from-pink-400 hover:to-pink-600 active:translate-y-2 active:border-b-0 border-b-8 border-pink-900 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 transition-all shadow-xl group touch-manipulation"
                    onPointerDown={(e) => { e.preventDefault(); handleClimb(); }}
                >
                     <i className="fa-solid fa-shoe-prints text-4xl text-white group-hover:scale-110 transition-transform -rotate-90"></i>
                     <span className="font-black text-white uppercase tracking-wider text-sm">Climb</span>
                     <div className="flex gap-2 text-[10px] text-pink-200 bg-black/20 px-2 py-1 rounded">
                         <span><i className="fa-solid fa-arrow-right"></i> Right</span>
                         <span><i className="fa-solid fa-arrow-up"></i> Up</span>
                         <span className="font-bold border border-pink-200/30 px-1 rounded">Z</span>
                    </div>
                </button>
            </div>
            <div className="text-center mt-2 text-white/80 text-xs font-semibold drop-shadow-md">
                Desktop Controls Enabled
            </div>
        </div>

        {/* Game Over Overlay */}
        {isDead && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-6">
                <div className="bg-white p-8 rounded-3xl shadow-2xl text-center w-full max-w-sm animate-shake border-4 border-slate-200">
                    <div className="inline-block p-4 rounded-full bg-red-100 mb-4">
                        <i className="fa-solid fa-skull text-4xl text-red-500"></i>
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 mb-2 uppercase italic transform -skew-x-6">Wasted</h2>
                    <p className="text-slate-500 mb-6 font-medium">You missed a step!</p>
                    
                    <div className="bg-slate-100 rounded-2xl p-4 mb-8">
                        <div className="text-sm text-slate-500 font-bold uppercase">Final Score</div>
                        <div className="text-6xl font-black text-indigo-600 tracking-tighter">{score}</div>
                    </div>
                    
                    <button 
                        onClick={() => { playSound('jump'); onGameOver(); }}
                        className="w-full bg-indigo-600 text-white font-bold py-4 px-8 rounded-2xl shadow-[0_6px_0_0_rgba(79,70,229,1)] hover:bg-indigo-500 active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-2"
                    >
                        <i className="fa-solid fa-rotate-right"></i> Play Again
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};