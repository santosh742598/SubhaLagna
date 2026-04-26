# 💍 SubhaLagna Matrimony — v3.1.7

[![Project Version](https://img.shields.io/badge/version-3.1.7-blue.svg)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Stack](https://img.shields.io/badge/stack-MERN-green.svg)](#technology-stack)

SubhaLagna is a high-fidelity, enterprise-grade matrimony platform designed for security, scalability, and cultural precision. Built on the modern **MERN stack**, v3.0.0 introduces a robust automated quality foundation, ensuring long-term maintainability and high-performance matching.

---

## 📽️ Platform Capabilities

### 🔮 Matchmaking Intelligence (Guna Milan)
SubhaLagna implements a **professional-grade Ashta Koota compatibility engine** for precise partner matching:
- **108 Pada Mapping**: Automated Moon sign (Rashi) determination based on birth star quarters.
- **36-Point Scoring**: Factor-by-factor breakdown of Varna, Vashya, Tara, Yoni, Maitri, Gana, Bhakoot, and Nadi.
- **Dosha Cancellation**: Traditional Vedic logic for Nadi and Bhakoot cancellations based on planetary friendship.

### 📊 Secure Financial Oversight
A dedicated transparency hub for platform administrators:
- **Unified Transaction Ledger**: Audit every payment across Razorpay, Bank transfers, and Coupons.
- **Revenue Analytics**: Real-time insights into daily peak performance and lifetime revenue.
- **Automated Invoicing**: Immediate premium HTML documentation sent to users upon payment.

### 🛡️ Privacy & Trust Infrastructure
Advanced gating mechanisms to protect user identity and data:
- **Privacy Frost**: Photos remain blurred with a frosted-glass effect until an interest is **Accepted**.
- **Contact Masking**: Multi-layer redaction of phone and email for unauthorized viewers.
- **Email Verification**: Identity verification via OTP (One-Time Password) before profile activation.

- **Structured Documentation**: Strict JSDoc enforcement for all critical controllers, models, and UI components.

---

## 📂 Project Architecture

SubhaLagna follows a **Modular Clean Architecture** to separate concerns and ensure scalability:

```text
📦 SubhaLagna-main
├── 📂 subhalagna-backend       # Node.js / Express Core
│   ├── 📂 config               # DB & App Configurations
│   ├── 📂 controllers          # Request Handlers (Business Logic)
│   ├── 📂 middleware           # Auth Gating & Security Layers
│   ├── 📂 models               # Mongoose Data Schemas
│   ├── 📂 routes               # API Endpoint Definitions
│   ├── 📂 scripts              # Database & Maintenance Scripts
│   ├── 📂 services             # External Integrations (Email/SMS)
│   ├── 📂 socket               # Real-Time Communications (Socket.io)
│   ├── 📂 uploads              # Local Multi-media Storage
│   ├── 📂 utils                # Helpers (Matching/Logic)
│   └── 📄 index.js             # Server Entry Point
├── 📂 subhalagna-frontend      # React / Vite Client
│   ├── 📂 src
│   │   ├── 📂 assets           # Global Media & Static Files
│   │   ├── 📂 components       # UI Components (Glassmorphism)
│   │   ├── 📂 context          # State Management (Auth/Chat)
│   │   ├── 📂 data             # Static Constants & Master Data
│   │   ├── 📂 services         # API Communication Layer
│   │   └── 📂 utils            # Frontend Helpers & Constants
│   └── 📄 vite.config.js       # Build Pipeline Config
└── 📄 AGENTS.md                # Project Coding Standards (Master Truth)
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS v4, Context API |
| **Backend** | Node.js, Express 5, Socket.io |
| **Database** | MongoDB (Mongoose ODM) |
| **Payments** | Razorpay Gateway (Signature Verification) |
| **Storage** | Hybrid (Local Disk / AWS S3 Abstraction) |
| **Quality** | ESLint (Flat Config), Prettier, JSDoc |

---

## 🚀 Installation & Deployment

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: v6.0+ (Local or Atlas)
- **Email**: SMTP access (for OTP and notifications)

### 2. Database Initialization
Before starting the backend, ensure your MongoDB instance is running:
- **Windows**: Run `net start MongoDB` in an Administrator terminal.
- **macOS**: Run `brew services start mongodb-community`.
- **Linux**: Run `sudo systemctl start mongod`.
- **Cloud**: Verify your [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster is active and your IP is whitelisted.

### 3. Environment Configuration
Create a `.env` file in the `subhalagna-backend/` directory based on the following template:

| Key | Description |
| :--- | :--- |
| `MONGO_URI` | Your MongoDB connection string |
| `JWT_SECRET` | Secret key for token generation |
| `RAZORPAY_KEY_ID` | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key |
| `SMTP_HOST` | Outgoing mail server (e.g., smtp.gmail.com) |
| `SMTP_USER` | Email account username |
| `SMTP_PASS` | Email app password |
| `STORAGE_TYPE` | `local` (disk) or `s3` (AWS Cloud) |
| `AWS_S3_BUCKET` | Your AWS S3 bucket name |
| `AWS_REGION` | AWS region (e.g., ap-south-1) |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |

### 3. Backend Setup
```bash
cd subhalagna-backend
npm install
npm run dev
```

### 4. Frontend Setup
```bash
cd subhalagna-frontend
npm install
npm run dev
```

---

## 👔 Development Workflow

Maintain the platform's v3.0.0 standards using the following commands:

- **Linting**: `npm run lint` (Checks for documentation and security violations)
- **Formatting**: `npm run format` (Global code alignment via Prettier)
- **Dev Mode**: `npm run dev` (Hot-reloading development server)

---

## 🛡️ License
Proprietary Intellectual Property of the **SubhaLagna Team**. Unauthorized distribution or modification is strictly prohibited.
