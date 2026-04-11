import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

// ─── Floating Heart Component ────────────────────────────────────────────────
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

const Login = () => {
  const { loginContext } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStr, setErrorStr] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    setIsSubmitting(true);
    setErrorStr(null);
    try {
      await loginContext(formData.email, formData.password);
      navigate('/matches');
    } catch (err) {
      setErrorStr(err.response?.data?.message || 'Invalid Credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

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

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      {/* ── Background ──────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100/80" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-rose-200/15 rounded-full blur-3xl" />

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
              opacity: 0.45,
            }}
          />
        ))}

        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, #fecdd3 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Header />

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-xl shadow-rose-100/40 border border-rose-100/60 relative z-10 animate-fade-in">
          {/* Welcome Heading & Tagline */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-serif font-bold text-gray-800 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-400 text-sm">
              Your journey to finding love continues here 💕
            </p>
          </div>

          {/* Error */}
          {errorStr && (
            <div className="mb-4 text-center text-sm font-semibold text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-200">
              {errorStr}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="login-input w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all font-sans text-sm text-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="login-input w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all font-sans text-sm text-gray-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors p-1"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full mt-4 py-3.5 px-4 rounded-xl text-white font-semibold flex justify-center items-center shadow-lg transition-all ${isSubmitting
                ? 'bg-rose-400'
                : 'bg-rose-600 hover:bg-rose-700 hover:-translate-y-0.5'
                }`}
            >
              {isSubmitting ? 'Verifying...' : 'Log In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-rose-600 font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="shrink-0 py-4 text-center relative z-10">
        <p className="text-xs text-gray-400 font-medium tracking-wide">
          © 2026 <span className="text-rose-400">Subhalagna</span>. All rights reserved.
        </p>
      </footer>

      {/* ── Animations & Global Styles ─────────────────────────────────────── */}
      <style>{`
        html, body, #root {
          overflow: hidden;
          height: 100%;
          margin: 0;
          padding: 0;
        }

        /* ── White background on focus / active ── */
        .login-input,
        .login-input:focus,
        .login-input:active,
        .login-input:hover {
          background-color: #ffffff !important;
          color: #1f2937 !important;
          caret-color: #1f2937 !important;
        }

        /* ── Placeholder — light soft grey ── */
        .login-input::placeholder {
          color: #d1d5db !important;
          -webkit-text-fill-color: #d1d5db !important;
          opacity: 1 !important;
        }

        .login-input::-webkit-input-placeholder {
          color: #d1d5db !important;
          -webkit-text-fill-color: #d1d5db !important;
        }

        .login-input::-moz-placeholder {
          color: #d1d5db !important;
          opacity: 1 !important;
        }

        .login-input:-ms-input-placeholder {
          color: #d1d5db !important;
        }

        /* ── Chrome / Edge / Safari autofill override ── */
        .login-input:-webkit-autofill,
        .login-input:-webkit-autofill:hover,
        .login-input:-webkit-autofill:focus,
        .login-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
          box-shadow: 0 0 0 1000px #ffffff inset !important;
          -webkit-text-fill-color: #1f2937 !important;
          background-color: #ffffff !important;
          transition: background-color 9999s ease-in-out 0s;
        }

        /* ── Firefox autofill ── */
        .login-input:autofill {
          background-color: #ffffff !important;
          color: #1f2937 !important;
        }

        @keyframes float-heart {
          0%, 100% {
            transform: translateY(0px) rotate(0deg) scale(1);
            opacity: 0.35;
          }
          25% {
            transform: translateY(-8px) rotate(5deg) scale(1.1);
            opacity: 0.55;
          }
          50% {
            transform: translateY(-3px) rotate(-3deg) scale(0.95);
            opacity: 0.4;
          }
          75% {
            transform: translateY(-10px) rotate(3deg) scale(1.05);
            opacity: 0.5;
          }
        }
        .animate-float-heart {
          animation: float-heart 4s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Login;
