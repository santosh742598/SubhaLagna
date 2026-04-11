/**
 * @fileoverview SubhaLagna v2.0.8 — Privacy Shield Component
 * @description   Frosted glass overlay for blurred photos.
 *                Includes a lock icon and "Private Profile" message.
 */

import React from 'react';

const PrivacyShield = ({ compact = false }) => {
  return (
    <div className="absolute inset-0 z-20 backdrop-blur-3xl bg-white/10 flex flex-col items-center justify-center p-4 text-center">
      <div className={`${compact ? 'p-1.5' : 'p-3'} bg-rose-500/20 rounded-full border border-white/30 mb-2 animate-glow`}>
        <svg 
           className={`${compact ? 'w-4 h-4' : 'w-8 h-8'} text-rose-500`}
           fill="none" 
           stroke="currentColor" 
           viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2.5} 
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
          />
        </svg>
      </div>
      
      {!compact && (
        <div className="space-y-1 animate-fade-in">
           <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Private Profile</p>
           <p className="text-[10px] font-bold text-slate-500 leading-tight">
             Send Interest to request photo access
           </p>
        </div>
      )}
      
      {compact && (
        <span className="text-[9px] font-black text-rose-600 uppercase tracking-tighter">Private</span>
      )}
    </div>
  );
};

export default PrivacyShield;
