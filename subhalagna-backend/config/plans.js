/**
 * @fileoverview SubhaLagna v2.3.0 — Subscription Plans Configuration
 * @description   Unified source of truth for all membership plans.
 *                Changes here reflect instantly across frontend and payment gateway.
 */

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    durationInMonths: 0, // Forever
    description: 'Basic access to explore matches.',
    features: [
      { text: 'Create Profile', included: true },
      { text: 'Browse Matches', included: true },
      { text: 'Send Interests', included: true },
      { text: 'View Contact Info', included: false },
      { text: 'Direct Messaging', included: false },
    ]
  },
  {
    id: 'gold',
    name: 'Gold',
    price: 999, // Inclusive of GST
    durationInMonths: 12, // 1 Year as requested
    description: 'Perfect for serious searchers. 1-year access.',
    popular: true,
    features: [
      { text: 'Create Profile', included: true },
      { text: 'Browse Matches', included: true },
      { text: 'Send Interests', included: true },
      { text: 'View 30 Contact Info', included: true },
      { text: 'Direct Messaging', included: true },
      { text: 'View Private Photos', included: true },
    ]
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: 1999, // Inclusive of GST
    durationInMonths: 12, // 1 Year as requested
    description: 'Our most comprehensive plan. 1-year access.',
    features: [
      { text: 'Create Profile', included: true },
      { text: 'Browse Matches', included: true },
      { text: 'Send Interests', included: true },
      { text: 'View UNLIMITED Contacts', included: true },
      { text: 'Direct Messaging', included: true },
      { text: 'Priority Placement', included: true },
      { text: 'View Private Photos', included: true },
    ]
  }
];

module.exports = plans;
