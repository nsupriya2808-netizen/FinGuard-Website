# FinGuard – Financial Transaction Analysis and Fraud Detection System

**Academic Domain:** Data Warehousing and Data Mining (College Capstone Project)  
**Target RDBMS:** MySQL 8.0  
**Stack:** React 19, TypeScript, Tailwind CSS, Express.js, Node.js, Recharts, Lucide React

---

## 🚀 Quick Start for Evaluation & Faculty Demonstration

FinGuard features an enterprise Role-Based Access Control (RBAC) portal distinguishing **System Administrators** from **Operational Analysts & Users**.

### Demonstration Credentials
- 👑 **Administrator Portal:**
  - **Email:** `admin@finguard.bank`
  - **Password:** `Admin@FinGuard2026`
  - **Privileges:** Full root access, User provisioning & role elevation, Immutable security audit trail, System demo re-seeder.
- 🛡️ **Analyst Portal:**
  - **Email:** `analyst@finguard.bank`
  - **Password:** `FinGuard@2026`
  - **Privileges:** Core AML modules, ETL file validation, Suspicious alerts triage, Audit notes logging.
- 👤 **Standard User / Auditor Portal:**
  - **Email:** `user@finguard.bank`
  - **Password:** `User@FinGuard2026`
  - **Privileges:** Read-only transaction ledger access, Star Schema inspection, Reports generation.

*(One-click **"Auto-Fill Admin"**, **"Auto-Fill Analyst"**, and **"Auto-Fill User"** buttons are available on the login terminal)*

---

## 📁 Project Structure

```
FinGuard/
├── backend/                  # Full Express REST API & Database engine
│   ├── auth.ts               # PBKDF2 password hashing & session management
│   ├── db.ts                 # Persistent database manager & Star Schema sync
│   ├── etlEngine.ts          # Module 1 ETL validation, cleaning & transformation
│   ├── fraudEngine.ts        # Module 2 Fraud & Anomaly risk scoring engine
│   ├── seed.ts               # 520+ realistic synthetic transactions generator
│   └── types.ts              # Data models & Star Schema type contracts
├── database/                 # MySQL 8.0 DDL & Setup
│   ├── finguard_schema.sql   # Operational OLTP database schema
│   ├── warehouse_star_schema.sql # Dimensional Star Schema (Fact + Dimensions)
│   └── setup_guide.md        # Step-by-step MySQL 8.0 & Python setup instructions
├── dataset/                  # Datasets
│   ├── sample_transactions.csv   # 520+ standard synthetic records
│   └── corrupt_sample_for_etl_test.csv # Specially crafted corrupt test file
├── documentation/            # Academic Capstone Documentation
│   ├── capstone_project_report.md
│   └── data_mining_and_dw_guide.md
├── src/                      # Frontend Application
│   ├── components/
│   │   ├── alerts/           # Suspicious alerts triage & audit notes
│   │   ├── auth/             # Login & Registration views
│   │   ├── dashboard/        # Executive overview & dynamic Recharts
│   │   ├── etl/              # Module 1 ETL Pipeline & Visual Graph
│   │   ├── fraud/            # Module 2 Fraud Engine & Calibration sliders
│   │   ├── layout/           # Dark navy sidebar & top navigation
│   │   ├── reports/          # 6 downloadable & printable reports
│   │   ├── settings/         # Profile, security & demo reset
│   │   ├── transactions/     # Paginated ledger & audit modal
│   │   └── warehouse/        # Star schema visualizer & OLAP engine
│   ├── App.tsx
│   └── main.tsx
├── server.ts                 # Server entry point (Express + Vite)
├── package.json
└── README.md
```

---

## 🌟 Key Functional Modules

### 1. Main Executive Dashboard
- **5 Summary Stat Cards:** Total Transactions, Normal Transactions, Suspicious Transactions, High-Risk Transactions, and Total Settled Volume.
- **Dynamic Charts:**
  - Area Chart: Daily Transaction Trends (Total vs. Flagged Suspicious).
  - Donut Chart: Risk Distribution across Low (0-30), Medium (31-60), and High (61-100) tiers.
  - Bar Chart: Settlement volume by channel type (POS, Online, ATM, Wire Transfer).
- **Recent Ledger Table & Active Suspicious Alerts Feed.**

### 2. Module 1: Transaction Data Management (ETL Pipeline)
- **Data Collection:** Drag-and-drop CSV uploader with preview and schema validation.
- **Data Cleaning:** Detects missing values, duplicate transaction IDs, negative/zero amounts, corrupt date strings, and missing account IDs.
- **Data Transformation:** Standardizes ISO dates (`YYYY-MM-DD`), normalizes locations to title case, and cleans numeric decimals.
- **Data Storage:** Commits validated records into the operational database and synchronizes the Star Schema.
- **Interactive Test Button:** Click **"Load Corrupt Test Sample (For Examiners)"** to watch the cleaning engine detect and report discrepancies live.

### 3. Module 2: Fraud Detection & Risk Analysis
- **Pattern & Anomaly Detection:**
  1. Amount Outliers (Statistical thresholds & $4\times$ account average).
  2. Nocturnal Window (01:00 AM – 05:00 AM).
  3. High-Risk International Hubs (Moscow, Lagos, Dubai, Zurich).
  4. Repeat Velocity Carding Bursts ($\ge 3$ transactions in $\le 5$ minutes).
  5. Irreversible Wire Transfer and elevated ATM limits.
- **Multi-Factor Risk Scoring (0–100):** Clear itemized breakdown with contributing point values.
- **Live Calibration Sliders:** Adjust scoring weights and thresholds in real-time.

### 4. Suspicious Alerts & Audit Trail
- Compliance triage queue categorized by status: `Pending`, `Under Review`, `Confirmed Fraud`, and `False Positive / Resolved`.
- Immutable audit notes log for investigators.

### 5. Data Warehousing Star Schema
- Visual dimensional architecture diagram.
- Inspection of `Fact_Transactions`, `Dim_Date`, `Dim_Account`, `Dim_Location`, and `Dim_Transaction_Type`.
- **Interactive OLAP Engine:** Perform Slice & Dice / Rollup aggregations by Location, Channel, or Date.
- Complete copyable MySQL 8.0 DDL scripts.

### 6. Reports & Analytics
- 6 Comprehensive Reports: Total Transactions, Suspicious Transactions, High-Risk Dossier, Daily Activity, Monthly Rollup, and Risk Distribution.
- Functional CSV export and browser-native print view.
