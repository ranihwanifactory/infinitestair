import React from 'react';
import { Direction } from '../types';

interface CharacterProps {
  color: string;
  facing: Direction;
  isDead?: boolean;
  className?: string;
}

export const Character: React.FC<CharacterProps> = ({ color, facing, isDead, className = '' }) => {
  // Eye position logic
  // If facing left, eyes look left. If right, eyes look right.
  const eyeOffset = facing === 'left' ? '-translate-x-1' : 'translate-x-1';
  
  return (
    <div className={`relative transition-all duration-200 ${className}`}>
      {/* Body */}
      <div 
        className={`w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center transition-transform duration-100 ${isDead ? 'rotate-45 opacity-60 grayscale' : ''}`}
        style={{ backgroundColor: color }}
      >
        {/* Face Container */}
        <div className="flex gap-2">
          {/* Left Eye */}
          <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center overflow-hidden">
            <div className={`w-2 h-2 bg-black rounded-full transition-transform duration-150 ${isDead ? '' : eyeOffset}`}></div>
          </div>
          {/* Right Eye */}
          <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center overflow-hidden">
            <div className={`w-2 h-2 bg-black rounded-full transition-transform duration-150 ${isDead ? '' : eyeOffset}`}></div>
          </div>
        </div>

        {/* Mouth (optional, changes on death) */}
        <div className={`absolute bottom-3 w-4 h-1 bg-black/20 rounded-full transition-all ${isDead ? 'w-6 rotate-12' : ''}`}></div>
      </div>
      
      {/* Shadow */}
      <div className="absolute -bottom-2 left-2 w-12 h-2 bg-black/10 rounded-full blur-sm"></div>
    </div>
  );
};
