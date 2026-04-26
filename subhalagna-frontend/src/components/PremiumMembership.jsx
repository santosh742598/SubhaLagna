/**
 * @file        SubhaLagna v3.3.5 — Premium Membership & Payments
 * @description Dynamic membership selection with Coupon system and Razorpay integration.
 * - v2.3.1 changes:
 *   - Removed hardcoded duration strings in favor of plan-driven duration text.
 *   - Integrated dynamic Razorpay order metadata.
 *   - Fixed checkout initialization for dynamic plans.
 * @version      3.3.5
 * @author        SubhaLagna Team
 */

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  loadRazorpayScript,
  createPaymentOrder,
  verifyPayment,
  validateCoupon,
  confirmFreeSubscription,
  requestBankTransfer,
} from '../services/razorpayService';
import { BANK_DETAILS, RAZORPAY_KEY_ID } from '../config';

const PremiumMembership = () => {
  const { user, refreshUser, plans, refreshPlans } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discountedPrice, discountAmount }
  const [couponError, setCouponError] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' or 'bank'
  const [showBankForm, setShowBankForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [bankData, setBankData] = useState({
    utrNumber: '',
    senderUpiId: '',
    userRemarks: '',
  });

  // ── Load Plans ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (plans.length === 0) {
      refreshPlans();
    }
  }, [plans, refreshPlans]);

  // ── Coupon Logic ───────────────────────────────────────────────────────────
  const handleApplyCoupon = async (planId) => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const result = await validateCoupon(couponCode, planId);
      setAppliedCoupon({ ...result, targetPlanId: planId });
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  // ── Payment Logic ──────────────────────────────────────────────────────────
  const handlePlanSelect = async (plan) => {
    if (!user) {
      navigate('/login', { state: { from: '/premium' } });
      return;
    }

    setProcessing(true);
    try {
      // 1. Load Razorpay Script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert('Razorpay SDK failed to load. Check your internet connection.');
        setProcessing(false);
        return;
      }

      // 2. Create Order (Backend)
      const currentCoupon =
        appliedCoupon && appliedCoupon.targetPlanId === plan.planId
          ? appliedCoupon.couponCode
          : null;

      const orderResponse = await createPaymentOrder(plan.planId, currentCoupon);

      if (orderResponse.isFree) {
        const confirm = await confirmFreeSubscription(plan.planId, currentCoupon);
        if (confirm.success) {
          await refreshUser(); // Update global auth context
          alert('🎉 Premium Activated Successfully!');
          navigate('/dashboard');
        }
        return;
      }

      // 3. Open Razorpay Modal
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        name: 'SubhaLagna Premium',
        description: `${plan.name} Membership (${plan.durationInMonths === 0 ? 'Lifetime' : plan.durationInMonths === 12 ? '1 Year' : `${plan.durationInMonths} Months`})`,
        image: '/logo.png',
        order_id: orderResponse.data.id,
        handler: async (response) => {
          try {
            const verifyData = {
              ...response,
              planId: plan.id,
              couponCode: currentCoupon,
            };
            const verification = await verifyPayment(verifyData);
            if (verification.success) {
              await refreshUser(); // Force refresh auth state seamlessly without full page reload
              alert('✨ Upgrade Successful! Welcome to Premium.');
              navigate('/dashboard');
            }
          } catch {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: { color: '#f43f5e' }, // Rose-500
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setProcessing(false);
    }
  };

  const handleBankTransferSubmit = async () => {
    if (!bankData.utrNumber || !bankData.senderUpiId) {
      alert('Please enter UTR Number and your UPI ID');
      return;
    }

    setProcessing(true);
    try {
      const currentCoupon =
        appliedCoupon && appliedCoupon.targetPlanId === selectedPlan.planId
          ? appliedCoupon.couponCode
          : null;

      const priceToShow =
        appliedCoupon && appliedCoupon.targetPlanId === selectedPlan.planId
          ? appliedCoupon.discountedPrice
          : selectedPlan.price;

      await requestBankTransfer({
        planId: selectedPlan.planId,
        couponCode: currentCoupon,
        amount: priceToShow,
        ...bankData,
      });

      alert('✨ Request Submitted! Admin will verify your payment soon.');
      setShowBankForm(false);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-16 bg-white">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-5xl font-serif font-bold text-gray-900 mb-6">
          Premium <span className="text-rose-600">Soulmate</span> Access
        </h1>
        <p className="text-gray-500 text-lg">
          Unlock the full potential of your search with targeted premium features and priority
          support.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {plans.map((plan, idx) => {
          const currentPlanIndex = plans.findIndex((p) => p.planId === user?.premiumPlan);
          const isDowngrade = currentPlanIndex !== -1 && idx < currentPlanIndex;
          const isCurrentPlan = plan.planId === user?.premiumPlan;

          const isSelected = appliedCoupon?.targetPlanId === plan.planId;
          const priceToShow = isSelected ? appliedCoupon.discountedPrice : plan.price;
          const hasDiscount = isSelected && appliedCoupon.discountAmount > 0;

          return (
            <div
              key={plan.planId}
              className={`relative flex flex-col p-10 rounded-[3rem] border transition-all duration-500 hover:scale-[1.02] ${
                isCurrentPlan
                  ? 'border-emerald-300 bg-emerald-50/10 ring-2 ring-emerald-200 shadow-2xl scale-105 z-20'
                  : plan.popular
                    ? 'border-rose-200 bg-rose-50/30 ring-1 ring-rose-100 shadow-2xl scale-105 z-10'
                    : 'border-slate-100 bg-white shadow-xl'
              }`}
            >
              {isCurrentPlan ? (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg border border-emerald-400">
                  Current Plan
                </span>
              ) : isDowngrade ? (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1 bg-gray-400 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                  Included
                </span>
              ) : (
                plan.popular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                    Best Value
                  </span>
                )
              )}

              <header className="mb-8">
                <h3 className="text-2xl font-bold text-gray-800">{plan.name}</h3>
                <p className="text-gray-400 text-sm mt-2">{plan.description}</p>
              </header>

              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-extrabold text-gray-900">₹{priceToShow}</span>
                {hasDiscount && (
                  <span className="text-xl text-gray-400 line-through">₹{plan.price}</span>
                )}
                <span className="text-gray-400 font-medium">
                  /{' '}
                  {plan.durationInMonths === 0
                    ? 'Forever'
                    : plan.durationInMonths === 12
                      ? '1 yr'
                      : `${plan.durationInMonths} mo`}
                </span>
              </div>

              {/* Coupon Field for paid plans */}
              {plan.price > 0 && (
                <div className="mb-8 p-4 bg-white/50 rounded-2xl border border-rose-50">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon Code"
                      className="flex-1 bg-transparent text-xs font-bold uppercase tracking-tight outline-none"
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <button
                      onClick={() => handleApplyCoupon(plan.planId)}
                      disabled={couponLoading}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 disabled:opacity-50"
                    >
                      {couponLoading ? '...' : 'APPLY'}
                    </button>
                  </div>
                  {couponError && <p className="text-[10px] text-red-500 mt-1">{couponError}</p>}
                  {hasDiscount && (
                    <p className="text-[10px] text-emerald-600 mt-1 font-bold">
                      ✓ Coupon Applied (-₹{appliedCoupon.discountAmount})
                    </p>
                  )}
                </div>
              )}

              <ul className="flex-1 space-y-4 mb-10">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${f.included ? 'bg-rose-100' : 'bg-gray-100'}`}
                    >
                      <svg
                        className={`w-3 h-3 ${f.included ? 'text-rose-600' : 'text-gray-400'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d={f.included ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'}
                        />
                      </svg>
                    </div>
                    <span className={f.included ? 'text-gray-700' : 'text-gray-400 line-through'}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-3 mt-auto">
                <button
                  onClick={() => {
                    if (paymentMethod === 'razorpay') {
                      handlePlanSelect(plan);
                    } else {
                      setSelectedPlan(plan);
                      setShowBankForm(true);
                    }
                  }}
                  disabled={
                    processing ||
                    isCurrentPlan ||
                    isDowngrade ||
                    (plan.planId === 'free' && user?.isPremium)
                  }
                  className={`w-full py-5 rounded-2xl font-bold transition-all ${
                    isCurrentPlan
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default shadow-sm'
                      : isDowngrade || (plan.planId === 'free' && user?.isPremium)
                        ? 'bg-gray-100 text-gray-400 cursor-default'
                        : plan.popular
                          ? 'bg-linear-to-r from-rose-600 to-pink-600 text-white shadow-xl shadow-rose-200'
                          : 'bg-gray-900 text-white hover:bg-black'
                  } disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]`}
                >
                  {processing
                    ? 'Processing...'
                    : isCurrentPlan
                      ? '✔ Current Plan'
                      : isDowngrade
                        ? 'Already Unlocked'
                        : plan.planId === 'free' && user?.isPremium
                          ? 'Already Applied'
                          : `Upgrade to ${plan.name}`}
                </button>

                {plan.planId !== 'free' && !isCurrentPlan && !isDowngrade && (
                  <div className="flex justify-center gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`method-${plan.planId}`}
                        checked={paymentMethod === 'razorpay'}
                        onChange={() => setPaymentMethod('razorpay')}
                        className="accent-rose-600"
                      />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                        Online
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`method-${plan.planId}`}
                        checked={paymentMethod === 'bank'}
                        onChange={() => setPaymentMethod('bank')}
                        className="accent-rose-600"
                      />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                        Bank/UPI
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-20 text-center text-gray-400 text-xs">
        Secure payments by Razorpay. Prices inclusive of 18% GST. No hidden charges.
      </div>

      {/* Bank Transfer Modal */}
      {showBankForm && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Proof</h2>

            <div className="bg-rose-50 p-5 rounded-2xl mb-6 text-sm text-rose-900 leading-relaxed">
              <p className="font-bold mb-2 uppercase text-[10px] tracking-widest text-rose-500">
                Our Details
              </p>
              <p>
                <strong>Name:</strong> {BANK_DETAILS.name}
              </p>
              <p>
                <strong>Account:</strong> {BANK_DETAILS.accNo}
              </p>
              <p>
                <strong>IFSC:</strong> {BANK_DETAILS.ifsc}
              </p>
              <p>
                <strong>UPI ID:</strong> {BANK_DETAILS.upiId}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 ml-2">
                  UTR / Transaction ID
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 ring-rose-500 outline-none"
                  placeholder="Enter 12-digit UTR"
                  value={bankData.utrNumber}
                  onChange={(e) => setBankData({ ...bankData, utrNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 ml-2">
                  Your UPI ID
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 ring-rose-500 outline-none"
                  placeholder="e.g. name@upi"
                  value={bankData.senderUpiId}
                  onChange={(e) => setBankData({ ...bankData, senderUpiId: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2 ml-2">
                  Remarks (Optional)
                </label>
                <textarea
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 ring-rose-500 outline-none h-24 resize-none"
                  placeholder="Anything we should know?"
                  value={bankData.userRemarks}
                  onChange={(e) => setBankData({ ...bankData, userRemarks: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowBankForm(false)}
                className="flex-1 py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBankTransferSubmit}
                disabled={processing}
                className="flex-2 py-4 bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all disabled:opacity-50"
              >
                {processing ? 'Wait...' : 'Submit Proof'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumMembership;
