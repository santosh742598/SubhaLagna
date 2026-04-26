/**  
 * @file        SubhaLagna v3.3.6 — Dashboard Widgets  
 * @description   Extracted widgets for Profile Dashboard.  
 *                - v3.3.3 changes:  
 *                  - Initial extraction from ProfileDashboard.jsx.  
 * @author        SubhaLagna Team  
 * @version      3.3.6  
 */  
import React from 'react';
import { Check } from './DashboardIcons';

// ─── Shared UI Components ──────────────────────────────────────────────────
const DashboardCard = ({
  children,
  title,
  icon,
  delay = '0',
  onSave,
  isSaving,
  loadingText = 'Saving...',
}) => (
  <div
    className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-slide-up group transition-all hover:shadow-[0_20px_50px_rgba(225,29,72,0.1)] mb-8"
    style={{ animationDelay: `${delay}ms` }}
  >
    {title && (
      <div className="flex items-center justify-between mb-8 border-b border-rose-50 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-50 rounded-2xl text-rose-500 group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-800 tracking-tight">{title}</h2>
        </div>
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-rose-100 flex items-center gap-2 group/btn"
          >
            {isSaving ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{loadingText}</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 group-hover/btn:scale-125 transition-transform" />
                <span>Save Section</span>
              </>
            )}
          </button>
        )}
      </div>
    )}
    {children}
  </div>
);

const FormLabel = ({ children }) => (
  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">
    {children}
  </label>
);

const formatDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

// Formats a date string (ISO) into YYYY-MM-DD for the <input type="date">
const toInputDate = (date) => {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
};


export { DashboardCard, FormLabel, formatDate, toInputDate };
