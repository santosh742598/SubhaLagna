# 💍 SubhaLagna Matrimony — v2.0.0

A high-fidelity, secure matrimony platform built on the **MERN Stack** (MongoDB, Express, React, Node.js). SubhaLagna v2.0.0 focuses on premium user experiences, secure contact management, and robust administrative tools.

---

## 🚀 Key Features

### 🌟 Premium Monetization & Gating
- **Tiered Access**: Support for **Gold** and **Platinum** subscription plans.
- **Secure Reveal**: Contact information (Email/Phone) is server-side redacted for free users and revealed only for authorized premium users.
- **View Quotas**: Gold plans come with a 30-contact reveal limit, while Platinum offers unlimited access.
- **Razorpay Integration**: Fully automated checkout flow with signature verification and secure activation.

### 🛡️ Smart Moderation & Admin Pro
- **Verification Engine**: Admins can approve profiles to display a "Verified" trust badge.
- **Manual Upgrades**: Admin dashboard allows manual granting of premium status for offline payments with custom day-based durations.
- **Revenue Dashboard**: Real-time tracking of Total and Daily revenue stats.
- **Coupon Engine**: Create/Manage percentage or fixed-amount discount codes.

### 💬 Engagement & Matching
- **Interest System**: Send and moderating connection interests with a high-fidelity inbox.
- **Real-time Messaging**: Built-in chat for connected matches.
- **Profile Search**: Advanced filtering by age, caste, education, and location.

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
