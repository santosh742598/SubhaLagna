/**
 * @file        SubhaLagna v3.1.7 — React Main Entry
 * @description   Initializes the React application and mounts it to the DOM.
 * @author        SubhaLagna Team
 * @version      3.1.7
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { APP_NAME } from './config';

// Dynamic Title
document.title = APP_NAME;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
