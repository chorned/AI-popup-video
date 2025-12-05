import React, { useMemo } from 'react';
import { FactItem } from '../types';

interface FactBubbleProps {
  fact: FactItem | null;
  isVisible: boolean;
}

// 8 Positions along the edges (4 corners + 4 mid-edges)
const POSITIONS = [
  { id: 'TL', class: 'top-8 left-8 origin-top-left', tail: 'border-b-4 border-r-4 top-[-10px] left-8 rotate-[225deg]' },
  { id: 'TC', class: 'top-8 left-1/2 -translate-x-1/2 origin-top', tail: 'border-b-4 border-r-4 bottom-[-10px] left-1/2 rotate-45' }, // pointing down
  { id: 'TR', class: 'top-8 right-8 origin-top-right', tail: 'border-b-4 border-r-4 top-[-10px] right-8 rotate-[225deg]' }, // pointing up-ish (flipped)
  
  { id: 'RC', class: 'top-1/2 right-8 -translate-y-1/2 origin-right', tail: 'border-b-4 border-r-4 top-1/2 left-[-10px] rotate-[135deg]' }, // pointing left
  
  { id: 'BR', class: 'bottom-8 right-8 origin-bottom-right', tail: 'border-b-4 border-r-4 bottom-[-10px] right-8 rotate-45' },
  { id: 'BC', class: 'bottom-8 left-1/2 -translate-x-1/2 origin-bottom', tail: 'border-b-4 border-r-4 top-[-10px] left-1/2 rotate-[225deg]' }, // pointing up
  { id: 'BL', class: 'bottom-8 left-8 origin-bottom-left', tail: 'border-b-4 border-r-4 bottom-[-10px] left-8 rotate-45' },
  
  { id: 'LC', class: 'top-1/2 left-8 -translate-y-1/2 origin-left', tail: 'border-b-4 border-r-4 top-1/2 right-[-10px] rotate-[-45deg]' }, // pointing right
];

const FactBubble: React.FC<FactBubbleProps> = ({ fact, isVisible }) => {
  // If no text, don't render anything to avoid empty bubbles popping
  if (!fact || !fact.text) return null;

  // Memoize random position based on the fact text content
  // This ensures the position stays constant for the duration of this specific fact's display
  // but changes for the next fact.
  const position = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * POSITIONS.length);
    return POSITIONS[randomIndex];
  }, [fact.text]); // Only change position when text changes

  return (
    <div
      className={`
        absolute z-20 
        max-w-[16rem] md:max-w-xs lg:max-w-sm
        p-5 rounded-2xl
        bg-white text-blue-900 shadow-2xl border-4 border-blue-400
        transform transition-all
        ${position.class}
        ${isVisible ? 'animate-popIn' : 'animate-fadeOut pointer-events-none opacity-0'}
      `}
    >
      <div className="absolute -top-3 -left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider border-2 border-white z-10">
        Pop-Up Info
      </div>
      
      <p className="font-whimsical text-lg leading-snug mb-2">
        {fact.text}
      </p>

      {/* Source Link */}
      {fact.sourceUrl && (
        <div className="text-right mt-2 border-t border-blue-100 pt-1">
           <a 
             href={fact.sourceUrl} 
             target="_blank" 
             rel="noopener noreferrer"
             className="text-xs text-blue-500 hover:text-blue-700 hover:underline flex items-center justify-end gap-1 font-sans font-bold"
           >
             <span>Source</span>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
             </svg>
           </a>
        </div>
      )}
      
      {/* Decorative arrow/tail - Dynamic based on position */}
      {/* Note: Simplified generic tail for "Center" positions might be needed, but trying to be smart here */}
      {/* For specific corner/edge cases, we might hide tail if it looks bad, but let's try rendering it */}
      <div 
        className={`absolute w-4 h-4 bg-white border-blue-400 ${position.tail}`}
        style={{ 
             // Ensure the tail border matches the main border logic (since it's a rotated square)
             // The POSITIONS array defines the rotation and border sides.
        }}
      ></div>
    </div>
  );
};

export default FactBubble;