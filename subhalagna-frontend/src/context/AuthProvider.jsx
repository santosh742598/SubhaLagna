/**
 * @file        SubhaLagna v3.3.7 — Auth Provider
 * @description   Global authentication state provider component.
 *                Separated from the Context object to support Vite Fast Refresh.
 * @author        SubhaLagna Team
 * @version      3.3.7
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  login as loginService,
  register as registerService,
  logout as logoutService,
  getMe,
} from '../services/authService';
import { fetchPublicSettings } from '../services/lookupService';
import api from '../services/api';
import { AuthContext } from './AuthContext';

/**
 * AuthProvider — wrap the entire app with this to provide auth state globally.
 * @param {object} props - Component properties.
 * @param {React.ReactNode} props.children - Child components to be wrapped.
 * @returns {React.JSX.Element} The rendered authentication provider component.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [plans, setPlans] = useState([]);

  // ── Rehydrate auth state on app boot ─────────────────────────────────────
  useEffect(() => {
    const rehydrate = async () => {
      const savedToken = localStorage.getItem('accessToken');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        setToken(savedToken);
        const { user: fetchedUser, profile, hasProfile } = await getMe();
        setUser({ ...fetchedUser, profile, hasProfile });
      } catch {
        // Token invalid or expired and refresh failed → clear state
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    rehydrate();
  }, []);

  // ── Fetch System Settings ────────────────────────────────────────────────
  const refreshSettings = useCallback(async () => {
    try {
      const data = await fetchPublicSettings();
      if (data) setSettings(data);
    } catch (err) {
      console.error('Settings Refresh Failed:', err);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  // ── Fetch Membership Plans ─────────────────────────────────────────────
  const refreshPlans = useCallback(async () => {
    try {
      const { data } = await api.get('/payments/plans');
      if (data) setPlans(data.data);
    } catch (err) {
      console.error('Plans Refresh Failed:', err);
    }
  }, []);

  useEffect(() => {
    refreshPlans();
  }, [refreshPlans]);

  /**
   * Login action — stores tokens, sets user state.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<object>} The full auth response data
   */
  const loginContext = useCallback(async (email, password) => {
    const data = await loginService({ email, password });

    // Persist tokens
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    setToken(data.accessToken);
    setUser({
      _id: data._id,
      name: data.name,
      email: data.email,
      role: data.role,
      isPremium: data.isPremium,
      premiumPlan: data.premiumPlan,
      isEmailVerified: data.isEmailVerified,
      hasProfile: data.hasProfile,
      profile: data.profile,
    });

    return data;
  }, []);

  /**
   * Register action — creates account, stores tokens, sets user state.
   * @param {object} userData
   * @returns {Promise<object>}
   */
  const registerContext = useCallback(async (userData) => {
    const data = await registerService(userData);

    // Persist tokens
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    setToken(data.accessToken);
    setUser({
      _id: data._id,
      name: data.name,
      email: data.email,
      role: data.role,
      isPremium: data.isPremium,
      premiumPlan: data.premiumPlan,
      isEmailVerified: data.isEmailVerified,
      hasProfile: data.hasProfile,
      profile: data.profile,
    });

    return data;
  }, []);

  /**
   * Logout action — clears tokens and user state.
   */
  const logoutContext = useCallback(async () => {
    await logoutService(); // clears localStorage, calls API
    setToken(null);
    setUser(null);
  }, []);

  /**
   * Update the profile field within user state (after profile edit).
   * @param {object} updatedProfile - New profile document
   */
  const updateProfileContext = useCallback((updatedProfile) => {
    setUser((prev) => (prev ? { ...prev, profile: updatedProfile, hasProfile: true } : prev));
  }, []);

  /**
   * Re-fetch the current user from the server (e.g., after payment or upgrade).
   */
  const refreshUser = useCallback(async () => {
    try {
      const { user: fetchedUser, profile, hasProfile } = await getMe();
      setUser({ ...fetchedUser, profile, hasProfile });
    } catch {
      // Silently fail — user stays logged in with stale data
    }
  }, []);

  // Derived values
  const isAuthenticated = !!user;
  const isPremium = !!(user?.isPremium && user?.premiumPlan !== 'none');

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isPremium,
    loginContext,
    registerContext,
    logoutContext,
    updateProfileContext,
    refreshUser,
    settings,
    refreshSettings,
    plans,
    refreshPlans,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
