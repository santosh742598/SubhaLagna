/**
 * @file        SubhaLagna v3.3.7 — Maintenance Page
 * @description Premium "Coming Back Soon" screen for maintenance windows.
 * @author       SubhaLagna Team
 * @version      3.3.7
 */

import React from 'react';
import { Link } from 'react-router-dom';

const Maintenance = () => {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-600/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" />

      <div className="max-w-2xl w-full text-center relative z-10">
        {/* Glass Card */}
        <div className="glass-panel p-12 md:p-20 rounded-[3rem] border border-white/10 shadow-2xl backdrop-blur-3xl animate-fade-in">
          <div className="mb-8 relative inline-block">
            <div className="w-24 h-24 bg-rose-600/20 rounded-3xl flex items-center justify-center mx-auto animate-bounce duration-[3000ms]">
              <svg className="w-12 h-12 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full border-4 border-[#0f172a] animate-ping" />
          </div>

          <h1 className="text-4xl md:text-5xl font-serif font-black text-white mb-6 tracking-tight">
            Perfecting Your <span className="text-rose-500">Matches</span>
          </h1>
          
          <p className="text-gray-400 text-lg md:text-xl leading-relaxed mb-10 max-w-lg mx-auto font-light">
            We're currently performing a scheduled update to enhance your experience.
            The platform will be back online shortly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-white/5"
            >
              Check Again
            </button>
            <Link 
              to="/login"
              className="px-8 py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all border border-white/5"
            >
              Admin Access
            </Link>
          </div>

          <div className="mt-12 pt-12 border-t border-white/5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
              SubhaLagna v3.3.7 — Stability Update
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
