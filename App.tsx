import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { MainMenu } from './components/MainMenu';
import { Game } from './components/Game';
import { Leaderboard } from './components/Leaderboard';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { UserProfile, GameState } from './types';

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [gameState, setGameState] = useState<GameState>('auth');
  const [characterColor, setCharacterColor] = useState('#F87171'); // Default Red
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL
        });
        // If we were in auth screen, go to menu
        setGameState(prev => prev === 'auth' ? 'menu' : prev);
      } else {
        setUser(null);
        setGameState('auth');
      }
    });

    // PWA Install Prompt Listener
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setGameState('auth');
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  return (
    <div className="w-full h-screen max-w-md mx-auto bg-white shadow-2xl overflow-hidden relative">
      {gameState === 'auth' && (
        <Auth onLogin={() => setGameState('menu')} />
      )}
      
      {gameState === 'menu' && user && (
        <MainMenu 
          user={user}
          selectedColor={characterColor}
          onColorChange={setCharacterColor}
          onStart={() => setGameState('playing')}
          onShowLeaderboard={() => setGameState('leaderboard')}
          onLogout={handleLogout}
          showInstallButton={!!deferredPrompt}
          onInstall={handleInstallClick}
        />
      )}

      {gameState === 'playing' && user && (
        <Game 
          user={user}
          characterColor={characterColor}
          onGameOver={() => setGameState('menu')}
        />
      )}

      {gameState === 'leaderboard' && (
        <Leaderboard onBack={() => setGameState('menu')} />
      )}
    </div>
  );
}

export default App;