/**
 * @file        SubhaLagna v3.3.3 — Email Verification Component
 * @description   Handles 6-digit OTP entry and resend logic.
 *               - v3.1.4 changes:
 *                 - Modernized gradient syntax to Tailwind v4 (bg-linear-to-br).
 *               - v3.0.5 changes:
 *                 - Implemented celebratory success banner for newly registered users.
 * @author        SubhaLagna Team
 * @version      3.3.3
 */

import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { verifyEmail, resendOTP } from '../services/authService';

const VerifyEmail = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStr, setErrorStr] = useState(null);
  const [successStr, setSuccessStr] = useState(null);
  const [timer, setTimer] = useState(0);
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  // Redirect if already verified
  useEffect(() => {
    if (user?.isEmailVerified) {
      navigate(user.hasProfile ? '/dashboard' : '/create-profile');
    }
  }, [user, navigate]);

  // Handle countdown timer for resend
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    if (pastedData.every((char) => /^\d$/.test(char))) {
      const newOtp = [...otp];
      pastedData.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      // Focus last filled or next
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs[nextIndex].current.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setErrorStr('Please enter the full 6-digit code.');
      return;
    }

    setIsSubmitting(true);
    setErrorStr(null);
    setSuccessStr(null);

    try {
      await verifyEmail({ email: user?.email, otp: otpCode });
      setSuccessStr('Email verified successfully! Redirecting...');
      setTimeout(async () => {
        await refreshUser(); // Update global state
        navigate(user?.hasProfile ? '/dashboard' : '/create-profile');
      }, 1500);
    } catch (err) {
      setErrorStr(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;

    setErrorStr(null);
    setSuccessStr(null);
    try {
      await resendOTP(user?.email);
      setSuccessStr('A new code has been sent to your email.');
      setTimer(60); // 60s cooldown
    } catch (err) {
      setErrorStr(err);
    }
  };

  const containerStyle = {
    animation: 'fade-in-up 0.6s ease-out forwards',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-linear-to-br from-rose-50 to-pink-50">
      <div
        className="max-w-md w-full bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-rose-100/40 border border-rose-100"
        style={containerStyle}
      >
        {location.state?.fromSignup && (
          <div className="mb-6 p-4 bg-rose-500 text-white text-xs font-bold rounded-2xl text-center animate-bounce shadow-lg shadow-rose-200">
            🎉 Account Created! Please verify your email below.
          </div>
        )}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-500">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-serif font-bold text-gray-800">Verify Your Email</h2>
          <p className="text-gray-500 text-sm mt-2">
            We&apos;ve sent a 6-digit code to{' '}
            <span className="font-semibold text-gray-700">{user?.email}</span>
          </p>
        </div>

        {errorStr && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl text-center font-medium">
            {errorStr}
          </div>
        )}

        {successStr && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm rounded-xl text-center font-medium">
            {successStr}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex justify-between gap-2 mb-8" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-xl font-bold bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-50/50 transition-all outline-none"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 rounded-xl text-white font-bold shadow-lg shadow-rose-200 transition-all ${
              isSubmitting ? 'bg-rose-400' : 'bg-rose-600 hover:bg-rose-700 hover:-translate-y-0.5'
            }`}
          >
            {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <p className="text-gray-500">
            Didn&apos;t receive the code?{' '}
            <button
              onClick={handleResend}
              disabled={timer > 0}
              className={`font-bold transition-colors ${
                timer > 0 ? 'text-gray-300' : 'text-rose-600 hover:text-rose-700'
              }`}
            >
              {timer > 0 ? `Resend in ${timer}s` : 'Resend Now'}
            </button>
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-gray-400 text-xs hover:text-gray-600 transition-colors"
          >
            Use a different email? Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
