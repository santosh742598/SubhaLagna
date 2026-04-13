# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.1] - 2026-04-13

### Added
- **📂 Project Architecture Map**: Integrated a high-fidelity visual directory guide in `README.md` for rapid navigation.
- **🤖 AI-Agent Mandate**: Established a formal protocol in `AGENTS.md` for AI-driven self-documentation and version header maintenance.
- **🛠️ Scaling Infrastructure**: Added comprehensive AWS S3 and Storage configuration guides for enterprise cloud readiness.
- **📖 Setup Ecosystem**: Comprehensive MongoDB initialization instructions for Windows, macOS, and Linux environments.

### Changed
- **🚀 Version Bump**: Universal automated synchronization to `v3.0.1` across 85+ platform source files.
- **🔗 GitHub Baseline**: Reset the remote repository history to the clean v3.0.1 modernization state.

## [3.0.0] - 2026-04-13

### Added
- **🛠️ Infrastructure Modernization**: Upgraded the entire project architecture to support automated quality guardrails.
- **🎛️ ESLint Flat Config**: Implemented modern ESLint configurations across Backend and Frontend for real-time error detection.
- **🛡️ Security Linting**: Integrated `eslint-plugin-security` (Backend) to pro-actively catch insecure coding patterns.
- **📖 JSDoc Enforcement**: Standardized code documentation with strict JSDoc header requirements for all core files.
- **💅 Global Prettier**: Established a unified root Prettier configuration to ensure perfect code formatting project-wide.
- **📦 Tailwind CSS v4 Stability**: Implemented specialized `.npmrc` configurations to resolve complex dependency conflicts during the v4 transition.

### Changed
- **🚀 Version Bump**: Universal upgrade to version `3.0.0` for all core modules and packages.
- **🛠️ Documentation**: Updated `AGENTS.md` and `README.md` to reflect the new automated standards as the project's Source of Truth.

## [2.4.0] - 2026-04-12

### Added
- **🛡️ Mandatory Email Verification**: Integrated a secure gating system that requires all new users to verify their email via OTP before profile creation.
- **🔄 Resend OTP Logic**: Implemented backend and frontend support for requesting new verification codes with persistent rate limiting (Max 3/hr).
- **✨ Premium Verification Center**: A new dedicated OTP entry UI with 6-block inputs, clipboard support, and a 60-second cooldown timer.
- **🛠️ 3-State Manglik System**: Standardized Manglik status across the platform into `Yes`, `No`, and `Unknown` for better data accuracy.

### Improved
- **📋 Admin User Management**: Synchronized "Add New User" and "Edit User" flows with the new Manglik and Rashi standardization rules.
- **📍 Rashi Logic**: Hardened the Selective-Lock logic to ensure Rashi is always astronomically correct based on Nakshatra/Pada.
- **💅 Security Headers**: Updated JWT session management with transparent background refresh for access tokens.

## [2.3.1] - 2026-04-12

### Fixed
- **🚨 Critical Payment Bug**: Resolved a `ReferenceError` in `paymentController.js` that caused checkout initialization to fail for paid plans.
- **💨 MongoDB Stability**: Provided guidance for fixing fatal system OOM (Out of Memory) crash by implementing a `cacheSizeGB` limit in `mongod.cfg`.

### Improved
- **📊 Database-Driven Quotas**: Migrated contact reveal limits from hardcoded logic to dynamic `MembershipPlan` schema fields (`contactsAllowed`).
- **🔧 Manual Upgrade UX**: Added automatic duration calculation to the Admin Manual Upgrade modal based on selected plan profiles.
- **✨ UI Clarity**: Removed lingering hardcoded duration strings on the Premium membership page.

## [2.3.0] - 2026-04-12

### Added
- **🎟️ Dynamic Membership Plans**: Migrated subscription tiers from static config files to a fully dynamic, database-driven MongoDB architecture (`MembershipPlan` model).
- **🔧 Admin Plan Management**: Introduced a "Membership Plans" tab in the Admin Dashboard for real-time control over display names, pricing, and durations.
- **✨ Session-Aware Home Page**: Implemented conditional rendering for the landing page hero and navigation, automatically toggling Login/Logout/Dashboard based on auth state.

### Improved
- **📋 Manual Upgrade Refactor**: Enhanced the administrative manual upgrade flow to dynamically fetch and populate available plans from the database.
- **🛡️ Checkout Logic**: Standardized frontend and backend membership logic to use `planId` identifiers, ensuring cross-module compatibility for dynamic plans.
- **💅 Admin Dashboard UI**: Added dedicated plan editing modals with glassmorphism aesthetics and consistent validation.

## [2.2.0] - 2026-04-11

### Added
- **☁️ Unified Storage Hub**: Abstracted file storage into a `StorageService` supporting both Local Filesystem and AWS S3 via `.env` toggle.
- **🔄 Upgrade Hierarchy**: Interactive "Upgrade to Platinum" triggers and active plan highlighting for Gold members.
- **📦 AWS S3 Logic**: Integrated the `@aws-sdk` with lazy-loading for future cloud migration support.

### Improved
- **🚨 Enhanced Payment Feedback**: Unpacked nested Razorpay error objects to provide precise feedback (e.g., "Authentication Failed") to the UI.
- **🧹 Storage Cleanup**: Automated physical file deletion when users update or remove profile photos locally or on S3.
- **💻 Dynamic Domain Logging**: Implemented server startup logging that automatically respects the production domain URL.
- **🛠️ Gateway Stability**: Repositioned Express middleware for better sanitization and error capture.

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
