import React from 'react';
import { Direction } from '../types';

interface CharacterProps {
  color: string;
  facing: Direction;
  isDead?: boolean;
  className?: string;
}

export const Character: React.FC<CharacterProps> = ({ color, facing, isDead, className = '' }) => {
  const isRight = facing === 'right';

  // Skin tone
  const skinColor = '#FFDCB1';
  // Pants color
  const pantsColor = '#1e293b'; // slate-800
  // Shoes
  const shoeColor = '#dc2626'; // red-600

  return (
    <div className={`relative w-20 h-28 transition-transform duration-75 ${className}`}>
      
      {/* --- BACK LIMBS (Rendered first to be behind body) --- */}
      
      {/* Left Arm (Back) */}
      <div 
        className={`absolute top-[38px] w-3 h-10 rounded-full origin-top transition-all duration-100 ease-linear
          ${isRight 
            ? 'left-8 rotate-[30deg] translate-x-2' // Right facing: Back arm swings back
            : 'left-8 -rotate-[30deg] -translate-x-2' // Left facing: Back arm swings forward (visual flip)
          } 
          ${isDead ? 'rotate-45' : ''}`}
        style={{ backgroundColor: skinColor, zIndex: 0 }}
      >
        <div className="absolute bottom-0 w-3.5 h-3.5 rounded-full bg-pink-200 opacity-50"></div> {/* Hand */}
      </div>

      {/* Left Leg (Back) */}
      <div 
         className={`absolute top-[60px] w-4 h-10 rounded-full origin-top transition-all duration-100 ease-linear
          ${isRight 
            ? 'left-7 -rotate-[15deg]' // Right facing: Back leg kicks back slightly
            : 'left-8 rotate-[15deg]' 
          } 
          ${isDead ? '-rotate-90' : ''}`}
         style={{ backgroundColor: pantsColor, zIndex: 0 }}
      >
        <div className={`absolute bottom-[-4px] w-5 h-3 rounded-md ${isRight ? 'left-0 rounded-tl-none' : 'right-0 rounded-tr-none'}`} style={{ backgroundColor: shoeColor }}></div>
      </div>


      {/* --- BODY --- */}

      {/* Torso / Jersey */}
      <div 
        className={`absolute top-[28px] left-1/2 -translate-x-1/2 w-10 h-14 rounded-xl shadow-sm z-10 flex flex-col items-center
          ${isDead ? 'rotate-45 translate-y-4' : ''}`}
        style={{ backgroundColor: color }}
      >
        {/* Neck line/Collar */}
        <div className="w-4 h-2 bg-black/10 rounded-b-full mt-0"></div>
        {/* Stripe */}
        <div className="w-full h-2 bg-white/20 mt-4"></div>
      </div>

      {/* Head */}
      <div 
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 bg-[#FFDCB1] rounded-full shadow-md z-20 transition-transform duration-100
          ${isDead ? 'rotate-12 translate-x-2' : ''}`}
      >
         {/* Hair/Hat (Simple hair) */}
         <div className="absolute top-[-2px] left-1/2 -translate-x-1/2 w-11 h-4 bg-slate-800 rounded-t-full"></div>

         {/* Face */}
         <div className={`flex gap-1.5 absolute top-4 ${isRight ? 'right-1' : 'left-1'} transition-all`}>
            {/* Eyes */}
            <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
         </div>
         {/* Mouth */}
         <div className={`absolute bottom-2 ${isRight ? 'right-2' : 'left-2'} w-2 h-0.5 bg-black/50 rounded-full ${isDead ? 'h-2 w-2 rounded-full border border-black bg-transparent' : ''}`}></div>

         {/* Sweat drop if dead */}
         {isDead && <i className="fa-solid fa-xmark absolute top-3 left-3 text-red-500 text-lg"></i>}
      </div>


      {/* --- FRONT LIMBS (Rendered last to be in front) --- */}

      {/* Right Leg (Front) */}
      <div 
         className={`absolute top-[60px] w-4 h-10 rounded-full origin-top transition-all duration-100 ease-linear
          ${isRight 
             ? 'left-8 rotate-[40deg] -translate-y-1' // Right facing: Front leg high step
             : 'left-7 -rotate-[40deg] -translate-y-1' 
          }
          ${isDead ? 'rotate-12 translate-y-2' : ''}`}
         style={{ backgroundColor: pantsColor, zIndex: 15 }}
      >
         {/* Shoe */}
         <div className={`absolute bottom-[-4px] w-5 h-3 rounded-md ${isRight ? 'left-0 rounded-tl-none' : 'right-0 rounded-tr-none'}`} style={{ backgroundColor: shoeColor }}></div>
      </div>

      {/* Right Arm (Front) */}
      <div 
        className={`absolute top-[38px] w-3 h-10 rounded-full origin-top transition-all duration-100 ease-linear
          ${isRight 
             ? 'left-9 -rotate-[40deg] translate-x-1' // Right facing: Front arm swings forward
             : 'left-7 rotate-[40deg] -translate-x-1' 
          } 
          ${isDead ? '-rotate-45' : ''}`}
        style={{ backgroundColor: skinColor, zIndex: 16 }}
      >
        <div className="absolute bottom-0 w-3.5 h-3.5 rounded-full bg-pink-200 opacity-50"></div>
      </div>
      
    </div>
  );
};