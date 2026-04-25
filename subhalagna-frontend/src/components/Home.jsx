/**
 * @file        SubhaLagna v3.1.0 — Interactive Landing Page
 * @description Transitioned to session-aware UI.
 *                - [v3.0.0 changes]
 *                - Upgraded to Version 3.0.0 with automated coding standards.
 *                - Implemented session-aware buttons (Dashboard/Logout toggle).
 *                - Standardized Prettier formatting and Tailwind class sorting.
 *                - Verified responsive layouts across mobile/desktop views.
 * @author        SubhaLagna Team
 * @version      3.1.0
 */
import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import heroImage from '../assets/hero-image.jpg';
import Couple1 from '../assets/couple1.jpg';
import Couple2 from '../assets/couple2.jpeg';
import Couple3 from '../assets/couple3.jpeg';
import Couple4 from '../assets/couple4.jpg';
import sacredBond from '../assets/sacred-bond.jpg';
import familiesUnite from '../assets/family-unite.jpg';
import growingTogether from '../assets/grow-together.jpg';

// ─── Counter Animation Hook ────────────────────────────────────────────────
const useCountUp = (end, duration = 2000, startOnView = true) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!startOnView) {
      setHasStarted(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted, startOnView]);

  useEffect(() => {
    if (!hasStarted) return;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [hasStarted, end, duration]);

  return { count, ref };
};

// ─── Extracted StatCard ─────────────────────────────────────────────────────
const StatCard = ({ end, suffix, label, icon }) => {
  const { count, ref } = useCountUp(end, 2500);
  return (
    <div ref={ref} className="text-center group">
      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-700 mb-1 tabular-nums">
        {count.toLocaleString()}
        <span className="text-rose-400">{suffix}</span>
      </div>
      <div className="text-gray-500 font-medium text-xs md:text-sm tracking-wide">{label}</div>
    </div>
  );
};

// ─── Sliding Testimonials Hook ──────────────────────────────────────────────
const useSlider = (length, interval = 5000) => {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % length);
    }, interval);
    return () => clearInterval(timer);
  }, [length, interval]);
  return [current, setCurrent];
};

// ─── Header ─────────────────────────────────────────────────────────────────
const Header = () => {
  const { token, logoutContext } = useContext(AuthContext);
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logoutContext();
    navigate('/login');
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-white/90 backdrop-blur-xl shadow-lg shadow-rose-100/20' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-400 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-rose-300/50 transition-all duration-300 group-hover:scale-110">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <span
            className={`text-2xl font-serif font-bold transition-colors duration-300 ${
              scrolled ? 'text-gray-800' : 'text-white'
            }`}
          >
            Subha<span className="text-rose-500">Lagna</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {['Home', 'About', 'Success Stories', 'Contact'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(' ', '-')}`}
              className={`font-medium transition-all duration-300 hover:text-rose-500 relative group ${
                scrolled ? 'text-gray-600' : 'text-white/90'
              }`}
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-rose-500 group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {token ? (
            <>
              <Link
                to="/matches"
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                  scrolled ? 'text-gray-700 hover:text-rose-600' : 'text-white/90 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="px-6 py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-black hover:to-black text-white font-semibold rounded-xl shadow-lg transition-all duration-300"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                  scrolled ? 'text-gray-700 hover:text-rose-600' : 'text-white/90 hover:text-white'
                }`}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:-translate-y-0.5 transition-all duration-300"
              >
                Register Free
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`md:hidden p-2 rounded-lg transition-colors ${
            scrolled ? 'text-gray-700' : 'text-white'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-all duration-500 bg-white/95 backdrop-blur-xl ${
          menuOpen ? 'max-h-96 shadow-xl' : 'max-h-0'
        }`}
      >
        <div className="px-6 py-4 flex flex-col gap-4">
          {['Home', 'About', 'Success Stories', 'Contact'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(' ', '-')}`}
              className="text-gray-700 font-medium py-2 hover:text-rose-500 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {item}
            </a>
          ))}
          <div className="flex gap-3 pt-2">
            {token ? (
              <>
                <Link
                  to="/matches"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center py-2.5 border-2 border-rose-200 text-rose-600 rounded-xl font-semibold"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex-1 text-center py-2.5 bg-slate-900 text-white rounded-xl font-semibold"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center py-2.5 border-2 border-rose-200 text-rose-600 rounded-xl font-semibold"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center py-2.5 bg-rose-600 text-white rounded-xl font-semibold"
                >
                  Register Free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// ─── Hero Section ────────────────────────────────────────────────────────────
const HeroSection = () => {
  const { token } = useContext(AuthContext);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Indian wedding celebration"
          className={`w-full h-full object-cover transition-opacity duration-[2000ms] ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImgLoaded(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-rose-900/30 via-transparent to-pink-900/20" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          >
            <div
              className="bg-white/30 rounded-full"
              style={{ width: `${2 + Math.random() * 4}px`, height: `${2 + Math.random() * 4}px` }}
            />
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-32 pb-24">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-2 mb-8 animate-bounce-slow">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-white/90 text-sm font-medium tracking-wide">
            Trusted by 5,000+ Community Members
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white mb-6 leading-[1.1] tracking-tight">
          Find Your{' '}
          <span className="relative inline-block">
            <span className="relative z-10 bg-gradient-to-r from-rose-300 via-pink-400 to-pink-300 bg-clip-text text-transparent">
              Forever
            </span>
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
              <path
                d="M2 8C50 2 150 2 198 8"
                stroke="url(#underline-grad)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="underline-grad" x1="0" y1="0" x2="200" y2="0">
                  <stop offset="0%" stopColor="#fb7185" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          <br />
          <span className="text-white/80 italic font-light">Starting Today</span>
        </h1>

        <p className="text-lg md:text-xl lg:text-2xl text-white/70 font-light mb-12 max-w-2xl mx-auto leading-relaxed">
          The most secure and trusted matrimonial platform exclusively for your community. Where
          honest profiles meet{' '}
          <span className="text-pink-300 font-medium">intelligent matchmaking</span>.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          {token ? (
            <Link
              to="/matches"
              className="group px-10 py-5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold rounded-2xl text-lg shadow-2xl shadow-rose-500/30 hover:shadow-rose-500/50 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          ) : (
            <>
              <Link
                to="/signup"
                className="group px-10 py-5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold rounded-2xl text-lg shadow-2xl shadow-rose-500/30 hover:shadow-rose-500/50 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Begin Your Journey
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
              <Link
                to="/login"
                className="px-10 py-5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold rounded-2xl text-lg hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
              >
                Member Login
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

// ─── Stats Section ───────────────────────────────────────────────────────────
const StatsSection = () => {
  const stats = [
    { end: 5200, suffix: '+', label: 'Happy Members', icon: '👥' },
    { end: 1850, suffix: '+', label: 'Successful Matches', icon: '💍' },
    { end: 1200, suffix: '+', label: 'Weddings Celebrated', icon: '🎊' },
    { end: 96, suffix: '%', label: 'Satisfaction Rate', icon: '⭐' },
  ];

  return (
    <section className="relative py-10 bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 border-y border-rose-100/60 overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #fecdd3 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── About / How It Works ────────────────────────────────────────────────────
const HowItWorks = () => {
  const steps = [
    {
      num: '01',
      title: 'Create Account',
      desc: 'Sign up first with your email and name to secure your spot in our community.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          />
        </svg>
      ),
    },
    {
      num: '02',
      title: 'Upload Photos',
      desc: 'Upload your likely images and best shots to make your profile attractive to matches.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      num: '03',
      title: 'Register Profile',
      desc: 'Complete your detailed registration with family, education, and partner preferences.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      num: '04',
      title: 'Discover Matches',
      desc: 'Our intelligent algorithm finds compatible profiles based on your lifestyle and values.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
    },
    {
      num: '05',
      title: 'Connect & Chat',
      desc: 'Securely communicate and begin your beautiful journey together with your partner.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
    },
  ];

  return (
    <section id="about" className="py-24 bg-gradient-to-b from-white to-rose-50/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 bg-rose-100 text-rose-600 rounded-full text-sm font-semibold mb-4 tracking-wide">
            HOW IT WORKS
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-800 mb-6">
            Your Journey to{' '}
            <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
              Happily Ever After
            </span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Simple steps to finding your perfect life partner with SubhaLagna
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {steps.map((step, i) => (
            <div
              key={i}
              className="group relative bg-white rounded-3xl p-8 shadow-lg shadow-rose-100/50 hover:shadow-2xl hover:shadow-rose-200/50 hover:-translate-y-2 transition-all duration-500 border border-rose-50 overflow-hidden"
            >
              <div className="absolute top-4 right-5 text-6xl font-bold text-rose-50 font-serif select-none group-hover:text-rose-100 transition-colors duration-300 pointer-events-none leading-none">
                {step.num}
              </div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-rose-500/20 group-hover:scale-110 transition-transform duration-300">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
              {i < 4 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 z-20">
                  <div className="border-t-2 border-dashed border-rose-200 w-full" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Success Stories ─────────────────────────────────────────────────────────
const SuccessStories = () => {
  const stories = [
    {
      couple: 'Rahul & Priya',
      image: Couple1,
      quote:
        'We never imagined finding each other online. SubhaLagna made it so easy and natural. Our families connected instantly, and the rest is history!',
      date: 'Married Dec 2023',
      location: 'Bhubaneswar, Odisha',
    },
    {
      couple: 'Arjun & Sneha',
      image: Couple2,
      quote:
        "The matching algorithm understood what we were looking for even better than we did ourselves. We're grateful every single day for this platform.",
      date: 'Married Mar 2024',
      location: 'Cuttack, Odisha',
    },
    {
      couple: 'Vikram & Meera',
      image: Couple3,
      quote:
        'From the first message to our wedding day, SubhaLagna was with us at every step. The privacy and security gave our families confidence.',
      date: 'Married Aug 2024',
      location: 'Puri, Odisha',
    },
    {
      couple: 'Karan & Anjali',
      image: Couple4,
      quote:
        "We were introduced through SubhaLagna's smart suggestions. What started as a simple 'Hi' turned into a lifetime of love and togetherness.",
      date: 'Married Jan 2024',
      location: 'Rourkela, Odisha',
    },
  ];

  const [current, setCurrent] = useSlider(stories.length, 6000);

  return (
    <section
      id="success-stories"
      className="py-24 bg-gradient-to-b from-rose-50/30 to-white overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold mb-4 tracking-wide">
            ❤️ REAL LOVE STORIES
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-800 mb-6">
            Matches Made in{' '}
            <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
              Heaven
            </span>
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Thousands of couples have found their soulmates through SubhaLagna
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto px-8 md:px-12">
          <div className="overflow-hidden rounded-3xl">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {stories.map((story, i) => (
                <div key={i} className="w-full flex-shrink-0">
                  <div className="bg-white rounded-3xl shadow-xl shadow-rose-100/50 overflow-hidden border border-rose-50">
                    <div className="grid md:grid-cols-2">
                      <div className="relative h-72 md:h-96">
                        <img
                          src={story.image}
                          alt={story.couple}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/10" />
                        <div className="absolute bottom-4 left-4 md:hidden">
                          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-semibold text-rose-600">
                            {story.couple}
                          </span>
                        </div>
                      </div>
                      <div className="p-8 md:p-12 flex flex-col justify-center">
                        <svg
                          className="w-10 h-10 text-rose-200 mb-6 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                        </svg>
                        <p className="text-gray-600 text-lg leading-relaxed mb-6 italic">
                          &ldquo;{story.quote}&rdquo;
                        </p>
                        <div>
                          <h4 className="text-xl font-bold text-gray-800">{story.couple}</h4>
                          <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                            <span>{story.date}</span>
                            <span>•</span>
                            <span>{story.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-3 mt-8">
            {stories.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`transition-all duration-300 rounded-full ${i === current ? 'w-10 h-3 bg-rose-500' : 'w-3 h-3 bg-rose-200 hover:bg-rose-300'}`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrent((current - 1 + stories.length) % stories.length)}
            className="absolute top-1/2 left-0 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:scale-110 transition-all z-10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={() => setCurrent((current + 1) % stories.length)}
            className="absolute top-1/2 right-0 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:scale-110 transition-all z-10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

// ─── Marriage Experience Section ──────────────────────────────────────────────
const MarriageExperience = () => {
  const experiences = [
    {
      title: 'A Sacred Bond',
      desc: 'Marriage is more than a ceremony — it is the beginning of a lifelong partnership built on love, trust, and mutual respect. This bond carries generations of tradition and meaning.',
      image: sacredBond,
      align: 'left',
    },
    {
      title: 'Two Families Unite',
      desc: 'When two souls come together, so do their families. The joy of shared celebrations, combined traditions, and new relationships makes the experience truly magical.',
      image: familiesUnite,
      align: 'right',
    },
    {
      title: 'Growing Together',
      desc: "Every day of married life is an opportunity to grow together — through laughter and challenges, through milestones and quiet moments. It's a journey of endless discovery.",
      image: growingTogether,
      align: 'left',
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-white to-rose-50/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 bg-rose-100 text-rose-600 rounded-full text-sm font-semibold mb-4 tracking-wide">
            THE BEAUTIFUL JOURNEY
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-800 mb-6">
            The Experience of{' '}
            <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
              Marriage
            </span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Marriage is a beautiful tapestry woven with love, tradition, and the promise of forever
          </p>
        </div>

        <div className="space-y-24">
          {experiences.map((exp, i) => (
            <div
              key={i}
              className={`flex flex-col ${exp.align === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 md:gap-16`}
            >
              <div className="w-full md:w-1/2">
                <div className="relative group">
                  <div
                    className={`absolute -inset-4 bg-gradient-to-r ${i === 0 ? 'from-rose-400 to-pink-400' : i === 1 ? 'from-pink-400 to-rose-400' : 'from-rose-500 to-pink-400'} rounded-3xl opacity-20 group-hover:opacity-30 blur-xl transition-opacity duration-500`}
                  />
                  <img
                    src={exp.image}
                    alt={exp.title}
                    className="relative w-full h-72 sm:h-80 md:h-96 object-cover rounded-3xl shadow-2xl group-hover:scale-[1.02] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-1 bg-gradient-to-r from-rose-500 to-pink-400 rounded-full" />
                  <span className="text-rose-400 font-medium text-sm tracking-wider uppercase">
                    Chapter {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="text-3xl md:text-4xl font-serif font-bold text-gray-800 mb-6">
                  {exp.title}
                </h3>
                <p className="text-gray-500 text-lg leading-relaxed mb-8">{exp.desc}</p>
                <div className="flex gap-8">
                  {[
                    { val: 'Love', sub: 'Foundation' },
                    { val: 'Trust', sub: 'Pillar' },
                    { val: 'Joy', sub: 'Reward' },
                  ].map((item, j) => (
                    <div key={j} className="text-center">
                      <div className="text-2xl font-bold text-rose-500">{item.val}</div>
                      <div className="text-xs text-gray-400 mt-1">{item.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

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
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
};

// ─── CTA Section (Card with floating hearts) ────────────────────────────────
const CTASection = () => {
  const { token } = useContext(AuthContext);
  const hearts = [
    { left: '5%', top: '10%', size: 'xs', color: 'text-rose-200', delay: '0s', duration: '4s' },
    { left: '15%', top: '70%', size: 'sm', color: 'text-pink-200', delay: '1s', duration: '5s' },
    { left: '25%', top: '25%', size: 'md', color: 'text-rose-150', delay: '2s', duration: '3.5s' },
    {
      left: '35%',
      top: '80%',
      size: 'xs',
      color: 'text-pink-300/40',
      delay: '0.5s',
      duration: '4.5s',
    },
    {
      left: '45%',
      top: '15%',
      size: 'sm',
      color: 'text-rose-300/30',
      delay: '3s',
      duration: '5.5s',
    },
    { left: '55%', top: '60%', size: 'xs', color: 'text-pink-200', delay: '1.5s', duration: '4s' },
    {
      left: '65%',
      top: '35%',
      size: 'lg',
      color: 'text-rose-200/50',
      delay: '2.5s',
      duration: '6s',
    },
    {
      left: '75%',
      top: '75%',
      size: 'sm',
      color: 'text-pink-300/30',
      delay: '0.8s',
      duration: '3.8s',
    },
    {
      left: '85%',
      top: '20%',
      size: 'md',
      color: 'text-rose-200/60',
      delay: '1.2s',
      duration: '5.2s',
    },
    {
      left: '92%',
      top: '55%',
      size: 'xs',
      color: 'text-pink-200',
      delay: '3.5s',
      duration: '4.2s',
    },
    {
      left: '10%',
      top: '45%',
      size: 'md',
      color: 'text-rose-300/25',
      delay: '2.2s',
      duration: '5.8s',
    },
    {
      left: '50%',
      top: '85%',
      size: 'sm',
      color: 'text-pink-200/50',
      delay: '0.3s',
      duration: '4.8s',
    },
    {
      left: '70%',
      top: '10%',
      size: 'xs',
      color: 'text-rose-200',
      delay: '1.8s',
      duration: '3.2s',
    },
    { left: '30%', top: '50%', size: 'xs', color: 'text-pink-300/35', delay: '4s', duration: '5s' },
    {
      left: '80%',
      top: '45%',
      size: 'sm',
      color: 'text-rose-200/40',
      delay: '2.8s',
      duration: '4.5s',
    },
    {
      left: '20%',
      top: '90%',
      size: 'xs',
      color: 'text-pink-200',
      delay: '1.6s',
      duration: '3.6s',
    },
    {
      left: '60%',
      top: '5%',
      size: 'sm',
      color: 'text-rose-300/30',
      delay: '3.2s',
      duration: '5.4s',
    },
    {
      left: '40%',
      top: '40%',
      size: 'xs',
      color: 'text-pink-200/60',
      delay: '0.7s',
      duration: '4.3s',
    },
    {
      left: '88%',
      top: '85%',
      size: 'md',
      color: 'text-rose-200/35',
      delay: '2.4s',
      duration: '5.6s',
    },
    {
      left: '8%',
      top: '60%',
      size: 'sm',
      color: 'text-pink-300/25',
      delay: '3.8s',
      duration: '4.1s',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100/80 rounded-[2.5rem] px-8 py-16 md:px-16 md:py-20 shadow-xl shadow-rose-100/40 border border-rose-100/60 overflow-hidden">
          {/* Floating Hearts */}
          {hearts.map((heart, i) => (
            <FloatingHeart
              key={i}
              size={heart.size}
              style={{
                left: heart.left,
                top: heart.top,
                animationDelay: heart.delay,
                animationDuration: heart.duration,
              }}
            />
          ))}

          {/* Subtle radial glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-200/20 rounded-full blur-3xl pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 text-center">
            <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-rose-200/50 rounded-full px-4 py-1.5 mb-8">
              <span className="text-rose-400 text-sm">💕</span>
              <span className="text-rose-500 text-sm font-medium">Start your journey today</span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-gray-800 mb-6 leading-tight">
              Your Love Story <br />
              <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent italic">
                Awaits
              </span>
            </h2>

            <p className="text-gray-500 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
              Join thousands of members who have found their perfect match on SubhaLagna. Your
              forever person could be just one click away.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {token ? (
                <Link
                  to="/matches"
                  className="group px-10 py-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold rounded-2xl text-lg shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Go to Dashboard
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="group px-10 py-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold rounded-2xl text-lg shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    Register Free Today
                    <svg
                      className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                  <Link
                    to="/login"
                    className="px-10 py-4 bg-white hover:bg-rose-50 border-2 border-rose-200 hover:border-rose-300 text-rose-600 font-bold rounded-2xl text-lg hover:-translate-y-1 transition-all duration-300 shadow-sm"
                  >
                    Login to Account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Footer ──────────────────────────────────────────────────────────────────
const Footer = () => (
  <footer id="contact" className="bg-gray-900 text-gray-400">
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-400 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <span className="text-2xl font-serif font-bold text-white">
              Subha<span className="text-rose-400">Lagna</span>
            </span>
          </div>
          <p className="text-gray-500 leading-relaxed mb-6">
            The most trusted matrimonial platform. Building beautiful families since 2020.
          </p>
          <div className="flex gap-4">
            {['facebook', 'twitter', 'instagram', 'youtube'].map((social) => (
              <a
                key={social}
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-rose-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:-translate-y-1"
              >
                <span className="text-sm text-gray-400 hover:text-white">
                  {social[0].toUpperCase()}
                </span>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6 text-lg">Quick Links</h4>
          <ul className="space-y-3">
            {[
              'Home',
              'About Us',
              'Search Profiles',
              'Success Stories',
              'Pricing',
              'Contact Us',
            ].map((link) => (
              <li key={link}>
                <a
                  href="#"
                  className="hover:text-rose-400 transition-colors flex items-center gap-2"
                >
                  <svg className="w-3 h-3 text-rose-500/50" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6 text-lg">Support</h4>
          <ul className="space-y-3">
            {[
              'Help Center',
              'Safety Tips',
              'Privacy Policy',
              'Terms of Service',
              'Community Guidelines',
              'Report an Issue',
            ].map((link) => (
              <li key={link}>
                <a
                  href="#"
                  className="hover:text-rose-400 transition-colors flex items-center gap-2"
                >
                  <svg className="w-3 h-3 text-rose-500/50" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6 text-lg">Contact Us</h4>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Saheed Nagar, Bhubaneswar 751007, Odisha</span>
            </div>
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-rose-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <span>+91 98765 43210</span>
            </div>
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-rose-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span>support@subhalagna.com</span>
            </div>
          </div>

          <div className="mt-6">
            <h5 className="text-white font-semibold mb-3 text-sm">Subscribe Newsletter</h5>
            <div className="flex">
              <input
                type="email"
                placeholder="Enter email"
                className="flex-1 min-w-0 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-l-xl text-sm focus:outline-none focus:border-rose-500 text-white placeholder-gray-500"
              />
              <button className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-r-xl transition-colors flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-gray-500 text-sm text-center md:text-left">
          © {new Date().getFullYear()} SubhaLagna. All rights reserved. Made with{' '}
          <span className="text-rose-500">❤</span> for you.
        </p>
        <div className="flex items-center gap-6 text-sm">
          <a href="#" className="hover:text-rose-400 transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-rose-400 transition-colors">
            Terms
          </a>
          <a href="#" className="hover:text-rose-400 transition-colors">
            Cookies
          </a>
        </div>
      </div>
    </div>
  </footer>
);

// ─── Main Home Component ─────────────────────────────────────────────────────
const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <StatsSection />
      <HowItWorks />
      <SuccessStories />
      <MarriageExperience />
      <CTASection />
      <Footer />

      <style>{`
            @keyframes bounce-slow {
               0%, 100% { transform: translateY(0); }
               50% { transform: translateY(-5px); }
            }
            .animate-bounce-slow {
               animation: bounce-slow 3s ease-in-out infinite;
            }
            @keyframes float-heart {
               0%, 100% {
                  transform: translateY(0px) rotate(0deg) scale(1);
                  opacity: 0.4;
               }
               25% {
                  transform: translateY(-8px) rotate(5deg) scale(1.1);
                  opacity: 0.7;
               }
               50% {
                  transform: translateY(-3px) rotate(-3deg) scale(0.95);
                  opacity: 0.5;
               }
               75% {
                  transform: translateY(-10px) rotate(3deg) scale(1.05);
                  opacity: 0.6;
               }
            }
            .animate-float-heart {
               animation: float-heart 4s ease-in-out infinite;
               color: #fecdd3;
            }
            html {
               scroll-behavior: smooth;
            }
            ::-webkit-scrollbar {
               display: none;
            }
            html {
               -ms-overflow-style: none;
               scrollbar-width: none;
            }
         `}</style>
    </div>
  );
};

export default Home;
