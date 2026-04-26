/**
 * @file        SubhaLagna v3.3.5 — Frontend Astrology Constants
 * @description   Standardized lists for Rashi and Nakshatra selections.
 *                Includes Pada-to-Rashi mapping for auto-selection.
 * @author        SubhaLagna Team
 * @version      3.3.5
 */

export const RASHIS = [
  'Aries (Mesha)',
  'Taurus (Vrishabha)',
  'Gemini (Mithuna)',
  'Cancer (Karka)',
  'Leo (Simha)',
  'Virgo (Kanya)',
  'Libra (Tula)',
  'Scorpio (Vrishchika)',
  'Sagittarius (Dhanu)',
  'Capricorn (Makara)',
  'Aquarius (Kumbha)',
  'Pisces (Meena)',
];

export const NAKSHATRAS = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashira',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshtha',
  'Mula',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanistha',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati',
];

export const PADAS = [1, 2, 3, 4];

// Precise 108 Pada Mapping
export const PADA_RASHI_MAP = {
  Ashwini: { 1: 'Aries (Mesha)', 2: 'Aries (Mesha)', 3: 'Aries (Mesha)', 4: 'Aries (Mesha)' },
  Bharani: { 1: 'Aries (Mesha)', 2: 'Aries (Mesha)', 3: 'Aries (Mesha)', 4: 'Aries (Mesha)' },
  Krittika: {
    1: 'Aries (Mesha)',
    2: 'Taurus (Vrishabha)',
    3: 'Taurus (Vrishabha)',
    4: 'Taurus (Vrishabha)',
  },
  Rohini: {
    1: 'Taurus (Vrishabha)',
    2: 'Taurus (Vrishabha)',
    3: 'Taurus (Vrishabha)',
    4: 'Taurus (Vrishabha)',
  },
  Mrigashira: {
    1: 'Taurus (Vrishabha)',
    2: 'Taurus (Vrishabha)',
    3: 'Gemini (Mithuna)',
    4: 'Gemini (Mithuna)',
  },
  Ardra: {
    1: 'Gemini (Mithuna)',
    2: 'Gemini (Mithuna)',
    3: 'Gemini (Mithuna)',
    4: 'Gemini (Mithuna)',
  },
  Punarvasu: {
    1: 'Gemini (Mithuna)',
    2: 'Gemini (Mithuna)',
    3: 'Gemini (Mithuna)',
    4: 'Cancer (Karka)',
  },
  Pushya: { 1: 'Cancer (Karka)', 2: 'Cancer (Karka)', 3: 'Cancer (Karka)', 4: 'Cancer (Karka)' },
  Ashlesha: { 1: 'Cancer (Karka)', 2: 'Cancer (Karka)', 3: 'Cancer (Karka)', 4: 'Cancer (Karka)' },
  Magha: { 1: 'Leo (Simha)', 2: 'Leo (Simha)', 3: 'Leo (Simha)', 4: 'Leo (Simha)' },
  'Purva Phalguni': { 1: 'Leo (Simha)', 2: 'Leo (Simha)', 3: 'Leo (Simha)', 4: 'Leo (Simha)' },
  'Uttara Phalguni': {
    1: 'Leo (Simha)',
    2: 'Virgo (Kanya)',
    3: 'Virgo (Kanya)',
    4: 'Virgo (Kanya)',
  },
  Hasta: { 1: 'Virgo (Kanya)', 2: 'Virgo (Kanya)', 3: 'Virgo (Kanya)', 4: 'Virgo (Kanya)' },
  Chitra: { 1: 'Virgo (Kanya)', 2: 'Virgo (Kanya)', 3: 'Libra (Tula)', 4: 'Libra (Tula)' },
  Swati: { 1: 'Libra (Tula)', 2: 'Libra (Tula)', 3: 'Libra (Tula)', 4: 'Libra (Tula)' },
  Vishakha: { 1: 'Libra (Tula)', 2: 'Libra (Tula)', 3: 'Libra (Tula)', 4: 'Scorpio (Vrishchika)' },
  Anuradha: {
    1: 'Scorpio (Vrishchika)',
    2: 'Scorpio (Vrishchika)',
    3: 'Scorpio (Vrishchika)',
    4: 'Scorpio (Vrishchika)',
  },
  Jyeshtha: {
    1: 'Scorpio (Vrishchika)',
    2: 'Scorpio (Vrishchika)',
    3: 'Scorpio (Vrishchika)',
    4: 'Scorpio (Vrishchika)',
  },
  Mula: {
    1: 'Sagittarius (Dhanu)',
    2: 'Sagittarius (Dhanu)',
    3: 'Sagittarius (Dhanu)',
    4: 'Sagittarius (Dhanu)',
  },
  'Purva Ashadha': {
    1: 'Sagittarius (Dhanu)',
    2: 'Sagittarius (Dhanu)',
    3: 'Sagittarius (Dhanu)',
    4: 'Sagittarius (Dhanu)',
  },
  'Uttara Ashadha': {
    1: 'Sagittarius (Dhanu)',
    2: 'Capricorn (Makara)',
    3: 'Capricorn (Makara)',
    4: 'Capricorn (Makara)',
  },
  Shravana: {
    1: 'Capricorn (Makara)',
    2: 'Capricorn (Makara)',
    3: 'Capricorn (Makara)',
    4: 'Capricorn (Makara)',
  },
  Dhanistha: {
    1: 'Capricorn (Makara)',
    2: 'Capricorn (Makara)',
    3: 'Aquarius (Kumbha)',
    4: 'Aquarius (Kumbha)',
  },
  Shatabhisha: {
    1: 'Aquarius (Kumbha)',
    2: 'Aquarius (Kumbha)',
    3: 'Aquarius (Kumbha)',
    4: 'Aquarius (Kumbha)',
  },
  'Purva Bhadrapada': {
    1: 'Aquarius (Kumbha)',
    2: 'Aquarius (Kumbha)',
    3: 'Aquarius (Kumbha)',
    4: 'Pisces (Meena)',
  },
  'Uttara Bhadrapada': {
    1: 'Pisces (Meena)',
    2: 'Pisces (Meena)',
    3: 'Pisces (Meena)',
    4: 'Pisces (Meena)',
  },
  Revati: { 1: 'Pisces (Meena)', 2: 'Pisces (Meena)', 3: 'Pisces (Meena)', 4: 'Pisces (Meena)' },
};
