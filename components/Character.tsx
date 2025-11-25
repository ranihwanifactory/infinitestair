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
  const eyeOffset = facing === 'left' ? '-translate-x-1.5' : 'translate-x-1.5';
  
  // Darker shade for limbs
  const getLimbColor = (c: string) => {
    // Simple way to darken without a library: just use black with opacity or solid dark color
    // For simplicity, we'll use a standard dark gray for limbs to look like "stickman" style limbs or suit
    return '#334155'; // slate-700
  };

  const limbColor = getLimbColor(color);

  return (
    <div className={`relative w-16 h-20 transition-all duration-150 ${className}`}>
      
      {/* Back Arm (Left Arm) */}
      <div 
        className={`absolute top-10 left-0 w-3 h-8 rounded-full origin-top transition-all duration-150 ${facing === 'right' ? '-rotate-12 translate-x-2' : 'rotate-12 translate-x-1'} ${isDead ? 'rotate-45' : ''}`}
        style={{ backgroundColor: limbColor, zIndex: 0 }}
      ></div>

      {/* Back Leg (Left Leg) */}
      <div 
         className={`absolute bottom-0 left-3 w-3.5 h-8 rounded-full origin-top transition-all duration-150 ${facing === 'right' ? 'rotate-12' : '-rotate-12'} ${isDead ? '-rotate-90' : ''}`}
         style={{ backgroundColor: limbColor, zIndex: 0 }}
      ></div>


      {/* Main Body */}
      <div 
        className={`absolute top-0 left-0 w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center transition-transform duration-100 border-b-4 border-black/10 z-10 ${isDead ? 'rotate-45 opacity-60 grayscale' : ''}`}
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

        {/* Mouth */}
        <div className={`absolute bottom-3 w-4 h-1.5 bg-black/20 rounded-full transition-all ${isDead ? 'w-6 rotate-12 bg-black/40' : ''}`}></div>
      </div>
      
      {/* Front Leg (Right Leg) */}
      <div 
         className={`absolute bottom-0 right-3 w-3.5 h-8 rounded-full origin-top transition-all duration-150 ${facing === 'right' ? '-rotate-12' : 'rotate-12'} ${isDead ? 'rotate-12 translate-y-2' : ''}`}
         style={{ backgroundColor: limbColor, zIndex: 20 }}
      ></div>

      {/* Front Arm (Right Arm) */}
      <div 
        className={`absolute top-10 right-0 w-3 h-8 rounded-full origin-top transition-all duration-150 ${facing === 'right' ? 'rotate-12 -translate-x-2' : '-rotate-12 -translate-x-1'} ${isDead ? '-rotate-45' : ''}`}
        style={{ backgroundColor: limbColor, zIndex: 20 }}
      ></div>
      
    </div>
  );
};