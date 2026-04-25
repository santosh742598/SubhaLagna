/**
 * @file        SubhaLagna v3.1.0 — Admin Dashboard
 * @description Comprehensive management interface for users, plans, and system state.
 *               v3.1.0 changes:
 *                 - Stabilized fetch logic with useCallback/useEffect hooks
 *                 - Resolved infinite render loops
 *                 - Modernized Tailwind v4 shorthand syntax
 * - v3.0.4 changes:
 *   - Implemented Admin Role Moderation (Promote/Demote users) with safety confirmations.
 *   - Integrated Role badges and toggle actions in User Moderation table.
 * - v2.4.0 changes:
 *   - Integrated Comprehensive Transaction Ledger (Full Payment History). [v2.4.0]
 *   - Integrated 3-state Manglik system (Yes, No, Unknown) in Add/Edit user flows. [v2.4.0]
 *   - Standardized Rashi selection logic in user management forms. [v2.4.0]
 * @version      3.1.0
 * @author        SubhaLagna Team
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  getDashboardStats,
  getAllUsers,
  toggleSuspendUser,
  toggleVerifyProfile,
  deleteUser,
  getAllCoupons,
  createCoupon,
  deleteCoupon,
  manualUpgradeUser,
  getPendingBankPayments,
  verifyBankPayment,
  getAdminPlans,
  getAllTransactions,
  adminAddUser,
  adminUpdateUser,
  adminUploadPhotos,
  updateUserRole,
  updateAdminPlan,
} from '../services/adminService';
import { getProfileAvatar } from '../utils/avatarHelper';
import { fetchLookupOptions } from '../services/lookupService';
import { RASHIS, NAKSHATRAS, PADAS, PADA_RASHI_MAP } from '../data/astrologyData';
import SearchableDropdown from './SearchableDropdown';

// ─── Shared Icons ────────────────────────────────────────────────────────────
const CreditCard = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

CreditCard.propTypes = {
  className: PropTypes.string,
};

const History = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

History.propTypes = {
  className: PropTypes.string,
};

// ─── Stat Card Component ─────────────────────────────────────────────────────
const StatCard = ({ label, value, delta, icon, color, isCurrency = false }) => (
  <div className="bg-white p-6 rounded-4xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-100 transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-opacity-100`}>{icon}</div>
      {delta && (
        <span
          className={`text-xs font-bold px-2 py-1 rounded-lg ${delta.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}
        >
          {delta}
        </span>
      )}
    </div>
    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">{label}</h3>
    <p className="text-3xl font-black text-gray-800 mt-1">
      {isCurrency ? `₹${(value || 0).toLocaleString()}` : value || 0}
    </p>
  </div>
);

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  delta: PropTypes.string,
  icon: PropTypes.node.isRequired,
  color: PropTypes.string.isRequired,
  isCurrency: PropTypes.bool,
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState(null);
  // loading is not currently used for UI feedback, but fetched in fetchData
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);

  // Users State
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [search, setSearch] = useState('');
  // setFilterRole is currently not used by UI controls
  // eslint-disable-next-line no-unused-vars
  const [filterRole, setFilterRole] = useState('all');

  // Manual Upgrade State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [upgradeForm, setUpgradeForm] = useState({ planId: 'gold', durationDays: '365' });
  const [coupons, setCoupons] = useState([]);
  const [plans, setPlans] = useState([]);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planForm, setPlanForm] = useState({ name: '', price: 0, durationInMonths: 0 });

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 10,
    expiryDate: '',
    usageLimit: 100,
  });

  // Ledger State
  const [transactions, setTransactions] = useState([]);

  // Payments State
  const [pendingPayments, setPendingPayments] = useState([]);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [verifyForm, setVerifyForm] = useState({ status: 'captured', adminRemarks: '' });

  // User Add/Edit Management State
  const [showUserModal, setShowUserModal] = useState(false);
  const [userFormMode, setUserFormMode] = useState('add'); // 'add' or 'edit'
  const [targetUserId, setTargetUserId] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    isPremium: false,
    premiumPlan: 'none',
    premiumExpires: '',
    profileData: {
      gender: 'Male',
      religion: 'Hindu',
      caste: '',
      currentCity: '',
      currentState: '',
      nativeCity: '',
      nativeState: '',
      education: 'Graduate',
      profession: 'Professional',
      height: '5\' 5"',
      bio: '',
      motherTongue: '',
      family: { fatherName: '', motherName: '', siblings: '0', familyType: 'Nuclear' },
      horoscope: {
        dateOfBirth: '',
        timeOfBirth: '',
        placeOfBirth: '',
        rashi: '',
        nakshatra: '',
        pada: '',
        gotra: '',
        manglik: 'Unknown',
      },
    },
  });
  const [userModalTab, setUserModalTab] = useState('account');
  const [photoFiles, setPhotoFiles] = useState({ profilePhoto: null, additionalPhotos: [] });
  const [isUploading, setIsUploading] = useState(false);

  // Master Data Options for Modals
  const [religionOptions, setReligionOptions] = useState([]);
  const [casteOptions, setCasteOptions] = useState([]);
  const [languageOptions, setLanguageOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [curCityOptions, setCurCityOptions] = useState([]);
  const [natCityOptions, setNatCityOptions] = useState([]);

  const handleManualUpgrade = async (e) => {
    e.preventDefault();
    try {
      await manualUpgradeUser(selectedUser._id, upgradeForm);
      setShowUpgradeModal(false);
      fetchData(pagination.page);
      alert('User upgraded successfully!');
    } catch (err) {
      alert(err);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      await createCoupon(newCoupon);
      setNewCoupon({
        code: '',
        discountType: 'percentage',
        discountValue: 10,
        expiryDate: '',
        usageLimit: 100,
      });
      fetchCoupons();
      alert('Coupon created!');
    } catch (err) {
      alert(err);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await deleteCoupon(id);
      fetchCoupons();
    } catch (err) {
      alert(err);
    }
  };

  const fetchData = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const [statsData, usersData] = await Promise.all([
          getDashboardStats(),
          getAllUsers({
            page,
            limit: 10,
            search,
            role: filterRole === 'all' ? undefined : filterRole,
          }),
        ]);
        setStats(statsData);
        setUsers(usersData.data);
        setPagination(usersData.pagination);
      } catch (err) {
        console.error(err);
        alert('Failed to fetch dashboard data: ' + err);
      } finally {
        setLoading(false);
      }
    },
    [search, filterRole],
  );

  const fetchCoupons = useCallback(async () => {
    try {
      const data = await getAllCoupons();
      setCoupons(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      const pending = await getPendingBankPayments();
      const ledger = await getAllTransactions();
      setPendingPayments(pending);
      setTransactions(ledger);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    try {
      const data = await getAdminPlans();
      setPlans(data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch plans: ' + err);
    }
  }, []);

  useEffect(() => {
    fetchPlans(); // Fetch plans on mount for modals
  }, [fetchPlans]);

  // Auto-fill Manual Upgrade duration
  useEffect(() => {
    if (upgradeForm.planId && plans.length > 0) {
      const plan = plans.find((p) => p.planId === upgradeForm.planId);
      if (plan) {
        // months * 30 days approximation, 0 = 36500 (approx lifetime)
        const days = plan.durationInMonths === 0 ? 36500 : plan.durationInMonths * 30;
        setUpgradeForm((prev) => ({ ...prev, durationDays: days.toString() }));
      }
    }
  }, [upgradeForm.planId, plans]);

  // Load Lookups for User Form
  useEffect(() => {
    const loadLookups = async () => {
      const [r, l, s, c] = await Promise.all([
        fetchLookupOptions('religion'),
        fetchLookupOptions('motherTongue'),
        fetchLookupOptions('state'),
        fetchLookupOptions('caste'),
      ]);
      setReligionOptions(r);
      setLanguageOptions(l);
      setStateOptions(s);
      setCasteOptions(c);
    };
    loadLookups();
  }, []);

  // Fetch Cities (Current)
  useEffect(() => {
    if (userForm.profileData.currentState) {
      fetchLookupOptions('city', userForm.profileData.currentState).then(setCurCityOptions);
    }
  }, [userForm.profileData.currentState]);

  // Fetch Cities (Native)
  useEffect(() => {
    if (userForm.profileData.nativeState) {
      fetchLookupOptions('city', userForm.profileData.nativeState).then(setNatCityOptions);
    }
  }, [userForm.profileData.nativeState]);

  // Auto-Rashi Logic for Admin Form
  useEffect(() => {
    const { nakshatra, pada, rashi } = userForm.profileData.horoscope || {};
    if (nakshatra && pada) {
      const correctRashi = PADA_RASHI_MAP[nakshatra]?.[pada];
      if (correctRashi && rashi !== correctRashi) {
        setUserForm((prev) => ({
          ...prev,
          profileData: {
            ...prev.profileData,
            horoscope: {
              ...prev.profileData.horoscope,
              rashi: correctRashi,
            },
          },
        }));
      }
    }
  }, [userForm.profileData.horoscope]);

  useEffect(() => {
    if (activeTab === 'users') fetchData();
    if (activeTab === 'coupons') fetchCoupons();
    if (activeTab === 'payments') fetchPayments();
    if (activeTab === 'membership_plans') fetchPlans();
  }, [search, filterRole, activeTab, fetchData, fetchCoupons, fetchPayments, fetchPlans]);

  const handleAction = async (actionFn, id) => {
    if (
      actionFn === deleteUser &&
      !window.confirm('Are you sure you want to PERMANENTLY delete this user?')
    )
      return;
    try {
      await actionFn(id);
      fetchData(pagination.page);
    } catch (err) {
      alert(err);
    }
  };

  const handleVerifyPayment = async (e) => {
    e.preventDefault();
    try {
      await verifyBankPayment(selectedPayment._id, verifyForm);
      setShowVerifyModal(false);
      fetchPayments();
      fetchData(); // Refresh stats
      alert(`Payment ${verifyForm.status === 'captured' ? 'Approved' : 'Rejected'}!`);
    } catch (err) {
      alert(err);
    }
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      await updateAdminPlan(selectedPlan._id, planForm);
      setIsPlanModalOpen(false);
      fetchPlans();
      alert('Plan updated successfully! ✨');
    } catch (err) {
      alert(err);
    }
  };

  const handleUserFormChange = (e) => {
    const { name, value } = e.target;

    // Handle nested profileData fields
    if (name.startsWith('profile.')) {
      const field = name.split('.')[1];
      setUserForm((prev) => ({
        ...prev,
        profileData: {
          ...prev.profileData,
          [field]: value,
        },
      }));
    }
    // Handle nested family fields
    else if (name.startsWith('family.')) {
      const field = name.split('.')[1];
      setUserForm((prev) => ({
        ...prev,
        profileData: {
          ...prev.profileData,
          family: {
            ...prev.profileData.family,
            [field]: value,
          },
        },
      }));
    }
    // Handle nested horoscope fields
    else if (name.startsWith('horoscope.')) {
      const field = name.split('.')[1];
      setUserForm((prev) => ({
        ...prev,
        profileData: {
          ...prev.profileData,
          horoscope: {
            ...prev.profileData.horoscope,
            [field]: value,
          },
        },
      }));
    }
    // Top-level fields
    else {
      setUserForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleOpenAddUser = () => {
    setUserFormMode('add');
    setTargetUserId(null);
    setUserModalTab('account');
    setUserForm({
      name: '',
      email: '',
      password: '',
      role: 'user',
      isPremium: false,
      premiumPlan: 'none',
      premiumExpires: '',
      profileData: {
        gender: 'Male',
        religion: 'Hindu',
        caste: '',
        currentCity: '',
        currentState: '',
        nativeCity: '',
        nativeState: '',
        education: 'Graduate',
        profession: 'Professional',
        height: '5\' 5"',
        bio: '',
        motherTongue: '',
        family: { fatherName: '', motherName: '', siblings: '0', familyType: 'Nuclear' },
        horoscope: {
          dateOfBirth: '',
          timeOfBirth: '',
          placeOfBirth: '',
          rashi: '',
          nakshatra: '',
          pada: '',
          gotra: '',
          manglik: 'Unknown',
        },
      },
    });
    setPhotoFiles({ profilePhoto: null, additionalPhotos: [] });
    setShowUserModal(true);
  };

  const handleOpenEditUser = (user) => {
    const profile = user.profile || {};
    setUserFormMode('edit');
    setTargetUserId(user._id);
    setUserModalTab('account');
    setUserForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      isPremium: user.isPremium,
      premiumPlan: user.premiumPlan,
      premiumExpires: user.premiumExpires
        ? new Date(user.premiumExpires).toISOString().split('T')[0]
        : '',
      profileData: {
        gender: profile.gender || 'Male',
        religion: profile.religion || 'Hindu',
        caste: profile.caste || '',
        currentCity: profile.currentCity || '',
        currentState: profile.currentState || '',
        nativeCity: profile.nativeCity || '',
        nativeState: profile.nativeState || '',
        education: profile.education || 'Graduate',
        profession: profile.profession || 'Professional',
        height: profile.height || '5\' 5"',
        bio: profile.bio || '',
        motherTongue: profile.motherTongue || '',
        profilePhoto: profile.profilePhoto,
        family: profile.family || {
          fatherName: '',
          motherName: '',
          siblings: '0',
          familyType: 'Nuclear',
        },
        horoscope: {
          ...(profile.horoscope || {}),
          dateOfBirth: profile.horoscope?.dateOfBirth
            ? new Date(profile.horoscope.dateOfBirth).toISOString().split('T')[0]
            : '',
          manglik: profile.horoscope?.manglik || 'Unknown',
        },
      },
    });
    setPhotoFiles({ profilePhoto: null, additionalPhotos: [] });
    setShowUserModal(true);
  };

  const handleUploadPhotos = async (profileId) => {
    if (!photoFiles.profilePhoto && photoFiles.additionalPhotos.length === 0) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      if (photoFiles.profilePhoto) formData.append('profilePhoto', photoFiles.profilePhoto);
      photoFiles.additionalPhotos.forEach((file) => formData.append('additionalPhotos', file));

      await adminUploadPhotos(profileId, formData);
      alert('Photos uploaded successfully! 📸');
    } catch (err) {
      alert('Photo upload failed: ' + err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      let result;
      if (userFormMode === 'add') {
        result = await adminAddUser(userForm);
        alert('User created successfully! ✨');
        // If photos selected, upload them now using the new profile ID
        if (photoFiles.profilePhoto || photoFiles.additionalPhotos.length > 0) {
          await handleUploadPhotos(result.profile._id);
        }
      } else {
        result = await adminUpdateUser(targetUserId, userForm);
        alert('User updated successfully! ✨');
      }
      setShowUserModal(false);
      fetchData(pagination.page);
    } catch (err) {
      alert(err);
    }
  };

  const handleRoleUpdate = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const confirmMsg =
      newRole === 'admin'
        ? `🛡️ Are you sure you want to promote ${user.name} to ADMINISTRATOR?`
        : `⚠️ Are you sure you want to demote ${user.name} to a standard user?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await updateUserRole(user._id, newRole);
      fetchData(pagination.page);
      alert(`Success: ${user.name} is now a ${newRole}.`);
    } catch (err) {
      alert(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <main className="max-w-7xl mx-auto pt-10 pb-20">
        {/* ── Page Header ── */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-serif font-bold text-gray-800">Admin Dashboard v2.1</h1>
            <p className="text-gray-400 text-sm mt-1">Platform overview and commercial controls.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-100' : 'bg-white text-gray-400 border-gray-100'}`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${activeTab === 'payments' ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-100' : 'bg-white text-gray-400 border-gray-100'}`}
            >
              Pending Payments
              {pendingPayments.length > 0 && (
                <span className="ml-2 bg-white text-rose-600 px-1.5 py-0.5 rounded-md text-[9px]">
                  {pendingPayments.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${activeTab === 'coupons' ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-100' : 'bg-white text-gray-400 border-gray-100'}`}
            >
              Coupons
            </button>
            <button
              onClick={() => setActiveTab('membership_plans')}
              className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${activeTab === 'membership_plans' ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-100' : 'bg-white text-gray-400 border-gray-100'}`}
            >
              Membership Plans
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${activeTab === 'transactions' ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-100' : 'bg-white text-gray-400 border-gray-100'}`}
            >
              Transactions
            </button>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard
            label="Total Revenue"
            value={stats?.totalRevenue}
            isCurrency={true}
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path
                  fillRule="evenodd"
                  d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                  clipRule="evenodd"
                />
              </svg>
            }
            color="text-emerald-500"
          />
          <StatCard
            label="Today's Revenue"
            value={stats?.todayRevenue}
            isCurrency={true}
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
              </svg>
            }
            color="text-emerald-400"
          />
          <StatCard
            label="Total Users"
            value={stats?.totalUsers}
            delta={`+${stats?.newUsersToday || 0}`}
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            }
            color="text-blue-500"
          />
          <StatCard
            label="Verified"
            value={stats?.verifiedProfiles}
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
              </svg>
            }
            color="text-emerald-600"
          />
        </div>

        {activeTab === 'users' ? (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-xl font-serif font-bold text-gray-800">User Moderation</h3>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <input
                  type="text"
                  placeholder="Search Users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-64 bg-slate-50 border border-gray-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500 transition-all font-medium"
                />
                <button
                  onClick={handleOpenAddUser}
                  className="bg-rose-600 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-lg shadow-rose-100 hover:scale-105 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add New User
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <th className="px-8 py-4">User</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Premium</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-8 py-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg
                            className="w-8 h-8 text-slate-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-400 font-medium">No users match your criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 shadow-sm">
                              <img
                                src={getProfileAvatar(user.profile)}
                                className="w-full h-full object-cover"
                                alt=""
                                onError={(e) => {
                                  e.target.src = '/man.png';
                                }}
                              />
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 text-sm">{user.name}</p>
                              <p className="text-xs text-gray-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${user.isSuspended ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            />
                            <span className="text-sm font-medium text-gray-600">
                              {user.isSuspended ? 'Suspended' : 'Active'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              user.role === 'admin'
                                ? 'bg-indigo-100 text-indigo-600 border border-indigo-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          {user.isPremium ? (
                            <span className="text-amber-500 text-xs font-bold flex flex-col">
                              <span>👑 {user.premiumPlan.toUpperCase()}</span>
                              <span className="text-[9px] text-gray-400">
                                Exp: {new Date(user.premiumExpires).toLocaleDateString()}
                              </span>
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs font-medium">Free</span>
                          )}
                        </td>
                         <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRoleUpdate(user)}
                            className={`p-2 rounded-xl border transition-all ${
                              user.role === 'admin'
                                ? 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100'
                                : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100'
                            }`}
                            title={user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleOpenEditUser(user)}
                            className="p-2 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all"
                            title="Edit Account & Profile"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>
                          {user.profile?._id && (
                            <Link
                              to={`/profile/${user.profile._id}`}
                              className="p-2 rounded-xl border border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                              title="View Profile"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </Link>
                          )}
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUpgradeModal(true);
                            }}
                            className="p-2 rounded-xl border border-amber-100 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all"
                            title="Manual Upgrade"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 2a1 1 0 011 1v1h1a1 1 0 110 2H11v1a1 1 0 11-2 0V6H8a1 1 0 010-2h1V3a1 1 0 011-1z" />
                              <path d="M12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              user.profile?._id
                                ? handleAction(toggleVerifyProfile, user.profile._id)
                                : alert('User has not set up a matrimony profile yet.')
                            }
                            className={`p-2 rounded-xl border transition-all ${user.profile?.isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-white text-gray-300 hover:text-emerald-500'}`}
                            title="Verify"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2.166 4.999A11.954 11.954 0 0010 1.944a11.954 11.954 0 007.834 3.056 12.017 12.017 0 01-1.547 4.544 11.968 11.968 0 01-4.04 4.508A11.953 11.953 0 0110 16c-1.353 0-2.65-.224-3.868-.636a11.96 11.96 0 01-4.04-4.508 12.01 12.01 0 01-1.547-4.544l2.166-3.313a1 1 0 011.668.001zM9 11a1 1 0 100-2 1 1 0 000 2zm3-1a1 1 0 11-2 0 1 1 0 012 0z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleAction(toggleSuspendUser, user._id)}
                            className={`p-2 rounded-xl border transition-all ${user.isSuspended ? 'bg-rose-50 text-rose-600' : 'bg-white text-gray-300'}`}
                            title="Suspend"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleAction(deleteUser, user._id)}
                            className="p-2 rounded-xl border border-gray-200 text-gray-300 hover:bg-rose-600 hover:text-white transition-all"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'payments' ? (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50">
              <h3 className="text-xl font-serif font-bold text-gray-800">Pending Bank Transfers</h3>
              <p className="text-gray-400 text-xs mt-1">
                Review UTR numbers and UPI IDs to verify manual payments.
              </p>
            </div>
            {pendingPayments.length === 0 ? (
              <div className="p-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-slate-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-400 font-medium tracking-tight">
                  No pending payments to review.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto font-sans">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <th className="px-8 py-4">User</th>
                      <th className="px-6 py-4">UTR Number</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-8 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pendingPayments.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <div>
                            <p className="font-bold text-gray-800 text-sm">
                              {p.user?.name || 'Unknown'}
                            </p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-tighter">
                              {p.planId} Plan
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                            {p.utrNumber}
                          </code>
                          <p className="text-[10px] text-gray-400 mt-1">From: {p.senderUpiId}</p>
                        </td>
                        <td className="px-6 py-5">
                          <span className="font-bold text-gray-700">₹{p.amount}</span>
                        </td>
                        <td className="px-6 py-5 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(p.paymentDateTime).toLocaleString([], {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button
                            onClick={() => {
                              setSelectedPayment(p);
                              setShowVerifyModal(true);
                            }}
                            className="bg-rose-600 text-white text-[10px] font-bold px-4 py-2 rounded-xl shadow-lg shadow-rose-100 hover:scale-105 transition-all"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === 'membership_plans' ? (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-serif font-bold text-gray-800">Plan Management</h3>
                <p className="text-gray-400 text-xs mt-1">
                  Control pricing, names, and durations for all subscription tiers.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <th className="px-8 py-4">Internal ID</th>
                    <th className="px-6 py-4">Display Name</th>
                    <th className="px-6 py-4">Price (₹)</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-8 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {plans.map((plan) => (
                    <tr key={plan._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                          {plan.planId}
                        </code>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-bold text-gray-800 text-sm">{plan.name}</span>
                        {plan.popular && (
                          <span className="ml-2 text-[8px] bg-amber-100 text-amber-600 font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                            Popular
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-bold text-gray-800">
                          ₹{plan.price.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm text-gray-500 font-medium">
                          {plan.durationInMonths === 0
                            ? 'Forever'
                            : `${plan.durationInMonths} Months`}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => {
                            setSelectedPlan(plan);
                            setPlanForm({
                              name: plan.name,
                              price: plan.price,
                              durationInMonths: plan.durationInMonths,
                            });
                            setIsPlanModalOpen(true);
                          }}
                          className="text-rose-600 text-xs font-bold hover:underline"
                        >
                          Edit Pricing
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'transactions' ? (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-serif font-bold text-gray-800">Transaction Ledger</h3>
                <p className="text-gray-400 text-xs mt-1">
                  Full history of platform revenue and membership activations.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Platform Revenue
                  </span>
                  <span className="text-xl font-black text-emerald-600">
                    ₹{(stats?.totalRevenue || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <th className="px-8 py-4">Transaction Date</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Plan / Amount</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <p className="font-bold text-gray-700">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-tighter">
                          {new Date(tx.createdAt).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-bold text-gray-800">{tx.user?.name || 'Unknown User'}</p>
                        <p className="text-xs text-gray-400">{tx.user?.email || '—'}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-black text-slate-700 uppercase tracking-tight">
                          {tx.planId}
                        </p>
                        <p className="font-bold text-emerald-600">₹{tx.amount}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${tx.type === 'razorpay' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`flex items-center gap-1.5 text-xs font-bold ${tx.status === 'captured' ? 'text-emerald-500' : tx.status === 'pending' ? 'text-amber-500' : 'text-slate-400'}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${tx.status === 'captured' ? 'bg-emerald-500' : tx.status === 'pending' ? 'bg-amber-500' : 'bg-slate-300'}`}
                          />
                          {tx.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-20 text-center text-gray-300 italic">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <h3 className="text-xl font-serif font-bold text-gray-800 mb-6">Create New Coupon</h3>
              <form onSubmit={handleCreateCoupon} className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="OFF50"
                    value={newCoupon.code}
                    onChange={(e) =>
                      setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })
                    }
                    className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div className="w-40">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Type
                  </label>
                  <select
                    value={newCoupon.discountType}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div className="w-32">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    {newCoupon.discountType === 'percentage' ? 'Value (%)' : 'Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newCoupon.discountValue}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newCoupon.expiryDate}
                    onChange={(e) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newCoupon.usageLimit}
                    onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold shadow-xl shadow-gray-200 hover:scale-105 transition-all"
                >
                  Create Coupon
                </button>
              </form>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-gray-50">
                <h3 className="text-xl font-serif font-bold text-gray-800">Active Coupons</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <th className="px-8 py-4">Code</th>
                      <th className="px-6 py-4">Discount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Usage</th>
                      <th className="px-6 py-4">Expiry</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {coupons.map((c) => {
                      const isExpired = c.expiryDate && new Date(c.expiryDate) < new Date();
                      return (
                        <tr key={c._id}>
                          <td className="px-8 py-5">
                            <code className="text-sm font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-lg">
                              {c.code}
                            </code>
                          </td>
                          <td className="px-6 py-5 font-bold text-gray-700">
                            {c.discountType === 'percentage'
                              ? `${c.discountValue}% OFF`
                              : `₹${c.discountValue.toLocaleString()} OFF`}
                          </td>
                          <td className="px-6 py-5">
                            <span
                              className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${isExpired ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}
                            >
                              {isExpired ? 'Expired' : 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex flex-col gap-1 min-w-[100px]">
                              <div className="flex justify-between text-[10px] font-bold text-gray-400 font-sans">
                                <span>
                                  {c.usageCount || 0} / {c.usageLimit || 100}
                                </span>
                                <span>
                                  {Math.round(((c.usageCount || 0) / (c.usageLimit || 100)) * 100)}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    (c.usageCount || 0) / (c.usageLimit || 100) >= 0.9
                                      ? 'bg-rose-500'
                                      : (c.usageCount || 0) / (c.usageLimit || 100) >= 0.7
                                        ? 'bg-amber-500'
                                        : 'bg-emerald-500'
                                  }`}
                                  style={{
                                    width: `${Math.min(100, ((c.usageCount || 0) / (c.usageLimit || 100)) * 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-xs text-gray-400">
                            {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button
                              onClick={() => handleDeleteCoupon(c._id)}
                              className="text-rose-500 hover:text-rose-700 p-2"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {coupons.length === 0 && (
                      <tr>
                        <td colSpan="6" className="p-20 text-center text-gray-400 italic">
                          No coupons found. Create one to get started!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Manual Upgrade Modal ── */}
      {showUpgradeModal && selectedUser && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-scale-in">
            <h3 className="text-2xl font-serif font-bold text-gray-800 mb-2">Manual Upgrade</h3>
            <p className="text-gray-400 text-sm mb-8">
              Upgrading: <span className="font-bold text-gray-700">{selectedUser.name}</span>
            </p>

            <form onSubmit={handleManualUpgrade} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                  Select Plan
                </label>
                <select
                  value={upgradeForm.planId}
                  onChange={(e) => setUpgradeForm({ ...upgradeForm, planId: e.target.value })}
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold"
                >
                  <option value="">-- Choose Plan --</option>
                  {plans
                    .filter((p) => p.planId !== 'free')
                    .map((p) => (
                      <option key={p.planId} value={p.planId}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  required
                  value={upgradeForm.durationDays}
                  onChange={(e) => setUpgradeForm({ ...upgradeForm, durationDays: e.target.value })}
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold"
                />
                <p className="text-[10px] text-gray-400 mt-2 italic">
                  Common: 30 (1 mo), 90 (3 mo), 365 (1 yr)
                </p>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-amber-500 text-white rounded-2xl font-bold shadow-xl shadow-amber-100"
                >
                  Grant Premium
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Payment Verification Modal ── */}
      {showVerifyModal && selectedPayment && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-scale-in">
            <h3 className="text-2xl font-serif font-bold text-gray-800 mb-2">Verify Payment</h3>
            <p className="text-gray-400 text-sm mb-6">
              Reviewing claim for{' '}
              <span className="font-bold text-gray-700">{selectedPayment.user?.name}</span>
            </p>

            <div className="bg-slate-50 p-5 rounded-2xl mb-8 space-y-2 text-sm">
              <p className="text-gray-500">
                <strong>UTR:</strong> {selectedPayment.utrNumber}
              </p>
              <p className="text-gray-500">
                <strong>UPI:</strong> {selectedPayment.senderUpiId}
              </p>
              <p className="text-gray-500">
                <strong>Amount:</strong> ₹{selectedPayment.amount} ({selectedPayment.planId})
              </p>
              {selectedPayment.userRemarks && (
                <p className="text-gray-500 pt-2 border-t border-slate-100 mt-2 italic">
                  &quot;{selectedPayment.userRemarks}&quot;
                </p>
              )}
            </div>

            <form onSubmit={handleVerifyPayment} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                  Action
                </label>
                <select
                  value={verifyForm.status}
                  onChange={(e) => setVerifyForm({ ...verifyForm, status: e.target.value })}
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold"
                >
                  <option value="captured">✅ Approve & Activate</option>
                  <option value="failed">❌ Reject Request</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                  Admin Remarks (Sent to user)
                </label>
                <textarea
                  placeholder="e.g. UTR verified OR UTR mismatch..."
                  value={verifyForm.adminRemarks}
                  onChange={(e) => setVerifyForm({ ...verifyForm, adminRemarks: e.target.value })}
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 text-sm h-24 resize-none"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-4 text-white rounded-2xl font-bold shadow-xl ${verifyForm.status === 'captured' ? 'bg-emerald-500 shadow-emerald-100' : 'bg-rose-500 shadow-rose-100'}`}
                >
                  {verifyForm.status === 'captured' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Plan Edit Modal ── */}
      {isPlanModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-120 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-scale-in">
            <h3 className="text-2xl font-serif font-bold text-gray-800 mb-2">
              Edit Membership Plan
            </h3>
            <p className="text-gray-400 text-sm mb-8 italic">
              Internal key: <span className="font-bold text-gray-700">{selectedPlan.planId}</span>
            </p>

            <form onSubmit={handleSavePlan} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Duration (Months)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={planForm.durationInMonths}
                    onChange={(e) => setPlanForm({ ...planForm, durationInMonths: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold"
                  />
                  <p className="text-[10px] text-gray-400 mt-2">0 = Lifetime</p>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-xl shadow-gray-200"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── User Add/Edit Modal ── */}
      {showUserModal && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-10 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-serif font-bold text-gray-800">
                  {userFormMode === 'add' ? 'Add New User' : 'Edit User Info'}
                </h3>
                <p className="text-gray-400 text-sm italic">
                  Full control over account and profile data.
                </p>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-2 mb-8 border-b border-gray-100 pb-2 overflow-x-auto no-scrollbar">
              {['account', 'profile', 'family', 'horoscope', 'media'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setUserModalTab(tab)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${userModalTab === tab ? 'bg-rose-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveUser} className="space-y-8">
              {/* TAB 1: Account & Subscription */}
              {userModalTab === 'account' && (
                <div className="space-y-8 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-full pb-2 border-b border-gray-50">
                      <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">
                        Account Credentials
                      </h4>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={userForm.name}
                        onChange={handleUserFormChange}
                        className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={userForm.email}
                        onChange={handleUserFormChange}
                        className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Password {userFormMode === 'edit' && '(Blank to keep same)'}
                      </label>
                      <input
                        type="password"
                        name="password"
                        required={userFormMode === 'add'}
                        value={userForm.password}
                        onChange={handleUserFormChange}
                        className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        System Role
                      </label>
                      <select
                        name="role"
                        value={userForm.role}
                        onChange={handleUserFormChange}
                        className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-full pb-2 border-b border-gray-50">
                      <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">
                        Membership Status
                      </h4>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Is Premium?
                      </label>
                      <select
                        name="isPremium"
                        value={userForm.isPremium}
                        onChange={(e) =>
                          handleUserFormChange({
                            target: { name: 'isPremium', value: e.target.value === 'true' },
                          })
                        }
                        className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold"
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Current Plan
                      </label>
                      <select
                        name="premiumPlan"
                        disabled={!userForm.isPremium}
                        value={userForm.premiumPlan}
                        onChange={handleUserFormChange}
                        className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-50"
                      >
                        <option value="none">None</option>
                        <option value="gold">Gold</option>
                        <option value="platinum">Platinum</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        name="premiumExpires"
                        disabled={!userForm.isPremium}
                        value={userForm.premiumExpires}
                        onChange={handleUserFormChange}
                        className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Biographical & Location */}
              {userModalTab === 'profile' && (
                <div className="space-y-8 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-full pb-2 border-b border-gray-50">
                      <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">
                        Background & Bio
                      </h4>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Gender
                      </label>
                      <select
                        name="profile.gender"
                        value={userForm.profileData.gender}
                        onChange={handleUserFormChange}
                        className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="horoscope.dateOfBirth"
                        value={userForm.profileData.horoscope?.dateOfBirth}
                        onChange={handleUserFormChange}
                        className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-3 text-sm"
                      />
                    </div>
                    <div>
                      <SearchableDropdown
                        label="Religion"
                        name="profile.religion"
                        value={userForm.profileData.religion}
                        options={religionOptions}
                        onChange={handleUserFormChange}
                      />
                    </div>
                    <div>
                      <SearchableDropdown
                        label="Caste / Community"
                        name="profile.caste"
                        value={userForm.profileData.caste}
                        options={casteOptions}
                        onChange={handleUserFormChange}
                        placeholder="e.g. Brahmin, Rajput"
                      />
                    </div>
                    <div>
                      <SearchableDropdown
                        label="Mother Tongue"
                        name="profile.motherTongue"
                        value={userForm.profileData.motherTongue}
                        options={languageOptions}
                        onChange={handleUserFormChange}
                        placeholder="e.g. Hindi, English"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Short Bio
                      </label>
                      <textarea
                        name="profile.bio"
                        rows="3"
                        value={userForm.profileData.bio}
                        onChange={handleUserFormChange}
                        className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none no-scrollbar resize-none"
                        placeholder="User story, personality traits..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-full pb-2 border-b border-gray-50">
                      <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">
                        Physical & Professional
                      </h4>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Height (e.g. 5&apos; 11&quot;)
                      </label>
                      <input
                        type="text"
                        name="profile.height"
                        value={userForm.profileData.height}
                        onChange={handleUserFormChange}
                        className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Education
                      </label>
                      <input
                        type="text"
                        name="profile.education"
                        value={userForm.profileData.education}
                        onChange={handleUserFormChange}
                        className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Profession
                      </label>
                      <input
                        type="text"
                        name="profile.profession"
                        value={userForm.profileData.profession}
                        onChange={handleUserFormChange}
                        className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-full pb-2 border-b border-gray-50">
                      <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">
                        Residence & Native
                      </h4>
                    </div>
                    <div>
                      <SearchableDropdown
                        label="Current State"
                        name="profile.currentState"
                        value={userForm.profileData.currentState}
                        options={stateOptions}
                        onChange={handleUserFormChange}
                        placeholder="Select state..."
                      />
                    </div>
                    <div>
                      <SearchableDropdown
                        label="Current City"
                        name="profile.currentCity"
                        value={userForm.profileData.currentCity}
                        options={curCityOptions}
                        onChange={handleUserFormChange}
                        placeholder="Select city..."
                        disabled={!userForm.profileData.currentState}
                        minChars={2}
                      />
                    </div>
                    <div>
                      <SearchableDropdown
                        label="Native State"
                        name="profile.nativeState"
                        value={userForm.profileData.nativeState}
                        options={stateOptions}
                        onChange={handleUserFormChange}
                        placeholder="Select state..."
                      />
                    </div>
                    <div>
                      <SearchableDropdown
                        label="Native City"
                        name="profile.nativeCity"
                        value={userForm.profileData.nativeCity}
                        options={natCityOptions}
                        onChange={handleUserFormChange}
                        placeholder="Select city..."
                        disabled={!userForm.profileData.nativeState}
                        minChars={2}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Family Details */}
              {userModalTab === 'family' && (
                <div className="space-y-8 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-full pb-2 border-b border-gray-50">
                      <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">
                        Family Background
                      </h4>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Father&apos;s Name
                      </label>
                      <input
                        type="text"
                        name="family.fatherName"
                        value={userForm.profileData.family?.fatherName}
                        onChange={handleUserFormChange}
                        className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Mother&apos;s Name
                      </label>
                      <input
                        type="text"
                        name="family.motherName"
                        value={userForm.profileData.family?.motherName}
                        onChange={handleUserFormChange}
                        className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Siblings
                      </label>
                      <input
                        type="text"
                        name="family.siblings"
                        value={userForm.profileData.family?.siblings}
                        onChange={handleUserFormChange}
                        className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Family Type
                      </label>
                      <select
                        name="family.familyType"
                        value={userForm.profileData.family?.familyType}
                        onChange={handleUserFormChange}
                        className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
                      >
                        <option value="Nuclear">Nuclear</option>
                        <option value="Joint">Joint</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Horoscope Details */}
              {userModalTab === 'horoscope' && (
                <div className="space-y-8 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-full pb-2 border-b border-gray-50">
                      <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">
                        Astrological Data
                      </h4>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Time of Birth (e.g. 10:30 AM)
                      </label>
                      <input
                        type="text"
                        name="horoscope.timeOfBirth"
                        value={userForm.profileData.horoscope?.timeOfBirth}
                        onChange={handleUserFormChange}
                        className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-3 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Place of Birth
                      </label>
                      <input
                        type="text"
                        name="horoscope.placeOfBirth"
                        value={userForm.profileData.horoscope?.placeOfBirth}
                        onChange={handleUserFormChange}
                        className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Nakshatra
                      </label>
                      <select
                        name="horoscope.nakshatra"
                        value={userForm.profileData.horoscope?.nakshatra}
                        onChange={handleUserFormChange}
                        className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
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
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Pada
                      </label>
                      <select
                        name="horoscope.pada"
                        value={userForm.profileData.horoscope?.pada}
                        onChange={handleUserFormChange}
                        className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
                      >
                        <option value="">Select Pada</option>
                        {PADAS.map((p) => (
                          <option key={p} value={p}>
                            {p}st Pada
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Rashi (Moon Sign)
                      </label>
                      <select
                        name="horoscope.rashi"
                        value={userForm.profileData.horoscope?.rashi}
                        onChange={handleUserFormChange}
                        disabled={
                          !!(
                            userForm.profileData.horoscope?.nakshatra &&
                            userForm.profileData.horoscope?.pada
                          )
                        }
                        className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-70"
                      >
                        <option value="">Select Rashi</option>
                        {RASHIS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Gotra
                      </label>
                      <input
                        type="text"
                        name="horoscope.gotra"
                        value={userForm.profileData.horoscope?.gotra}
                        onChange={handleUserFormChange}
                        className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Is Manglik?
                      </label>
                      <select
                        name="horoscope.manglik"
                        value={userForm.profileData.horoscope?.manglik}
                        onChange={handleUserFormChange}
                        className="w-full bg-slate-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
                      >
                        <option value="Unknown">Unknown/Not Set</option>
                        <option value="No">No (Non-Manglik)</option>
                        <option value="Yes">Yes (Manglik)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: Media & Gallery */}
              {userModalTab === 'media' && (
                <div className="space-y-8 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4">
                        Main Profile Photo
                      </h4>
                      <div className="relative group w-40 h-40 rounded-3xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-rose-400 transition-all">
                        {photoFiles.profilePhoto ? (
                          <img
                            src={URL.createObjectURL(photoFiles.profilePhoto)}
                            className="w-full h-full object-cover"
                            alt="Preview"
                          />
                        ) : (
                          <img
                            src={userForm.profileData.profilePhoto}
                            className="w-full h-full object-cover opacity-50"
                            alt="Current"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setPhotoFiles({ ...photoFiles, profilePhoto: e.target.files[0] })
                          }
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-[10px] font-black uppercase">
                            Change Photo
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">
                        Add Gallery Photos (Max 5)
                      </h4>
                      <label className="block w-full bg-slate-50 border border-gray-100 rounded-xl p-6 text-center cursor-pointer hover:bg-slate-100 transition-all">
                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                          Click to Select Multiple Images
                        </span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) =>
                            setPhotoFiles({
                              ...photoFiles,
                              additionalPhotos: [
                                ...photoFiles.additionalPhotos,
                                ...Array.from(e.target.files),
                              ],
                            })
                          }
                          className="hidden"
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {photoFiles.additionalPhotos.map((file, idx) => (
                          <div
                            key={idx}
                            className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200"
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setPhotoFiles({
                                  ...photoFiles,
                                  additionalPhotos: photoFiles.additionalPhotos.filter(
                                    (_, i) => i !== idx,
                                  ),
                                })
                              }
                              className="absolute top-1 right-1 bg-white/80 rounded-full p-0.5"
                            >
                              <svg
                                className="w-3 h-3 text-rose-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {userFormMode === 'edit' && targetUserId && (
                    <div className="pt-6 border-t border-gray-50 flex justify-center">
                      <button
                        type="button"
                        disabled={
                          isUploading ||
                          (!photoFiles.profilePhoto && photoFiles.additionalPhotos.length === 0)
                        }
                        onClick={() =>
                          handleUploadPhotos(
                            users.find((u) => u._id === targetUserId)?.profile?._id,
                          )
                        }
                        className="px-6 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-100 hover:-translate-y-1 transition-all disabled:opacity-50"
                      >
                        {isUploading ? 'Uploading...' : 'Save Photos Only'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-6 border-t border-gray-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-6 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-10 py-2.5 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-100 hover:-translate-y-1 transition-all"
                >
                  {userFormMode === 'add' ? 'Create Account' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
