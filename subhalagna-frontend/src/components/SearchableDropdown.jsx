/**
 * @file        SubhaLagna v3.0.2 — Searchable Dropdown
 * @description   A reusable interactive dropdown with search filtering and manual entry support.
 */

import React, { useState, useRef, useEffect } from 'react';

const SearchableDropdown = ({
  label,
  name,
  value,
  options,
  onChange,
  placeholder,
  disabled,
  minChars = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const wrapperRef = useRef(null);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  const filteredOptions = (options || []).filter((opt) =>
    opt?.toString().toLowerCase().includes(searchTerm.toString().toLowerCase()),
  );

  const handleSelect = (opt) => {
    onChange({ target: { name, value: opt } });
    setSearchTerm(opt);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    onChange({ target: { name, value: e.target.value } });
    setIsOpen(true);
  };

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">{label}</label>
      <input
        type="text"
        name={name}
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-400 transition-all text-sm text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ outline: 'none' }}
      />
      {isOpen && searchTerm.length >= minChars && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-rose-100 rounded-xl shadow-xl shadow-rose-100/30 max-h-44 overflow-y-auto">
          {filteredOptions.length > 0
            ? filteredOptions.map((opt, i) => (
                <div
                  key={i}
                  onClick={() => handleSelect(opt)}
                  className="px-4 py-2.5 hover:bg-rose-50 cursor-pointer text-sm text-gray-700 transition-colors border-b last:border-0 border-gray-50"
                >
                  {opt}
                </div>
              ))
            : searchTerm.length > 0 && (
                <div className="px-4 py-2.5 text-xs text-gray-400 italic">
                  "{searchTerm}" not in list — using as manual entry.
                </div>
              )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
