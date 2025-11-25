import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile, Direction } from '../types';
import { Character } from './Character';
import { db } from '../services/firebase';
import { collection, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';

interface GameProps {
  user: UserProfile;
  characterColor: string;
  onGameOver: () => void;
}

// Game Constants
const INITIAL_TIME = 100;
const TIME_DECAY_BASE = 0.5;
const TIME_BONUS = 4.0;
const MAX_TIME = 100;

// Sound Synthesizer - Snappier sounds
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
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
  } else if (type === 'turn') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
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
  // We use Refs for game logic to allow super-fast inputs without waiting for React renders
  const gameStateRef = useRef({
    facing: 'right' as Direction,
    steps: [] as Direction[],
    score: 0,
    timer: INITIAL_TIME,
    isDead: false,
    pastSteps: [] as Direction[]
  });

  // UI State (synced from Refs for rendering)
  const [uiScore, setUiScore] = useState(0);
  const [uiTimer, setUiTimer] = useState(INITIAL_TIME);
  const [uiFacing, setUiFacing] = useState<Direction>('right');
  const [uiSteps, setUiSteps] = useState<Direction[]>([]);
  const [uiPastSteps, setUiPastSteps] = useState<Direction[]>([]);
  const [isDead, setIsDead] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Background gradient based on score
  const getBackgroundClass = () => {
    if (uiScore < 50) return 'bg-gradient-to-b from-sky-300 to-blue-200';
    if (uiScore < 100) return 'bg-gradient-to-b from-indigo-400 to-purple-300';
    return 'bg-gradient-to-b from-slate-900 via-indigo-900 to-purple-900';
  };

  // Initialize Game
  useEffect(() => {
    const initialSteps: Direction[] = [];
    let currentDir: Direction = 'right';
    for (let i = 0; i < 30; i++) {
        // More structured random generation for better flow
        if (i > 4 && Math.random() > 0.65) {
            currentDir = currentDir === 'left' ? 'right' : 'left';
        }
        initialSteps.push(currentDir);
    }

    gameStateRef.current = {
        facing: 'right',
        steps: initialSteps,
        score: 0,
        timer: 100,
        isDead: false,
        pastSteps: []
    };

    // Sync UI
    setUiSteps(initialSteps);
    setUiFacing('right');
    setUiScore(0);
    setUiTimer(100);
    setUiPastSteps([]);
    setIsDead(false);
  }, []);

  // Timer Logic
  useEffect(() => {
    if (isDead) return;
    
    const interval = setInterval(() => {
      if (gameStateRef.current.isDead) return;

      const current = gameStateRef.current;
      // Decay accelerates slightly
      const decay = TIME_DECAY_BASE + (Math.min(current.score, 200) * 0.003);
      current.timer -= decay;

      if (current.timer <= 0) {
        handleDeath();
      } else {
        setUiTimer(current.timer);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isDead]);

  const handleDeath = async () => {
    if (gameStateRef.current.isDead) return;
    gameStateRef.current.isDead = true;
    setIsDead(true);
    playSound('gameover');

    const finalScore = gameStateRef.current.score;
    
    // Save Score Logic (Highest Score Only)
    try {
      const userScoreRef = doc(db, "scores", user.uid);
      const docSnap = await getDoc(userScoreRef);

      const newScoreData = {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || "Anonymous",
        score: finalScore,
        characterColor: characterColor,
        timestamp: serverTimestamp()
      };

      if (docSnap.exists()) {
        const currentHighScore = docSnap.data().score;
        if (finalScore > currentHighScore) {
            await setDoc(userScoreRef, newScoreData);
        }
      } else {
        await setDoc(userScoreRef, newScoreData);
      }
    } catch (e) {
      console.error("Error saving score", e);
    }
  };

  // Core Move Logic
  const processMove = (attemptedDirection: Direction, isTurn: boolean) => {
    if (gameStateRef.current.isDead) return;

    const current = gameStateRef.current;
    const requiredDirection = current.steps[0];

    // Check if move matches the required next step
    if (attemptedDirection === requiredDirection) {
        // Success
        if (isTurn) playSound('turn');
        else playSound('jump');

        current.score += 1;
        current.timer = Math.min(MAX_TIME, current.timer + TIME_BONUS);
        
        // Update History
        current.pastSteps = [requiredDirection, ...current.pastSteps].slice(0, 8);
        
        // Generate Next Step
        const nextSteps = current.steps.slice(1);
        let lastDir = nextSteps[nextSteps.length - 1];
        // 70% chance to keep direction, 30% switch
        if (Math.random() > 0.7) {
            lastDir = lastDir === 'left' ? 'right' : 'left';
        }
        nextSteps.push(lastDir);
        current.steps = nextSteps;

        // Visual Feedback triggers
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 50);

        // Sync UI
        setUiScore(current.score);
        setUiTimer(current.timer);
        setUiSteps([...current.steps]);
        setUiPastSteps([...current.pastSteps]);
        setUiFacing(current.facing);

    } else {
        // Fail
        handleDeath();
    }
  };

  const handleClimb = () => {
    const current = gameStateRef.current;
    // Climb = Move in current facing direction
    processMove(current.facing, false);
  };

  const handleTurn = () => {
    const current = gameStateRef.current;
    // Turn = Switch facing AND Move in that new direction
    const newFacing = current.facing === 'left' ? 'right' : 'left';
    current.facing = newFacing;
    processMove(newFacing, true);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.repeat) return;
        
        // Climb (Z, Right Arrow, Up Arrow)
        if (['ArrowUp', 'ArrowRight', 'z', 'Z'].includes(e.key)) {
            handleClimb();
        }
        // Turn (X, Left Arrow, Down Arrow)
        else if (['ArrowDown', 'ArrowLeft', 'x', 'X'].includes(e.key)) {
            handleTurn();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderStairs = () => {
    const elements = [];

    // STAIR CONFIGURATION (Smaller and thinner)
    const STAIR_WIDTH = 'w-16'; // 64px
    const STAIR_HEIGHT = 'h-6'; // 24px
    const SIDE_HEIGHT = 'h-3'; // 12px (Thin)
    const X_DELTA = 40;
    const Y_DELTA = 32;
    const START_BOTTOM = 120;

    // --- PAST STEPS (Fade out) ---
    let backX = 0;
    let backY = 0;
    uiPastSteps.forEach((dir, index) => {
        if (dir === 'left') backX += X_DELTA;
        else backX -= X_DELTA;
        backY -= Y_DELTA;

        elements.push(
            <div 
                key={`past-${index}`}
                className={`absolute ${STAIR_WIDTH} ${STAIR_HEIGHT} bg-slate-100 transition-all duration-75`}
                style={{ 
                    bottom: `${START_BOTTOM + backY}px`, 
                    left: `calc(50% - 32px + ${backX}px)`,
                    zIndex: 10 - index,
                    opacity: Math.max(0, 1 - (index * 0.25))
                }}
            >
               {/* 3D Side Face */}
               <div className={`absolute top-[24px] left-0 w-full ${SIDE_HEIGHT} bg-slate-300`}></div>
            </div>
        );
    });

    // --- CURRENT PLATFORM ---
    elements.push(
        <div key="current" className={`absolute ${STAIR_WIDTH} ${STAIR_HEIGHT} bg-slate-200`}
             style={{ bottom: `${START_BOTTOM}px`, left: 'calc(50% - 32px)', zIndex: 20 }}>
             <div className={`absolute top-[24px] left-0 w-full ${SIDE_HEIGHT} bg-slate-400`}></div>
        </div>
    );

    // --- FUTURE STEPS ---
    let currentX = 0;
    let currentY = 0;
    uiSteps.slice(0, 12).forEach((dir, index) => {
        if (dir === 'left') currentX -= X_DELTA;
        else currentX += X_DELTA;
        currentY += Y_DELTA;

        elements.push(
            <div 
                key={`future-${index}`} 
                className={`absolute ${STAIR_WIDTH} ${STAIR_HEIGHT} bg-white transition-all duration-75`}
                style={{ 
                    bottom: `${START_BOTTOM + currentY}px`, 
                    left: `calc(50% - 32px + ${currentX}px)`,
                    zIndex: 20 - index
                }}
            >
              <div className="w-full h-full bg-white border-t-2 border-indigo-100/50"></div>
              {/* 3D Side Face - Darker to show depth */}
              <div className={`absolute top-[24px] left-0 w-full ${SIDE_HEIGHT} bg-slate-200 border-b border-slate-300`}></div>
            </div>
        );
    });

    return elements;
  };

  return (
    <div className={`relative h-full w-full overflow-hidden flex flex-col transition-colors duration-1000 ${getBackgroundClass()}`}>
        
        {/* Sky Elements */}
        <div className="absolute inset-0 pointer-events-none">
             {/* Simple Clouds */}
             <div className="absolute top-20 left-10 w-24 h-8 bg-white/20 rounded-full blur-lg animate-cloud-slow"></div>
             <div className="absolute top-40 left-60 w-32 h-10 bg-white/10 rounded-full blur-md animate-cloud-fast"></div>
        </div>

        {/* HUD */}
        <div className="absolute top-0 left-0 right-0 p-4 z-50 flex flex-col gap-2">
            <div className="flex justify-between items-start">
                 {/* Best Score (Small) */}
                 <div className="bg-black/20 backdrop-blur-md px-3 py-1 rounded-lg">
                    <span className="text-xs font-bold text-white/80 uppercase">Best Score</span>
                 </div>
                 
                 {/* Current Score (Big) */}
                 <div className="flex flex-col items-end">
                    <span className="text-6xl font-black text-white drop-shadow-md leading-none">{uiScore}</span>
                 </div>
            </div>
            
            {/* Timer Bar */}
            <div className="relative w-full h-4 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm mt-1">
                <div 
                    className={`h-full transition-all duration-100 ease-linear ${uiTimer < 30 ? 'bg-red-500' : 'bg-yellow-400'}`}
                    style={{ width: `${uiTimer}%` }}
                ></div>
            </div>
        </div>

        {/* Game World */}
        <div className="flex-1 relative mt-0 overflow-visible">
            {/* Container moves down as player climbs to keep player centered visually */}
            <div className="absolute inset-0 flex items-end justify-center pb-32">
                 {renderStairs()}
            </div>

            {/* Player */}
            {/* Positioned on top of the starting platform (120px + 24px = 144px). 
                Added slightly more (148px) to account for feet. 
                Scaled down to 90% to fit the smaller 64px wide stairs better. */}
            <div 
                className={`absolute bottom-[148px] left-[calc(50%-40px)] z-40 transition-transform duration-75 origin-bottom ${isAnimating ? 'scale-[0.95] -translate-y-1' : 'scale-90'}`}
            >
                <Character 
                    color={characterColor} 
                    facing={uiFacing} 
                    isDead={isDead} 
                    className="drop-shadow-xl"
                />
            </div>
        </div>

        {/* Arcade Controls */}
        <div className="h-auto pb-8 pt-4 px-4 z-50 bg-gradient-to-t from-slate-900/40 to-transparent">
            <div className="flex gap-6 max-w-md mx-auto items-end">
                {/* Turn Button (Left) */}
                <button 
                    className="flex-1 h-24 bg-indigo-500 active:bg-indigo-600 rounded-2xl border-b-8 border-indigo-700 active:border-b-0 active:translate-y-2 transition-all shadow-xl flex flex-col items-center justify-center group"
                    onPointerDown={(e) => { e.preventDefault(); handleTurn(); }}
                >
                    <div className="bg-indigo-700/50 p-2 rounded-full mb-1 group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-arrow-rotate-left text-2xl text-white"></i>
                    </div>
                    <span className="font-black text-white uppercase text-lg tracking-wider">Turn</span>
                </button>

                {/* Climb Button (Right) */}
                <button 
                    className="flex-1 h-24 bg-pink-500 active:bg-pink-600 rounded-2xl border-b-8 border-pink-700 active:border-b-0 active:translate-y-2 transition-all shadow-xl flex flex-col items-center justify-center group"
                    onPointerDown={(e) => { e.preventDefault(); handleClimb(); }}
                >
                     <div className="bg-pink-700/50 p-2 rounded-full mb-1 group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-shoe-prints text-2xl text-white -rotate-90"></i>
                    </div>
                    <span className="font-black text-white uppercase text-lg tracking-wider">Climb</span>
                </button>
            </div>
            
            {/* Keyboard Hints */}
            <div className="flex justify-between px-8 mt-2 text-white/60 text-xs font-bold">
                 <span>[X] or [Left]</span>
                 <span>[Z] or [Right]</span>
            </div>
        </div>

        {/* Game Over Screen */}
        {isDead && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-6">
                <div className="bg-white p-6 rounded-3xl shadow-2xl text-center w-full max-w-sm animate-shake">
                    <h2 className="text-4xl font-black text-slate-800 mb-2 italic">GAME OVER</h2>
                    
                    <div className="bg-slate-100 rounded-2xl p-6 mb-6">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Score</div>
                        <div className="text-7xl font-black text-indigo-600 tracking-tighter">{uiScore}</div>
                    </div>
                    
                    <div className="space-y-3">
                        <button 
                            onClick={() => { playSound('jump'); onGameOver(); }}
                            className="w-full bg-green-500 text-white font-bold py-4 px-8 rounded-xl shadow-[0_4px_0_0_rgba(22,163,74,1)] hover:bg-green-600 active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center gap-2 text-lg"
                        >
                            <i className="fa-solid fa-rotate-right"></i> RETRY
                        </button>
                        <button 
                            onClick={onGameOver}
                            className="w-full bg-slate-200 text-slate-600 font-bold py-3 px-8 rounded-xl hover:bg-slate-300 transition-all"
                        >
                            Main Menu
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
