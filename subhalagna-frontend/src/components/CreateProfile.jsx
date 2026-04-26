/**
 * @file        SubhaLagna v3.3.6 — Profile Creation (Onboarding)
 * @description   Multi-step onboarding flow for newly registered users.
 *                - [v3.0.5 changes]
 *                - Fixed critical bug where API response was not unwrapped, causing profile data to appear missing.
 *                - Refactored submission logic to use profileService for better consistency.
 *                - [v2.1.0 changes]
 *                  - Automated Rashi selection logic based on Nakshatra/Pada mapping
 *                  - Standardized horoscope dropdowns for Guna Milan data integrity
 *                  - Laptop camera direct capture support
 *                  - Multimedia gallery upload management
 *                  - Enhanced Glassmorphism styling
 * @author        SubhaLagna Team
 * @version      3.3.6
 */

import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { fetchLookupOptions } from '../services/lookupService';
import { setupProfile } from '../services/profileService';
import { RASHIS, NAKSHATRAS, PADA_RASHI_MAP } from '../data/astrologyData.js';
import CaptureModal from './CaptureModal';

// ─── Floating Heart Component ────────────────────────────────────────────────
const FloatingHeart = ({ style, size = 'sm' }) => {
  const sizes = { xs: 'w-2.5 h-2.5', sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-7 h-7' };
  return (
    <svg
      className={`absolute ${sizes[size]} pointer-events-none`}
      style={{
        ...style,
        animation: `float-heart ${style.animationDuration || '4s'} ease-in-out ${style.animationDelay || '0s'} infinite`,
      }}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
};

// ─── Header ──────────────────────────────────────────────────────────────────
const Header = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 bg-linear-to-br from-rose-500 to-pink-400 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-rose-300/50 transition-all duration-300 group-hover:scale-110">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
        <span className="text-2xl font-serif font-bold text-gray-800">
          Subha<span className="text-rose-500">Lagna</span>
        </span>
      </Link>
    </div>
  </header>
);

// ─── Background Hearts ──────────────────────────────────────────────────────
const bgHearts = [
  { left: '3%', top: '8%', size: 'xs', delay: '0s', duration: '5s' },
  { left: '12%', top: '22%', size: 'sm', delay: '1.2s', duration: '4.5s' },
  { left: '22%', top: '55%', size: 'md', delay: '0.5s', duration: '5.5s' },
  { left: '32%', top: '15%', size: 'xs', delay: '2.8s', duration: '4s' },
  { left: '42%', top: '70%', size: 'sm', delay: '1.8s', duration: '6s' },
  { left: '52%', top: '30%', size: 'xs', delay: '3.2s', duration: '3.8s' },
  { left: '62%', top: '80%', size: 'md', delay: '0.8s', duration: '5.2s' },
  { left: '72%', top: '10%', size: 'sm', delay: '2.2s', duration: '4.8s' },
  { left: '82%', top: '45%', size: 'xs', delay: '1.5s', duration: '5.8s' },
  { left: '92%', top: '65%', size: 'sm', delay: '3.5s', duration: '4.2s' },
  { left: '8%', top: '88%', size: 'xs', delay: '0.3s', duration: '5s' },
  { left: '18%', top: '40%', size: 'sm', delay: '2.5s', duration: '3.5s' },
  { left: '28%', top: '75%', size: 'xs', delay: '1s', duration: '4.6s' },
  { left: '38%', top: '5%', size: 'md', delay: '3.8s', duration: '5.3s' },
  { left: '48%', top: '50%', size: 'xs', delay: '0.6s', duration: '4.1s' },
  { left: '58%', top: '92%', size: 'sm', delay: '2s', duration: '5.7s' },
  { left: '68%', top: '35%', size: 'xs', delay: '3s', duration: '3.9s' },
  { left: '78%', top: '60%', size: 'md', delay: '1.3s', duration: '4.4s' },
  { left: '88%', top: '20%', size: 'xs', delay: '0.9s', duration: '5.6s' },
  { left: '95%', top: '42%', size: 'sm', delay: '2.6s', duration: '3.7s' },
  { left: '5%', top: '58%', size: 'xs', delay: '3.4s', duration: '5.1s' },
  { left: '15%', top: '78%', size: 'md', delay: '0.2s', duration: '4.9s' },
  { left: '55%', top: '12%', size: 'xs', delay: '1.7s', duration: '5.4s' },
  { left: '75%', top: '85%', size: 'sm', delay: '2.9s', duration: '4.3s' },
  { left: '35%', top: '95%', size: 'xs', delay: '0.7s', duration: '3.6s' },
];

// ─── Inject keyframes ───────────────────────────────────────────────────────
const keyframesId = 'createprofile-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(keyframesId)) {
  const s = document.createElement('style');
  s.id = keyframesId;
  s.textContent = `
    @keyframes float-heart { 0%,100%{transform:translateY(0) rotate(0) scale(1);opacity:.35}25%{transform:translateY(-8px) rotate(5deg) scale(1.1);opacity:.55}50%{transform:translateY(-3px) rotate(-3deg) scale(.95);opacity:.4}75%{transform:translateY(-10px) rotate(3deg) scale(1.05);opacity:.5} }
    @keyframes fade-in-up { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
    @keyframes slide-in { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
    @keyframes shake { 0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)} }
  `;
  document.head.appendChild(s);
}

// ─── Icons ───────────────────────────────────────────────────────────────────
const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);
const BriefcaseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);
const HeartIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
);
const CameraIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);
const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);
const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
    />
  </svg>
);
const ChevronRight = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
);
const ChevronLeft = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
  </svg>
);
const XIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
  </svg>
);

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
  'Kind',
  'Determined',
  'Honest',
  'Humorous',
  'Patient',
  'Reliable',
];

import SearchableDropdown from './SearchableDropdown';

const inputClasses =
  'w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-400 transition-all font-sans text-sm text-gray-800';

// ─── CreateProfile ───────────────────────────────────────────────────────────
const CreateProfile = () => {
  const { user, updateProfileContext } = useContext(AuthContext);
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStr, setErrorStr] = useState(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    gender: 'Male',
    location: '',
    dateOfBirth: '',
    caste: '',
    religion: '',
    education: '',
    profession: '',
    bio: '',
    height: '',
    motherTongue: '',
    // Horoscope
    rashi: '',
    nakshatra: '',
    pada: '',
    gotra: '',
    manglik: 'Unknown',
    // Partner Preferences
    prefMinAge: 18,
    prefMaxAge: 40,
    prefLocation: 'Any',
    prefCaste: 'Any',
    prefReligion: 'Any',
    // Family
    fatherName: '',
    motherName: '',
    siblings: '0',
    familyType: 'Nuclear',
    phone: user?.phone || '',
    isWhatsappAvailable: user?.isWhatsappAvailable || false,
  });

  const [file, setFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

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
  const [interests, setInterests] = useState([]);

  // Auto-select Rashi based on Nakshatra + Pada
  useEffect(() => {
    if (formData.nakshatra && formData.pada) {
      const correctRashi = PADA_RASHI_MAP[formData.nakshatra]?.[formData.pada];
      if (correctRashi && formData.rashi !== correctRashi) {
        setFormData((prev) => ({ ...prev, rashi: correctRashi }));
      }
    }
  }, [formData.nakshatra, formData.pada, formData.rashi]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleCapture = (file) => {
    setFile(file);
    setIsCameraOpen(false);
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
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorStr(null);

    const submission = new FormData();
    Object.keys(formData).forEach((key) => submission.append(key, formData[key]));
    if (file) submission.append('profilePhoto', file);
    galleryFiles.forEach((f) => submission.append('additionalPhotos', f));
    submission.append('traits', traits.join(', '));
    submission.append('interests', interests.join(', '));

    try {
      const updatedProfile = await setupProfile(submission);
      updateProfileContext(updatedProfile);
      navigate('/dashboard');
    } catch (err) {
      setErrorStr(err || 'Failed to create profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, label: 'Identity', icon: <UserIcon /> },
    { id: 2, label: 'Roots', icon: <HomeIcon /> },
    { id: 3, label: 'Career', icon: <BriefcaseIcon /> },
    { id: 4, label: 'Life', icon: <SparklesIcon /> },
    { id: 5, label: 'Gallery', icon: <CameraIcon /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans">
      <Header />
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
        {bgHearts.map((h, i) => (
          <FloatingHeart
            key={i}
            size={h.size}
            style={{
              left: h.left,
              top: h.top,
              animationDelay: h.delay,
              animationDuration: h.duration,
              color: i % 2 === 0 ? '#fb7185' : '#f43f5e',
            }}
          />
        ))}
      </div>

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20 relative z-10">
        {/* Step Indicator */}
        <div className="flex justify-between items-center mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0"></div>
          {steps.map((s) => (
            <div key={s.id} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${
                  currentStep >= s.id
                    ? 'bg-rose-600 text-white shadow-rose-200'
                    : 'bg-white text-gray-400 border border-gray-100'
                }`}
              >
                {currentStep > s.id ? <CheckIcon /> : s.icon}
              </div>
              <span
                className={`text-[10px] font-bold uppercase mt-3 tracking-widest ${
                  currentStep >= s.id ? 'text-rose-600' : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Content Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-xl rounded-[3rem] border border-white shadow-2xl p-10 md:p-14 transition-all duration-500"
        >
          {errorStr && (
            <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-bold flex items-center gap-3 animate-shake">
              <div className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center">
                !
              </div>
              {errorStr}
            </div>
          )}

          {/* STEP 1: IDENTITY */}
          {currentStep === 1 && (
            <div className="animate-fade-in-up">
              <div className="mb-10">
                <h2 className="text-3xl font-serif font-bold text-gray-800">The First Look</h2>
                <p className="text-gray-500 mt-2">
                  Tell us who you are. This is the heart of your profile.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                <div className="md:col-span-5">
                  <div className="relative group cursor-pointer">
                    <div className="w-full aspect-4/5 rounded-[2.5rem] bg-slate-100 overflow-hidden border-4 border-white shadow-2xl transition-transform group-hover:scale-[1.02]">
                      <img
                        src={file ? URL.createObjectURL(file) : '/placeholder-profile.png'}
                        className="w-full h-full object-cover"
                        alt="Profile"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3">
                        <label className="px-6 py-2 bg-white text-gray-800 rounded-full font-bold text-xs cursor-pointer hover:bg-rose-50">
                          Upload Photo
                          <input type="file" onChange={handleFileChange} className="hidden" />
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsCameraOpen(true)}
                          className="px-6 py-2 bg-rose-600 text-white rounded-full font-bold text-xs hover:bg-rose-700"
                        >
                          Laptop Camera
                        </button>
                      </div>
                    </div>
                    {file && (
                      <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-emerald-500 text-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-white">
                        <CheckIcon />
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-7 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={inputClasses}
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className={inputClasses}
                      >
                        <option>Male</option>
                        <option>Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        required
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                      Bio / Description
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows="4"
                      className={`${inputClasses} resize-none h-32`}
                      placeholder="Tell us about yourself, your values, and what you're looking for..."
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                      Mobile Number (Required for Premium)
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        maxLength={10}
                        className={`${inputClasses} pl-12`}
                        placeholder="10-digit number without +91"
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
                    <p className="text-[10px] text-gray-400 mt-2 ml-1 italic">
                      Please enter your 10-digit number without the country code.
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
                        <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-emerald-500 transition-all"></div>
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-4"></div>
                      </div>
                      <span className="text-sm font-bold text-gray-600 group-hover:text-emerald-600 transition-colors flex items-center gap-2">
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
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ROOTS */}
          {currentStep === 2 && (
            <div className="animate-fade-in-up space-y-10">
              <div>
                <h2 className="text-3xl font-serif font-bold text-gray-800">Your Heritage</h2>
                <p className="text-gray-500 mt-2">
                  Family traditions and roots are the foundation of a lasting bond.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <SearchableDropdown
                  label="Religion"
                  name="religion"
                  value={formData.religion}
                  options={religionOptions}
                  onChange={handleChange}
                />
                <SearchableDropdown
                  label="Caste / Community"
                  name="caste"
                  value={formData.caste}
                  options={casteOptions}
                  onChange={handleChange}
                />
                <SearchableDropdown
                  label="Mother Tongue"
                  name="motherTongue"
                  value={formData.motherTongue}
                  options={languageOptions}
                  onChange={handleChange}
                />
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                    Gotra
                  </label>
                  <input
                    type="text"
                    name="gotra"
                    value={formData.gotra}
                    onChange={handleChange}
                    className={inputClasses}
                    placeholder="Enter Gotra"
                  />
                </div>
              </div>

              <div className="p-8 bg-rose-50/50 rounded-[2.5rem] border border-rose-100">
                <h3 className="font-serif font-bold text-gray-700 mb-6 flex items-center gap-2">
                  <SparklesIcon /> Horoscope Details (Optional)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">
                      Nakshatra
                    </label>
                    <select
                      name="nakshatra"
                      value={formData.nakshatra}
                      onChange={handleChange}
                      className={inputClasses}
                    >
                      <option value="">Select</option>
                      {NAKSHATRAS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">
                      Pada
                    </label>
                    <select
                      name="pada"
                      value={formData.pada}
                      onChange={handleChange}
                      className={inputClasses}
                    >
                      <option value="">Select</option>
                      {[1, 2, 3, 4].map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">
                      Rashi
                    </label>
                    <select
                      name="rashi"
                      value={formData.rashi}
                      onChange={handleChange}
                      className={inputClasses}
                    >
                      <option value="">Select</option>
                      {RASHIS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">
                      Manglik
                    </label>
                    <select
                      name="manglik"
                      value={formData.manglik}
                      onChange={handleChange}
                      className={inputClasses}
                    >
                      <option>No</option>
                      <option>Yes</option>
                      <option>Anshik</option>
                      <option>Unknown</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CAREER */}
          {currentStep === 3 && (
            <div className="animate-fade-in-up space-y-10">
              <div>
                <h2 className="text-3xl font-serif font-bold text-gray-800">Life Journey</h2>
                <p className="text-gray-500 mt-2">
                  Share your achievements and professional aspirations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                    Highest Education
                  </label>
                  <input
                    type="text"
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    className={inputClasses}
                    placeholder="e.g. Master of Technology"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                    Current Profession
                  </label>
                  <input
                    type="text"
                    name="profession"
                    value={formData.profession}
                    onChange={handleChange}
                    className={inputClasses}
                    placeholder="e.g. Senior Software Engineer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                    Residence City
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className={inputClasses}
                    placeholder="e.g. Mumbai, Maharashtra"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                    Height (e.g. 5&apos;8&quot;)
                  </label>
                  <input
                    type="text"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    className={inputClasses}
                    placeholder="Enter height"
                  />
                </div>
              </div>

              <div className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100">
                <h3 className="font-serif font-bold text-gray-700 mb-6 flex items-center gap-2">
                  Family Background
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">
                      Father&apos;s Name
                    </label>
                    <input
                      type="text"
                      name="fatherName"
                      value={formData.fatherName}
                      onChange={handleChange}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">
                      Mother&apos;s Name
                    </label>
                    <input
                      type="text"
                      name="motherName"
                      value={formData.motherName}
                      onChange={handleChange}
                      className={inputClasses}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: LIFE */}
          {currentStep === 4 && (
            <div className="animate-fade-in-up space-y-12">
              <div>
                <h2 className="text-3xl font-serif font-bold text-gray-800">Your Vibe</h2>
                <p className="text-gray-500 mt-2">
                  Let your personality shine through interests and traits.
                </p>
              </div>

              <div className="space-y-8">
                <div>
                  <FormLabel>MY TOP INTERESTS</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_INTERESTS.map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleInterest(i)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          interests.includes(i)
                            ? 'bg-rose-600 text-white shadow-lg'
                            : 'bg-white border border-gray-100 text-gray-500 hover:bg-rose-50'
                        }`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <FormLabel>PERSONALITY TRAITS</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_TRAITS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTrait(t)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          traits.includes(t)
                            ? 'bg-slate-800 text-white shadow-lg'
                            : 'bg-white border border-gray-100 text-gray-500 hover:bg-slate-50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-100">
                  <FormLabel>WHAT I AM LOOKING FOR</FormLabel>
                  <p className="text-xs text-gray-400 mb-4 italic">
                    Tell us what&apos;s most important to you in a life partner.
                  </p>
                  <textarea
                    name="prefLocation"
                    value={formData.prefLocation}
                    onChange={handleChange}
                    rows="3"
                    className={`${inputClasses} h-24`}
                    placeholder="e.g. Someone who values family, loves traveling and is emotionally mature..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: GALLERY */}
          {currentStep === 5 && (
            <div className="animate-fade-in-up space-y-10">
              <div>
                <h2 className="text-3xl font-serif font-bold text-gray-800">Photo Gallery</h2>
                <p className="text-gray-500 mt-2">
                  Profiles with multiple photos get 10x more engagement.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Upload Trigger */}
                <label className="aspect-square rounded-3xl border-2 border-dashed border-rose-200 flex flex-col items-center justify-center cursor-pointer hover:bg-rose-50 hover:border-rose-300 transition-all group">
                  <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-500 mb-2 group-hover:scale-110 transition-transform">
                    <PlusIcon />
                  </div>
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                    Add Photos
                  </span>
                  <input type="file" multiple onChange={handleGalleryChange} className="hidden" />
                </label>

                {galleryPreviews.map((url, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-3xl overflow-hidden relative group shadow-lg"
                  >
                    <img
                      src={url}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      alt="Gallery"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setGalleryFiles((prev) => prev.filter((_, idx) => idx !== i));
                        setGalleryPreviews((prev) => prev.filter((_, idx) => idx !== i));
                      }}
                      className="absolute top-2 right-2 p-2 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600"
                    >
                      <XIcon />
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100 text-xs text-amber-700 leading-relaxed">
                <strong>💡 Tip:</strong> Real photos help in building trust. We recommend uploading
                clear, recent photos without heavy filters.
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-16 pt-10 border-t border-gray-100 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="flex items-center gap-2 px-6 py-3 text-gray-400 font-bold hover:text-gray-800 transition-all"
              >
                <ChevronLeft /> Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => {
                  // Step 1 Validation: Phone number check
                  if (currentStep === 1) {
                    if (!formData.phone) {
                      setErrorStr('Mobile number is required to proceed.');
                      return;
                    }
                    if (!/^\d{10}$/.test(formData.phone)) {
                      setErrorStr(
                        'Please enter a valid 10-digit mobile number without spaces or symbols.',
                      );
                      return;
                    }
                  }
                  setErrorStr(null);
                  setCurrentStep((prev) => prev + 1);
                }}
                className="flex items-center gap-2 px-10 py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-xl shadow-gray-200 hover:bg-black transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                Continue <ChevronRight />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-12 py-4 bg-rose-600 text-white rounded-2xl font-bold shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Profile...' : 'Complete Registration ✨'}
              </button>
            )}
          </div>
        </form>
      </main>

      <CaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapture}
      />
    </div>
  );
};

const FormLabel = ({ children }) => (
  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">
    {children}
  </label>
);

const PlusIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H12" />
  </svg>
);

export default CreateProfile;
