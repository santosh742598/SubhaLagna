/**
 * @file        SubhaLagna v3.0.4 — Main Application Router
 * @description   Entry point for all React routes. Wraps the application
 *                in required context providers (Auth → Notification → Chat)
 *                and configures all route guards.
 *                - [v3.0.4 changes]
 *                - Registered Forgot Password and Reset Password routes.
 *                - Integrated GuestRoute guarding for recovery flows.
 *                - [v3.0.0 changes]
 *                - Upgraded to Version 3.0.0.
 *                - Implemented automated Class Sorting for Tailwind CSS.
 *                - Standardized ESLint & Prettier for premium code quality.
 *                - Enhanced JSDoc requirements for architectural integrity.
 * @author        SubhaLagna Team
 * @version      3.0.4
 */

import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

/* ── Context Providers ─────────────────────────────────────────────────────── */
import { AuthProvider, AuthContext } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ChatProvider } from './context/ChatContext';

/* ── Components ────────────────────────────────────────────────────────────── */
import Header from './components/Header';
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import CreateProfile from './components/CreateProfile';
import ProfileDashboard from './components/ProfileDashboard';
import MatchResults from './components/MatchResults';
import ProfileDetail from './components/ProfileDetail';
import PremiumMembership from './components/PremiumMembership';
import Chat from './components/Chat';
import AdminDashboard from './components/AdminDashboard';
import VerifyEmail from './components/VerifyEmail';
import ShortlistedProfiles from './components/ShortlistedProfiles';
import InterestButton from './components/InterestButton'; // exported for reference

// ── Route Guards ──────────────────────────────────────────────────────────────

/**
 * GuestRoute — allows only unauthenticated users.
 * Redirects authenticated users with profiles to /matches.
 */
const GuestRoute = ({ children }) => {
  const { token, user, loading } = useContext(AuthContext);
  if (loading) return null;
  if (!token) return children;

  // If logged in but not verified, force verification
  if (user && !user.isEmailVerified) return <Navigate to="/verify-email" replace />;

  if (user && !user.hasProfile) return <Navigate to="/create-profile" replace />;
  return <Navigate to="/matches" replace />;
};

/**
 * OnboardRoute — for logged-in users who haven't set up their profile yet.
 */
const OnboardRoute = ({ children }) => {
  const { token, user, loading } = useContext(AuthContext);
  if (loading) return null;
  if (!token) return <Navigate to="/login" replace />;

  // Force email verification first
  if (user && !user.isEmailVerified) return <Navigate to="/verify-email" replace />;

  if (user && user.hasProfile) return <Navigate to="/matches" replace />;
  return children;
};

/**
 * ProtectedRoute — requires: logged in + profile exists.
 */
const ProtectedRoute = ({ children }) => {
  const { token, user, loading } = useContext(AuthContext);
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  if (!token) return <Navigate to="/login" replace />;

  // Must be verified
  if (user && !user.isEmailVerified) return <Navigate to="/verify-email" replace />;

  if (user && !user.hasProfile) return <Navigate to="/create-profile" replace />;
  return children;
};

/**
 * AdminRoute — requires: logged in + role === 'admin'.
 */
const AdminRoute = ({ children }) => {
  const { token, user, loading } = useContext(AuthContext);
  if (loading) return null;
  if (!token || !user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/matches" replace />;
  return children;
};

// ── Shared App Layout ─────────────────────────────────────────────────────────

/**
 * AppLayout — wraps dashboard pages with the Header + gradient background blobs.
 */
const AppLayout = () => (
  <>
    {/* Decorative ambient gradient blobs */}
    <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-200/30 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />
    <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-200/30 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />

    <Header />

    <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto relative z-10">
      <Outlet />
    </main>
  </>
);

// ── Root App Component ────────────────────────────────────────────────────────

/**
 * App — configures context provider nesting and route tree.
 *
 * @returns {JSX.Element}
 */
function App() {
  return (
    /*
     * Provider nesting is intentional:
     * AuthProvider is outermost (token state)
     * NotificationProvider depends on AuthContext
     * ChatProvider depends on both Auth + Notification contexts
     */
    <AuthProvider>
      <NotificationProvider>
        <ChatProvider>
          <Router>
            <div className="min-h-screen relative flex flex-col font-sans">
              <Routes>
                {/* ── Public Marketing Landing ────────────────────────── */}
                <Route path="/" element={<Home />} />

                {/* ── Auth + Dashboard Layout ──────────────────────────── */}
                <Route element={<AppLayout />}>
                  {/* Auth flows (redirect to /matches if already logged in) */}
                  <Route
                    path="/login"
                    element={
                      <GuestRoute>
                        <Login />
                      </GuestRoute>
                    }
                  />
                  <Route
                    path="/signup"
                    element={
                      <GuestRoute>
                        <Signup />
                      </GuestRoute>
                    }
                  />
                  <Route
                    path="/forgot-password"
                    element={
                      <GuestRoute>
                        <ForgotPassword />
                      </GuestRoute>
                    }
                  />
                  <Route
                    path="/reset-password/:token"
                    element={
                      <GuestRoute>
                        <ResetPassword />
                      </GuestRoute>
                    }
                  />

                  {/* Onboarding — create initial profile */}
                  <Route
                    path="/verify-email"
                    element={
                      <OnboardRoute>
                        <VerifyEmail />
                      </OnboardRoute>
                    }
                  />
                  <Route
                    path="/create-profile"
                    element={
                      <OnboardRoute>
                        <CreateProfile />
                      </OnboardRoute>
                    }
                  />

                  {/* ── Protected Dashboard Routes ────────────────────── */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfileDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/premium"
                    element={
                      <ProtectedRoute>
                        <PremiumMembership />
                      </ProtectedRoute>
                    }
                  />

                  {/* ── v2.0.0 New Features ───────────────────────────── */}
                  <Route
                    path="/chat"
                    element={
                      <ProtectedRoute>
                        <Chat />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/chat/:conversationId"
                    element={
                      <ProtectedRoute>
                        <Chat />
                      </ProtectedRoute>
                    }
                  />

                  {/* ── Admin Dashboard ───────────────────────────────── */}
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    }
                  />

                  {/* ── Shortlisted Profiles ────────────────────────────── */}
                  <Route
                    path="/shortlisted"
                    element={
                      <ProtectedRoute>
                        <ShortlistedProfiles />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* ── Routes without the standard AppLayout padding ────── */}
                <Route
                  path="/matches"
                  element={
                    <ProtectedRoute>
                      <MatchResults />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/:id"
                  element={
                    <ProtectedRoute>
                      <ProfileDetail />
                    </ProtectedRoute>
                  }
                />

                {/* ── Catch-all 404 ─────────────────────────────────────── */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </ChatProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
