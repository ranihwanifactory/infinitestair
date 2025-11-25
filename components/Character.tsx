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
  // Using translate to physically move the eyes
  const eyeOffset = facing === 'left' ? '-translate-x-1.5' : 'translate-x-1.5';
  
  return (
    <div className={`relative transition-all duration-150 ${className}`}>
      {/* Body */}
      <div 
        className={`w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center transition-transform duration-100 border-b-4 border-black/10 ${isDead ? 'rotate-45 opacity-60 grayscale' : ''}`}
        style={{ backgroundColor: color }}
      >
        {/* Face Container */}
        <div className="flex gap-2 relative">
          {/* Left Eye */}
          <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-inner">
            <div className={`w-2.5 h-2.5 bg-black rounded-full transition-transform duration-75 ${isDead ? '' : eyeOffset}`}></div>
          </div>
          {/* Right Eye */}
          <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-inner">
            <div className={`w-2.5 h-2.5 bg-black rounded-full transition-transform duration-75 ${isDead ? '' : eyeOffset}`}></div>
          </div>
          
          {/* Sweat Drop for intensity */}
          <div className="absolute -top-3 -right-3 text-blue-300 opacity-0 animate-pulse">
             <i className="fa-solid fa-droplet"></i>
          </div>
        </div>

        {/* Mouth (optional, changes on death) */}
        <div className={`absolute bottom-3 w-4 h-1.5 bg-black/20 rounded-full transition-all ${isDead ? 'w-6 rotate-12 bg-black/40' : ''}`}></div>
      </div>
      
      {/* Shadow */}
      <div className="absolute -bottom-3 left-1 w-14 h-3 bg-black/20 rounded-[100%] blur-sm"></div>
    </div>
  );
};