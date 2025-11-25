import React, { useState } from 'react';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export const Auth: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      onLogin();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 animate-fade-in bg-slate-50">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border-b-8 border-slate-100">
        <h1 className="text-3xl font-black text-center mb-6 text-indigo-600 tracking-tight">
          무한의 계단
        </h1>
        
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 mb-6"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
          Google로 계속하기
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-400">또는 이메일로 계속하기</span>
          </div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">이메일</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none transition-colors text-slate-800"
              placeholder="player@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">비밀번호</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none transition-colors text-slate-800"
              placeholder="••••••••"
            />
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-200 transition-all transform active:scale-95 active:shadow-none translate-y-0"
          >
            {isRegistering ? '계정 생성' : '로그인'}
          </button>
        </form>

        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="w-full text-center mt-4 text-sm text-indigo-500 hover:text-indigo-700 font-semibold"
        >
          {isRegistering ? '이미 계정이 있으신가요? 로그인' : '계정이 필요하신가요? 회원가입'}
        </button>
      </div>
    </div>
  );
};