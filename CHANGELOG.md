# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-04-11

### Added
- **🔮 Guna Milan Engine**: Automated Ashta Koota (36-point) Vedic compatibility matching.
- **📍 Precise Pada Mapping**: Implemented the full 108-Pada-to-Rashi conversion for 100% astronomical accuracy.
- **⚖️ Dosha Cancellations**: Added logic for Nadi and Bhakoot dosha cancellations based on traditional planetary friendships and birth-star quarters.
- **✨ Auto-Select UI**: Profile creation and dashboard now auto-calculate and lock the Rashi based on Nakshatra and Pada selections.

### Improved
- **Profile Detail View**: Integrated a premium compatibility gauge with factor-by-factor score breakdowns.
- **Profile Cards**: Added high-visibility Guna Match badges to search results.

## [2.0.8] - 2026-04-11

### Added
- **🔒 Privacy Frost System**: Interest-aware photo protection that blurs user photos for privacy.
- **`PrivacyShield.jsx`**: A high-end glassmorphism overlay for protected photos and galleries.
- **Unified Privacy Logic**: Gallery photos now follow the same "interest-locked" logic as the main profile photo.
- **Intelligent Gating**: Photos automatically unlock as soon as a connection request is marked as 'Accepted'.

### Improved
- **Profile Detail Security**: Integrated photo protection into the detailed profile view.
- **Search Result Privacy**: Profile cards in search results now automatically respect user privacy settings.

## [2.0.7] - 2026-04-11

### Added
- **💖 Heart Burst Interaction**: Delightful feedback animation when sending interests (floating heart particles).
- **📊 Profile Strength Meter**: A gamified progress tracker in the Dashboard to encourage 100% profile completion.
- **🎴 Card Hover Parallax**: Enhanced `ProfileCard` with visual "pop-up" depth and a pulsing glow on compatibility scores.
- **Micro-Animations**: Added `heart-burst` and `glow-pulse` global CSS keyframes.

## [2.0.6] - 2026-04-11

### Added
- **Laptop Camera Capture**: Introduced "Direct Capture" feature for profile photos targeting desktop/laptop users.
- **CaptureModal Component**: A new, reusable glassmorphism component for webcam stream management and snapshots.
- **Auto-Sync**: Captured snapshots are automatically integrated into the v2.0.5 Media Optimizer pipeline for instant square-cropping and WebP conversion.

## [2.0.5] - 2026-04-11

### Added
- **Media Optimizer (Sharp)**: Integrated high-performance image processing pipeline.
- **Auto-Cropping**: Main profile photos are now automatically cropped to a perfect **800x800 square**.
- **WebP Transition**: All user-uploaded media is now automatically converted to `.webp` format for superior compression.
- **Size Optimization**: Multi-megabyte uploads are now compressed to <200KB without visible quality loss.

### Changed
- **Memory Storage**: Switched to `multer.memoryStorage` to enable pre-processing of image buffers.

## [2.0.4] - 2026-04-11

## [2.0.3] - 2026-04-11

## [2.0.2] - 2026-04-11

### Added
- **Project Standardization**: Synchronized `@version` headers across all code files (59+ files).
- **Standards Update**: Updated `AGENTS.md` to mandate version header maintenance.

### Changed
- **SMTP Refactor**: Improved email configuration to support robust SMTP settings (Gmail, Custom SMTP).
- **Env Consistency**: Standardized variable names in `.env.example` to match code.

## [2.0.1] - 2026-04-11

### Added
- **Contact Reveal Engine**: Implemented missing `unlockContact` functionality in backend.
- **Reveal UI**: Added "Reveal Contact Details" button to `ProfileDetail` component.
- **Quota Enforcement**: Gold tier users now have their 30-reveal limit enforced.
- **Changelog**: Initialized this file to track project evolution.

### Changed
- **README Enhancement**: Detailed business logic and smart matching algorithm breakdown.
- **Version Upgrade**: Project bumped to v2.0.1 across all components.

## [2.0.0] - 2026-04-11

### Added
- **Initial Release of v2.0.0**: High-fidelity matrimony platform.
- **Smart Matching**: Weighted compatibility scoring.
- **Premium Tiers**: Gold and Platinum subscription models with Razorpay.
- **Admin Dashboard**: Moderation, Revenue, and Coupon management.
