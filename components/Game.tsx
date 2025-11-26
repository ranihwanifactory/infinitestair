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

  // Background gradient - Dark Mode Theme
  const getBackgroundClass = () => {
    // Progressive dark themes
    if (uiScore < 50) return 'bg-gradient-to-b from-slate-900 to-indigo-950';
    if (uiScore < 100) return 'bg-gradient-to-b from-indigo-950 to-purple-950';
    return 'bg-gradient-to-b from-black via-slate-900 to-black';
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

  // Kakao AdFit Script Loading
  useEffect(() => {
    try {
      // Check if script already exists to avoid duplicate loading
      if (!document.querySelector('script[src="//t1.daumcdn.net/kas/static/ba.min.js"]')) {
        const script = document.createElement('script');
        script.src = "//t1.daumcdn.net/kas/static/ba.min.js";
        script.async = true;
        document.body.appendChild(script);
      } else {
        // If script exists, re-trigger ad refresh if possible, or assume it handles new inserts
        // @ts-ignore
        if (window.kakao_ad_runner) {
           // @ts-ignore
           // window.kakao_ad_runner(); // Uncomment if ad refresh is needed explicitly
        }
      }
    } catch (e) {
      console.error("AdFit script error", e);
    }
  }, []);

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
        displayName: user.displayName || user.email?.split('@')[0] || "익명",
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