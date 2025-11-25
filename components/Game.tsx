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
const STEP_SIZE = 40; // Pixels
const INITIAL_TIME = 100; // Percentage
const TIME_DECAY = 0.4; // % per tick (speed increases)
const TIME_BONUS = 2; // % added per step

export const Game: React.FC<GameProps> = ({ user, characterColor, onGameOver }) => {
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(INITIAL_TIME);
  const [isDead, setIsDead] = useState(false);
  const [steps, setSteps] = useState<Direction[]>([]); // Future steps
  const [playerFacing, setPlayerFacing] = useState<Direction>('right');
  const [climbOffset, setClimbOffset] = useState(0); // For animation vertical
  
  // Audio refs (using simple oscillator if we wanted, but sticking to visual for now)
  
  // Initialize Stairs
  useEffect(() => {
    const initialSteps: Direction[] = [];
    let currentDir: Direction = 'right';
    // Generate initial 20 steps
    for (let i = 0; i < 20; i++) {
        // 70% chance to continue same direction, 30% to switch
        if (Math.random() > 0.7) {
            currentDir = currentDir === 'left' ? 'right' : 'left';
        }
        initialSteps.push(currentDir);
    }
    setSteps(initialSteps);
    setTimer(100);
    setScore(0);
    setIsDead(false);
  }, []);

  // Timer Logic
  useEffect(() => {
    if (isDead) return;
    
    const interval = setInterval(() => {
      setTimer((prev) => {
        const decay = TIME_DECAY + (score * 0.001); // Gets harder as you climb
        const nextTime = prev - decay;
        if (nextTime <= 0) {
          handleDeath();
          return 0;
        }
        return nextTime;
      });
    }, 50); // 20 ticks per second

    return () => clearInterval(interval);
  }, [isDead, score]);

  const handleDeath = async () => {
    setIsDead(true);
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
    
    // Wait a bit then show game over screen
    setTimeout(() => {
        onGameOver();
    }, 1500);
  };

  const addSteps = (count: number) => {
    setSteps(prev => {
        const newSteps = [...prev];
        let lastDir = newSteps[newSteps.length - 1];
        for(let i=0; i<count; i++) {
            if (Math.random() > 0.6) {
                lastDir = lastDir === 'left' ? 'right' : 'left';
            }
            newSteps.push(lastDir);
        }
        return newSteps;
    });
  };

  const handleMove = useCallback((direction: Direction) => {
    if (isDead) return;

    // The logic: 
    // The "steps" array contains the direction of the NEXT step relative to the previous one.
    // Index 0 is the step directly in front of the player.
    
    const correctDirection = steps[0];
    setPlayerFacing(direction);

    if (direction === correctDirection) {
        // Correct Move
        setScore(s => s + 1);
        setTimer(t => Math.min(100, t + TIME_BONUS));
        setClimbOffset(prev => prev + 1); // Trigger animation effect logic if needed
        
        // Remove the stepped-on step and add a new one at the end
        setSteps(prev => {
            const next = prev.slice(1);
            // Replenish buffer
            if (next.length < 10) {
                 // Add logic helper
                 let lastDir = next[next.length - 1];
                 for(let i=0; i<5; i++) {
                     if(Math.random() > 0.6) lastDir = lastDir === 'left' ? 'right' : 'left';
                     next.push(lastDir);
                 }
            }
            return next;
        });

    } else {
        // Wrong Move
        handleDeath();
    }
  }, [isDead, steps, score]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') handleMove('left');
        if (e.key === 'ArrowRight') handleMove('right');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  // Render logic for stairs
  // We render the player static at the bottom center.
  // We render the stairs relative to the player.
  // steps[0] is the immediate next step.
  // We need to visualize previous steps for continuity? 
  // Simplified: Just render steps[0] to steps[N] going UP.
  // We need to track the cumulative X position for rendering.
  
  const renderStairs = () => {
    let currentX = 0;
    let currentY = 0;
    
    const elements = [];
    
    // Render the "current" platform player is standing on (visually index -1)
    elements.push(
        <div key="start" className="absolute w-[60px] h-[20px] bg-slate-300 border-b-4 border-slate-400 rounded-sm"
             style={{ bottom: '80px', left: 'calc(50% - 30px)', zIndex: 10 }} />
    );

    // Render upcoming steps
    // steps array is just directions. We need to accumulate position.
    // If step[0] is 'left', it is placed at (-STEP_X, +STEP_Y).
    
    steps.slice(0, 12).forEach((dir, index) => {
        if (dir === 'left') {
            currentX -= 40; // Move Left
        } else {
            currentX += 40; // Move Right
        }
        currentY += 40; // Move Up

        elements.push(
            <div 
                key={index} 
                className="absolute w-[60px] h-[20px] bg-slate-300 border-b-4 border-slate-400 rounded-sm shadow-sm transition-all duration-100"
                style={{ 
                    bottom: `${80 + currentY}px`, 
                    left: `calc(50% - 30px + ${currentX}px)`,
                    zIndex: 10 - index
                }}
            >
                {/* Optional decoration */}
                <div className="w-full h-full bg-white/20"></div>
            </div>
        );
    });

    return elements;
  };

  return (
    <div className="relative h-full w-full bg-sky-100 overflow-hidden flex flex-col">
        {/* HUD */}
        <div className="absolute top-0 left-0 right-0 p-4 z-50 flex flex-col gap-2">
            <div className="flex justify-between items-end">
                <span className="text-4xl font-black text-slate-800 drop-shadow-sm">{score}</span>
                <span className={`text-xl font-bold ${timer < 30 ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
                    TIME
                </span>
            </div>
            {/* Timer Bar */}
            <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
                <div 
                    className={`h-full transition-all duration-100 linear ${timer < 30 ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${timer}%` }}
                ></div>
            </div>
        </div>

        {/* Game World */}
        <div className="flex-1 relative mt-20">
            {/* Background Decor */}
            <div className="absolute inset-0 flex items-end justify-center opacity-10 pointer-events-none">
                 <i className="fa-solid fa-city text-9xl text-indigo-900 transform translate-y-10"></i>
            </div>

            {/* Stairs Container - Moves down as we animate? 
                Actually, simpler to keep player static and just re-render stairs based on the sliced array. 
                React is fast enough. 
            */}
            {renderStairs()}

            {/* Player */}
            <div 
                className="absolute transition-all duration-100"
                style={{ 
                    bottom: '100px', // On top of the start platform
                    left: 'calc(50% - 32px)', // Centered (width is 64px)
                    zIndex: 20
                }}
            >
                <Character color={characterColor} facing={playerFacing} isDead={isDead} />
                
                {/* Sweat particles if time is low */}
                {timer < 30 && !isDead && (
                    <div className="absolute -top-4 right-0 text-blue-400 animate-bounce text-xl">
                        <i className="fa-solid fa-droplet"></i>
                    </div>
                )}
            </div>
            
            {/* Fall effect/Fog */}
             <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-sky-100 to-transparent z-30"></div>
        </div>

        {/* Controls */}
        <div className="h-48 z-40 grid grid-cols-2 gap-2 p-2 pb-6 bg-white/30 backdrop-blur-md">
            <button 
                className="bg-white hover:bg-slate-50 border-b-8 border-slate-200 active:border-b-0 active:translate-y-[8px] rounded-2xl flex flex-col items-center justify-center gap-2 transition-all group"
                onPointerDown={(e) => { e.preventDefault(); handleMove('left'); }}
            >
                <i className="fa-solid fa-arrow-left text-4xl text-slate-400 group-hover:text-indigo-500 transition-colors"></i>
                <span className="font-black text-slate-400 uppercase tracking-widest">Left</span>
            </button>
            <button 
                className="bg-white hover:bg-slate-50 border-b-8 border-slate-200 active:border-b-0 active:translate-y-[8px] rounded-2xl flex flex-col items-center justify-center gap-2 transition-all group"
                onPointerDown={(e) => { e.preventDefault(); handleMove('right'); }}
            >
                 <i className="fa-solid fa-arrow-right text-4xl text-slate-400 group-hover:text-indigo-500 transition-colors"></i>
                 <span className="font-black text-slate-400 uppercase tracking-widest">Right</span>
            </button>
        </div>

        {/* Game Over Overlay */}
        {isDead && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                <div className="bg-white p-8 rounded-3xl shadow-2xl text-center transform scale-110">
                    <h2 className="text-4xl font-black text-slate-800 mb-2">GAME OVER</h2>
                    <p className="text-slate-500 mb-6">You fell!</p>
                    <div className="text-6xl font-black text-indigo-600 mb-8">{score}</div>
                    <button 
                        onClick={onGameOver}
                        className="bg-indigo-600 text-white font-bold py-4 px-12 rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-105"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};
