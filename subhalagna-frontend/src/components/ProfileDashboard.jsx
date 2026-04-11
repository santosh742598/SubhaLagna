 * @fileoverview SubhaLagna v2.2.0 — User Dashboard
 * @description   Central hub for users to manage their profile, view premium status,
 *                and handle incoming interest requests.
 *                v2.1.0 changes:
 *                  - Integrated Guna Milan data management (Nakshatra/Pada editing)
 *                  - Automated Rashi calculation and locking based on Pada mapping
 *                  - birth-details integrity for astrological matching
 *                v2.2.0 changes:
 *                  - Direct "Upgrade to Platinum" CTA for Gold members
 *                  - Enhanced Glassmorphism styling and performance
 * @version       2.2.0
 */

import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { updateProfile as updateProfileService } from '../services/profileService';
import { getMyInterests, respondToInterest } from '../services/interestService';
import { RASHIS, NAKSHATRAS, PADA_RASHI_MAP } from '../data/astrologyData.js';
import CaptureModal from './CaptureModal';
import { RAZORPAY_KEY_ID } from '../config';

const PREDEFINED_INTERESTS = ["Travel", "Music", "Cooking", "Photography", "Fitness", "Reading", "Movies", "Sports", "Art"];
const PREDEFINED_TRAITS = ["Introvert", "Extrovert", "Ambivert", "Ambitious", "Creative", "Organized", "Spontaneous", "Rational", "Empathetic"];

const formatDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

// Re-using consistent Icon style from the app
const Sparkles = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);
const Trash = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const Plus = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H12" />
  </svg>
);
const Heart = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);
const Check = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
  </svg>
);
const X = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const ShieldCheck = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
const Camera = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7a2 2 0 012-2h3.5l1-2h9l1 2H21a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
    <circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);

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

  // Multi-tag lists
  const [traits, setTraits] = useState([]);
  const [interestsList, setInterestsList] = useState([]);

  useEffect(() => {
    if (user?.profile) {
      setFormData({
        name:          user.profile.name || '',
        gender:        user.profile.gender || 'Male',
        location:      user.profile.location || '',
        dateOfBirth:   user.profile.horoscope?.dateOfBirth || '',
        caste:         user.profile.caste || '',
        religion:      user.profile.religion || '',
        education:     user.profile.education || '',
        profession:    user.profile.profession || '',
        bio:           user.profile.bio || '',
        height:        user.profile.height || '',
        motherTongue:  user.profile.motherTongue || '',
        // Horoscope
        rashi:         user.profile.horoscope?.rashi || '',
        nakshatra:     user.profile.horoscope?.nakshatra || '',
        pada:          user.profile.horoscope?.pada || '',
        gotra:         user.profile.horoscope?.gotra || '',
        manglik:       user.profile.horoscope?.manglik || false,
        // Privacy
        showPhotoTo:   user.profile.privacySettings?.showPhotoTo || 'everyone',
        showContactTo: user.profile.privacySettings?.showContactTo || 'premium_only',
        isProfileHidden: user.profile.privacySettings?.isProfileHidden || false,
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
        setFormData(prev => ({ ...prev, rashi: correctRashi }));
      }
    }
  }, [formData.nakshatra, formData.pada]);

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
      setInterests(prev => prev.filter(i => i._id !== id));
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
    setGalleryFiles(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setGalleryPreviews(prev => [...prev, ...newPreviews]);
  };

  const toggleTrait = (t) => setTraits(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const toggleInterest = (i) => setInterestsList(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  const handleRemoveExisting = (photoUrl) => setRemovePhotos(prev => [...prev, photoUrl]);
  const handleRemoveNew = (index) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg('Saving your changes...');
    
    const submitData = new FormData();
    Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
    submitData.append('traits', traits.join(', '));
    submitData.append('interests', interestsList.join(', '));
    if (file) submitData.append('profilePhoto', file);
    galleryFiles.forEach(f => submitData.append('additionalPhotos', f));
    if (removePhotos.length > 0) submitData.append('removePhotos', JSON.stringify(removePhotos));

    try {
      const updatedProfile = await updateProfileService(user.profile._id, submitData);
      setStatusMsg('Profile and gallery updated successfully! ✨');
      updateProfileContext(updatedProfile);
      setGalleryFiles([]); setGalleryPreviews([]); setRemovePhotos([]); setFile(null);
    } catch (err) {
      setStatusMsg(err || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setStatusMsg(''), 5000);
    }
  };
  
  const calculateProfileStrength = () => {
    if (!user?.profile) return 0;
    const fields = [
      user.profile.name, user.profile.horoscope?.dateOfBirth, user.profile.religion, 
      user.profile.location, user.profile.education, user.profile.profession, 
      user.profile.bio, user.profile.profilePhoto
    ];
    let score = fields.filter(f => f && f !== '—' && f !== '').length;
    if (user.profile.traits?.length > 0) score++;
    if (user.profile.interests?.length > 0) score++;
    if (user.profile.additionalPhotos?.length > 0) score++;
    
    return Math.round((score / 11) * 100);
  };

  const profileStrength = calculateProfileStrength();

  if (!user?.profile) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-400">
        <div className="w-12 h-12 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin mb-4" />
        <p>Initializing your dashboard...</p>
      </div>
    );
  }

  const existingGallery = (user.profile.additionalPhotos || []).filter(p => !removePhotos.includes(p));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in pb-32">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ══ Sidebar (Stats & Tabs) ══ */}
        <div className="lg:col-span-4 space-y-6">
          {/* Premium Status Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            
            <div className="relative z-10">
               <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-rose-500 rounded-xl">
                   <ShieldCheck className="w-6 h-6 text-white" />
                 </div>
                 <div>
                   <h3 className="font-bold text-lg leading-tight">{user.isPremium ? `${user.premiumPlan.toUpperCase()} MEMBER` : 'FREE PLAN'}</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Account Security: High</p>
                 </div>
               </div>

               {user.isPremium ? (
                 <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                       <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] block mb-1">Expires On</span>
                       <p className="text-sm font-bold text-rose-300">
                         {new Date(user.premiumExpires).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                       </p>
                    </div>
                    {user.premiumPlan === 'gold' && (
                       <>
                         <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] block mb-1">Contacts Left</span>
                            <div className="flex items-end gap-2">
                               <p className="text-2xl font-black text-white">{Math.max(0, 30 - (user.contactsViewed?.length || 0))}</p>
                               <p className="text-[10px] text-slate-400 pb-1">out of 30</p>
                            </div>
                            <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                               <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${Math.max(0, ((30 - (user.contactsViewed?.length || 0)) / 30) * 100)}%` }} />
                            </div>
                         </div>
                         <button onClick={() => window.location.href='/premium'} className="w-full py-3 mt-4 bg-white/10 hover:bg-white/20 text-white border border-rose-500/30 rounded-xl font-bold text-sm transition-all shadow-lg hover:border-rose-500/60 flex items-center justify-center gap-2">
                            <span>Upgrade to Platinum</span>
                            <span className="text-lg">✨</span>
                         </button>
                       </>
                    )}
                 </div>
               ) : (
                 <button onClick={() => window.location.href='/premium'} className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-rose-900/50">
                    Upgrade to Premium
                 </button>
               )}
            </div>
          </div>

          {/* Profile Strength Card */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-rose-100 shadow-sm relative overflow-hidden group">
             <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">Profile Strength</h3>
                <span className={`text-sm font-black ${profileStrength > 80 ? 'text-emerald-500' : profileStrength > 50 ? 'text-amber-500' : 'text-rose-500'}`}>
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
                  ? "💡 Tip: Complete your bio and add more photos to reach 100%!"
                  : "✨ Perfect! Your profile is fully optimized for matches."}
             </p>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-[2rem] p-3 border border-rose-100 shadow-sm space-y-2">
             <button 
               onClick={() => setActiveTab('profile')}
               className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-rose-50 text-rose-600' : 'text-gray-400 hover:bg-rose-50/50 hover:text-gray-600'}`}
             >
               <Sparkles className="w-5 h-5" /> Edit Profile Details
             </button>
             <button 
               onClick={() => setActiveTab('interests')}
               className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl font-bold text-sm transition-all ${activeTab === 'interests' ? 'bg-rose-50 text-rose-600' : 'text-gray-400 hover:bg-rose-50/50 hover:text-gray-600'}`}
             >
               <div className="relative">
                 <Heart className="w-5 h-5" />
                 {interests.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full" />}
               </div>
               Interests Received
             </button>
          </div>
        </div>

        {/* ══ Main Content (Forms/Inbox) ══ */}
        <div className="lg:col-span-8">
           {statusMsg && (
             <div className={`mb-8 p-5 rounded-2xl font-bold border transition-all animate-scale-in flex items-center gap-4 ${statusMsg.includes('successfully') || statusMsg.includes('accepted') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
               <span className={`w-3 h-3 rounded-full animate-pulse ${statusMsg.includes('successfully') ? 'bg-emerald-500' : 'bg-rose-500'}`} />
               {statusMsg}
             </div>
           )}

           {activeTab === 'profile' ? (
             <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-sm border border-rose-50">
               <form onSubmit={handleSubmit} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                     <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Identity (Locked)</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5 focus-within:opacity-100 opacity-60 transition-opacity">
                             <label className="text-[10px] font-bold text-gray-400 ml-1">NAME</label>
                             <input type="text" value={formData.name} disabled className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 text-xs font-bold cursor-not-allowed" />
                          </div>
                          <div className="space-y-1.5 focus-within:opacity-100 opacity-60 transition-opacity">
                             <label className="text-[10px] font-bold text-gray-400 ml-1">GENDER</label>
                             <input type="text" value={formData.gender} disabled className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 text-xs font-bold cursor-not-allowed" />
                          </div>
                        </div>

                        <div className="space-y-1.5 focus-within:opacity-100 opacity-60 transition-opacity">
                          <label className="text-[10px] font-bold text-gray-400 ml-1">DATE OF BIRTH</label>
                          <input type="text" value={formatDate(formData.dateOfBirth)} disabled className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 text-xs font-bold cursor-not-allowed" />
                        </div>

                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pt-4">Additional Info</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <input type="text" name="height" value={formData.height} onChange={handleChange} placeholder="Height" className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/30 text-sm font-medium" />
                          <input type="text" name="motherTongue" value={formData.motherTongue} onChange={handleChange} placeholder="Mother Tongue" className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/30 text-sm font-medium" />
                        </div>
                        <textarea name="bio" value={formData.bio} onChange={handleChange} rows="4" placeholder="Briefly describe yourself..." className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/30 text-sm font-medium" />
                     </div>

                     <div className="space-y-6">
                        <div className="bg-rose-50/30 p-6 rounded-[2rem] border border-rose-100/50">
                          <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-6">Profile Photo</h3>
                          <div className="flex flex-col sm:flex-row items-center gap-6">
                              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-xl flex-shrink-0">
                                 <img src={file ? URL.createObjectURL(file) : user.profile.profilePhoto} className="w-full h-full object-cover" alt="" />
                              </div>
                              <div className="flex flex-wrap gap-2">
                                 <label className="flex-1 text-center items-center justify-center gap-2 px-4 py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold text-xs cursor-pointer hover:bg-rose-50 transition-all shadow-sm">
                                    Change
                                    <input type="file" onChange={handleFileChange} className="hidden" />
                                 </label>
                                 <button 
                                   type="button" 
                                   onClick={() => setIsCameraOpen(true)}
                                   className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold text-xs hover:bg-rose-50 transition-all shadow-sm"
                                 >
                                    Camera
                                 </button>
                              </div>
                          </div>
                        </div>

                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Background</h3>
                        <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Current City, State" className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/30 text-sm font-medium" />
                        <input type="text" name="education" value={formData.education} onChange={handleChange} placeholder="Highest Education" className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/30 text-sm font-medium" />
                        <input type="text" name="profession" value={formData.profession} onChange={handleChange} placeholder="Profession" className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/30 text-sm font-medium" />
                        
                        <div className="pt-4 space-y-4">
                           <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                             <Sparkles className="w-3 h-3 text-rose-400" /> Horoscope (Guna Milan)
                           </h3>
                           <div className="grid grid-cols-2 gap-4">
                              <select name="rashi" value={formData.rashi} onChange={handleChange} 
                                className={`w-full px-5 py-3.5 rounded-xl border border-gray-100 text-sm font-medium cursor-pointer ${formData.nakshatra && formData.pada ? 'bg-gray-100/50' : 'bg-gray-50/30'}`}
                                disabled={!!(formData.nakshatra && formData.pada)}>
                                <option value="">Select Rashi</option>
                                {RASHIS.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                              <select name="nakshatra" value={formData.nakshatra} onChange={handleChange} className="w-full px-5 py-3.5 rounded-xl border border-gray-100 bg-gray-50/30 text-sm font-medium cursor-pointer">
                                <option value="">Select Nakshatra</option>
                                {NAKSHATRAS.map(n => <option key={n} value={n}>{n}</option>)}
                              </select>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <select name="pada" value={formData.pada} onChange={handleChange} className="w-full px-5 py-3.5 rounded-xl border border-gray-100 bg-gray-50/30 text-sm font-medium cursor-pointer">
                                <option value="">Select Pada</option>
                                <option value="1">1st Pada</option>
                                <option value="2">2nd Pada</option>
                                <option value="3">3rd Pada</option>
                                <option value="4">4th Pada</option>
                              </select>
                              <input type="text" name="gotra" value={formData.gotra} onChange={handleChange} placeholder="Gotra" className="w-full px-5 py-3.5 rounded-xl border border-gray-100 bg-gray-50/30 text-sm font-medium" />
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Personality Tags */}
                  <div className="pt-8 border-t border-rose-50 space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">Interests & Hobbies</label>
                           <div className="flex flex-wrap gap-2 mb-4">
                              {PREDEFINED_INTERESTS.map(i => (
                                <button key={i} type="button" onClick={() => toggleInterest(i)}
                                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border 
                                  ${interestsList.includes(i) ? 'bg-rose-500 border-rose-500 text-white' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-rose-200'}`}>
                                  {i}
                                </button>
                              ))}
                           </div>
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">Personality Traits</label>
                           <div className="flex flex-wrap gap-2 mb-4">
                              {PREDEFINED_TRAITS.map(t => (
                                <button key={t} type="button" onClick={() => toggleTrait(t)}
                                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border 
                                  ${traits.includes(t) ? 'bg-rose-500 border-rose-500 text-white' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-rose-200'}`}>
                                  {t}
                                </button>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Privacy Suite */}
                  <div className="bg-gradient-to-br from-rose-50/50 to-pink-50/50 p-8 rounded-[2.5rem] border border-rose-100 space-y-6">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-rose-500 text-white rounded-xl flex items-center justify-center">
                           <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Privacy & Security Controls</h3>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-gray-500 ml-1">PHOTO VISIBILITY</label>
                           <select name="showPhotoTo" value={formData.showPhotoTo} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl border-2 border-white bg-white/60 focus:bg-white transition-all text-sm font-bold text-gray-800">
                              <option value="everyone">Everyone (Public)</option>
                              <option value="interests_only">Only Accepted Connections (Frosted)</option>
                              <option value="none">Nobody (Max Stealth)</option>
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-gray-500 ml-1">CONTACT VISIBILITY</label>
                           <select name="showContactTo" value={formData.showContactTo} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl border-2 border-white bg-white/60 focus:bg-white transition-all text-sm font-bold text-gray-800">
                              <option value="premium_only">Premium Members Only</option>
                              <option value="interests_only">Only Accepted Connections</option>
                              <option value="none">Hidden from All</option>
                           </select>
                        </div>
                     </div>
                  </div>

                  {/* ── Gallery Photos ── */}
                  <div className="bg-rose-50/30 p-8 rounded-[2.5rem] border border-rose-100 mt-8 space-y-6">
                     <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-2">Gallery Photos</h3>
                     <p className="text-xs text-gray-400 mb-6 font-medium">Add up to 5 additional photos here to complete your profile.</p>
                     
                     <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        {existingGallery.map((photoUrl, idx) => (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden shadow-sm group border border-rose-100">
                            <img src={photoUrl} className="w-full h-full object-cover" alt="Gallery" />
                            <button type="button" onClick={() => handleRemoveExisting(photoUrl)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {galleryPreviews.map((src, idx) => (
                          <div key={'new-'+idx} className="relative aspect-square rounded-xl overflow-hidden shadow-sm group border border-emerald-100">
                            <img src={src} className="w-full h-full object-cover" alt="New Gallery" />
                            <button type="button" onClick={() => handleRemoveNew(idx)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                              <X className="w-3 h-3" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-emerald-500 text-white text-[9px] text-center font-bold py-0.5">NEW</div>
                          </div>
                        ))}
                        {(existingGallery.length + galleryFiles.length) < 5 && (
                          <label className="cursor-pointer aspect-square rounded-xl border-2 border-dashed border-rose-200 flex flex-col items-center justify-center text-rose-400 hover:bg-rose-50/50 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center mb-1"><Camera className="w-4 h-4" /></div>
                            <span className="text-[10px] font-bold">Add Photo</span>
                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleGalleryChange} />
                          </label>
                        )}
                     </div>
                  </div>

                  <div className="pt-6">
                     <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-gradient-to-r from-rose-600 to-pink-500 text-white rounded-2xl font-black shadow-xl shadow-rose-200 disabled:opacity-50">
                        {isSubmitting ? 'SAVING...' : 'UPDATE PROFILE'}
                     </button>
                  </div>
               </form>
             </div>
           ) : (
             <div className="space-y-4">
               <h2 className="text-2xl font-serif font-bold text-gray-800 mb-6">Pending Interests</h2>
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
                 interests.map(interest => (
                   <div key={interest._id} className="bg-white p-5 rounded-3xl border border-rose-100 shadow-sm flex items-center gap-6 hover:shadow-md transition-all group animate-fade-in">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                        <img src={interest.sender.profile?.profilePhoto || '/placeholder-profile.png'} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-800">{interest.sender.name}</h4>
                        <p className="text-gray-500 text-sm">{interest.sender.profile?.location || 'Location hidden'}</p>
                        {interest.message && <p className="text-gray-400 text-xs italic mt-1 line-clamp-1">"{interest.message}"</p>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleInterestAction(interest._id, 'rejected')} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all">
                          <X className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleInterestAction(interest._id, 'accepted')} className="p-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all">
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
