/**
 * @fileoverview SubhaLagna v2.0.0 — Auth Context
 * @description   Global authentication state provider. Supplies `user`, `token`,
 *                and auth actions to all child components via React Context API.
 *
 *                v2.0.0 changes:
 *                  - Uses authService functions instead of raw fetch calls
 *                  - Stores both accessToken and refreshToken in localStorage
 *                  - Handles token refresh transparently (via axios interceptor)
 *                  - Provides `isPremium` computed getter
 *
 * @author        SubhaLagna Team
 * @version       2.0.0
 */

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { login as loginService, register as registerService, logout as logoutService, getMe } from '../services/authService';

/**
 * AuthContext shape:
 * @typedef {object} AuthContextValue
 * @property {object|null}   user                - Current user data
 * @property {string|null}   token               - Current JWT access token
 * @property {boolean}       loading             - Initial auth check in progress
 * @property {boolean}       isAuthenticated     - Whether user is logged in
 * @property {boolean}       isPremium           - Whether user has active premium
 * @property {Function}      loginContext        - Login action
 * @property {Function}      registerContext     - Register action
 * @property {Function}      logoutContext       - Logout action
 * @property {Function}      updateProfileContext - Update profile in state
 * @property {Function}      refreshUser         - Re-fetch user from server
 */

export const AuthContext = createContext(/** @type {AuthContextValue} */({
  user:                 null,
  token:                null,
  loading:              true,
  isAuthenticated:      false,
  isPremium:            false,
  loginContext:         () => {},
  registerContext:      () => {},
  logoutContext:        () => {},
  updateProfileContext: () => {},
  refreshUser:          () => {},
}));

/**
 * AuthProvider — wrap the entire app with this to provide auth state globally.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

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
        const { user: fetchedUser, profile } = await getMe();
        setUser({ ...fetchedUser, profile });
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

  /**
   * Login action — stores tokens, sets user state.
   *
   * @param {string} email
   * @param {string} password
   * @returns {Promise<object>} The full auth response data
   */
  const loginContext = useCallback(async (email, password) => {
    const data = await loginService({ email, password });

    // Persist tokens
    localStorage.setItem('accessToken',  data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    setToken(data.accessToken);
    setUser({
      _id:             data._id,
      name:            data.name,
      email:           data.email,
      role:            data.role,
      isPremium:       data.isPremium,
      premiumPlan:     data.premiumPlan,
      isEmailVerified: data.isEmailVerified,
      hasProfile:      data.hasProfile,
      profile:         data.profile,
    });

    return data;
  }, []);

  /**
   * Register action — creates account, stores tokens, sets user state.
   *
   * @param {object} userData
   * @returns {Promise<object>}
   */
  const registerContext = useCallback(async (userData) => {
    const data = await registerService(userData);

    // Persist tokens
    localStorage.setItem('accessToken',  data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    setToken(data.accessToken);
    setUser({
      _id:             data._id,
      name:            data.name,
      email:           data.email,
      role:            data.role,
      isPremium:       data.isPremium,
      premiumPlan:     data.premiumPlan,
      isEmailVerified: data.isEmailVerified,
      hasProfile:      data.hasProfile,
      profile:         data.profile,
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
   *
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
      const { user: fetchedUser, profile } = await getMe();
      setUser({ ...fetchedUser, profile });
    } catch {
      // Silently fail — user stays logged in with stale data
    }
  }, []);

  // Derived values
  const isAuthenticated = !!user;
  const isPremium       = !!(user?.isPremium && user?.premiumPlan !== 'none');

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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
