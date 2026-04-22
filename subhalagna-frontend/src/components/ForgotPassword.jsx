/**
 * @file        SubhaLagna v3.0.5 — Forgot Password
 * @description   Premium recovery interface for requesting password reset links.
 * - v3.0.4 changes:
 *   - Initial implementation with glassmorphism UI.
 * @author        SubhaLagna Team
 * @version      3.0.5
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/authService';

const FloatingHeart = ({ style, size = 'sm' }) => {
  const sizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  return (
    <svg
      className={`absolute ${sizes[size]} animate-float-heart pointer-events-none`}
      style={style}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3 C1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
};

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const res = await forgotPassword(email);
      setMessage(res.message || 'Reset link sent to your email.');
    } catch (err) {
      setError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const bgHearts = [
    { left: '10%', top: '15%', size: 'sm', delay: '0s', duration: '5s' },
    { left: '85%', top: '20%', size: 'md', delay: '1.5s', duration: '6s' },
    { left: '20%', top: '75%', size: 'xs', delay: '0.5s', duration: '4s' },
    { left: '70%', top: '80%', size: 'lg', delay: '2s', duration: '7s' },
  ];

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      {/* ── Background ── */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100/80" />
        {bgHearts.map((heart, i) => (
          <FloatingHeart
            key={i}
            size={heart.size}
            style={{
              left: heart.left,
              top: heart.top,
              animationDelay: heart.delay,
              animationDuration: heart.duration,
              color: '#f9a8b8',
              opacity: 0.3,
            }}
          />
        ))}
      </div>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-xl border border-rose-100/60 animate-fade-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="text-3xl font-serif font-bold text-gray-800 mb-2">Forgot Password?</h2>
            <p className="text-gray-400 text-sm">Enter your email and we'll send you a link to reset your password.</p>
          </div>

          {message && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl text-sm font-medium text-center">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-medium text-center">
              {error}
            </div>
          )}

          {!message && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3.5 rounded-xl text-white font-bold shadow-lg transition-all ${
                  isSubmitting ? 'bg-rose-400' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link to="/login" className="text-sm font-semibold text-rose-600 hover:underline flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Login
            </Link>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes float-heart {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(10deg); opacity: 0.5; }
        }
        .animate-float-heart { animation: float-heart 5s ease-in-out infinite; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
