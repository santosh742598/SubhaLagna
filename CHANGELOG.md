# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
 
## [3.2.8] - 2026-04-26
### Fixed
- Resolved ESM/CommonJS parsing errors in `index.js` by reverting to standard CommonJS syntax to match project `"type": "commonjs"`.
- Eliminated "Object Injection" security vulnerabilities in `index.js` via explicit property lookups.
- Standardized `dotenv` initialization for improved IDE and linter compatibility.

### Improved
- Achieved **100% Lint Clean** status for `index.js` by resolving all `no-console` and `security` warnings.
- Added comprehensive JSDoc documentation for rate limit optimizations and security hardening.

## [3.2.7] - 2026-04-26
### Changed
- Optimized rate limits to accommodate production traffic and polling:
    - Increased `globalLimiter` from 100 to **500** requests per 15 min.
    - Increased `healthLimiter` from 300 to **1000** requests per 15 min.
    - Increased `authLimiter` from 10 to **20** requests per 15 min.

## [3.2.6] - 2026-04-26
### Security
- Hardened `/api/health` endpoint to prevent information disclosure (removed `version` and `environment` from public response).
- Implemented `healthLimiter` in `rateLimitMiddleware.js` to protect health check endpoint from abuse while allowing monitoring tools.

## [3.2.5] - 2026-04-26
### Changed
- Migrated all legacy Tailwind CSS gradient classes to modern v4 syntax (`bg-linear-to-*`).
- Updated `flex-shrink` utilities to concise `shrink-*` shorthand.
- Simplified arbitrary duration classes (e.g., `duration-[2000ms]` to `duration-2000`).

### Fixed
- Resolved `ReferenceError: settings is not defined` in `Home.jsx` > `SuccessStories`.
- Removed unused `settings` context extraction from `MarriageExperience` component.

## [3.2.4] - 2026-04-26
### Fixed
- Fixed missing JSDoc `@returns` and `@param` issues in `App.jsx`.
- Cleaned up auto-generated JSDoc in route guards.

## [3.2.3] - 2026-04-26
### Fixed
- Fixed missing JSDoc `@returns` and `@param` in `AuthProvider.jsx`.
- Finalized Context/Provider split for Fast Refresh stability.

## [3.2.2] - 2026-04-26
### Fixed
- Resolved Vite Fast Refresh warning by splitting `AuthContext` (logic) and `AuthProvider` (component) into separate files.
- Improved development experience with better HMR support.

## [3.2.1] - 2026-04-26
### Fixed
- Resolved `ReferenceError: settings is not defined` in `Home.jsx` sub-components (`HowItWorks`, `MarriageExperience`, `Footer`).
- Fixed missing `api` import in `AuthContext.jsx`.
- Implemented dynamic branding in `Home.jsx` Footer.

## [3.2.0] - 2026-04-26
 
### Fixed
- **🖼️ Photo Restoration**: Reverted default avatar extensions from `.jpg` back to `.png` after verifying server file availability.
- **🚀 Production Pathing (Stable)**: Maintained the critical fix for automatic backend URL prepending for uploaded profile photos, ensuring high-fidelity image loading across distributed hosting environments.
 
### Changed
- **🚀 Version Bump**: Universal synchronization of the project to `v3.2.0`, marking a new stable milestone for production deployment.
 
## [3.1.9] - 2026-04-26
 
### Fixed
- **🖼️ Photo Fallback Fix**: Updated `avatarHelper.js` to support `.jpg` extensions for default placeholders as per production server configuration.
- **🚀 Production Pathing**: Implemented automatic backend URL prepending for uploaded profile photos to ensure images load correctly when frontend and backend are hosted on different paths or domains.
- **🎨 UI Consistency**: Synchronized all mock data and fallback error handlers to use the new `.jpg` default avatars.
 
### Changed
- **🚀 Version Bump**: Universal synchronization of the project to `v3.1.9`.
 
## [3.1.8] - 2026-04-26
 
### Fixed
- **🚀 Health Check Stability**: Resolved a critical `ReferenceError: mongoose is not defined` in `index.js` that caused the `/api/health` endpoint to crash the server.
- **📧 Email Service Fix**: Re-applied the syntax fix for `emailService.js` to ensure the project remains stable across all environments.
 
### Changed
- **🚀 Version Bump**: Universal synchronization of the project to `v3.1.8`.
 
## [3.1.7] - 2026-04-26
 
### Added
- **📝 JSDoc Excellence**: Performed a comprehensive sweep of the backend `emailService.js` to resolve all project-wide JSDoc documentation warnings by adding proper `@returns` descriptions.
 
### Changed
- **🚀 Version Bump**: Universal synchronization of the project to `v3.1.7`.
 
## [3.1.6] - 2026-04-26
 
### Fixed
- **📧 Email Service Stability**: Resolved a critical syntax error in `emailService.js` that caused backend crashes during startup.
- **🛠️ Linting Compliance**: Added ESLint overrides for intentional console logging in the email service fallback, ensuring a clean build.
 
### Changed
- **🚀 Version Bump**: Universal synchronization of the project to `v3.1.6`.
 
## [3.1.5] - 2026-04-26
 
### Added
- **⚙️ Admin-Managed Configuration**: Transitioned core platform settings (App Name, Branding, WhatsApp, Domain) from static files to a database-driven system managed via the Admin Dashboard.
- **🌍 Global Context Integration**: Unified `settings` and `plans` into a centralized global context (`AuthContext`), ensuring high performance and real-time UI updates across all components.
- **💅 Premium Settings UI**: Added a dedicated "System Settings" tab to the Admin Dashboard with a modern glassmorphism design for managing branding and support contacts.
 
### Changed
- **🚀 Version Bump**: Universal synchronization of the project to `v3.1.5`.
- **🛠️ Config Refactor**: Simplified `src/config.js` to prioritize critical environment variables at the top of the file for easier management.
- **📁 Environment Templates**: Updated `.env.example` in both backend and frontend with new configuration keys (`PRODUCTION_DOMAIN`, `WHATSAPP_COUNTRY_CODE`).
 
### Fixed
- **🔄 Sync Logic**: Standardized membership plan fetching across the platform, eliminating redundant API endpoints and ensuring consistent data.

## [3.1.0] - 2026-04-26

### Added
- **🏆 Zero-Error Milestone**: Successfully cleared all project-wide ESLint errors and warnings, achieving a perfectly stable and clean codebase.
- **💅 Tailwind v4 Modernization**: Performed a project-wide sweep to update styling to Tailwind v4 standards, including shorthand properties (`aspect-4/5`, `rounded-4xl`, `shrink-0`) and the new `bg-linear-to-*` gradient syntax.
- **📝 JSDoc Standardization**: Resolved over 60 documentation warnings by providing proper `@param` descriptions, `@returns` tags, and ensuring perfect block alignment across all core components.

### Fixed
- **🚀 AdminDashboard Stability**: Resolved critical infinite re-render loops in the Admin Dashboard by wrapping core fetchers (`fetchData`, `fetchPlans`, etc.) in `useCallback` and optimizing dependency arrays.
- **💬 Chat UI Polish**: Fixed a copy-paste typo in the chat error messages and stabilized the `openConversation` logic with proper reference tracking.
- **🛠️ Service Refactoring**: Refactored `lookupService.js` and `shortlistService.js` to use the standardized Axios `api` instance, ensuring consistent token handling and error reporting.

### Changed
- **🚀 Version Bump**: Universal synchronization of the project to `v3.1.0`.

## [3.0.7] - 2026-04-25

### Added
- **📞 Contact Recovery**: Implemented a `phone` field in the `User` model to allow persistent storage of mobile numbers.
- **📱 Onboarding Update**: Added a mandatory "Mobile Number" input field to Step 1 of the profile creation process.
- **🔄 Account Sync**: Automated synchronization of name and phone data from the profile setup directly into the core user account.

### Fixed
- **🖼️ Avatar Restoration**: Reverted the initials-based fallback logic in the Header and restored the original gender-specific "sweet photo" (default avatar) images.
- **🛡️ Registration Flow**: Fixed a response unwrapping bug in the Quick Registration form to ensure profile objects are correctly structured, preventing "undefined" profile links.
- **🔍 Profile Detail Population**: Updated the backend profile retrieval logic to correctly populate the user's phone number for premium/unlocked views.

### Changed
- **🚀 Version Bump**: Universal synchronization of the project to `v3.0.7`.


## [3.0.6] - 2026-04-25

### Added
- **🛠️ Documentation Versioning**: Enhanced the global synchronization script to automatically update version strings in `README.md` and `AGENTS.md`.
- **📁 Markdown Support**: Expanded version sync regex patterns to capture markdown headers, shield badges, and parenthetical version references.

### Fixed
- **🛡️ Critical Profile State**: Resolved a major bug in `CreateProfile.jsx` where the API response was not properly unwrapped, causing profile data to appear missing and generating "undefined" public profile links.
- **💅 Tailwind v4 Polish**: Updated `Header.jsx` to use modern `bg-linear-to-*` syntax as per Tailwind v4 standards.
- **👤 Avatar Fallback**: Implemented Initial-based fallback avatars for users without profile photos in the navigation header.

### Changed
- **🚀 Version Bump**: Universal synchronization of the project to `v3.0.6`.


## [3.0.5] - 2026-04-22

### Added
- **🎉 Enhanced Signup UX**: Implemented celebratory success banners on the verification page for newly registered users.
- **📧 OTP Feedback**: Added visual confirmation of OTP delivery during the signup process to improve clarity.

### Fixed
- **🛡️ Production Connectivity**: Resolved critical HTTPS/Mixed-content issues for the `bahaghara.in` domain using a domain-aware "Smart Config."
- **💻 Localhost Stability**: Implemented automatic environment detection to seamlessly switch between local and production backend URLs.
- **🔐 Login Visibility**: Fixed a major bug where 401 Unauthorized errors triggered accidental page refreshes, clearing error messages before the user could read them.
- **💅 UI Polish**: Removed redundant Header components and improved error message visibility with layout stabilization.

### Changed
- **🚀 Version Bump**: Universal synchronization of the project to `v3.0.5` including updated JSDoc headers with bulleted change documentation.

## [3.0.4] - 2026-04-22

### Added
- **🛡️ Admin Role Management**: Implemented an explicit promotion/demotion system in the Admin Dashboard with self-protection logic to prevent lockout.
- **🔐 Forgot Password Flow**: Added a complete secure password recovery system including premium "Forgot" and "Reset" UI components.
- **🚦 System Health Monitoring**: Integrated a real-time infrastructure monitor in the global header that tracks both API and Database availability.

### Changed
- **🚀 Version Bump**: Universal synchronization of the project to `v3.0.4` using the master versioning protocol.
- **🛡️ Backend Health Check**: Enhanced the `/api/health` endpoint to report granular MongoDB connection states.

## [3.0.3] - 2026-04-13

### Added
- **🛡️ Quality Guardrails**: achieved a clean **Exit Code: 0** across the entire backend after resolving 175+ ESLint errors and warnings.
- **🛡️ Performance Verification**: verified success of the centralized version synchronization and master data seeding scripts.

### Changed
- **🚀 Version Bump**: Universal automated synchronization to `v3.0.3` across the entire project codebase and metadata.
- **🛡️ Backend Standardization**: Resolved all critical JSDoc warnings, unused variables, and empty catch blocks in core controllers and services.
- **🛡️ Security Hardening**: Refactored dynamic object access in `matchingAlgorithm.js` and `gunaMilanService.js` to eliminate object injection vulnerabilities.

## [3.0.2] - 2026-04-13

### Added
- **🛡️ Enterprise License**: Expanded the Proprietary License to a multi-section EULA covering intellectual property, liability, and governing law.

### Changed
- **🚀 Version Bump**: Universal synchronization to `v3.0.2` across 85+ source files and project metadata.
- **🛡️ License Standardization**: Formally established the project as Proprietary, updated backend `package.json` to `UNLICENSED`, and added a root `LICENSE` document.

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

### Changed
- **🔧 Internal Maintenance**: Standardized versioning across platform modules.

## [2.0.3] - 2026-04-11

### Changed
- **🔧 Internal Maintenance**: Metadata synchronization.

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
