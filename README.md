# 💍 SubhaLagna Matrimony — v2.4.0

A high-fidelity, secure matrimony platform built on the **MERN Stack** (MongoDB, Express, React, Node.js). SubhaLagna v2.4.0 focuses on **Administrative Transparency**, Automated Communication, and structural UI stability.

---

## 🚀 Key Features

### 📊 Transaction Ledger (New in v2.4.0)
Administrators now have a dedicated financial oversight center:
- **Full Audit Trail**: Track every payment across Razorpay, Manual upgrades, and Bank transfers.
- **Detailed Reporting**: View transaction dates, amounts, user emails, and plan types in a single, unified ledger.
- **Revenue Analytics**: Real-time tracking of platform performance with daily and total revenue insights.

### ✉️ Automated Notifications (New in v2.4.0)
Enhanced user trust through immediate communication:
- **Payment Confirmation**: Users automatically receive a premium HTML email upon successful membership activation.
- **Membership Details**: Confirmation emails include the plan name, validity period, and expiry date.

### 💎 UI Stabilization (New in v2.4.0)
- **Zero-Dependency Icons**: Optimized rendering by switching to theme-consistent inline SVGs, eliminating "ReferenceErrors" and improving dashboard load reliability.

### ☁️ Cloud-Ready Storage (New in v2.2.0)
SubhaLagna is now optimized for cloud hosting:
- **Unified Abstraction**: Seamlessly switch between **Local Disk** and **AWS S3** via a single `.env` toggle.
- **Lazy Loading**: Zero overhead for cloud libraries when using local storage.
- **Auto-Cleanup**: The system automatically deletes old assets from storage when profile photos are updated, preventing storage bloat.

### 🔮 Vedic Guna Milan
SubhaLagna now implements a **professional-grade Ashta Koota compatibility engine**:
- **Precise 108 Pada Mapping**: Automatic Moon sign (Rashi) determination based on birth star quarter.
- **36-Point Scoring**: Factor-by-factor breakdown of Varna, Vashya, Tara, Yoni, Maitri, Gana, Bhakoot, and Nadi.
- **Dosha Cancellation**: Traditional logic for Nadi and Bhakoot cancellations based on planetary friendship and Pada differences.

### 🛡️ Privacy Engine & Data Gating
- **Privacy Frost**: Interest-aware photo protection. Photos and galleries are blurred with a frosted-glass effect and only unlock after an interest is **Accepted**.
- **Contact Redaction**: Server-side masking of Email/Phone for non-authorized viewers.
- **View Insights**: Premium users can track "Who Viewed My Profile" with a complete audit trail.

### 💰 Premium Monetization
- **Tiered Plans**: **Gold** vs. **Platinum** tiers with unique quotas.
- **Automated Billing**: Razorpay integration with secure HMAC signature verification.
- **Admin Overrides**: Manual subscription activation for offline or bank-transfer users.

### 🛠️ Admin & Moderation
- **Verification Engine**: Admin approval workflow for the "Verified" trust badge.
- **Segmented Management**: Tabs for User Moderation, Pending Payments, Coupons, Membership Plans, and the new **Transaction Ledger**.
- **Coupon Engine**: Manage dynamic discount codes (Fixed or Percentage).

### 💬 Engagement
- **Interest System**: Unified inbox for sending/receiving connection requests.
- **Real-time Chat**: Integrated messaging via Socket.io for connected matches.

---

## 🏗️ Technical Architecture

### **Backend (`/subhalagna-backend`)**
- **Runtime**: Node.js & Express.
- **Database**: MongoDB (Mongoose ODM).
- **Security**: JWT Authentication, HMAC signature verification for payments.
- **API Documentation**: RESTful endpoints with status-coded responses.

### **Frontend (`/subhalagna-frontend`)**
- **Library**: React 18+ with Vite as the build tool.
- **Styling**: Vanilla CSS with a focus on Glassmorphism and modern UI/UX.
- **State Management**: Context API for Global Auth and Subscription state.

---

## 📂 Folder Structure

### **Backend**
```text
subhalagna-backend/
├── config/             # DB connection and app configuration
├── controllers/        # Business logic for API endpoints
├── middleware/         # JWT Auth and Admin check logic
├── models/             # Mongoose schemas (User, Profile, Interest, etc.)
├── routes/             # API endpoint definitions
├── socket/             # Socket.io implementation for real-time features
├── uploads/            # Storage for profile images (ignored by git)
└── utils/              # Shared helper functions
```

### **Frontend**
```text
subhalagna-frontend/
├── public/             # Static assets (icons, manifest)
└── src/                # Source code
    ├── assets/         # Global styles and images
    ├── components/     # Core UI components (Login, Profile, Dashboards, etc.)
    ├── context/        # AuthContext and state providers
    ├── data/           # Static constants (Caste, Religion, State lists)
    ├── services/       # Axios API integration layer
    └── App.jsx         # Main routing and layout
```

---


## 🛠️ Installation & Setup

### 1. Prerequisites
- Node.js (v16+)
- MongoDB Atlas account
- Razorpay developer account

### 2. Backend Setup
```bash
cd subhalagna-backend
npm install
# Configure .env using .env.example
npm run dev
```

### 3. Frontend Setup
```bash
cd subhalagna-frontend
npm install
# Configure .env using .env.example
npm run dev
```

---

## 🔑 Environment Variables

| Variable | Description | Source |
| :--- | :--- | :--- |
| `MONGO_URI` | Database Connection String | MongoDB Atlas |
| `JWT_SECRET` | Token Encryption Key | System Generated |
| `RAZORPAY_KEY_ID` | Public Payment Key | Razorpay Dashboard |
| `RAZORPAY_KEY_SECRET` | Secret Payment Key | Razorpay Dashboard |
| `SMTP_HOST` | Email Server Host | e.g. smtp.gmail.com |
| `SMTP_USER` | Email Service Account | Login Email |
| `SMTP_PASS` | Email App Password | Security > App Passwords |
| `VITE_API_URL` | Frontend API endpoint | Backend Developer |

---

## 👔 Admin Quick Start
To grant Admin access to an account:
1. Register a normal user.
2. Go to your MongoDB database.
3. Change the `role` field from `"user"` to `"admin"`.
4. Log in again. The **Admin Dashboard** will appear in the top navigation.

---

## 📄 License
Custom Proprietary License — Developed by SubhaLagna Team.
