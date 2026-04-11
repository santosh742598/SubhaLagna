/**
 * @fileoverview SubhaLagna v2.0.6 — Admin Dashboard
 * @description   Executive interface for platform management.
 *                v2.0.2 features:
 *                  - Financial Oversight (Total & Today's Revenue)
 *                  - User Moderation (Verify, Suspend, Delete)
 *                  - Manual Subscription Upgrades
 *                  - Coupon Management
 *                  - Bank Payment Verification (New)
 * @version       2.1.0
 */

import React, { useState, useEffect } from 'react';
import Header from './Header';
  manualUpgradeUser,
  getPendingBankPayments,
  verifyBankPayment
} from '../services/adminService';

// ─── Stat Card Component ─────────────────────────────────────────────────────
const StatCard = ({ label, value, delta, icon, color, isCurrency = false }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-100 transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-opacity-100`}>
        {icon}
      </div>
      {delta && (
        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${delta.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {delta}
        </span>
      )}
    </div>
    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">{label}</h3>
    <p className="text-3xl font-black text-gray-800 mt-1">
      {isCurrency ? `₹${(value || 0).toLocaleString()}` : (value || 0)}
    </p>
  </div>
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users'); 
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Users State
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Manual Upgrade State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [upgradeForm, setUpgradeForm] = useState({ planId: 'gold', durationDays: '365' });

  });

  // Payments State
  const [pendingPayments, setPendingPayments] = useState([]);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [verifyForm, setVerifyForm] = useState({ status: 'captured', adminRemarks: '' });

  const fetchData = async (page = 1) => {
    try {
      setLoading(true);
      const [statsData, usersData] = await Promise.all([
        getDashboardStats(),
        getAllUsers({ page, limit: 10, search, role: filterRole === 'all' ? undefined : filterRole })
      ]);
      setStats(statsData);
      setUsers(usersData.data);
      setPagination(usersData.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      const data = await getAllCoupons();
      setCoupons(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayments = async () => {
    try {
      const data = await getPendingBankPayments();
      setPendingPayments(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchData();
    if (activeTab === 'coupons') fetchCoupons();
    if (activeTab === 'payments') fetchPayments();
  }, [search, filterRole, activeTab]);

  const handleAction = async (actionFn, id) => {
    if (actionFn === deleteUser && !window.confirm('Are you sure you want to PERMANENTLY delete this user?')) return;
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

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        
        {/* ── Page Header ── */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-serif font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Platform overview and commercial controls.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
             <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-100' : 'bg-white text-gray-400 border-gray-100'}`}>Users</button>
             <button onClick={() => setActiveTab('payments')} className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${activeTab === 'payments' ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-100' : 'bg-white text-gray-400 border-gray-100'}`}>
               Pending Payments 
               {pendingPayments.length > 0 && <span className="ml-2 bg-white text-rose-600 px-1.5 py-0.5 rounded-md text-[9px]">{pendingPayments.length}</span>}
             </button>
             <button onClick={() => setActiveTab('coupons')} className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${activeTab === 'coupons' ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-100' : 'bg-white text-gray-400 border-gray-100'}`}>Coupons</button>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard label="Total Revenue" value={stats?.totalRevenue} isCurrency={true} icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>} color="text-emerald-500" />
          <StatCard label="Today's Revenue" value={stats?.todayRevenue} isCurrency={true} icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" /></svg>} color="text-emerald-400" />
          <StatCard label="Total Users" value={stats?.totalUsers} delta={`+${stats?.newUsersToday || 0}`} icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>} color="text-blue-500" />
          <StatCard label="Verified" value={stats?.verifiedProfiles} icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>} color="text-emerald-600" />
        </div>

        {activeTab === 'users' ? (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-xl font-serif font-bold text-gray-800">User Moderation</h3>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <input type="text" placeholder="Search Users..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-64 bg-slate-50 border border-gray-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500 transition-all font-medium" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <th className="px-8 py-4">User</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Premium</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center font-bold text-gray-600">{user.name.charAt(0)}</div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{user.name}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${user.isSuspended ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                          <span className="text-sm font-medium text-gray-600">{user.isSuspended ? 'Suspended' : 'Active'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {user.isPremium ? (
                          <span className="text-amber-500 text-xs font-bold flex flex-col">
                            <span>👑 {user.premiumPlan.toUpperCase()}</span>
                            <span className="text-[9px] text-gray-400">Exp: {new Date(user.premiumExpires).toLocaleDateString()}</span>
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs font-medium">Free</span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                           <button onClick={() => { setSelectedUser(user); setShowUpgradeModal(true); }} className="p-2 rounded-xl border border-amber-100 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all" title="Manual Upgrade"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1h1a1 1 0 110 2H11v1a1 1 0 11-2 0V6H8a1 1 0 010-2h1V3a1 1 0 011-1z" /><path d="M12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" /></svg></button>
                           <button onClick={() => handleAction(toggleVerifyProfile, user.profile?._id)} className={`p-2 rounded-xl border transition-all ${user.profile?.isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-white text-gray-300 hover:text-emerald-500'}`} title="Verify"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2.166 4.999A11.954 11.954 0 0010 1.944a11.954 11.954 0 007.834 3.056 12.017 12.017 0 01-1.547 4.544 11.968 11.968 0 01-4.04 4.508A11.953 11.953 0 0110 16c-1.353 0-2.65-.224-3.868-.636a11.96 11.96 0 01-4.04-4.508 12.01 12.01 0 01-1.547-4.544l2.166-3.313a1 1 0 011.668.001zM9 11a1 1 0 100-2 1 1 0 000 2zm3-1a1 1 0 11-2 0 1 1 0 012 0z" /></svg></button>
                           <button onClick={() => handleAction(toggleSuspendUser, user._id)} className={`p-2 rounded-xl border transition-all ${user.isSuspended ? 'bg-rose-50 text-rose-600' : 'bg-white text-gray-300'}`} title="Suspend"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" /></svg></button>
                           <button onClick={() => handleAction(deleteUser, user._id)} className="p-2 rounded-xl border border-gray-200 text-gray-300 hover:bg-rose-600 hover:text-white transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'payments' ? (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50">
               <h3 className="text-xl font-serif font-bold text-gray-800">Pending Bank Transfers</h3>
               <p className="text-gray-400 text-xs mt-1">Review UTR numbers and UPI IDs to verify manual payments.</p>
            </div>
            {pendingPayments.length === 0 ? (
               <div className="p-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <p className="text-gray-400 font-medium tracking-tight">No pending payments to review.</p>
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
                            <p className="font-bold text-gray-800 text-sm">{p.user?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{p.planId} Plan</p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">{p.utrNumber}</code>
                          <p className="text-[10px] text-gray-400 mt-1">From: {p.senderUpiId}</p>
                        </td>
                        <td className="px-6 py-5">
                          <span className="font-bold text-gray-700">₹{p.amount}</span>
                        </td>
                        <td className="px-6 py-5 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(p.paymentDateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button 
                            onClick={() => { setSelectedPayment(p); setShowVerifyModal(true); }}
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
        ) : (
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
             <h3 className="text-xl font-serif font-bold text-gray-800">Coupon Hub</h3>
             <p className="p-20 text-center text-gray-400">Coupon management is active in the Coupons tab above.</p>
          </div>
        )}
      </main>

      {/* ── Manual Upgrade Modal ── */}
      {showUpgradeModal && selectedUser && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-scale-in">
              <h3 className="text-2xl font-serif font-bold text-gray-800 mb-2">Manual Upgrade</h3>
              <p className="text-gray-400 text-sm mb-8">Upgrading: <span className="font-bold text-gray-700">{selectedUser.name}</span></p>
              
              <form onSubmit={handleManualUpgrade} className="space-y-6">
                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Select Plan</label>
                    <select value={upgradeForm.planId} onChange={e => setUpgradeForm({...upgradeForm, planId: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold">
                       <option value="gold">Gold (30 Contacts)</option>
                       <option value="platinum">Platinum (Unlimited)</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Duration (Days)</label>
                    <input type="number" required value={upgradeForm.durationDays} onChange={e => setUpgradeForm({...upgradeForm, durationDays: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold" />
                    <p className="text-[10px] text-gray-400 mt-2 italic">Common: 30 (1 mo), 90 (3 mo), 365 (1 yr)</p>
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowUpgradeModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-amber-500 text-white rounded-2xl font-bold shadow-xl shadow-amber-100">Grant Premium</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* ── Payment Verification Modal ── */}
      {showVerifyModal && selectedPayment && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-scale-in">
              <h3 className="text-2xl font-serif font-bold text-gray-800 mb-2">Verify Payment</h3>
              <p className="text-gray-400 text-sm mb-6">Reviewing claim for <span className="font-bold text-gray-700">{selectedPayment.user?.name}</span></p>
              
              <div className="bg-slate-50 p-5 rounded-2xl mb-8 space-y-2 text-sm">
                 <p className="text-gray-500"><strong>UTR:</strong> {selectedPayment.utrNumber}</p>
                 <p className="text-gray-500"><strong>UPI:</strong> {selectedPayment.senderUpiId}</p>
                 <p className="text-gray-500"><strong>Amount:</strong> ₹{selectedPayment.amount} ({selectedPayment.planId})</p>
                 {selectedPayment.userRemarks && <p className="text-gray-500 pt-2 border-t border-slate-100 mt-2 italic">"{selectedPayment.userRemarks}"</p>}
              </div>

              <form onSubmit={handleVerifyPayment} className="space-y-6">
                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Action</label>
                    <select 
                      value={verifyForm.status} 
                      onChange={e => setVerifyForm({...verifyForm, status: e.target.value})} 
                      className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold"
                    >
                       <option value="captured">✅ Approve & Activate</option>
                       <option value="failed">❌ Reject Request</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Admin Remarks (Sent to user)</label>
                    <textarea 
                      placeholder="e.g. UTR verified OR UTR mismatch..."
                      value={verifyForm.adminRemarks} 
                      onChange={e => setVerifyForm({...verifyForm, adminRemarks: e.target.value})} 
                      className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 text-sm h-24 resize-none"
                    />
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowVerifyModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold">Cancel</button>
                    <button type="submit" className={`flex-1 py-4 text-white rounded-2xl font-bold shadow-xl ${verifyForm.status === 'captured' ? 'bg-emerald-500 shadow-emerald-100' : 'bg-rose-500 shadow-rose-100'}`}>
                      {verifyForm.status === 'captured' ? 'Approve' : 'Reject'}
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
