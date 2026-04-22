/**
 * @file        SubhaLagna v3.0.4 — Axios API Base Instance
 * @description   Configures a single axios instance used by all service modules.
 *                Features:
 *                  - Attaches JWT Bearer token from localStorage automatically
 *                  - Handles 401 responses by clearing auth and redirecting to login
 *                  - Provides consistent error message extraction
 *
 * @author        SubhaLagna Team
 * @version      3.0.4
 */

import axios from 'axios';
import { API_BASE_URL } from '../config';

/**
 * Shared axios instance with base URL configured.
 * All services should import this instead of creating their own.
 */
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
});

// ── Request Interceptor: Attach Access Token ──────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor: Handle 401 (token expired) ─────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {
            refreshToken,
          });

          // Store new tokens
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);

          // Retry the failed request with new token
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(originalRequest);
        } catch {
          // Refresh failed — clear everything and redirect to login
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Extract a human-readable error message from an axios error.
 *
 * @param {import('axios').AxiosError} error
 * @param {string} [fallback='An error occurred']
 * @returns {string}
 */
export const getErrorMessage = (error, fallback = 'An error occurred') => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.message ||
    error?.message ||
    fallback
  );
};

export default api;
