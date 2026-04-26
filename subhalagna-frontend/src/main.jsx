/**
 * @file        SubhaLagna v3.3.3 — React Main Entry
 * @description   Initializes the React application and mounts it to the DOM.
 * @author        SubhaLagna Team
 * @version      3.3.3
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);
