/**
 * @fileoverview SubhaLagna v2.3.0 — Profile Detail Page
 * @description   Deep dive into a specific profile. Shows full bio, family,
 *                horoscope, and interaction options.
 *                v2.0.0 changes:
 *                  - Unified Header and Footer
 *                  - Integrated InterestButton
 *                  - Automated profile view tracking
 *                  - Premium responsive layout with glassmorphism
 *                  - Contact Information Gating (Unlock Logic)
 *                v2.1.0 changes:
 *                  - Guna Milan compatibility gauge (36-point score)
 *                  - Factor-by-factor Ashta Koota breakdown
 *                  - Dynamic visibility of compatibility section
 */

import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getProfileById, unlockContact } from '../services/profileService';
import InterestButton from './InterestButton';
import Header from './Header';
import PrivacyShield from './PrivacyShield';

// ─── Stat Box Component ───────────────────────────────────────────────────────
const StatBox = ({ label, value, icon }) => (
  <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-rose-100 flex flex-col gap-1 transition-all hover:shadow-md hover:bg-white">
    <div className="flex items-center gap-2 text-rose-400">
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
    </div>
    <span className="text-sm font-bold text-gray-800">{value || 'N/A'}</span>
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionTitle = ({ title, icon }) => (
  <h2 className="text-xl font-serif font-bold text-gray-800 flex items-center gap-3 mb-6 border-b border-rose-100 pb-3">
    <span className="p-2 bg-rose-50 rounded-xl text-rose-500">{icon}</span>
    {title}
  </h2>
);

const ProfileDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useContext(AuthContext);

  const [profile, setProfile] = useState(null);
  const [activePhoto, setActivePhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfileById(id);
      setProfile(data);
      setActivePhoto(data.profilePhoto || data.image || '/placeholder-profile.png');
    } catch (err) {
      setError(err || 'Could not load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!currentUser?.isPremium) {
      navigate('/premium');
      return;
    }
    
    setUnlocking(true);
    try {
      await unlockContact(profile._id);
      await refreshUser(); // Update global quota
      await loadProfile(); // Reload to get revealed data
    } catch (err) {
      alert(err || "Failed to unlock contact. You may have reached your limit.");
    } finally {
      setUnlocking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-rose-50/30">
        <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
        <p className="mt-4 text-rose-500 font-medium">Loading premium profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-rose-50/30 p-6">
        <div className="text-6xl mb-4">💔</div>
        <h2 className="text-2xl font-serif font-bold text-gray-800 mb-2">Profile Unavailable</h2>
        <p className="text-gray-500 mb-8 text-center max-w-md">{error || 'This profile might have been deactivated or set to private.'}</p>
        <button onClick={() => navigate(-1)} className="px-8 py-3 bg-rose-600 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all">
          Back to Matches
        </button>
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === profile.user?._id || currentUser?._id === profile.user;
  const isBlurred = profile.isPhotoBlurred;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <Header />

      {/* ── Main Content Area ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ══ Left Sidebar (Photo Gallery & Quick Actions) ══ */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[2.5rem] overflow-hidden border border-rose-100 shadow-sm sticky top-28">
              {/* Active Photo Container */}
              <div className="relative aspect-[3/4] group cursor-zoom-in overflow-hidden">
                <img 
                  src={activePhoto} 
                  alt={profile.name} 
                  className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${isBlurred ? 'blur-3xl px-8 grayscale-[0.2]' : ''}`}
                />
                
                {isBlurred && <PrivacyShield />}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                
                {/* Visual Badges */}
                <div className="absolute bottom-6 left-6 text-white z-10 w-full pr-12">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h1 className="text-3xl font-serif font-bold">{profile.name}, {profile.age}</h1>
                    {profile.user?.isPremium && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-[0.2em] flex items-center gap-1.5 shadow-xl backdrop-blur-md border ${
                        profile.user.premiumPlan === 'platinum' 
                          ? 'bg-cyan-500/60 text-white border-cyan-400/30' 
                          : 'bg-amber-500/60 text-white border-amber-400/30'
                      }`}>
                        <div className={`w-1 h-1 rounded-full animate-pulse ${
                          profile.user.premiumPlan === 'platinum' ? 'bg-cyan-200' : 'bg-amber-200'
                        }`} />
                        {profile.user.premiumPlan.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-rose-200 text-sm font-medium flex items-center gap-2 mt-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {profile.location}
                  </p>
                </div>
              </div>

              {/* Thumbnails */}
              {profile.additionalPhotos?.length > 0 && (
                <div className="p-4 flex gap-3 overflow-x-auto no-scrollbar border-t border-rose-50">
                   {[profile.profilePhoto || profile.image, ...profile.additionalPhotos].map((img, i) => (
                     <button 
                       key={i} 
                       onClick={() => !isBlurred && setActivePhoto(img)}
                       className={`w-16 h-16 rounded-2xl flex-shrink-0 overflow-hidden border-2 transition-all ${activePhoto === img ? 'border-rose-500 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'} ${isBlurred ? 'blur-md grayscale cursor-not-allowed' : ''}`}
                     >
                       <img src={img} className="w-full h-full object-cover" alt="" />
                     </button>
                   ))}
                </div>
              )}

              {/* Action Buttons */}
              {!isOwnProfile && (
                <div className="p-6 bg-rose-50/50 flex flex-col gap-3">
                  <InterestButton receiverUserId={profile.user?._id || profile.user} />
                  <button className="w-full py-3 bg-white border border-rose-200 text-rose-600 font-bold rounded-2xl hover:bg-rose-50 transition-all flex items-center justify-center gap-2">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                     </svg>
                     Shortlist Profile
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ══ Right Content (Details) ══ */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Contact Information (GATED) */}
            <div className={`bg-white rounded-[2.5rem] p-8 md:p-10 border shadow-sm transition-all ${profile.isContactUnlocked ? 'border-emerald-100 bg-emerald-50/10' : 'border-rose-100'}`}>
               <div className="flex justify-between items-center mb-6">
                 <SectionTitle title="Contact Information" icon={
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                 } />
                 {profile.isContactUnlocked && (
                   <span className="px-4 py-1.5 bg-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-full">✓ Unlocked</span>
                 )}
               </div>

               {profile.isContactUnlocked ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    <div>
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</span>
                       <p className="text-xl font-bold text-gray-800 mt-1">{profile.user?.phone || 'Not provided'}</p>
                    </div>
                    <div>
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</span>
                       <p className="text-lg font-bold text-gray-800 mt-1">{profile.user?.email}</p>
                    </div>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-6 text-center border-2 border-dashed border-rose-100 rounded-[2rem] bg-rose-50/20">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-rose-500 shadow-sm mb-4">
                       <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h4 className="text-gray-800 font-bold mb-1">Contact Details are Locked</h4>
                    <p className="text-gray-400 text-xs mb-6 max-w-xs">Upgrade to a premium plan to view verified contact information and connect directly.</p>
                    
                    <button 
                      onClick={handleUnlock}
                      disabled={unlocking}
                      className="px-10 py-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-rose-200 hover:scale-[1.02] transition-all disabled:opacity-50"
                    >
                      {unlocking ? 'Unlocking...' : (currentUser?.isPremium ? 'Reveal Contact Info' : 'Upgrade to View Details')}
                    </button>
                    {currentUser?.premiumPlan === 'gold' && (
                      <p className="mt-3 text-[10px] text-rose-400 font-bold uppercase tracking-widest">
                        {currentUser.contactsAllowed || 0} Gold views remaining
                      </p>
                    )}
                 </div>
               )}
            </div>

            {/* About & Basic Stats */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-rose-100 shadow-sm">
              <SectionTitle title="About" icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              } />
              
              <p className="text-gray-600 italic text-lg leading-relaxed mb-8">
                "{profile.bio}"
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox label="Religion" value={profile.religion} icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" /></svg>} />
                <StatBox label="Caste" value={profile.caste} icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>} />
                <StatBox label="Height" value={profile.height} icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1H5a2 2 0 00-2 2v10a2 2 0 002 2h4v1a1 1 0 102 0v-1h4a2 2 0 002-2V7a2 2 0 00-2-2h-4V3z" /></svg>} />
                <StatBox label="Mother Tongue" value={profile.motherTongue} icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" /><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" /></svg>} />
              </div>
            </div>

            {/* Career & Family */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Career */}
              <div className="bg-white rounded-[2rem] p-8 border border-rose-100 shadow-sm">
                <SectionTitle title="Career" icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                } />
                <div className="space-y-4">
                   <div>
                     <span className="text-xs font-bold text-gray-400 uppercase">Profession</span>
                     <p className="font-bold text-gray-700">{profile.profession}</p>
                   </div>
                   <div>
                     <span className="text-xs font-bold text-gray-400 uppercase">Education</span>
                     <p className="font-medium text-gray-600">{profile.education}</p>
                   </div>
                </div>
              </div>

              {/* Family */}
              <div className="bg-white rounded-[2rem] p-8 border border-rose-100 shadow-sm">
                <SectionTitle title="Family Details" icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                } />
                <div className="grid grid-cols-2 gap-y-4">
                   <div>
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Father</span>
                     <p className="font-bold text-gray-700">{profile.family?.fatherName || 'Not specified'}</p>
                   </div>
                   <div>
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Mother</span>
                     <p className="font-bold text-gray-700">{profile.family?.motherName || 'Not specified'}</p>
                   </div>
                   <div>
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Siblings</span>
                     <p className="font-bold text-gray-700">{profile.family?.siblings || '0'}</p>
                   </div>
                   <div>
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Family Type</span>
                     <p className="font-bold text-gray-700">{profile.family?.familyType || 'Nuclear'}</p>
                   </div>
                </div>
              </div>
            </div>

            {/* Horoscope & Astrology */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-rose-100 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                 <SectionTitle title="Horoscope & Astrology" icon={
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                 } />
                 {profile.horoscope?.manglik !== undefined && (
                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${profile.horoscope.manglik ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                     {profile.horoscope.manglik ? 'Manglik' : 'Non-Manglik'}
                   </span>
                 )}
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Moon Sign (Rashi)</span>
                    <p className="text-lg font-bold text-gray-800">{profile.horoscope?.rashi || 'Not set'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Birth Star (Nakshatra)</span>
                    <p className="text-lg font-bold text-gray-800">{profile.horoscope?.nakshatra || 'Not set'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Pada</span>
                    <p className="text-lg font-bold text-gray-800">{profile.horoscope?.pada || 'Not set'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Gotra</span>
                    <p className="text-lg font-bold text-gray-800">{profile.horoscope?.gotra || 'Not set'}</p>
                  </div>
               </div>
            </div>

            {/* Interests & Horoscope */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-rose-100 shadow-sm">
              <SectionTitle title="Interests & Personality" icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              } />
              
              <div className="mb-8">
                <span className="text-xs font-bold text-gray-400 uppercase mb-3 block">Hobbies & Interests</span>
                <div className="flex flex-wrap gap-2">
                  {profile.interests?.map(item => (
                    <span key={item} className="px-4 py-2 bg-pink-50 text-pink-600 rounded-xl text-sm font-semibold border border-pink-100">{item}</span>
                  ))}
                </div>
              </div>

              {profile.partnerInterests && (
                <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100">
                  <h4 className="text-rose-600 font-bold mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                    Partner Expectations
                  </h4>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {profile.partnerInterests}
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 pt-10 border-t border-rose-100 text-center text-gray-400 text-sm">
        <p>© 2026 SubhaLagna Matrimony. Premium verified profiles only.</p>
      </footer>
    </div>
  );
};

export default ProfileDetail;
