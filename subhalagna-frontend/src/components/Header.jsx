/**
 * @file        SubhaLagna v3.2.6 — Global Header
 * @description   Modern, responsive navigation bar with real-time notifications and chat triggers.
 *               - Restored original gender-based default avatar image (/man.png, /woman.png).
 *               - Integrated SystemStatus indicator for real-time infrastructure monitoring.
 * @author        SubhaLagna Team
 * @version      3.2.6
 */
import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import SystemStatus from './SystemStatus';
import { getProfileAvatar } from '../utils/avatarHelper';
import { APP_NAME, BRAND_PRIMARY, BRAND_SECONDARY } from '../config';

const Header = () => {
  const { token, logoutContext, user, settings } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logoutContext();
    navigate('/login');
  };

  const navLinks = [
    {
      name: 'Matches',
      path: '/matches',
      icon: 'M12 4.318l-1.318 1.318L12 6.954l1.318-1.318L12 4.318zM12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    },
    {
      name: 'Chat',
      path: '/chat',
      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    },
  ];

  if (user?.role === 'admin') {
    navLinks.push({
      name: 'Admin',
      path: '/admin',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    });
  }

  return (
    <header className="sticky top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-pink-100/60 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* ── Logo ── */}
          <Link
            to="/"
            className="flex items-center gap-3 group transition-transform hover:scale-[1.02]"
          >
            <div className="relative w-11 h-11 rounded-xl bg-linear-to-br from-pink-400 via-pink-500 to-pink-600 shadow-md shadow-pink-200/50 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-t from-transparent to-white/20"></div>
              <svg
                className="w-6 h-6 text-white relative z-10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold tracking-tight text-slate-800">
                {settings?.brandPrimary || BRAND_PRIMARY}
                <span className="text-pink-500">{settings?.brandSecondary || BRAND_SECONDARY}</span>
              </h1>
              <p className="text-[10px] text-pink-400 font-bold uppercase tracking-[0.2em] -mt-1 opacity-80">
                Premium Matrimony
              </p>
            </div>
          </Link>

          {/* ── System Status Indicator ── */}
          <div className="hidden sm:block ml-4">
            <SystemStatus />
          </div>

          {/* ── Desktop Navigation ── */}
          {token && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    location.pathname === link.path
                      ? 'bg-pink-50 text-pink-600'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d={link.icon}
                    />
                  </svg>
                  {link.name}
                </Link>
              ))}

              <div className="h-6 w-px bg-slate-200 mx-4" />

              <div className="flex items-center gap-4">
                <NotificationBell />

                <div className="relative group">
                  <button
                    onClick={() => navigate('/profile')}
                    className="w-10 h-10 rounded-full border-2 border-pink-100 overflow-hidden hover:border-pink-300 transition-colors shadow-sm flex items-center justify-center bg-linear-to-br from-rose-500 to-pink-500"
                  >
                    <img
                      src={getProfileAvatar(user?.profile)}
                      alt="Profile"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </button>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  Log Out
                </button>
              </div>
            </nav>
          )}

          {!token && (
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-sm font-bold text-slate-600 hover:text-pink-600 transition-colors px-4"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-xl bg-pink-500 text-white text-sm font-bold hover:bg-pink-600 transition-all shadow-lg shadow-pink-200"
              >
                Join Free
              </Link>
            </div>
          )}

          {/* ── Mobile Menu Toggle ── */}
          {token && (
            <div className="md:hidden flex items-center gap-4">
              <NotificationBell />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16m-7 6h7'}
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Menu Tray ── */}
      {isMobileMenuOpen && token && (
        <div className="md:hidden animate-slide-down bg-white border-t border-slate-100 px-4 py-6 shadow-xl">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 p-4 rounded-xl text-base font-bold transition-colors ${
                  location.pathname === link.path
                    ? 'bg-pink-50 text-pink-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={link.icon}
                  />
                </svg>
                {link.name}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="mt-4 flex items-center gap-4 p-4 rounded-xl text-red-600 font-bold hover:bg-red-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
