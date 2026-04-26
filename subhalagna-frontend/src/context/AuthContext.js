/**
 * @file        SubhaLagna v3.3.5 — Auth Context Core
 * @description   The raw React Context object for Authentication.
 *                Separated from the Provider to support Vite Fast Refresh.
 * @author        SubhaLagna Team
 * @version      3.3.5
 */

import { createContext } from 'react';

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

export const AuthContext = createContext(
  /** @type {AuthContextValue} */ ({
    user: null,
    token: null,
    loading: true,
    isAuthenticated: false,
    isPremium: false,
    loginContext: () => {},
    registerContext: () => {},
    logoutContext: () => {},
    updateProfileContext: () => {},
    refreshUser: () => {},
    settings: null,
    refreshSettings: () => {},
    plans: [],
    refreshPlans: () => {},
  }),
);
