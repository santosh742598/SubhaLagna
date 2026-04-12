/**
 * @fileoverview SubhaLagna v2.3.0 — Match Results
 * @description   Displays compatible profiles based on user's preferences.
 *                v2.0.0 changes:
 *                  - Centralized data fetching via profileService
 *                  - Server-side pagination and sorting
 *                  - Unified Header component
 */

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import ProfileCard from './ProfileCard';
import { getMatches } from '../services/profileService';
import Header from './Header';
import SearchableDropdown from './SearchableDropdown';
import { fetchLookupOptions } from '../services/lookupService';

// ─── Shared Icons ──────────────────────────────────────────────────────────
const Sparkles = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

// ─── Filter Tag Component ───────────────────────────────────────────────────
const FilterTag = ({ label, value, onClear }) => {
  if (value === 'Any' || !value) return null;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-50 text-pink-600 border border-pink-100 rounded-full text-xs font-semibold">
      <span className="opacity-60">{label}:</span> {value}
      <button onClick={onClear} className="hover:text-pink-800 transition-colors">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </span>
  );
};

// ─── Skeleton Card Component ──────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-3xl border border-pink-100/50 overflow-hidden shadow-sm animate-pulse">
    <div className="h-64 bg-slate-100" />
    <div className="p-6 space-y-3">
      <div className="h-4 bg-slate-100 rounded-full w-3/4" />
      <div className="h-3 bg-slate-50 rounded-full w-1/2" />
      <div className="flex gap-2 pt-2">
        <div className="h-6 bg-slate-50 rounded-full w-16" />
        <div className="h-6 bg-slate-50 rounded-full w-16" />
      </div>
    </div>
  </div>
);

const MatchResults = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [matches, setMatches] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(() => {
    // ── Smart Initialization from Partner Preferences ──────────────────
    const prefs = user?.profile?.partnerPreferences || {};
    return {
      minAge: Number(prefs.ageRange?.min) || Number(prefs.minAge) || 18,
      maxAge: Number(prefs.ageRange?.max) || Number(prefs.maxAge) || 45,
      location: prefs.location || 'Any',
      education: 'Any',
      religion: prefs.religion || 'Any',
      caste: prefs.caste || 'Any',
      motherTongue: 'Any',
      manglik: 'Any'
    };
  });
  const [sortBy, setSortBy] = useState('compatibility');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasPreferences, setHasPreferences] = useState(!!user?.profile?.partnerPreferences);

  // Master Data Options
  const [cityOptions, setCityOptions] = useState([]);
  const [religionOptions, setReligionOptions] = useState([]);
  const [casteOptions, setCasteOptions] = useState([]);
  const [motherTongueOptions, setMotherTongueOptions] = useState([]);

  useEffect(() => {
    fetchLookupOptions('city').then(setCityOptions);
    fetchLookupOptions('religion').then(setReligionOptions);
    fetchLookupOptions('caste').then(setCasteOptions);
    fetchLookupOptions('motherTongue').then(setMotherTongueOptions);
  }, []);

  /**
   * Fetch matches using profileService.
   */
  const fetchMatches = useCallback(async (page = 1) => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      // ── Determine Target Gender ──────────────────────────────────────────
      // Male users search for Females, Female users search for Males.
      // Resolve user's actual gender from profile if not in account
      const currentUserGender = user?.gender || user?.profile?.gender;
      const targetGender = currentUserGender === 'Male' ? 'Female' : 'Male';

      const response = await getMatches({
        page,
        limit: 12,
        gender: targetGender, // Strict enforcement
        minAge: filters.minAge,
        maxAge: filters.maxAge,
        location: filters.location === 'Any' ? undefined : filters.location,
        education: filters.education === 'Any' ? undefined : filters.education,
        religion: filters.religion === 'Any' ? undefined : filters.religion,
        caste: filters.caste === 'Any' ? undefined : filters.caste,
        motherTongue: filters.motherTongue === 'Any' ? undefined : filters.motherTongue,
        manglik: filters.manglik === 'Any' ? undefined : filters.manglik,
        sortBy
      });
      
      if (page === 1) {
        setMatches(response.data);
      } else {
        setMatches(prev => [...prev, ...response.data]);
      }
      setPagination(response.pagination);
    } catch (err) {
      console.error('Fetch Matches Error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, filters, sortBy]);

  useEffect(() => {
    fetchMatches(1);
  }, [fetchMatches]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilter = (name) => {
    if (name === 'age') {
      setFilters(prev => ({ ...prev, minAge: 18, maxAge: 45 }));
    } else {
      setFilters(prev => ({ ...prev, [name]: 'Any' }));
    }
  };

  const activeFilterCount = Object.entries(filters).filter(([k,v]) => {
    if (k === 'minAge') return Number(v) !== 18;
    if (k === 'maxAge') return Number(v) !== 45;
    return v !== 'Any';
  }).length;

  // Filter local results based on search query (client-side for instant feel)
  const filteredMatches = matches.filter(m => 
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Header />

      {/* ── Hero Banner ── */}
      <div className="bg-gradient-to-br from-pink-500 to-rose-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] bg-[size:24px_24px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">Find Your Perfect Match</h1>
            <p className="text-pink-100 max-w-lg">
              Explore profiles tailored to your values and interests. Using our smart compatibility algorithm.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 inline-flex flex-col items-center">
            <span className="text-3xl font-bold">{pagination.total || 0}</span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-pink-100">Profiles Found</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* ── Filters Sidebar ── */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="bg-white rounded-3xl border border-pink-100/60 p-6 shadow-sm sticky top-28">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Quick Filters
                </h3>
                {activeFilterCount > 0 && (
                  <button onClick={() => setFilters({ minAge:18, maxAge:45, location:'Any', education:'Any', religion:'Any', caste: 'Any' })} 
                          className="text-xs font-bold text-pink-500 hover:text-pink-600">Reset</button>
                )}
              </div>

              <div className="space-y-6">
                {/* Age Range */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Age Range</label>
                  <div className="flex items-center gap-3">
                    <input type="number" name="minAge" value={filters.minAge} onChange={handleFilterChange} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 text-sm" />
                    <span className="text-slate-300">-</span>
                    <input type="number" name="maxAge" value={filters.maxAge} onChange={handleFilterChange} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 text-sm" />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <SearchableDropdown label="Location" name="location" value={filters.location} options={['Any', ...cityOptions]} onChange={handleFilterChange} placeholder="Search city..." />
                </div>

                 {/* Religion */}
                 <div className="space-y-1.5">
                  <SearchableDropdown label="Religion" name="religion" value={filters.religion} options={['Any', ...religionOptions]} onChange={handleFilterChange} />
                </div>

                {/* Caste */}
                <div className="space-y-1.5">
                  <SearchableDropdown label="Caste preference" name="caste" value={filters.caste} options={['Any', ...casteOptions]} onChange={handleFilterChange} placeholder="Brahmin, Any etc." />
                </div>

                {/* Mother Tongue */}
                <div className="space-y-1.5">
                  <SearchableDropdown label="Mother Tongue" name="motherTongue" value={filters.motherTongue} options={['Any', ...motherTongueOptions]} onChange={handleFilterChange} />
                </div>

                {/* Education */}
                <div className="space-y-1.5">
                  <SearchableDropdown label="Education" name="education" value={filters.education} options={['Any', "Bachelor's", "Master's", "PhD", "MBA", "Diploma", "High School"]} onChange={handleFilterChange} />
                </div>

                {/* Manglik Status */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Manglik Status</label>
                  <select 
                    name="manglik" 
                    value={filters.manglik} 
                    onChange={handleFilterChange}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-pink-500"
                  >
                    <option value="Any">Any</option>
                    <option value="true">Manglik Only</option>
                    <option value="false">Non-Manglik Only</option>
                  </select>
                </div>

                {/* Submit button (triggers fetch) */}
                <button 
                  onClick={() => fetchMatches(1)}
                  className="w-full py-3 bg-pink-500 text-white rounded-xl font-bold shadow-lg shadow-pink-100 hover:bg-pink-600 transition-all hover:-translate-y-0.5"
                >
                  Update Matches
                </button>
              </div>
            </div>
          </aside>

          {/* ── Results Main ── */}
          <main className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="bg-white rounded-3xl border border-pink-100/60 p-4 mb-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Seach by name..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto self-end md:self-auto">
                <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Sort By:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); fetchMatches(1); }}
                  className="bg-white border border-slate-100 rounded-xl px-3 py-2 text-sm font-semibold outline-none cursor-pointer"
                >
                  <option value="compatibility">Top Compatibility</option>
                  <option value="newest">Newest First</option>
                  <option value="age-asc">Age: Low to High</option>
                </select>
              </div>
            </div>

            {/* Active Tags */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-xs font-bold text-slate-400">Active Filters:</span>
                <FilterTag label="Age" value={`${filters.minAge}-${filters.maxAge}`} onClear={() => clearFilter('age')} />
                <FilterTag label="Location" value={filters.location} onClear={() => clearFilter('location')} />
                <FilterTag label="Religion" value={filters.religion} onClear={() => clearFilter('religion')} />
                <FilterTag label="Caste" value={filters.caste} onClear={() => clearFilter('caste')} />
                <FilterTag label="Language" value={filters.motherTongue} onClear={() => clearFilter('motherTongue')} />
                <FilterTag label="Education" value={filters.education} onClear={() => clearFilter('education')} />
                <FilterTag label="Manglik" value={filters.manglik === 'true' ? 'Yes' : filters.manglik === 'false' ? 'No' : ''} onClear={() => clearFilter('manglik')} />
              </div>
            )}

            {/* Personalized Banner */}
            {hasPreferences && (
              <div className="mb-6 px-6 py-3 bg-gradient-to-r from-rose-500/10 to-pink-500/5 rounded-2xl border border-rose-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-rose-500 text-white rounded-xl flex items-center justify-center animate-pulse">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Showing Personalized Matches</h4>
                    <p className="text-[10px] text-gray-500">Based on your saved partner preferences from your dashboard.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setHasPreferences(false)}
                  className="text-[10px] font-bold text-rose-500 hover:underline"
                >
                  Clear Preferences
                </button>
              </div>
            )}

            {/* Profiles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading && pagination.page === 1 ? (
                [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
              ) : filteredMatches.length > 0 ? (
                filteredMatches.map((profile, i) => (
                  <ProfileCard key={profile._id} profile={profile} index={i} />
                ))
              ) : (
                <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-pink-100/60 shadow-sm">
                   <div className="text-4xl mb-4">😿</div>
                   <h3 className="text-xl font-bold text-slate-800">No matches found</h3>
                   <p className="text-slate-400 text-sm mt-1">Try broadening your search filters.</p>
                </div>
              )}
            </div>

            {/* Load More */}
            {pagination.page < pagination.pages && (
              <div className="mt-12 text-center">
                <button 
                  onClick={() => fetchMatches(pagination.page + 1)}
                  disabled={loading}
                  className="px-8 py-3 bg-white border border-pink-100/60 text-pink-500 rounded-2xl font-bold shadow-sm hover:bg-pink-50 transition-all disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More Reliable Matches'}
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
      
      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-400 py-12 mt-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-medium">© 2026 SubhaLagna Matrimony. Finding love, one connection at a time.</p>
        </div>
      </footer>

      <style>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default MatchResults;
