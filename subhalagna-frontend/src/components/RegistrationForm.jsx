/**
 * @file        SubhaLagna v3.2.3 — Quick Registration Form
 * @description   Initial lead generation form for new guests to quickly find matches.
 * @author        SubhaLagna Team
 * @version      3.2.3
 */
import React, { useState } from 'react';
import { CITIES } from '../data/mockProfiles';
import { API_BASE_URL } from '../config';

const RegistrationForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    location: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.gender || !formData.location) return;

    setIsSubmitting(true);
    try {
      const apiUrl = API_BASE_URL.endsWith('/api') ? `${API_BASE_URL}/profiles` : `${API_BASE_URL}/api/profiles`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        // Artificial delay for smooth UX (unwrap data.data to ensure consistent profile objects)
        setTimeout(() => onSubmit(data.data || data), 500);
      } else {
        console.error('Failed to register');
      }
    } catch (error) {
      console.error('Error:', error);
      // Fallback to local submission if backend is down for some reason
      setTimeout(() => onSubmit(formData), 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 w-full h-full relative z-10 animate-fade-in delay-100">
      <div className="max-w-md w-full glass-card p-8 rounded-3xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-bold text-gray-800 mb-2">
            Find Your Perfect Match
          </h2>
          <p className="text-gray-500 text-sm">
            Join the Telli Community network to discover authentic profiles near you.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1" htmlFor="name">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="e.g. Ramesh Sahu"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all font-sans text-gray-800"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Gender Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Gender</label>
            <div className="flex gap-3">
              <label
                className={`flex-1 py-3 px-4 border rounded-xl cursor-pointer text-center transition-all ${formData.gender === 'Male' ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm' : 'border-gray-200 bg-white/50 text-gray-600 hover:bg-white'}`}
              >
                <input
                  type="radio"
                  name="gender"
                  value="Male"
                  className="sr-only"
                  onChange={handleChange}
                  required
                />
                <span className="font-medium">Male</span>
              </label>
              <label
                className={`flex-1 py-3 px-4 border rounded-xl cursor-pointer text-center transition-all ${formData.gender === 'Female' ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm' : 'border-gray-200 bg-white/50 text-gray-600 hover:bg-white'}`}
              >
                <input
                  type="radio"
                  name="gender"
                  value="Female"
                  className="sr-only"
                  onChange={handleChange}
                  required
                />
                <span className="font-medium">Female</span>
              </label>
            </div>
          </div>

          {/* Location Field */}
          <div>
            <label
              className="block text-sm font-semibold text-gray-700 mb-1 ml-1"
              htmlFor="location"
            >
              Your City
            </label>
            <div className="relative">
              <select
                id="location"
                name="location"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all appearance-none font-sans text-gray-800"
                value={formData.location}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Select your city...
                </option>
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full mt-4 py-3.5 px-4 rounded-xl text-white font-semibold text-lg transition-all shadow-lg flex justify-center items-center ${isSubmitting ? 'bg-rose-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 hover:shadow-xl hover:-translate-y-0.5'}`}
          >
            {isSubmitting ? (
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              'Find Matches'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
