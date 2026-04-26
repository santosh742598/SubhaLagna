/**
 * @file        SubhaLagna v3.3.5 — User Dashboard
 * @description   Central hub for users to manage their profile, view premium status,
 *                and handle incoming interest requests.
 *                - v3.3.0 changes:
 *                  - Implemented gamified Profile Completeness Bar with dynamic messaging.
 *                  - Integrated circular progress gauge for visual strength tracking.
 *                  - Resolved React hook missing dependency warnings for Rashi calculation and Profile Strength.
 *                  - Modernized Tailwind aspect ratio classes to v4 standards.
 *                  - Standardized arbitrary border-radius classes to modern shorthands.
 *                - [v3.0.0 changes]
 *                - Upgraded to Version 3.0.0.
 *                - Standardized Premium CTA logic and quota displays.
 *                - Implemented strict JSDoc validation and standard headers.
 *                - Global UI consistency via unified Prettier tokens.
 * @author        SubhaLagna Team
 * @version      3.3.5
 */

import React, { useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { updateProfile as updateProfileService } from '../services/profileService';
import { getMyInterests, respondToInterest } from '../services/interestService';
import { RASHIS, NAKSHATRAS, PADA_RASHI_MAP } from '../data/astrologyData.js';
import CaptureModal from './CaptureModal';
import SearchableDropdown from './SearchableDropdown';
import { fetchLookupOptions } from '../services/lookupService';
import { RAZORPAY_KEY_ID } from '../config';
import { getProfileAvatar } from '../utils/avatarHelper';

const PREDEFINED_INTERESTS = [
  'Travel',
  'Music',
  'Cooking',
  'Photography',
  'Fitness',
  'Reading',
  'Movies',
  'Sports',
  'Art',
];
const PREDEFINED_TRAITS = [
  'Introvert',
  'Extrovert',
  'Ambivert',
  'Ambitious',
  'Creative',
  'Organized',
  'Spontaneous',
  'Rational',
  'Empathetic',
];


import { DashboardCard, FormLabel, formatDate, toInputDate } from './dashboard/DashboardWidgets';
import { Sparkles, Check, Trash, Plus, Heart, X, ShieldCheck, Camera, Users, ChevronRight, Bookmark } from './dashboard/DashboardIcons';

const ProfileDashboard = () => {
  const { user, updateProfileContext } = useContext(AuthContext);

  // Tab State
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'interests'

  // Profile Form State
  const [formData, setFormData] = useState({});
  const [file, setFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [removePhotos, setRemovePhotos] = useState([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Interests State
  const [interests, setInterests] = useState([]);
  const [loadingInterests, setLoadingInterests] = useState(false);

  // Master Data Options
  const [casteOptions, setCasteOptions] = useState([]);
  const [religionOptions, setReligionOptions] = useState([]);
  const [languageOptions, setLanguageOptions] = useState([]);

  useEffect(() => {
    fetchLookupOptions('caste').then(setCasteOptions);
    fetchLookupOptions('religion').then(setReligionOptions);
    fetchLookupOptions('motherTongue').then(setLanguageOptions);
  }, []);

  // Multi-tag lists
  const [traits, setTraits] = useState([]);
  const [interestsList, setInterestsList] = useState([]);

  useEffect(() => {
    if (user?.profile) {
      setFormData({
        name: user.profile.name || '',
        gender: user.profile.gender || 'Male',
        location: user.profile.location || '',
        dateOfBirth: user.profile.horoscope?.dateOfBirth || '',
        caste: user.profile.caste || '',
        religion: user.profile.religion || '',
        education: user.profile.education || '',
        profession: user.profile.profession || '',
        bio: user.profile.bio || '',
        height: user.profile.height || '',
        motherTongue: user.profile.motherTongue || '',
        phone: user.phone || '',
        isWhatsappAvailable: user.isWhatsappAvailable || false,
        // Horoscope
        rashi: user.profile.horoscope?.rashi || '',
        nakshatra: user.profile.horoscope?.nakshatra || '',
        pada: user.profile.horoscope?.pada || '',
        gotra: user.profile.horoscope?.gotra || '',
        manglik: user.profile.horoscope?.manglik || 'Unknown',
        // Privacy
        showPhotoTo: user.profile.privacySettings?.showPhotoTo || 'everyone',
        showContactTo: user.profile.privacySettings?.showContactTo || 'premium_only',
        isProfileHidden: user.profile.privacySettings?.isProfileHidden || false,
        // Partner Preferences
        prefMinAge: user.profile.partnerPreferences?.minAge || 18,
        prefMaxAge: user.profile.partnerPreferences?.maxAge || 40,
        prefLocation: user.profile.partnerPreferences?.location || 'Any',
        prefCaste: user.profile.partnerPreferences?.caste || 'Any',
        prefReligion: user.profile.partnerPreferences?.religion || 'Any',
        // Family
        fatherName: user.profile.family?.fatherName || '',
        motherName: user.profile.family?.motherName || '',
        siblings: user.profile.family?.siblings || '0',
        familyType: user.profile.family?.familyType || 'Nuclear',
      });
      setTraits(user.profile.traits || []);
      setInterestsList(user.profile.interests || []);
    }
  }, [user]);

  // ── Auto-select Rashi based on Nakshatra + Pada ───────────────────────────
  useEffect(() => {
    if (formData.nakshatra && formData.pada) {
      const correctRashi = PADA_RASHI_MAP[formData.nakshatra]?.[formData.pada];
      if (correctRashi && formData.rashi !== correctRashi) {
        setFormData((prev) => ({ ...prev, rashi: correctRashi }));
      }
    }
  }, [formData.nakshatra, formData.pada, formData.rashi]);

  useEffect(() => {
    if (activeTab === 'interests') {
      const loadPendingInterests = async () => {
        setLoadingInterests(true);
        try {
          const data = await getMyInterests('received', 'pending');
          setInterests(data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingInterests(false);
        }
      };
      loadPendingInterests();
    }
  }, [activeTab]);

  const handleInterestAction = async (id, status) => {
    try {
      await respondToInterest(id, status);
      setInterests((prev) => prev.filter((i) => i._id !== id));
      if (status === 'accepted') {
        setStatusMsg('Interest accepted! You can now chat with them. ❤️');
      } else {
        setStatusMsg('Interest declined.');
      }
    } catch (err) {
      alert(err || 'Failed to respond');
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleCapture = (file) => {
    setFile(file);
    setStatusMsg('Photo captured! Click "Update Profile" to save. ✨');
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    setGalleryFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setGalleryPreviews((prev) => [...prev, ...newPreviews]);
  };

  const toggleTrait = (t) =>
    setTraits((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  const toggleInterest = (i) =>
    setInterestsList((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const handleRemoveExisting = (photoUrl) => setRemovePhotos((prev) => [...prev, photoUrl]);
  const handleRemoveNew = (index) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveSection = async (sectionFields, extraData = {}) => {
    setIsSubmitting(true);
    setStatusMsg('Syncing your updates...');

    // Determine if we need to send as multipart/form-data
    const needsFormData = extraData.hasFiles || false;
    let submitData;

    if (needsFormData) {
      submitData = new FormData();
      sectionFields.forEach((key) => {
        if (formData[key] !== undefined) submitData.append(key, formData[key]);
      });
      if (extraData.profilePhoto) submitData.append('profilePhoto', extraData.profilePhoto);
      if (extraData.additionalPhotos) {
        extraData.additionalPhotos.forEach((f) => submitData.append('additionalPhotos', f));
      }
      if (extraData.removePhotos)
        submitData.append('removePhotos', JSON.stringify(extraData.removePhotos));
      if (extraData.traits) submitData.append('traits', extraData.traits.join(', '));
      if (extraData.interests) submitData.append('interests', extraData.interests.join(', '));
    } else {
      // Regular JSON payload
      submitData = {};
      sectionFields.forEach((key) => {
        if (formData[key] !== undefined) submitData[key] = formData[key];
      });
      // Add nested structures if they belong to this section
      if (sectionFields.includes('family')) {
        submitData.fatherName = formData.fatherName;
        submitData.motherName = formData.motherName;
        submitData.siblings = formData.siblings;
        submitData.familyType = formData.familyType;
      }
      if (sectionFields.includes('horoscope')) {
        submitData.dateOfBirth = formData.dateOfBirth;
        submitData.rashi = formData.rashi;
        submitData.nakshatra = formData.nakshatra;
        submitData.pada = formData.pada;
        submitData.gotra = formData.gotra;
        submitData.manglik = formData.manglik;
      }
      if (sectionFields.includes('privacy')) {
        submitData.showPhotoTo = formData.showPhotoTo;
        submitData.showContactTo = formData.showContactTo;
        submitData.isProfileHidden = formData.isProfileHidden;
      }
      if (sectionFields.includes('preferences')) {
        submitData.prefMinAge = formData.prefMinAge;
        submitData.prefMaxAge = formData.prefMaxAge;
        submitData.prefLocation = formData.prefLocation;
        submitData.prefCaste = formData.prefCaste;
        submitData.prefReligion = formData.prefReligion;
      }
    }

    try {
      const updatedProfile = await updateProfileService(user.profile._id, submitData);
      setStatusMsg('Section updated successfully! ✨');
      updateProfileContext(updatedProfile);

      // Reset temporary states
      if (needsFormData) {
        setGalleryFiles([]);
        setGalleryPreviews([]);
        setRemovePhotos([]);
        setFile(null);
      }
    } catch (err) {
      setStatusMsg(err || 'Failed to update section');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setStatusMsg(''), 4000);
    }
  };

  const calculateProfileStrength = useCallback(() => {
    if (!user?.profile) return 0;
    const fields = [
      user.profile.name,
      user.profile.horoscope?.dateOfBirth,
      user.profile.religion,
      user.profile.location,
      user.profile.education,
      user.profile.profession,
      user.profile.bio,
      user.profile.profilePhoto,
    ];
    let score = fields.filter((f) => f && f !== '—' && f !== '').length;
    if (user.profile.traits?.length > 0) score++;
    if (user.profile.interests?.length > 0) score++;
    if (user.profile.additionalPhotos?.length > 0) score++;

    return Math.round((score / 11) * 100);
  }, [user]);

  const profileStrength = useMemo(() => calculateProfileStrength(), [calculateProfileStrength]);

  if (!user?.profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-rose-50/30">
        <div className="w-16 h-16 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin mb-6" />
        <p className="text-rose-500 font-bold font-serif text-xl animate-pulse">
          Designing your universe...
        </p>
      </div>
    );
  }

  const existingGallery = (user.profile.additionalPhotos || []).filter(
    (p) => !removePhotos.includes(p),
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in pb-32">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ══ Sidebar (Stats & Tabs) ══ */}
        <div className="lg:col-span-4 space-y-6">
          {/* Premium Status Card */}
          {(() => {
            const planStyles = {
              gold: {
                bg: 'from-slate-900 to-slate-800',
                badge: 'bg-amber-500',
                text: 'text-amber-400',
                border: 'border-amber-500/20',
                glow: 'shadow-amber-500/10',
              },
              platinum: {
                bg: 'from-slate-900 via-slate-800 to-slate-900',
                badge: 'bg-cyan-500',
                text: 'text-cyan-400',
                border: 'border-cyan-500/20',
                glow: 'shadow-cyan-500/10',
              },
              free: {
                bg: 'from-slate-900 to-slate-800',
                badge: 'bg-rose-500',
                text: 'text-rose-400',
                border: 'border-white/10',
                glow: 'shadow-none',
              },
            };
            const plan = user.isPremium ? user.premiumPlan : 'free';
            const s = planStyles[plan] || planStyles.free;

            return (
              <div
                className={`bg-linear-to-br ${s.bg} rounded-[2.5rem] p-8 text-white shadow-xl ${s.glow} relative overflow-hidden group border ${s.border}`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2 ${s.badge} rounded-xl shadow-lg`}>
                      <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg leading-tight ${s.text}`}>
                        {user.isPremium ? `${user.premiumPlan.toUpperCase()} MEMBER` : 'FREE PLAN'}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Account Security: High
                      </p>
                    </div>
                  </div>

                  {user.isPremium ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] block mb-1">
                          Expires On
                        </span>
                        <p className={`text-sm font-bold ${s.text}`}>
                          {new Date(user.premiumExpires).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      {user.premiumPlan === 'gold' && (
                        <>
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] block mb-1">
                              Contacts Left
                            </span>
                            <div className="flex items-end gap-2">
                              <p className="text-2xl font-black text-white">
                                {Math.max(0, 30 - (user.contactsViewed?.length || 0))}
                              </p>
                              <p className="text-[10px] text-slate-400 pb-1">out of 30</p>
                            </div>
                            <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                              <div
                                className={`h-full ${s.badge} transition-all duration-1000`}
                                style={{
                                  width: `${Math.max(0, ((30 - (user.contactsViewed?.length || 0)) / 30) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => (window.location.href = '/premium')}
                            className="w-full py-3 mt-4 bg-white/10 hover:bg-white/20 text-white border border-rose-500/30 rounded-xl font-bold text-sm transition-all shadow-lg hover:border-rose-500/60 flex items-center justify-center gap-2"
                          >
                            <span>Upgrade to Platinum</span>
                            <span className="text-lg">✨</span>
                          </button>
                        </>
                      )}
                      {user.premiumPlan === 'platinum' && (
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] block mb-1">
                            Status
                          </span>
                          <p className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                            <span>Unlimited Access Active</span>
                            <Sparkles className="w-4 h-4" />
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => (window.location.href = '/premium')}
                      className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-rose-900/50"
                    >
                      Upgrade to Premium
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Profile Strength Card */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-rose-100 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Profile Strength</h3>
              <span
                className={`text-sm font-black ${profileStrength > 80 ? 'text-emerald-500' : profileStrength > 50 ? 'text-amber-500' : 'text-rose-500'}`}
              >
                {profileStrength}%
              </span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full transition-all duration-1000 ${profileStrength > 80 ? 'bg-emerald-500' : profileStrength > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                style={{ width: `${profileStrength}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 font-medium italic">
              {profileStrength < 100
                ? '💡 Tip: Complete your bio and add more photos to reach 100%!'
                : '✨ Perfect! Your profile is fully optimized for matches.'}
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-3 border border-white shadow-sm space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'text-slate-400 hover:bg-rose-50/50 hover:text-slate-600'}`}
            >
              <Sparkles className="w-5 h-5" /> Edit My Profile
            </button>
            <button
              onClick={() => setActiveTab('interests')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'interests' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'text-slate-400 hover:bg-rose-50/50 hover:text-slate-600'}`}
            >
              <div className="relative">
                <Heart className="w-5 h-5" />
                {interests.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full" />
                )}
              </div>
              Received Interests
            </button>
            <button
              onClick={() => (window.location.href = '/shortlisted')}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm text-slate-400 hover:bg-rose-50/50 hover:text-slate-600 transition-all group"
            >
              <div className="relative">
                <Bookmark className="w-5 h-5 transition-transform group-hover:scale-110" />
                {user.shortlistedProfiles?.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full" />
                )}
              </div>
              Shortlisted Profiles
            </button>
            <div className="pt-2 border-t border-rose-50/50 mt-2">
              <button
                onClick={() => (window.location.href = `/profile/${user.profile._id}`)}
                className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm text-rose-500 hover:bg-rose-50 transition-all group"
              >
                <Users className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span>View Public Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* ══ Main Content (Forms/Inbox) ══ */}
        <div className="lg:col-span-8">
          {statusMsg && (
            <div
              className={`mb-8 p-5 rounded-2xl font-bold border transition-all animate-scale-in flex items-center gap-4 ${statusMsg.includes('successfully') || statusMsg.includes('accepted') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}
            >
              <span
                className={`w-3 h-3 rounded-full animate-pulse ${statusMsg.includes('successfully') ? 'bg-emerald-500' : 'bg-rose-500'}`}
              />
              {statusMsg}
            </div>
          )}

          {activeTab === 'profile' ? (
            <div className="relative z-10">
              {/* Profile Completeness Bar (v3.3.0) */}
              <div className="mb-10 bg-white/40 backdrop-blur-md rounded-4xl p-6 border border-white shadow-sm overflow-hidden relative group">
                <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                  <div className="relative w-20 h-20 shrink-0">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        className="stroke-rose-50 fill-none"
                        strokeWidth="6"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        className="stroke-rose-500 fill-none transition-all duration-1000"
                        strokeWidth="6"
                        strokeDasharray={226}
                        strokeDashoffset={226 - (226 * profileStrength) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-black text-rose-600">{profileStrength}%</span>
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-lg font-serif font-black text-slate-800 mb-1">
                      {profileStrength === 100
                        ? 'Profile Masterpiece! ✨'
                        : profileStrength >= 70
                          ? 'Almost there, Stellar Profile! 🚀'
                          : 'Unlock Your Match Potential 🔓'}
                    </h3>
                    <p className="text-slate-400 text-xs font-medium max-w-sm">
                      {profileStrength === 100
                        ? 'Your profile is perfect. You are 5x more likely to find your perfect match!'
                        : 'Complete your profile details and add photos to appear in more search results.'}
                    </p>
                  </div>
                  <div className="w-full md:w-auto">
                    <div className="h-2 w-full md:w-48 bg-slate-100 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-linear-to-r from-rose-500 to-pink-500 transition-all duration-1000 shadow-lg shadow-rose-200"
                        style={{ width: `${profileStrength}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <span>Progress</span>
                      <span className="text-rose-500">{profileStrength}/100</span>
                    </div>
                  </div>
                </div>
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 group-hover:bg-rose-100 transition-colors" />
              </div>

              {/* Hero Header with Public Profile Access */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 p-8 bg-slate-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[80px] -mr-32 -mt-32" />
                <div className="relative z-10">
                  <h1 className="text-3xl md:text-4xl font-serif font-black text-white mb-2 leading-tight">
                    Master Profile <span className="text-rose-500">Editor</span>
                  </h1>
                  <p className="text-slate-400 font-medium text-sm max-w-md">
                    Edit sections individually for faster updates. Keep your details fresh to
                    attract the right partners.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => window.open(`/profile/${user.profile._id}`, '_blank')}
                  className="relative z-10 px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-rose-900/40 flex items-center justify-center gap-3 active:scale-95 group/preview"
                >
                  <Users className="w-5 h-5 group-hover/preview:scale-110 transition-transform" />
                  <span>View Public Profile</span>
                  <ChevronRight className="w-4 h-4 text-rose-300" />
                </button>
              </div>

              {/* Identity Card */}
              <DashboardCard
                title="Profile Identity"
                delay="100"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                }
                onSave={() => {
                  if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
                    setStatusMsg('Please enter a valid 10-digit mobile number.');
                    return;
                  }
                  handleSaveSection(
                    [
                      'height',
                      'motherTongue',
                      'religion',
                      'caste',
                      'bio',
                      'dateOfBirth',
                      'phone',
                      'isWhatsappAvailable',
                    ],
                    { profilePhoto: file, hasFiles: !!file },
                  );
                }}
                isSaving={isSubmitting}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  {/* Photo Section */}
                  <div className="lg:col-span-5 border-r border-rose-50/60 pr-0 lg:pr-10">
                    <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 flex flex-col items-center">
                      <div className="w-full aspect-4/5 rounded-4xl overflow-hidden border-4 border-white shadow-2xl relative group mb-6">
                        <img
                          src={file ? URL.createObjectURL(file) : getProfileAvatar(user.profile)}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          alt=""
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs font-bold bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
                            Update Photo
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-3 w-full">
                        <label className="flex-1 text-center py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs cursor-pointer hover:bg-rose-50 hover:border-rose-200 transition-all">
                          Upload
                          <input type="file" onChange={handleFileChange} className="hidden" />
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsCameraOpen(true)}
                          className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all"
                        >
                          Camera
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="opacity-60 grayscale-[0.5]">
                        <FormLabel>NAME</FormLabel>
                        <input
                          type="text"
                          value={formData.name}
                          disabled
                          className="w-full px-5 py-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm font-bold cursor-not-allowed"
                        />
                      </div>
                      <div className="opacity-60 grayscale-[0.5]">
                        <FormLabel>GENDER</FormLabel>
                        <input
                          type="text"
                          value={formData.gender}
                          disabled
                          className="w-full px-5 py-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm font-bold cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {(() => {
                      const hasDOB = !!user.profile.horoscope?.dateOfBirth;
                      return (
                        <div>
                          <FormLabel>
                            DATE OF BIRTH
                            {hasDOB && (
                              <span className="ml-2 text-[8px] px-2 py-0.5 bg-slate-100 text-slate-400 rounded-md">
                                VERIFIED
                              </span>
                            )}
                          </FormLabel>
                          {hasDOB ? (
                            <input
                              type="text"
                              value={formatDate(formData.dateOfBirth)}
                              disabled
                              className="w-full px-5 py-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm font-bold opacity-60 cursor-not-allowed"
                            />
                          ) : (
                            <input
                              type="date"
                              name="dateOfBirth"
                              value={toInputDate(formData.dateOfBirth)}
                              onChange={handleChange}
                              className="w-full px-5 py-3.5 rounded-2xl border border-rose-100 bg-rose-50/10 text-sm font-bold focus:ring-4 focus:ring-rose-500/10 outline-none transition-all"
                            />
                          )}
                        </div>
                      );
                    })()}

                    <div className="pt-4 border-t border-rose-50/50">
                      <FormLabel>MOBILE NUMBER (FOR PREMIUM MEMBERS)</FormLabel>
                      <div className="relative">
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          maxLength={10}
                          placeholder="10-digit number without +91"
                          className="w-full px-5 py-3.5 pl-12 rounded-2xl border border-rose-100 bg-rose-50/10 text-sm font-bold focus:ring-4 focus:ring-rose-500/10 outline-none transition-all placeholder:text-slate-300"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 ml-1 italic">
                        Enter 10 digits only. Do not include +91 or any symbols.
                      </p>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            name="isWhatsappAvailable"
                            checked={formData.isWhatsappAvailable}
                            onChange={handleChange}
                            className="peer sr-only"
                          />
                          <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 transition-all"></div>
                          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-4"></div>
                        </div>
                        <span className="text-sm font-bold text-slate-600 group-hover:text-emerald-600 transition-colors flex items-center gap-2">
                          WhatsApp available on this number?
                          <svg
                            className="w-4 h-4 text-emerald-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                          </svg>
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-rose-50/50">
                      <div>
                        <FormLabel>HEIGHT</FormLabel>
                        <input
                          type="text"
                          name="height"
                          value={formData.height}
                          onChange={handleChange}
                          placeholder={'5\'8"'}
                          className="w-full px-5 py-3.5 rounded-2xl border border-slate-100 bg-slate-50/30 text-sm font-medium focus:bg-white transition-all"
                        />
                      </div>
                      <SearchableDropdown
                        label="MOTHER TONGUE"
                        name="motherTongue"
                        value={formData.motherTongue}
                        options={languageOptions}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-rose-50/50">
                      <SearchableDropdown
                        label="RELIGION"
                        name="religion"
                        value={formData.religion}
                        options={religionOptions}
                        onChange={handleChange}
                      />
                      <SearchableDropdown
                        label="CASTE"
                        name="caste"
                        value={formData.caste}
                        options={casteOptions}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <FormLabel>MY BIO / ABOUT ME</FormLabel>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Tell potential matches about your values, goals and what you're looking for..."
                    className="w-full px-6 py-4 rounded-3xl border border-slate-100 bg-slate-50/30 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-rose-500/5 transition-all outline-none resize-none"
                  />
                </div>
              </DashboardCard>

              {/* Career Card */}
              <DashboardCard
                title="Career & Education"
                delay="200"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                }
                onSave={() => handleSaveSection(['education', 'profession', 'location'])}
                isSaving={isSubmitting}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <FormLabel>HIGHEST EDUCATION</FormLabel>
                    <input
                      type="text"
                      name="education"
                      value={formData.education}
                      onChange={handleChange}
                      placeholder="e.g. Masters in Data Science"
                      className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/30 text-sm font-medium focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div>
                    <FormLabel>PROFESSION / ROLE</FormLabel>
                    <input
                      type="text"
                      name="profession"
                      value={formData.profession}
                      onChange={handleChange}
                      placeholder="e.g. Senior Architect"
                      className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/30 text-sm font-medium focus:bg-white transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-50">
                  <FormLabel>CURRENT RESIDENCE (CITY)</FormLabel>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Search city..."
                    className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/30 text-sm font-medium focus:bg-white transition-all outline-none"
                  />
                </div>
              </DashboardCard>

              {/* Family Card */}
              <DashboardCard
                title="Family Background"
                delay="300"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                }
                onSave={() => handleSaveSection(['family'])}
                isSaving={isSubmitting}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <FormLabel>FATHER&apos;S FULL NAME</FormLabel>
                    <input
                      type="text"
                      name="fatherName"
                      value={formData.fatherName}
                      onChange={handleChange}
                      className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/30 text-sm font-medium focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div>
                    <FormLabel>MOTHER&apos;S FULL NAME</FormLabel>
                    <input
                      type="text"
                      name="motherName"
                      value={formData.motherName}
                      onChange={handleChange}
                      className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/30 text-sm font-medium focus:bg-white transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8 mt-8">
                  <div>
                    <FormLabel>SIBLINGS</FormLabel>
                    <input
                      type="number"
                      name="siblings"
                      value={formData.siblings}
                      onChange={handleChange}
                      className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/30 text-sm font-medium focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div>
                    <FormLabel>FAMILY TYPE</FormLabel>
                    <select
                      name="familyType"
                      value={formData.familyType}
                      onChange={handleChange}
                      className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/30 text-sm font-medium focus:bg-white transition-all outline-none cursor-pointer"
                    >
                      <option value="Nuclear">Nuclear</option>
                      <option value="Joint">Joint</option>
                    </select>
                  </div>
                </div>
              </DashboardCard>

              {/* Astrology Card */}
              <DashboardCard
                title="Astro & Horoscope"
                delay="400"
                icon={<Sparkles className="w-6 h-6" />}
                onSave={() => handleSaveSection(['horoscope'])}
                isSaving={isSubmitting}
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="md:col-span-2">
                    <FormLabel>MOON SIGN (RASHI)</FormLabel>
                    <select
                      name="rashi"
                      value={formData.rashi}
                      onChange={handleChange}
                      className={`w-full px-6 py-4 rounded-2xl border border-slate-100 text-sm font-medium outline-none transition-all ${formData.nakshatra && formData.pada ? 'bg-slate-100 opacity-70 cursor-not-allowed' : 'bg-slate-50/30 focus:bg-white cursor-pointer'}`}
                      disabled={!!(formData.nakshatra && formData.pada)}
                    >
                      <option value="">Select Rashi</option>
                      {RASHIS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <FormLabel>BIRTH STAR (NAKSHATRA)</FormLabel>
                    <select
                      name="nakshatra"
                      value={formData.nakshatra}
                      onChange={handleChange}
                      className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/30 text-sm font-medium focus:bg-white outline-none cursor-pointer transition-all"
                    >
                      <option value="">Select Nakshatra</option>
                      {NAKSHATRAS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FormLabel>PADA</FormLabel>
                    <select
                      name="pada"
                      value={formData.pada}
                      onChange={handleChange}
                      className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/30 text-sm font-medium focus:bg-white outline-none cursor-pointer transition-all"
                    >
                      <option value="">Select Pada</option>
                      {[1, 2, 3, 4].map((p) => (
                        <option key={p} value={p}>
                          {p}st Pada
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <FormLabel>GOTRA</FormLabel>
                    <input
                      type="text"
                      name="gotra"
                      value={formData.gotra}
                      onChange={handleChange}
                      placeholder="Ancestral Lineage"
                      className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/30 text-sm font-medium focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => {
                        const states = ['Unknown', 'No', 'Yes'];
                        const currentIndex = states.indexOf(formData.manglik || 'Unknown');
                        const nextIndex = (currentIndex + 1) % states.length;
                        setFormData((prev) => ({ ...prev, manglik: states[nextIndex] }));
                      }}
                      className={`p-4 rounded-2xl border w-full text-center transition-all group/manglik relative overflow-hidden 
                             ${
                               formData.manglik === 'Yes'
                                 ? 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100/60'
                                 : formData.manglik === 'No'
                                   ? 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100/60'
                                   : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100/60'
                             }`}
                    >
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/manglik:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                          Click to Cycle
                        </span>
                      </div>
                      <div className="group-hover/manglik:blur-sm transition-all duration-300">
                        <span className="text-[10px] font-black uppercase tracking-tighter block mb-0.5 opacity-60">
                          ASTRO STATUS
                        </span>
                        <span className="font-bold text-sm tracking-wide">
                          {formData.manglik === 'Yes'
                            ? 'MANGLIK'
                            : formData.manglik === 'No'
                              ? 'NON-MANGLIK'
                              : "DON'T KNOW"}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </DashboardCard>

              {/* Personality Card */}
              <DashboardCard
                title="Interests & Traits"
                delay="500"
                icon={<Heart className="w-6 h-6" />}
                onSave={() =>
                  handleSaveSection([], { traits, interests: interestsList, hasFiles: true })
                }
                isSaving={isSubmitting}
              >
                <div className="space-y-10">
                  <div>
                    <FormLabel>MY HOBBIES & INTERESTS</FormLabel>
                    <div className="flex flex-wrap gap-2.5 mt-4">
                      {PREDEFINED_INTERESTS.map((i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleInterest(i)}
                          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border 
                                ${interestsList.includes(i) ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-100' : 'bg-white border-slate-100 text-slate-400 hover:border-rose-300 hover:text-rose-500'}`}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-8 border-t border-slate-50">
                    <FormLabel>PERSONALITY ATTRIBUTES</FormLabel>
                    <div className="flex flex-wrap gap-2.5 mt-4">
                      {PREDEFINED_TRAITS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleTrait(t)}
                          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border 
                                ${traits.includes(t) ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-100' : 'bg-white border-slate-100 text-slate-400 hover:border-rose-300 hover:text-rose-500'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </DashboardCard>

              {/* Partner Preferences Card */}
              <DashboardCard
                title="Partner Expectations"
                delay="600"
                icon={<Users className="w-6 h-6" />}
                onSave={() => handleSaveSection(['preferences'])}
                isSaving={isSubmitting}
              >
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Age range */}
                    <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                      <FormLabel>PREFERRED AGE RANGE</FormLabel>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex-1">
                          <span className="text-[9px] text-slate-400 font-bold block mb-1">
                            MIN
                          </span>
                          <input
                            type="number"
                            name="prefMinAge"
                            value={formData.prefMinAge}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-white bg-white shadow-sm text-sm font-bold"
                          />
                        </div>
                        <div className="pt-5 font-black text-rose-200">〰</div>
                        <div className="flex-1">
                          <span className="text-[9px] text-slate-400 font-bold block mb-1">
                            MAX
                          </span>
                          <input
                            type="number"
                            name="prefMaxAge"
                            value={formData.prefMaxAge}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-white bg-white shadow-sm text-sm font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex flex-col justify-end">
                      <FormLabel>PREFERRED LOCATION</FormLabel>
                      <input
                        type="text"
                        name="prefLocation"
                        value={formData.prefLocation}
                        onChange={handleChange}
                        placeholder="e.g. Any, Delhi, Maharashtra"
                        className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/30 text-sm font-medium focus:bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6 border-t border-slate-50">
                    <SearchableDropdown
                      label="Expected Religion"
                      name="prefReligion"
                      value={formData.prefReligion}
                      options={['Any', ...religionOptions]}
                      onChange={handleChange}
                    />
                    <SearchableDropdown
                      label="Expected Caste"
                      name="prefCaste"
                      value={formData.prefCaste}
                      options={['Any', ...casteOptions]}
                      onChange={handleChange}
                      placeholder="e.g. Brahmin, Any"
                    />
                  </div>
                </div>
              </DashboardCard>

              {/* Multi-Photo Gallery */}
              <DashboardCard
                title="My Gallery"
                delay="700"
                icon={<Camera className="w-6 h-6" />}
                onSave={() =>
                  handleSaveSection([], {
                    additionalPhotos: galleryFiles,
                    removePhotos,
                    hasFiles: true,
                  })
                }
                isSaving={isSubmitting}
              >
                <p className="text-xs text-slate-400 mb-8 font-medium italic">
                  Showing up to 5 additional moments from your life.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                  {existingGallery.map((photoUrl, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-3xl overflow-hidden shadow-md group border border-slate-100"
                    >
                      <img src={photoUrl} className="w-full h-full object-cover" alt="" />
                      <button
                        type="button"
                        onClick={() => handleRemoveExisting(photoUrl)}
                        className="absolute inset-0 bg-rose-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all font-bold text-[10px] tracking-widest"
                      >
                        REMOVE
                      </button>
                    </div>
                  ))}
                  {galleryPreviews.map((src, idx) => (
                    <div
                      key={'new-' + idx}
                      className="relative aspect-square rounded-3xl overflow-hidden shadow-md group border border-emerald-100 ring-2 ring-emerald-50"
                    >
                      <img src={src} className="w-full h-full object-cover" alt="" />
                      <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[8px] px-2 py-0.5 rounded-md font-black">
                        NEW
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveNew(idx)}
                        className="absolute inset-0 bg-rose-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all font-bold text-[10px] tracking-widest"
                      >
                        CANCEL
                      </button>
                    </div>
                  ))}
                  {existingGallery.length + galleryFiles.length < 5 && (
                    <label className="cursor-pointer aspect-square rounded-3xl border-2 border-dashed border-rose-100 flex flex-col items-center justify-center text-rose-300 hover:bg-rose-50 transition-all group">
                      <Plus className="w-6 h-6 mb-2 group-hover:scale-125 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Add</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleGalleryChange}
                      />
                    </label>
                  )}
                </div>
              </DashboardCard>

              {/* Privacy Suite */}
              <DashboardCard
                title="Privacy & Stealth"
                delay="800"
                icon={<ShieldCheck className="w-6 h-6" />}
                onSave={() => handleSaveSection(['privacy'])}
                isSaving={isSubmitting}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                    <FormLabel>PHOTO VISIBILITY</FormLabel>
                    <select
                      name="showPhotoTo"
                      value={formData.showPhotoTo}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-white bg-white shadow-sm text-sm font-bold text-slate-700 outline-none cursor-pointer"
                    >
                      <option value="everyone">Everyone (Public)</option>
                      <option value="interests_only">Connections Only</option>
                      <option value="none">Private (Hidden)</option>
                    </select>
                  </div>
                  <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                    <FormLabel>CONTACT VISIBILITY</FormLabel>
                    <select
                      name="showContactTo"
                      value={formData.showContactTo}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-white bg-white shadow-sm text-sm font-bold text-slate-700 outline-none cursor-pointer"
                    >
                      <option value="premium_only">Premium Members Only</option>
                      <option value="interests_only">Connections Only</option>
                      <option value="none">Private</option>
                    </select>
                  </div>
                </div>
              </DashboardCard>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-gray-800 mb-6">
                Pending Interests
              </h2>
              {loadingInterests ? (
                <div className="py-20 text-center text-gray-400">Loading your inbox...</div>
              ) : interests.length === 0 ? (
                <div className="bg-white p-16 rounded-[3rem] border border-dashed border-gray-200 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-4">
                    <Heart className="w-8 h-8" />
                  </div>
                  <p className="text-gray-400 font-medium">No pending interests at the moment.</p>
                </div>
              ) : (
                interests.map((interest) => (
                  <div
                    key={interest._id}
                    className="bg-white p-5 rounded-3xl border border-rose-100 shadow-sm flex items-center gap-6 hover:shadow-md transition-all group animate-fade-in"
                  >
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                      <img
                        src={interest.sender.profile?.profilePhoto || '/placeholder-profile.png'}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-800">{interest.sender.name}</h4>
                      <p className="text-gray-500 text-sm">
                        {interest.sender.profile?.location || 'Location hidden'}
                      </p>
                      {interest.message && (
                        <p className="text-gray-400 text-xs italic mt-1 line-clamp-1">
                          &quot;{interest.message}&quot;
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleInterestAction(interest._id, 'rejected')}
                        className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleInterestAction(interest._id, 'accepted')}
                        className="p-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <CaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapture}
      />
    </div>
  );
};

export default ProfileDashboard;
