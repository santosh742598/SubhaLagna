# 🤖 AGENTS.md — SubhaLagna v3.1.7 Best Practices & Coding Standards

This document serves as the **Source of Truth** for any developer or AI Agent working on the SubhaLagna Matrimony project. Adherence to these standards is mandatory to maintain the project's premium quality, security, and architectural integrity.

---

## 💎 Project Ethos

- **Premium UX**: Every component must feel high-end (Glassmorphism, smooth animations).
- **Security-First**: Never trust the client. Perform all critical validations on the backend.
- **Clean Architecture**: Keep logic separated (Models → Controllers → Routes).
- **Self-Documenting**: Use descriptive naming and standardized file headers.

---

## 🛠️ Tech Stack Specifics

- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.io, Razorpay.
- **Frontend**: React 18 (Vite), Tailwind CSS (Theming), Vanilla CSS (Custom tokens).
- **Security**: JWT (Access/Refresh), Helmet, Rate Limiting, Owner Validation.
- **Automation**: ESLint (Flat Config), Prettier (Global formatting).

---

## 🏗️ Backend Coding Standards

### 1. Controller Pattern

All controller functions must follow this pattern:

- **Strict Mode**: Every file MUST start with `"use strict";` at the very top.
- Wrapped in `try-catch` with `next(err)` for centralized error handling.
- Use `apiResponse.js` utilities: `sendSuccess`, `sendError`, `sendPaginated`.
- Use `.lean()` for read-only queries.

### 2. Security Protocols

- **Ownership Checks**: Always verify that `req.user._id` matches the document owner before `Update` or `Delete`.
- **Gating Logic**: Use `isPremiumActive()` or `premiumPlan` checks for contact reveals and blurred content.
- **Input Sanitization**: Use `express.json({ limit: '10kb' })` and explicit field extraction from `req.body`.

### 3. API Response Consistency

```javascript
// Success
return sendSuccess(res, data, 'Message', 200);

// Error
return sendError(res, 'Specific error message', 400);

// Paginated
return sendPaginated(res, results, total, page, limit, 'Results retrieved');
```

---

## 🛠️ Development Workflow (v3.1.7)

### 1. Unified Formatting

All code is managed by **Prettier**. The configuration is located in the root `.prettierrc`.

- **Constraint**: Do not use custom formatting; use `npm run format`.

### 2. Automated Linting

Every file is validated against strict ESLint rules (Security, JSDoc, React).

- **Verification**: Run `npm run lint` before committing.

### 3. IDE Integration

Use the **ESLint** and **Prettier** extensions in VS Code. Settings are pre-configured in `.vscode/settings.json` for auto-fix on save.

---

## 💅 Frontend & UI/UX Standards

### 1. Design System (Glassmorphism)

Use the predefined tokens in `index.css`:

- `.glass-panel`: For semi-transparent backgrounds with high blur.
- `.glass-card`: For interactive containers with hover translations.
- **Typography**:
  - Headers: `font-serif` (Playfair Display).
  - Body: `font-sans` (Outfit).

### 2. State Management

- **AuthContext**: For user identity, tokens, and premium status.
- **NotificationContext**: For real-time updates.
- **ChatContext**: For handling active conversations.

### 3. Route Guarding

Respect the guard hierarchy in `App.jsx`:

- `GuestRoute`: Only for Login/Signup.
- `OnboardRoute`: Only for profile creation.
- `ProtectedRoute`: Requires full Auth + Profile.
- `AdminRoute`: Restricted to `role === 'admin'`.

---

## 💾 Database Protocols

### 1. Model Definition

- Use strict typing and `enums`.
- Define **Indexes** for any field used in filters (e.g., `gender`, `age`, `location`).
- Use `pre-save` hooks for computed fields like `completenessScore`.

### 2. Querying

- Avoid full table scans; always use pagination for lists.
- Use `.populate()` selectively to avoid deep object trees.

---

---

## 🚀 Working Guidelines

- **No Scrollbars**: Respect the global `::-webkit-scrollbar { display: none; }` setting.
- **Animation First**: Use `animate-fade-in` or `animate-slide-up` for entry transitions.
- **Responsive**: All layouts must be mobile-first using Tailwind's responsive prefixes.
- **Automated Versioning**:
  - **Source of Truth**: The Backend `package.json` (`subhalagna-backend/package.json`) is the project's Master Version.
  - **Header Protocol**: Never edit version numbers in file headers manually.
  - **Sync Command**: After updating the master version, run `npm run version:sync` (or `node scripts/sync-version.mjs`) from the backend to propagate the change project-wide.
- **Versioned Headers (Agent Mandate)**: Every file MUST maintain a standardized JSDoc header.
  - **Agent Responsibility**: AI Agents are REQUIRED to update the `@description` block with a bulleted "vX.X.X changes" list whenever a file is modified.
  - **Release Protocol**: Every version bump MUST be accompanied by a formal entry in `CHANGELOG.md` documenting added, changed, and fixed items.
  - **Tag Sync**: The `@version` tag and the `@file       ` version number are managed by the automation script; Agents should focus on describing the _logic_ changes.
  - **Header Template**:

```javascript
/**
 * @file        SubhaLagna v3.1.7 — Dynamic Branding & WhatsApp
 * @description  Premium Matrimony Platform with real-time features.
 *               - v3.1.4 changes:
 *                 - Implemented Dynamic Branding (APP_NAME) across UI, Emails, and WhatsApp.
 *                 - Centralized branding configuration in backend .env and frontend config.js.
 *               - v3.1.3 changes:
 *                 - Added Premium WhatsApp Connect feature with personalized messaging.
 * @author       SubhaLagna Team
 * @version      3.1.7
 * @example
 * [Usage example here]
 */
```

    - Consistency across all files is mandated by the ESLint `jsdoc` plugin.

---

> [!IMPORTANT]
> When adding new features, always check if they belong behind a **Premium Gate**. Consult `Profile.js` privacySettings for data visibility rules.
