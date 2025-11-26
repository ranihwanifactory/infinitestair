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
  const [showInstallModal, setShowInstallModal] = useState(false);

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
      // Automatically show the install modal to the user
      setShowInstallModal(true);
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
    setShowInstallModal(false);
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

      {/* Auto Install Modal */}
      {showInstallModal && gameState !== 'playing' && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm text-center">
             <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-download text-3xl text-indigo-600"></i>
             </div>
             <h3 className="text-xl font-black text-slate-800 mb-2">앱을 설치하시겠습니까?</h3>
             <p className="text-slate-500 mb-6 text-sm">홈 화면에 추가하여 더 빠르고 편리하게<br/>무한의 계단을 즐겨보세요!</p>
             <div className="flex gap-3">
               <button 
                  onClick={() => setShowInstallModal(false)}
                  className="flex-1 py-3 text-slate-500 font-bold bg-slate-100 rounded-xl hover:bg-slate-200"
               >
                 나중에
               </button>
               <button 
                  onClick={handleInstallClick}
                  className="flex-1 py-3 text-white font-bold bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200"
               >
                 설치하기
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;