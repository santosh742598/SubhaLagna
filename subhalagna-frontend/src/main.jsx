/**
 * @file        SubhaLagna v3.0.8 — React Main Entry
 * @description   Initializes the React application and mounts it to the DOM.
 * @author        SubhaLagna Team
 * @version      3.0.8
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
