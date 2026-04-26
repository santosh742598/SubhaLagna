/**
 * @file        SubhaLagna v3.3.2 — Shortlisted Profiles Page
 * @description   Displays a collection of profiles saved by the user.
 * @author        SubhaLagna Team
 * @version      3.3.2
 */

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getShortlistedProfiles, toggleShortlist } from '../services/shortlistService';
import ProfileCard from './ProfileCard';
import Header from './Header';
import { Link } from 'react-router-dom';

const ShortlistedProfiles = () => {
  const { token, refreshUser } = useContext(AuthContext);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadShortlisted();
  }, []);

  const loadShortlisted = async () => {
    try {
      setLoading(true);
      const data = await getShortlistedProfiles(token || localStorage.getItem('accessToken'));
      setProfiles(data);
    } catch (err) {
      setError(err || 'Failed to load shortlisted profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (profileId) => {
    try {
      await toggleShortlist(profileId, token || localStorage.getItem('accessToken'));
      setProfiles((prev) => prev.filter((p) => p._id !== profileId));
      if (refreshUser) refreshUser(); // Update global context count
    } catch (err) {
      alert(err || 'Failed to remove profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50/30 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-serif font-bold text-gray-800">Shortlisted Profiles</h1>
            <p className="text-gray-500 mt-1">
              Profiles you&apos;ve saved for future consideration.
            </p>
          </div>
          <Link
            to="/matches"
            className="px-6 py-2.5 bg-white border border-rose-100 text-rose-600 rounded-xl font-bold text-sm shadow-sm hover:bg-rose-50 transition-all flex items-center gap-2"
          >
            Find More Matches
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-6 rounded-2xl border border-rose-100 text-center mb-10">
            {error}
          </div>
        )}

        {profiles.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-16 border border-rose-100 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-400 mb-6 text-3xl">
              🔖
            </div>
            <h2 className="text-2xl font-serif font-bold text-gray-800 mb-2">
              Your Shortlist is Empty
            </h2>
            <p className="text-gray-500 max-w-sm mb-8">
              Start exploring matches and save the ones that catch your eye!
            </p>
            <Link
              to="/matches"
              className="px-10 py-4 bg-rose-600 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all"
            >
              Go to Matches
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {profiles.map((profile, index) => (
              <div key={profile._id} className="relative group">
                <ProfileCard profile={profile} index={index} />
                <button
                  onClick={() => handleRemove(profile._id)}
                  className="absolute top-4 right-4 z-20 p-2 bg-white/90 backdrop-blur-sm text-gray-400 hover:text-red-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all border border-rose-50"
                  title="Remove from shortlist"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ShortlistedProfiles;
