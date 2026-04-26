/**  
 * @file        SubhaLagna v3.3.6 — Home Header Component  
 * @description   Extracted Header component for the landing page.  
 *                - v3.3.3 changes:  
 *                  - Initial extraction from Home.jsx.  
 * @author        SubhaLagna Team  
 * @version      3.3.6  
 */  
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

// ─── Header ─────────────────────────────────────────────────────────────────
const Header = () => {
  const { token, logoutContext, settings } = useContext(AuthContext);
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
          <div className="w-10 h-10 bg-linear-to-br from-rose-500 to-pink-400 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-rose-300/50 transition-all duration-300 group-hover:scale-110">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <span
            className={`text-2xl font-serif font-bold transition-colors duration-300 ${
              scrolled ? 'text-gray-800' : 'text-white'
            }`}
          >
            {settings?.brandPrimary || 'Subha'}
            <span className="text-rose-500">{settings?.brandSecondary || 'Lagna'}</span>
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
                className="px-6 py-2.5 bg-linear-to-r from-slate-800 to-slate-900 hover:from-black hover:to-black text-white font-semibold rounded-xl shadow-lg transition-all duration-300"
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
                className="px-6 py-2.5 bg-linear-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:-translate-y-0.5 transition-all duration-300"
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


export default Header;
