# 💍 SubhaLagna Matrimony — v2.2.0

A high-fidelity, secure matrimony platform built on the **MERN Stack** (MongoDB, Express, React, Node.js). SubhaLagna v2.2.0 focuses on **Cloud-Ready Scalability**, Vedic astrological matching, and premium user experiences.

---

## 🚀 Key Features

### ☁️ Cloud-Ready Storage (New in v2.2.0)
SubhaLagna is now optimized for cloud hosting:
- **Unified Abstraction**: Seamlessly switch between **Local Disk** and **AWS S3** via a single `.env` toggle.
- **Lazy Loading**: Zero overhead for cloud libraries when using local storage.
- **Auto-Cleanup**: The system automatically deletes old assets from storage when profile photos are updated, preventing storage bloat.

### 🔮 Vedic Guna Milan (New in v2.1.0)
SubhaLagna now implements a **professional-grade Ashta Koota compatibility engine**:
- **Precise 108 Pada Mapping**: Automatic Moon sign (Rashi) determination based on birth star quarter.
- **36-Point Scoring**: Factor-by-factor breakdown of Varna, Vashya, Tara, Yoni, Maitri, Gana, Bhakoot, and Nadi.
- **Dosha Cancellation**: Traditional logic for Nadi and Bhakoot cancellations based on planetary friendship and Pada differences.

### ⚖️ Smart Match Algorithm (Behavioral)
In addition to astrology, we use a **weighted behavioral scorecard**:
- **Interest Synergy (25pts)**: Uses Jaccard similarity to find common ground.
- **Personality Traits (15pts)**: Multi-dimensional overlap scoring.
- **Hard Filters (30pts)**: Automatic point allocation for Religion and Caste matches.
- **Demographic Proximity (30pts)**: Weighted scoring for Age, Location, and Education tiers.

### 🛡️ Privacy Engine & Data Gating
- **Privacy Frost (New in v2.0.8)**: Interest-aware photo protection. Photos and galleries are blurred with a frosted-glass effect and only unlock after an interest is **Accepted**.
- **Contact Redaction**: Server-side masking of Email/Phone for non-authorized viewers.
- **Photo Privacy Settings**: Integrated support for `privacySettings` including profile hiding and selective photo visibility.
- **View Insights**: Premium users can track "Who Viewed My Profile" with a complete audit trail.
- **Ownership Guard**: Strict middleware checks ensure users only modify their own data.

### 💰 Premium Monetization
- **Tiered Plans**: **Gold** (30 reveals) vs. **Platinum** (Unlimited access).
- **Automated Billing**: Razorpay integration with secure HMAC signature verification.
- **Admin Controls**: Manual subscription overrides and day-based duration management.

### 🛠️ Admin & Moderation
- **Verification Engine**: Admin approval workflow for the "Verified" trust badge.
- **Revenue Analytics**: Real-time dashboard for total/daily revenue tracking.
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
