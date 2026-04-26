/**
 * @file        SubhaLagna v3.2.4 — Vite Configuration
 * @description   Build pipeline and development server setup for the frontend.
 * @author        SubhaLagna Team
 * @version      3.2.4
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
