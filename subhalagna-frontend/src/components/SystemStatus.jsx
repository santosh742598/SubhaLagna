import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

/**
 * @file        SubhaLagna v3.2.3 — System Status Indicator
 * @description   Real-time health monitor that checks API and Database availability.
 * @author        SubhaLagna Team
 * @version      3.2.3
 * @returns {JSX.Element} The status indicator component
 */
const SystemStatus = () => {
  const [status, setStatus] = useState('checking'); // checking, ok, db_down, backend_down

  const checkHealth = async () => {
    try {
      const healthUrl = API_BASE_URL.endsWith('/api') ? `${API_BASE_URL}/health` : `${API_BASE_URL}/api/health`;
      const { data } = await axios.get(healthUrl, { timeout: 5000 });
      if (data.database && data.database.connected) {
        setStatus('ok');
      } else {
        setStatus('db_down');
      }
    } catch {
      setStatus('backend_down');
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const config = {
    checking: { color: 'bg-amber-400', text: 'Checking Status', label: '🟡' },
    ok: { color: 'bg-emerald-500', text: 'All Systems Operational', label: '🟢' },
    db_down: { color: 'bg-amber-500', text: 'Database Connection Lost', label: '🟠' },
    backend_down: { color: 'bg-rose-500', text: 'Backend Offline', label: '🔴' },
  };

  const current = config[status] || config.checking;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 shadow-inner group relative cursor-help">
      <span className={`w-2 h-2 rounded-full ${current.color} animate-pulse shadow-sm`}></span>
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden lg:inline">
        {status === 'ok' ? 'System Live' : 'System Alert'}
      </span>

      {/* Tooltip */}
      <div className="absolute top-full left-0 mt-2 w-48 p-3 bg-white rounded-2xl shadow-2xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-60 transform origin-top-left scale-95 group-hover:scale-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Health Report</p>
          <span className="text-xs">{current.label}</span>
        </div>
        <p className="text-xs font-bold text-slate-800 leading-tight mb-3">{current.text}</p>
        
        <div className="space-y-2 pt-2 border-t border-slate-50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500">API Gateway</span>
            <span className={`text-[10px] font-black ${status === 'backend_down' ? 'text-rose-500' : 'text-emerald-500'}`}>
              {status === 'backend_down' ? 'OFFLINE' : 'ONLINE'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500">Database</span>
            <span className={`text-[10px] font-black ${status === 'db_down' || status === 'backend_down' ? 'text-rose-500' : 'text-emerald-500'}`}>
              {status === 'ok' ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
        
        <p className="mt-3 text-[9px] text-slate-400 text-center italic">Refreshes every 30s</p>
      </div>
    </div>
  );
};

export default SystemStatus;
