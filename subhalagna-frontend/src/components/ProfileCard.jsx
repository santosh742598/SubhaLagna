/**
 * @file        SubhaLagna v3.0.4 — Profile Card
 * @description   Brief overview card for the search results grid.
 *                v2.0.0 changes:
 *                  - Integration with InterestButton for quick interactions
 *                  - Improved compatibility scoring UI
 *                  - Premium visual refinements
 *                v2.1.0 changes:
 *                  - Guna Milan (Traditional Match) badge overlay
 *                  - Pulse animation on high-compatibility cards
 * @author        SubhaLagna Team
 * @version      3.0.4
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import InterestButton from './InterestButton';

import PrivacyShield from './PrivacyShield';
import { getProfileAvatar } from '../utils/avatarHelper';

const ProfileCard = ({ profile, index }) => {
  const navigate = useNavigate();

  // Handle profile click (except for interest button clicks)
  const handleNavigate = (e) => {
    // If the click is on a button or part of the interest component, don't navigate
    if (e.target.closest('button')) return;
    navigate(`/profile/${profile._id || profile.id}`);
  };

  const isBlurred = profile.isPhotoBlurred;
  const profileImage = getProfileAvatar(profile);
  const age = profile.age || '—';
  const location = profile.location || '—';
  const profession = profile.profession || '—';
  const matchScore = profile.matchScore || Math.floor(Math.random() * 20) + 70; // Mock score if missing

  return (
    <div
      onClick={handleNavigate}
      className={`group relative bg-white rounded-[2rem] border border-pink-100/60 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-pink-100/40 transition-all duration-500 cursor-pointer flex flex-col h-full animate-fade-in ${isBlurred ? 'grayscale-[0.3]' : ''}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* ── Image Section ── */}
      <div className="relative h-72 overflow-hidden">
        <img
          src={profileImage}
          alt={profile.name}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isBlurred ? 'blur-2xl bg-slate-200' : ''}`}
        />

        {isBlurred && <PrivacyShield compact={true} />}

        {/* Membership Badge */}
        {profile.user?.isPremium && (
          <div className="absolute top-4 left-4 z-20">
            <div
              className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1.5 shadow-lg backdrop-blur-md border ${
                profile.user.premiumPlan === 'platinum'
                  ? 'bg-cyan-500/80 text-white border-cyan-400/50'
                  : 'bg-amber-500/80 text-white border-amber-400/50'
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  profile.user.premiumPlan === 'platinum' ? 'bg-cyan-200' : 'bg-amber-200'
                }`}
              />
              {profile.user.premiumPlan.toUpperCase()}
            </div>
          </div>
        )}

        {/* Compatibility Overlay */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 transition-transform duration-500 group-hover:translate-z-0 group-hover:scale-110 group-hover:translate-y-[-4px]">
          {/* Behavioral Match Score */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl px-3 py-1.5 flex flex-col items-center border border-white/20 shadow-lg">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              Match
            </span>
            <span
              className={`text-lg font-black leading-none ${matchScore > 85 ? 'text-emerald-500' : 'text-pink-500'}`}
            >
              {matchScore}%
            </span>
          </div>

          {/* Guna Milan Score (Traditional) */}
          {profile.gunaMilan && (
            <div className="bg-rose-500/90 backdrop-blur-md rounded-2xl px-3 py-1.5 flex flex-col items-center border border-white/20 shadow-lg animate-glow">
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-tighter">
                Gunas
              </span>
              <span className="text-lg font-black leading-none text-white">
                {profile.gunaMilan.total}
              </span>
            </div>
          )}
        </div>

        {/* Name & Basic Info Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-serif font-bold text-white drop-shadow-md">
              {profile.name}, <span className="text-pink-300">{age}</span>
            </h3>
            {profile.isVerified && (
              <div
                className="bg-blue-500 text-white p-0.5 rounded-full shadow-lg"
                title="Verified Profile"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-white/80 text-xs mt-1">
            <svg className="w-3 h-3 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            {location}
          </div>
        </div>
      </div>

      {/* ── Details Section ── */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="text-xs font-bold text-slate-600 truncate">{profession}</span>
          </div>

          {/* Traits / Badges */}
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-pink-50 text-pink-600 text-[10px] font-bold border border-pink-100/50">
              {profile.religion || 'Non-religious'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 text-[10px] font-bold border border-slate-100">
              {profile.education?.split(' ')[0] || 'Graduated'}
            </span>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <InterestButton receiverUserId={profile.user} compact={true} />

          <button
            onClick={() => navigate(`/profile/${profile._id || profile.id}`)}
            className="flex-1 py-2.5 text-xs font-bold text-slate-400 hover:text-pink-500 hover:bg-pink-50 rounded-xl transition-all"
          >
            View Details
          </button>
        </div>
      </div>

      {/* Premium Decorative Line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-pink-400/20 to-transparent absolute bottom-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

export default ProfileCard;
