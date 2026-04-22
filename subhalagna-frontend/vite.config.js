/**
 * @file        SubhaLagna v3.0.5 — Vite Configuration
 * @description   Build pipeline and development server setup for the frontend.
 * @author        SubhaLagna Team
 * @version      3.0.5
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
