/**
 * @fileoverview SubhaLagna v2.3.0 — Profile Creation (Onboarding)
 * @description   Multi-step onboarding flow for newly registered users.
 *                v2.1.0 changes:
 *                  - Automated Rashi selection logic based on Nakshatra/Pada mapping
 *                  - Standardized horoscope dropdowns for Guna Milan data integrity
 *                  - Laptop camera direct capture support
 *                  - Multimedia gallery upload management
 *                  - Enhanced Glassmorphism styling
 */

import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { fetchLookupOptions } from '../services/lookupService';
import { RASHIS, NAKSHATRAS, PADA_RASHI_MAP } from '../data/astrologyData.js';
import { API_BASE_URL } from '../config';
import CaptureModal from './CaptureModal';

// ─── Floating Heart Component ────────────────────────────────────────────────
const FloatingHeart = ({ style, size = 'sm' }) => {
  const sizes = { xs: 'w-2.5 h-2.5', sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-7 h-7' };
  return (
    <svg className={`absolute ${sizes[size]} pointer-events-none`}
      style={{ ...style, animation: `float-heart ${style.animationDuration || '4s'} ease-in-out ${style.animationDelay || '0s'} infinite` }}
      fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
};

// ─── Header ──────────────────────────────────────────────────────────────────
const Header = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-400 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-rose-300/50 transition-all duration-300 group-hover:scale-110">
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
const UserIcon = () => (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>);
const BriefcaseIcon = () => (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>);
const HeartIcon = () => (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>);
const CameraIcon = () => (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const HomeIcon = () => (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>);
const SparklesIcon = () => (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>);
const ChevronRight = () => (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>);
const ChevronLeft = () => (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>);
const XIcon = () => (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>);
const CheckIcon = () => (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>);

const PREDEFINED_INTERESTS = ["Travel", "Music", "Cooking", "Photography", "Fitness", "Reading", "Movies", "Sports", "Art"];
const PREDEFINED_TRAITS = ["Introvert", "Extrovert", "Ambivert", "Ambitious", "Creative", "Organized", "Spontaneous", "Rational", "Empathetic"];

import SearchableDropdown from './SearchableDropdown';

const inputClasses = 'w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-400 transition-all font-sans text-sm text-gray-800';

// ─── CreateProfile ───────────────────────────────────────────────────────────
const CreateProfile = () => {
  const { user, token, updateProfileContext } = useContext(AuthContext);
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStr, setErrorStr] = useState(null);

  const [formData, setFormData] = useState({
    name: user?.name || '', gender: 'Male', dateOfBirth: '', religion: 'Hindu', caste: '', motherTongue: '',
    rashi: '', nakshatra: '', pada: '', gotra: '', manglik: 'Unknown',
    location: '', currentState: '', currentCity: '', nativeState: '', nativeCity: '',
    education: '', profession: '', height: "5' 5\"", fatherName: '', motherName: '',
    siblings: '0', familyType: 'Nuclear', bio: '', partnerInterests: ''
  });

  const [traits, setTraits] = useState([]);
  const [interests, setInterests] = useState([]);
  const [customInterest, setCustomInterest] = useState('');
  const [customTrait, setCustomTrait] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [additionalPreviews, setAdditionalPreviews] = useState([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Master Data Options
  const [religionOptions, setReligionOptions] = useState([]);
  const [casteOptions, setCasteOptions] = useState([]);
  const [languageOptions, setLanguageOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [curCityOptions, setCurCityOptions] = useState([]);
  const [natCityOptions, setNatCityOptions] = useState([]);

  useEffect(() => {
    const loadMasters = async () => {
      const [r, l, s] = await Promise.all([
        fetchLookupOptions('religion'),
        fetchLookupOptions('motherTongue'),
        fetchLookupOptions('state')
      ]);
      setReligionOptions(r);
      setLanguageOptions(l);
      setStateOptions(s);
    };
    loadMasters();
  }, []);

  // Dynamic Caste Loader
  useEffect(() => {
    const loadCastes = async () => {
      const c = await fetchLookupOptions('caste');
      setCasteOptions(c);
    };
    loadCastes();
  }, [formData.religion]); // Reload if religion changes (optional linking)

  // Dynamic City Loader (Current)
  useEffect(() => {
    if (formData.currentState) {
      fetchLookupOptions('city', formData.currentState).then(setCurCityOptions);
    }
  }, [formData.currentState]);

  // Dynamic City Loader (Native)
  useEffect(() => {
    if (formData.nativeState) {
      fetchLookupOptions('city', formData.nativeState).then(setNatCityOptions);
    }
  }, [formData.nativeState]);

  useEffect(() => { if (user?.name && !formData.name) setFormData(prev => ({ ...prev, name: user.name })); }, [user]);

  // ── Auto-select Rashi based on Nakshatra + Pada ───────────────────────────
  useEffect(() => {
    if (formData.nakshatra && formData.pada) {
      const correctRashi = PADA_RASHI_MAP[formData.nakshatra]?.[formData.pada];
      if (correctRashi && formData.rashi !== correctRashi) {
        setFormData(prev => ({ ...prev, rashi: correctRashi }));
      }
    }
  }, [formData.nakshatra, formData.pada]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const nextStep = () => {
    if (currentStep === 1 && (!formData.name || !formData.dateOfBirth)) { setErrorStr("Please fill in your name and date of birth."); return; }
    if (currentStep === 1) {
      const birthDate = new Date(formData.dateOfBirth);
      const age = Math.abs(new Date(Date.now() - birthDate.getTime()).getUTCFullYear() - 1970);
      if (age < 18) { setErrorStr("You must be 18 or older to register."); return; }
    }
    if (currentStep === 2 && (!formData.currentState || !formData.currentCity || !formData.nativeState || !formData.nativeCity)) { setErrorStr("Please fill in both Current and Native locations."); return; }
    setErrorStr(null); setCurrentStep(prev => Math.min(prev + 1, 6)); window.scrollTo(0, 0);
  };

  const prevStep = () => { setErrorStr(null); setCurrentStep(prev => Math.max(prev - 1, 1)); window.scrollTo(0, 0); };
  const toggleTrait = (t) => setTraits(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const toggleInterest = (i) => setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  const addCustomInterest = (e) => { e.preventDefault(); if (customInterest.trim() && !interests.includes(customInterest.trim())) setInterests([...interests, customInterest.trim()]); setCustomInterest(''); };
  const addCustomTrait = (e) => { e.preventDefault(); if (customTrait.trim() && !traits.includes(customTrait.trim())) setTraits([...traits, customTrait.trim()]); setCustomTrait(''); };

  const handlePhotoChange = (e, target) => {
    const files = Array.from(e.target.files);
    if (target === 'profile') { const f = files[0]; if (f) { setProfilePhoto(f); setProfilePhotoPreview(URL.createObjectURL(f)); } }
    else { if (additionalFiles.length + files.length > 5) { alert("Maximum 5 additional photos."); return; } setAdditionalFiles(prev => [...prev, ...files]); setAdditionalPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]); }
  };

  const handleCapture = (file) => {
    setProfilePhoto(file);
    setProfilePhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = (i) => { setAdditionalFiles(prev => prev.filter((_, idx) => idx !== i)); setAdditionalPreviews(prev => prev.filter((_, idx) => idx !== i)); };

  const handleSubmit = async (e) => {
    e.preventDefault(); if (currentStep !== 6) return;
    setIsSubmitting(true); setErrorStr(null);
    const submitData = new FormData();
    const consolidatedLocation = `${formData.currentCity}, ${formData.currentState}`;
    Object.keys(formData).forEach(key => { if (key === 'location') submitData.append(key, consolidatedLocation); else if (key !== 'partnerInterests') submitData.append(key, formData[key]); });
    submitData.append('traits', traits.join(', ')); submitData.append('interests', interests.join(', ')); submitData.append('partnerInterests', formData.partnerInterests);
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const computedAge = Math.abs(new Date(Date.now() - birthDate.getTime()).getUTCFullYear() - 1970);
      submitData.append('age', computedAge);
    }
    if (profilePhoto) submitData.append('profilePhoto', profilePhoto);
    additionalFiles.forEach(f => submitData.append('additionalPhotos', f));
    try {
      const res = await fetch(`${API_BASE_URL}/api/profiles/setup`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: submitData });
      const data = await res.json();
      if (res.ok) { updateProfileContext(data); navigate('/matches'); } else setErrorStr(data.errors?.[0]?.message || data.message || "Something went wrong.");
    } catch { setErrorStr("Failed to connect to server."); }
    finally { setIsSubmitting(false); }
  };

  const steps = [
    { id: 1, title: 'Basic Info', subtitle: 'Tell us who you are', icon: <UserIcon /> },
    { id: 2, title: 'Personal', subtitle: 'Religion, location & more', icon: <SparklesIcon /> },
    { id: 3, title: 'Career', subtitle: 'Education & profession', icon: <BriefcaseIcon /> },
    { id: 4, title: 'Family', subtitle: 'Your family details', icon: <HomeIcon /> },
    { id: 5, title: 'Interests', subtitle: 'Personality & hobbies', icon: <HeartIcon /> },
    { id: 6, title: 'Photos', subtitle: 'Show your best self', icon: <CameraIcon /> },
  ];

  const cur = steps.find(s => s.id === currentStep);

  return (
    <>
      {/* ── Fixed Background (outside flex layout) ───────────────────── */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100/80" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-rose-200/15 rounded-full blur-3xl" />
        {bgHearts.map((h, i) => (
          <FloatingHeart key={i} size={h.size} style={{ left: h.left, top: h.top, animationDelay: h.delay, animationDuration: h.duration, color: '#f9a8b8', opacity: 0.45 }} />
        ))}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #fecdd3 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      </div>

      {/* ── Header (fixed, outside flex layout) ──────────────────────── */}
      <Header />

      {/* ── Page Layout ──────────────────────────────────────────────── */}
      <div className="min-h-screen flex flex-col" style={{ margin: 0, padding: 0 }}>


        {/* ── Main ───────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 relative z-10 pt-2 pb-12">
          <div className="w-full max-w-3xl" style={{ animation: 'fade-in-up 0.5s ease-out forwards' }}>

            {/* ── Title ───────────────────────────────────────────────── */}
            <div className="text-center mb-4">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-800 mb-1">
                Step {currentStep}: {cur.title}
              </h2>
              <p className="text-gray-400 text-sm md:text-base">{cur.subtitle} 💕</p>
            </div>

            {/* ── Progress ────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-6 px-1 sm:px-4">
              {steps.map((step, idx) => (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 
                      ${currentStep > step.id
                        ? 'bg-green-500 border-green-500 text-white shadow-md shadow-green-200/50'
                        : currentStep === step.id
                          ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200/60 scale-110'
                          : 'bg-white/80 border-gray-200 text-gray-300'}`}>
                      {currentStep > step.id ? <CheckIcon /> : step.icon}
                    </div>
                    <span className={`text-[10px] md:text-xs font-semibold transition-colors hidden sm:block 
                      ${currentStep === step.id ? 'text-rose-600' : currentStep > step.id ? 'text-green-600' : 'text-gray-300'}`}>
                      {step.title}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="flex-1 mx-1 md:mx-2 h-0.5 rounded-full transition-all duration-500"
                      style={{ background: currentStep > step.id + 0 ? '#22c55e' : currentStep === step.id + 1 ? 'linear-gradient(90deg,#22c55e,#e5e7eb)' : '#e5e7eb' }} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* ── Error ───────────────────────────────────────────────── */}
            {errorStr && (
              <div className="mb-6 text-center text-sm font-semibold text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-200"
                style={{ animation: 'shake 0.4s ease-in-out' }}>
                ⚠️ {errorStr}
              </div>
            )}

            {/* ── Card ────────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit}>
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-rose-100/40 border border-rose-100/60 p-8 sm:p-10 md:p-12"
                style={{ animation: 'slide-in 0.35s ease-out forwards' }} key={currentStep}>

                {/* ═══ STEP 1 ═══ */}
                {currentStep === 1 && (
                  <div className="space-y-7">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Full Name</label>
                      <input type="text" name="name" value={formData.name} onChange={handleChange}
                        required placeholder="Enter your full name" className={inputClasses} style={{ outline: 'none' }} />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3 ml-1">Gender</label>
                      <div className="grid grid-cols-2 gap-4">
                        {['Male', 'Female'].map(g => (
                          <button key={g} type="button" onClick={() => setFormData({ ...formData, gender: g })}
                            className={`py-4 rounded-xl border-2 font-semibold text-sm transition-all 
                              ${formData.gender === g
                                ? 'bg-rose-50 border-rose-400 text-rose-600 shadow-sm shadow-rose-100'
                                : 'bg-white/60 border-gray-200 text-gray-400 hover:border-rose-200 hover:bg-rose-50/30'}`}>
                            {g === 'Male' ? '♂️ Male' : '♀️ Female'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Date of Birth</label>
                      <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange}
                        required className={inputClasses} style={{ outline: 'none' }} />
                      <p className="text-xs text-gray-400 mt-1.5 ml-1 italic">Format: DD-MMM-YYYY (e.g., 25-Aug-1995)</p>
                    </div>
                  </div>
                )}

                {/* ═══ STEP 2 ═══ */}
                {currentStep === 2 && (
                  <div className="space-y-7">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <SearchableDropdown label="Religion" name="religion" value={formData.religion} options={religionOptions} onChange={handleChange} />
                      <SearchableDropdown label="Caste" name="caste" value={formData.caste} options={casteOptions} onChange={handleChange} placeholder="e.g. Brahmin, Rajput" />
                      <SearchableDropdown label="Mother Tongue" name="motherTongue" value={formData.motherTongue} options={languageOptions} onChange={handleChange} placeholder="e.g. Hindi, English" />
                    </div>

                    <div className="pt-5 border-t border-rose-100/60">
                      <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4 ml-1">✨ Horoscope Details (Guna Milan)</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                        <select name="rashi" value={formData.rashi} onChange={handleChange} 
                          className={`${inputClasses} cursor-pointer ${formData.nakshatra && formData.pada ? 'bg-gray-100/50' : ''}`}
                          disabled={!!(formData.nakshatra && formData.pada)}>
                          <option value="">Select Rashi</option>
                          {RASHIS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <select name="nakshatra" value={formData.nakshatra} onChange={handleChange} className={`${inputClasses} cursor-pointer`}>
                          <option value="">Select Nakshatra</option>
                          {NAKSHATRAS.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <select name="pada" value={formData.pada} onChange={handleChange} className={`${inputClasses} cursor-pointer`}>
                          <option value="">Select Pada</option>
                          <option value="1">1st Pada</option>
                          <option value="2">2nd Pada</option>
                          <option value="3">3rd Pada</option>
                          <option value="4">4th Pada</option>
                        </select>
                        <input type="text" name="gotra" value={formData.gotra} onChange={handleChange}
                          placeholder="Gotra (Optional)" className={inputClasses} style={{ outline: 'none' }} />
                        <select name="manglik" value={formData.manglik} onChange={handleChange} className={`${inputClasses} cursor-pointer`}>
                          <option value="Unknown">Manglik? (Don't Know)</option>
                          <option value="No">Non-Manglik</option>
                          <option value="Yes">Manglik</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-5 border-t border-rose-100/60">
                      <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4 ml-1">📍 Current Residence</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <SearchableDropdown label="State" name="currentState" value={formData.currentState} options={stateOptions} onChange={handleChange} placeholder="Select state..." />
                        <SearchableDropdown label="City" name="currentCity" value={formData.currentCity} options={curCityOptions} onChange={handleChange} placeholder="Select city..." disabled={!formData.currentState} minChars={2} />
                      </div>
                    </div>

                    <div className="pt-5 border-t border-rose-100/60">
                      <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4 ml-1">🏡 Native / Hometown</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <SearchableDropdown label="State" name="nativeState" value={formData.nativeState} options={stateOptions} onChange={handleChange} placeholder="Select state..." />
                        <SearchableDropdown label="City" name="nativeCity" value={formData.nativeCity} options={natCityOptions} onChange={handleChange} placeholder="Select city..." disabled={!formData.nativeState} minChars={2} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Height</label>
                      <input type="text" name="height" value={formData.height} onChange={handleChange}
                        className={inputClasses} style={{ outline: 'none' }} />
                    </div>
                  </div>
                )}

                {/* ═══ STEP 3 ═══ */}
                {currentStep === 3 && (
                  <div className="space-y-7">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Highest Education</label>
                        <input type="text" name="education" value={formData.education} onChange={handleChange}
                          placeholder="e.g. MBA, B.Tech, MBBS" className={inputClasses} style={{ outline: 'none' }} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Profession</label>
                        <input type="text" name="profession" value={formData.profession} onChange={handleChange}
                          placeholder="e.g. Software Engineer" className={inputClasses} style={{ outline: 'none' }} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">About Myself</label>
                      <textarea name="bio" value={formData.bio} onChange={handleChange} rows="5"
                        className={`${inputClasses} resize-none`} style={{ outline: 'none' }}
                        placeholder="Write a brief introduction about yourself — your values, what you enjoy, your life goals..."></textarea>
                      <p className="text-xs text-gray-400 mt-1.5 ml-1">{formData.bio.length}/500 characters</p>
                    </div>
                  </div>
                )}

                {/* ═══ STEP 4 ═══ */}
                {currentStep === 4 && (
                  <div className="space-y-7">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Father's Name</label>
                        <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange}
                          placeholder="Enter father's name" className={inputClasses} style={{ outline: 'none' }} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Mother's Name</label>
                        <input type="text" name="motherName" value={formData.motherName} onChange={handleChange}
                          placeholder="Enter mother's name" className={inputClasses} style={{ outline: 'none' }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Number of Siblings</label>
                        <input type="number" name="siblings" value={formData.siblings} onChange={handleChange}
                          className={inputClasses} style={{ outline: 'none' }} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Family Type</label>
                        <select name="familyType" value={formData.familyType} onChange={handleChange}
                          className={`${inputClasses} cursor-pointer`} style={{ outline: 'none' }}>
                          <option value="Nuclear">Nuclear Family</option>
                          <option value="Joint">Joint Family</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══ STEP 5 ═══ */}
                {currentStep === 5 && (
                  <div className="space-y-8">
                    {/* Traits */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-4 ml-1">🧠 Personality Traits</label>
                      <div className="flex flex-wrap gap-2.5 mb-4">
                        {PREDEFINED_TRAITS.map(t => (
                          <button key={t} type="button" onClick={() => toggleTrait(t)}
                            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border 
                            ${traits.includes(t)
                                ? 'bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-200'
                                : 'bg-white/70 border-gray-200 text-gray-500 hover:border-rose-300 hover:bg-rose-50/50'}`}>
                            {t}
                          </button>
                        ))}
                        {traits.filter(t => !PREDEFINED_TRAITS.includes(t)).map(t => (
                          <button key={t} type="button" onClick={() => toggleTrait(t)}
                            className="px-4 py-2 rounded-full text-xs font-semibold bg-rose-500 border border-rose-500 text-white shadow-sm flex items-center gap-1.5">
                            {t} <XIcon />
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <input type="text" value={customTrait} onChange={e => setCustomTrait(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTrait(e); } }}
                          placeholder="Add a custom trait..." className={`flex-1 ${inputClasses}`} style={{ outline: 'none' }} />
                        <button onClick={addCustomTrait} type="button"
                          className="px-5 py-3 bg-gray-800 text-white font-semibold rounded-xl text-sm hover:bg-gray-900 transition-all whitespace-nowrap">Add</button>
                      </div>
                    </div>

                    {/* Interests */}
                    <div className="pt-6 border-t border-rose-100/60">
                      <label className="block text-sm font-semibold text-gray-700 mb-4 ml-1">🎯 Interests & Hobbies</label>
                      <div className="flex flex-wrap gap-2.5 mb-4">
                        {PREDEFINED_INTERESTS.map(i => (
                          <button key={i} type="button" onClick={() => toggleInterest(i)}
                            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border
                            ${interests.includes(i)
                                ? 'bg-pink-500 border-pink-500 text-white shadow-sm shadow-pink-200'
                                : 'bg-white/70 border-gray-200 text-gray-500 hover:border-pink-300 hover:bg-pink-50/50'}`}>
                            {i}
                          </button>
                        ))}
                        {interests.filter(i => !PREDEFINED_INTERESTS.includes(i)).map(i => (
                          <button key={i} type="button" onClick={() => toggleInterest(i)}
                            className="px-4 py-2 rounded-full text-xs font-semibold bg-pink-500 border border-pink-500 text-white shadow-sm flex items-center gap-1.5">
                            {i} <XIcon />
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <input type="text" value={customInterest} onChange={e => setCustomInterest(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomInterest(e); } }}
                          placeholder="Add a custom interest..." className={`flex-1 ${inputClasses}`} style={{ outline: 'none' }} />
                        <button onClick={addCustomInterest} type="button"
                          className="px-5 py-3 bg-gray-800 text-white font-semibold rounded-xl text-sm hover:bg-gray-900 transition-all whitespace-nowrap">Add</button>
                      </div>
                    </div>

                    {/* Partner Preferences */}
                    <div className="pt-6 border-t border-rose-100/60">
                      <div className="bg-gradient-to-br from-rose-50/80 to-pink-50/80 p-6 md:p-8 rounded-2xl border border-rose-100/50">
                        <label className="block text-sm font-semibold text-gray-800 mb-1 flex items-center gap-2">
                          <HeartIcon /> Ideal Partner Qualities
                        </label>
                        <p className="text-xs text-gray-400 mb-4 ml-1">Describe the personality and hobbies you seek in your partner.</p>
                        <textarea name="partnerInterests" value={formData.partnerInterests} onChange={handleChange} rows="4"
                          className="w-full px-4 py-3.5 rounded-xl border border-white bg-white/80 focus:bg-white focus:ring-2 focus:ring-rose-400 transition-all text-sm text-gray-800 resize-none shadow-sm"
                          style={{ outline: 'none' }}
                          placeholder="e.g. Someone who loves trekking, has a calm personality, values family..."></textarea>
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══ STEP 6 ═══ */}
                {currentStep === 6 && (
                  <div className="space-y-8">
                    {/* Profile Photo */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-4 ml-1 flex items-center gap-2">
                        <span className="w-7 h-7 bg-rose-100 flex items-center justify-center rounded-lg text-rose-500 text-xs font-bold">1</span>
                        Primary Profile Photo
                      </label>
                      <div className="flex flex-col items-center gap-6">
                        <div
                          className="relative w-44 h-44 md:w-52 md:h-52 rounded-2xl border-2 border-dashed border-rose-300 flex flex-col items-center justify-center cursor-pointer hover:bg-rose-50/30 overflow-hidden transition-all group"
                          onClick={() => document.getElementById('profile-file').click()}>
                          {profilePhotoPreview ? (
                            <>
                              <img src={profilePhotoPreview} className="w-full h-full object-cover" alt="Profile" />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-white text-sm font-semibold bg-black/40 px-3 py-1.5 rounded-lg">Change Photo</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center text-rose-400 gap-2">
                              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center"><CameraIcon /></div>
                              <span className="text-xs font-semibold">Click to Upload</span>
                              <span className="text-[10px] text-gray-400">JPG, PNG up to 5MB</span>
                            </div>
                          )}
                          <input id="profile-file" type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoChange(e, 'profile')} />
                        </div>
                        
                        <button 
                          type="button"
                          onClick={() => setIsCameraOpen(true)}
                          className="flex items-center gap-2 px-6 py-3 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold text-xs hover:bg-rose-50 transition-all shadow-sm"
                        >
                          <CameraIcon />
                          Take Photo with Camera
                        </button>
                      </div>
                    </div>

                    {/* Gallery */}
                    <div className="pt-6 border-t border-rose-100/60">
                      <label className="block text-sm font-semibold text-gray-700 mb-4 ml-1 flex items-center gap-2">
                        <span className="w-7 h-7 bg-pink-100 flex items-center justify-center rounded-lg text-pink-500 text-xs font-bold">2</span>
                        Gallery Photos
                        <span className="text-gray-400 font-normal text-xs">({additionalFiles.length}/5)</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {additionalPreviews.map((src, idx) => (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden shadow-sm group border border-rose-100">
                            <img src={src} className="w-full h-full object-cover" alt="Gallery" />
                            <button type="button" onClick={() => removePhoto(idx)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                              <XIcon />
                            </button>
                          </div>
                        ))}
                        {additionalFiles.length < 5 && (
                          <button type="button" onClick={() => document.getElementById('extra-files').click()}
                            className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-pink-300 hover:bg-pink-50/30 transition-all text-xs gap-2 font-semibold">
                            <CameraIcon />
                            Add Photo
                          </button>
                        )}
                        <input id="extra-files" type="file" className="hidden" multiple accept="image/*" onChange={(e) => handlePhotoChange(e, 'extra')} />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Nav Buttons ─────────────────────────────────────── */}
                <div className={`flex items-center pt-10 ${currentStep > 1 ? 'justify-between' : 'justify-end'}`}>
                  {currentStep > 1 && (
                    <button type="button" onClick={prevStep}
                      className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-gray-500 hover:bg-white/60 border border-gray-200 transition-all">
                      <ChevronLeft /> Back
                    </button>
                  )}
                  {currentStep < 6 ? (
                    <button type="button" onClick={nextStep}
                      className="flex items-center gap-2 px-10 py-3.5 bg-rose-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-rose-200/50 hover:bg-rose-700 hover:-translate-y-0.5 transition-all">
                      Continue <ChevronRight />
                    </button>
                  ) : (
                    <button type="submit" disabled={isSubmitting}
                      className={`flex items-center gap-2 px-12 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold shadow-xl shadow-rose-200/50 hover:-translate-y-0.5 transition-all 
                      ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}>
                      {isSubmitting ? (
                        <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Finalizing...</>
                      ) : 'Complete Profile 🚀'}
                    </button>
                  )}
                </div>

              </div>
            </form>

            {/* ── Footer (inside flex container, pushed to end by flex-1 on main) ── */}
            <footer className="shrink-0 py-8 text-center relative z-10 w-full">
              <p className="text-xs text-gray-400 font-medium tracking-wide">
                © 2026 <span className="text-rose-400">Subhalagna</span>. All rights reserved.
              </p>
            </footer>

          </div>
        </main>
      </div>

      <CaptureModal 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapture}
      />
    </>
  );
};

export default CreateProfile;
