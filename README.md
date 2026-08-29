<p align="center">
  <img src="client/public/assets/talentpulse_logo.png" alt="Rathinam TalentPulse.ai Logo" width="160" />
</p>

<h1 align="center">✨ TalentPulse.ai ✨</h1>

<p align="center">
  <b>Next-Generation AI Placement Management &amp; Talent Governance Platform</b><br />
  <i>Empowering Educational Institutions, Placement Officers, Recruiter Teams, and Students</i>
</p>

<p align="center">
  <a href="#-key-features"><img src="https://img.shields.io/badge/Features-Drive%20Lifecycle%20%7C%20ATS%20%7C%20AI-blue?style=for-the-badge&logo=rocket" alt="Features" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/Stack-React%20%7C%20Node%20%7C%20Prisma%20%7C%20PostgreSQL-green?style=for-the-badge&logo=react" alt="Tech Stack" /></a>
  <a href="#-getting-started"><img src="https://img.shields.io/badge/Setup-Docker%20%7C%20Local-orange?style=for-the-badge&logo=node.js" alt="Getting Started" /></a>
</p>

---

## 📌 Executive Summary

**TalentPulse.ai** is an enterprise-grade placement portal engineered for academic institutions (such as **Rathinam Educational Institutions**). It seamlessly unifies **student talent profiles**, **corporate partner pipelines**, **AI-driven ATS resume matching**, **placement drive candidate tracking (Registered $\rightarrow$ Attended $\rightarrow$ Shortlisted $\rightarrow$ Selected)**, and **real-time governance analytics** into a single, high-performance platform.

---

## 🚀 Key Features

### 🎓 1. Candidate Directory & Self Intro Video Links
* 📄 **Comprehensive Profiles**: SSLC (10th), HSC (12th), UG %, PG %, department, residency (Hostel/Day Scholar), and graduation date tracking.
* 🎥 **Student Self Intro Video Links**: Direct video URL integration (YouTube, Vimeo, Google Drive) with playable video previews in student profiles and directory cards.
* 📎 **Resume Document Vault**: Upload and preview PDF resumes with version history and direct download links.
* 📊 **Bulk Spreadsheet Import**: Import student records in bulk from `.xlsx` or `.csv` spreadsheets with instant row-by-row validation.

### 🏢 2. Corporate Partners & Company JD PDF Auto-Extraction
* 📂 **Company Directory**: Track cold, warm, hot, and drive-completed placement opportunity pipelines.
* 📄 **Company JD PDF Upload**: Upload company Job Description PDFs directly during company onboarding.
* 🤖 **Gemini AI Auto-Extraction**: Automatically parses job title, designation, package (CTC in LPA), location, skills, and responsibilities from uploaded JD PDFs.
* 📍 **Verified Google Places Resolution**: Real-time resolution of corporate addresses and Google Maps location links.

### 🎥 3. Placement Drive Lifecycle & Candidate Tracking
* 📋 **End-to-End Drive Pipeline**:
  $$\text{REGISTERED} \longrightarrow \text{ATTENDED} \longrightarrow \text{SHORTLISTED} \longrightarrow \text{SELECTED} \longrightarrow \text{REJECTED}$$
* 📊 **Drive Management Dashboard**: Real-time KPI counters for total registered candidates, attendance rate, shortlisted candidates, and final selections.
* ⚡ **Bulk Candidate Status Updates**: Single-click bulk status transitions (e.g. mark 30 students as Attended or Shortlisted at once).
* 🏆 **Automatic Placement Synchronization**: Marking a candidate as `SELECTED` in a drive automatically updates their global status to `PLACED` and records an official offer history record.

### 🎓 4. Candidate Profile Placement Drive History
* 📈 **Drive Analytics Card**: Instant summary of Registered Drives, Attended Drives, Shortlisted Count, and Placed Offer status.
* 📜 **Drive Outcome Timeline**: Detailed participation history table listing company names, job roles, package (CTC), registration date, attendance status, and round selection stage.

### 🤖 5. AI-Powered ATS Matcher & Resume Screening
* 🎯 **Deterministic Score Breakdown**: Evaluates technical skills, experience, education, projects, and keywords.
* 🔍 **Semantic Insights**: Highlights matched skills, missing skills, and detailed AI explanations for match ratings.
* ⚡ **Bulk Resume Screening**: Rank hundreds of student resumes against job descriptions in seconds.

### 🛡️ 6. Institutional Security & Governance
* 🔒 **Role-Based Access Control (RBAC)**: Fine-grained permissions across `ADMIN`, `MANAGER`, `LEAD`, and `RECRUITER` roles.
* 📜 **Audit Logs**: Transparent logging of logins, profile modifications, placement approvals, and status overrides.
* ⚠️ **Eligibility Termination & Revocation**: Formal administrative controls to suspend or reinstate student placement eligibility with documented reasoning.

---

## 💻 Tech Stack

### **Frontend**
* ⚡ **React 18** with **TypeScript** & **Vite**
* 🎨 **Vanilla Tailwind CSS** with custom dark/light theme tokens
* 🌌 **Three.js** & **@react-three/fiber** (3D WebGL particle constellation background on login)
* 🎨 **Lucide React** icons & **Recharts** analytics visualization

### **Backend**
* 🟢 **Node.js** & **Express** with **TypeScript**
* 🗄️ **Prisma ORM** with **PostgreSQL** database
* 🔐 **Argon2** password hashing & **JWT** authentication
* 🤖 **Google Gemini AI SDK** (`@google/generative-ai`) for PDF JD parsing

---

## ⚙️ Project Architecture

```
TalenPulse.ai/
├── client/                     # Frontend Vite + React application
│   ├── public/
│   │   └── assets/             # Rathinam logo and static media assets
│   ├── src/
│   │   ├── components/         # AppShell, DriveManagementModal, StatusBadge, etc.
│   │   ├── pages/              # Dashboard, Students, Companies, Jobs, Profile, etc.
│   │   ├── store/              # Zustand state management stores
│   │   └── utils/              # API fetch wrappers and helpers
├── server/                     # Backend Node.js + Express API server
│   ├── prisma/
│   │   └── schema.prisma       # Database schema definition
│   ├── src/
│   │   ├── modules/            # Students, Companies, Jobs, Drives, ATS, Audit, Auth
│   │   ├── middleware/         # Auth, permission, and error handling middleware
│   │   ├── services/           # Email and external service integrations
│   │   └── server.ts           # Express application entrypoint
└── README.md
```

---

## 🔑 Environment Variables Setup

Create a `.env` file in the `server` directory. **Do not commit actual production secrets to source control.**

```env
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/talentpulse_db?schema=public"

# Node Environment & Port
PORT=5000
NODE_ENV=development

# JWT Authentication Security
JWT_SECRET="your_secure_jwt_secret_key_here"

# Google Gemini AI Key for JD Extraction
GEMINI_API_KEY="your_google_gemini_api_key_here"

# Client CORS URL
CLIENT_URL="http://localhost:5173"
```

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/inba-web/TalentPulse.ai.git
cd TalentPulse.ai
```

### 2️⃣ Install Dependencies
```bash
# Install root dependencies
npm install

# Install server & client dependencies
npm --prefix server install
npm --prefix client install
```

### 3️⃣ Synchronize Database Schema
```bash
cd server
npx prisma db push
npx prisma generate
cd ..
```

### 4️⃣ Run Development Environment
```bash
# Start backend server (runs on http://localhost:5000)
npm --prefix server run dev

# In a separate terminal, start frontend client (runs on http://localhost:5173)
npm --prefix client run dev
```

---

## 🔒 Security Best Practices

* 🛡️ **Zero Secret Exposure**: All passwords, database URLs, and API tokens are managed via localized environment variables (`.env`).
* 🔑 **Argon2 Password Security**: Industry-standard cryptographic hashing for user authentication credentials.
* 🛑 **Permission Guards**: Server-side permission middleware enforces authorization rules on every API endpoint.

---

<p align="center">
  Designed &amp; Developed for <b>Rathinam Educational Institutions</b> by <b>Antigravity AI</b> 🚀
</p>
