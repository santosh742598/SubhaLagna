"use strict";

/**
 * @file SubhaLagna v3.0.2 — Guna Milan Service
 * @description   Core matchmaking engine implementing the Ashta Koota (36-point) match.
 *                v2.1.0 changes:
 *                  - Implemented 108-Pada precise Rashi resolution
 *                  - Added Nadi Dosha cancellation rules (Pada/Rashi)
 *                  - Added Bhakoot Dosha cancellation rules (Maitri/Friendship)
 *                  - Dynamic results with factor breakdown and labels
 * @author        SubhaLagna Team
 * @version      3.0.2
 */

const { NAKSHATRAS, RASHIS, YONI_COMPATIBILITY, LORD_FRIENDSHIP } = require('./gunaMilanData');

/**
 * @param nakshatra
 * @param pada
 * @param providedRashi
 * @description Resolves Rashi if it might be ambiguous due to Pada
 */

const resolveRashi = (nakshatra, pada, providedRashi) => {
  const nakEntry = NAKSHATRAS.find((n) => n.name === nakshatra);
  if (nakEntry && nakEntry.rashiMapping && pada) {
    return nakEntry.rashiMapping[pada] || providedRashi;
  }
  return providedRashi;
};

/**
 *
 * @param p1
 * @param p2
 */
const calculateGunaMilan = (p1, p2) => {
  // Support both nested horoscope structure (v2.0+) and top-level fields (legacy/internal)
  const par1 = {
    nakshatra: p1.horoscope?.nakshatra || p1.nakshatra,
    rashi: p1.horoscope?.rashi || p1.rashi,
    pada: p1.horoscope?.pada || p1.pada,
  };
  const par2 = {
    nakshatra: p2.horoscope?.nakshatra || p2.nakshatra,
    rashi: p2.horoscope?.rashi || p2.rashi,
    pada: p2.horoscope?.pada || p2.pada,
  };

  // Resolve accurate Rashis based on Padas
  const r1 = resolveRashi(par1.nakshatra, par1.pada, par1.rashi);
  const r2 = resolveRashi(par2.nakshatra, par2.pada, par2.rashi);

  if (!r1 || !par1.nakshatra || !r2 || !par2.nakshatra) {
    return null;
  }

  const p1Rashi = RASHIS.find((r) => r.name === r1);
  const p2Rashi = RASHIS.find((r) => r.name === r2);
  const p1Nak = NAKSHATRAS.find((n) => n.name === par1.nakshatra);
  const p2Nak = NAKSHATRAS.find((n) => n.name === par2.nakshatra);

  if (!p1Rashi || !p2Rashi || !p1Nak || !p2Nak) return null;

  let totalScore = 0;
  const breakdown = {};
  const cancellations = [];

  // 1. VARNA (1 Point)
  const varnaOrder = { Brahmin: 4, Kshatriya: 3, Vaishya: 2, Shudra: 1 };
  const varnaScore = varnaOrder[p1Rashi.varna] >= varnaOrder[p2Rashi.varna] ? 1 : 0;
  totalScore += varnaScore;
  breakdown.varna = varnaScore;

  // 2. VASHYA (2 Points)
  const vashyaScore = p1Rashi.vashya === p2Rashi.vashya ? 2 : 0;
  totalScore += vashyaScore;
  breakdown.vashya = vashyaScore;

  // 3. TARA (3 Points)
  const getTaraScore = (n1Name, n2Name) => {
    const idx1 = NAKSHATRAS.findIndex((n) => n.name === n1Name) + 1;
    const idx2 = NAKSHATRAS.findIndex((n) => n.name === n2Name) + 1;
    const diff = ((idx2 - idx1 + 27) % 27) + 1;
    const mod = diff % 9;
    return mod === 3 || mod === 5 || mod === 7 ? 0 : 1;
  };
  const taraVal = getTaraScore(p1Nak.name, p2Nak.name) + getTaraScore(p2Nak.name, p1Nak.name);
  const taraScore = taraVal === 2 ? 3 : taraVal === 1 ? 1.5 : 0;
  totalScore += taraScore;
  breakdown.tara = taraScore;

  // 4. YONI (4 Points)
  const yoniScore = YONI_COMPATIBILITY[p1Nak.yoni][p2Nak.yoni] || 0;
  totalScore += yoniScore;
  breakdown.yoni = yoniScore;

  // 5. MAITRI (5 Points)
  const maitriScore = LORD_FRIENDSHIP[p1Rashi.lord][p2Rashi.lord] || 0;
  totalScore += maitriScore;
  breakdown.maitri = maitriScore;

  // 6. GANA (6 Points)
  let ganaScore = 0;
  if (p1Nak.gana === p2Nak.gana) ganaScore = 6;
  else if (
    (p1Nak.gana === 'Deva' && p2Nak.gana === 'Manushya') ||
    (p1Nak.gana === 'Manushya' && p2Nak.gana === 'Deva')
  )
    ganaScore = 5;
  else if (
    (p1Nak.gana === 'Deva' && p2Nak.gana === 'Rakshasa') ||
    (p1Nak.gana === 'Rakshasa' && p2Nak.gana === 'Deva')
  )
    ganaScore = 1;
  totalScore += ganaScore;
  breakdown.gana = ganaScore;

  // 7. BHAKOOT (7 Points)
  const rIdx1 = RASHIS.findIndex((r) => r.name === r1) + 1;
  const rIdx2 = RASHIS.findIndex((r) => r.name === r2) + 1;
  const rDiff = ((rIdx2 - rIdx1 + 12) % 12) + 1;
  const approvedDiffs = [1, 7, 3, 11, 4, 10];
  let bhakootScore = approvedDiffs.includes(rDiff) ? 7 : 0;

  // Bhakoot Cancellation: If Lords are Friends
  if (bhakootScore === 0 && maitriScore >= 4) {
    bhakootScore = 7;
    cancellations.push('Bhakoot Dosha Cancelled (Maitri)');
  }

  totalScore += bhakootScore;
  breakdown.bhakoot = bhakootScore;

  // 8. NADI (8 Points)
  let nadiScore = p1Nak.nadi !== p2Nak.nadi ? 8 : 0;

  // Nadi Cancellation
  if (nadiScore === 0) {
    // Rule: Same Nakshatra, different Pada
    if (p1Nak.name === p2Nak.name && par1.pada !== par2.pada) {
      nadiScore = 8;
      cancellations.push('Nadi Dosha Cancelled (Pada)');
    }
    // Rule: Different Nakshatra, same Rashi
    else if (p1Nak.name !== p2Nak.name && p1Rashi.name === p2Rashi.name) {
      nadiScore = 8;
      cancellations.push('Nadi Dosha Cancelled (Rashi)');
    }
  }

  totalScore += nadiScore;
  breakdown.nadi = nadiScore;

  return {
    total: totalScore,
    max: 36,
    breakdown,
    cancellations,
    label:
      totalScore >= 32
        ? 'Excellent'
        : totalScore >= 24
          ? 'Very Good'
          : totalScore >= 18
            ? 'Average'
            : 'Low',
  };
};

module.exports = { calculateGunaMilan };
