export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface ScoreEntry {
  id?: string;
  uid: string;
  displayName: string;
  score: number;
  characterColor: string;
  timestamp: any; // Firestore timestamp
}

export type Direction = 'left' | 'right';

export interface GameConfig {
  characterColor: string;
}

export type GameState = 'auth' | 'menu' | 'playing' | 'gameover' | 'leaderboard';
