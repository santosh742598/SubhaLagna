# 💍 SubhaLagna Matrimony — v3.3.7

[![Project Version](https://img.shields.io/badge/version-3.3.7-blue.svg)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Stack](https://img.shields.io/badge/stack-MERN-green.svg)](#technology-stack)
[![Status](https://img.shields.io/badge/status-Production--Ready-brightgreen.svg)](CHANGELOG.md)

SubhaLagna is an enterprise-grade, high-fidelity matrimony platform engineered for cultural precision, real-time engagement, and institutional security. Built on a modernized **MERN Stack**, v3.3.0 introduces advanced data analytics, gamified user onboarding, and a robust real-time notification infrastructure.

---

## Platform Capabilities

### 📊 Business Intelligence & Analytics

SubhaLagna v3.3.7 empowers administrators with a high-fidelity **Analytics Dashboard**:

- **Real-time Growth Tracking**: Interactive time-series charts for User Acquisition and Financial Performance.
- **Financial Oversight**: Unified ledger for Razorpay transactions, bank transfers, and manual upgrades.
- **Conversion Insights**: Granular data on membership distribution and revenue trends.

### 🔮 Matchmaking Intelligence (Guna Milan)

A professional-grade **Ashta Koota compatibility engine** designed for astronomical accuracy:

- **108 Pada Mapping**: Automated Moon sign (Rashi) determination based on birth star quarters.
- **36-Point Scoring**: Factor-by-factor breakdown (Varna, Vashya, Tara, Yoni, Maitri, Gana, Bhakoot, and Nadi).
- **Dosha Cancellation**: Traditional Vedic logic for Nadi and Bhakoot cancellations based on planetary friendships.

### 🕹️ Gamified Engagement & UX

Designed to maximize user retention and profile quality:

- **Profile Strength Meter**: A dynamic, gamified progress engine that incentivizes 100% data completion.
- **Real-time Notifications**: Instant Socket.io alerts for profile views and connection interests.
- **Intelligent Cooldowns**: 24-hour notification logic to maintain a premium, spam-free user experience.

### 🛡️ Privacy & Trust Infrastructure

Advanced gating mechanisms to protect user identity and data:

- **Privacy Frost**: Photos remain blurred with a frosted-glass effect until an interest is **Accepted**.
- **Contact Masking**: Multi-layer redaction of phone and WhatsApp data for unauthorized viewers.
- **Secure Gating**: Identity verification via OTP (One-Time Password) before profile activation.

---

## Project Architecture

SubhaLagna follows a **Modular Clean Architecture** to ensure industrial scalability:

```text
📦 SubhaLagna-main
├── 📂 subhalagna-backend       # Node.js / Express Core
│   ├── 📂 config               # DB & App Configurations
│   ├── 📂 controllers          # Request Handlers (Business Logic)
│   ├── 📂 middleware           # Auth Gating & Security Layers
│   ├── 📂 models               # Mongoose Data Schemas
│   ├── 📂 routes               # API Endpoint Definitions
│   ├── 📂 scripts              # Database & Maintenance Scripts
│   ├── 📂 services             # External Integrations (Email/S3)
│   ├── 📂 socket               # Real-Time Communications (Socket.io)
│   ├── 📂 utils                # Helpers (Matching/Logic)
│   └── 📄 index.js             # Server Entry Point
├── 📂 subhalagna-frontend      # React / Vite Client
│   ├── 📂 src
│   │   ├── 📂 assets           # Global Media & Static Files
│   │   ├── 📂 components       # UI Components (Glassmorphism)
│   │   ├── 📂 context          # State Management (Auth/Analytics)
│   │   ├── 📂 data             # Static Constants & Master Data
│   │   ├── 📂 services         # API Communication Layer
│   │   └── 📂 utils            # Frontend Helpers & Constants
│   └── 📄 vite.config.js       # Build Pipeline Config
└── 📄 AGENTS.md                # Project Coding Standards (Master Truth)
```

---

## Technology Stack

| Layer        | Technologies                                             |
| :----------- | :------------------------------------------------------- |
| **Frontend** | React 18, Vite, Tailwind CSS v4, Recharts, Framer Motion |
| **Backend**  | Node.js, Express 5, Socket.io, Razorpay Node SDK         |
| **Database** | MongoDB (Mongoose ODM), Redis (Optional Caching)         |
| **Storage**  | Hybrid (Local Disk / AWS S3 Abstraction)                 |
| **Security** | JWT (Access/Refresh), Helmet, Rate Limiting, OTP         |
| **Quality**  | ESLint (Flat Config), Prettier, JSDoc Standardization    |

---

## Installation & Deployment

### 1. Prerequisites

- **Node.js**: v18.0.0 or higher
- **MongoDB**: v6.0+ (Local or Atlas)
- **Email**: SMTP access for OTP and system notifications

### 2. Database Initialization

Ensure your MongoDB instance is active before service startup:

- **Windows**: `net start MongoDB` (Admin Terminal)
- **macOS/Linux**: `sudo systemctl start mongod`
- **Cloud**: Verify [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster whitelist status.

### 3. Environment Configuration

Populate `.env` files in both `subhalagna-backend/` and `subhalagna-frontend/` based on provided `.env.example` templates.

### 4. Service Startup

```bash
# Backend
cd subhalagna-backend && npm install && npm run dev

# Frontend
cd subhalagna-frontend && npm install && npm run dev
```

---

## Development Workflow

Maintain the platform's **v3.3.0** quality standards using our automated toolchain:

- **Quality Audit**: `npm run lint` (Comprehensive JSDoc and Security scan)
- **Code Alignment**: `npm run format` (Global project-wide Prettier sync)
- **Release Protocol**: Refer to `AGENTS.md` for AI-driven versioning mandates.

---

## License

Proprietary Intellectual Property of the **SubhaLagna Team**. Unauthorized distribution, modification, or commercial exploitation is strictly prohibited.
