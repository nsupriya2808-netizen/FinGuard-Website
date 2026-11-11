# FinGuard: Financial Transaction Analysis and Fraud Detection System
## College Capstone Project Report
**Academic Domain**: Data Warehousing and Data Mining  
**Target RDBMS**: MySQL 8.0  
**Application Architecture**: Full-Stack TypeScript / Node.js + Express + React 19 + Tailwind CSS  

---

## 1. Executive Summary & Problem Definition

Financial fraud poses multi-billion-dollar systemic risks to banking networks, payment gateways, and merchant acquirers. Traditional rule engines struggle with rigid thresholds, creating overwhelming false-positive rates that overburden compliance analysts.

**FinGuard** was designed as an enterprise-grade full-stack platform addressing the entire data lifecycle:
1. **Data Collection & Ingestion**: Automated CSV parsing, header format verification, and streaming ingestion.
2. **Data Cleaning & Quality Audit**: Real-time identification of missing values, primary-key collisions, invalid currency amounts, unparseable dates, and account identifier gaps.
3. **Data Transformation**: Currency parsing, standard ISO timestamp formatting, title-case geographic normalization, and transactional category mapping.
4. **Data Warehousing (Star Schema)**: Storage in a normalized dimensional model featuring `Fact_Transactions` surrounded by conformed dimensions (`Dim_Date`, `Dim_Account`, `Dim_Location`, `Dim_Transaction_Type`).
5. **Data Mining & Fraud Detection**: A hybrid multi-factor scoring engine (0–100 scale) combining statistical Z-score amount anomaly detection, nocturnal window flags, unfamiliar cross-border velocity, repeat card burst frequency, and channel risk heuristics.
6. **Compliance Investigation & Triage**: Interactive alert workflow enabling analysts to review transaction audit trails, update triage states (Pending, Under Review, Confirmed Fraud, Resolved), and append immutable compliance notes.

---

## 2. System Architecture & ETL Pipeline

```
+---------------------+      +---------------------+      +------------------------+
|  Raw CSV Ingestion  | ---> |  Quality Cleaning   | ---> |  Data Transformation   |
| (Headers, Rows, Len)|      | (Nulls, Dups, Amts) |      | (ISO Date, Norm Types) |
+---------------------+      +---------------------+      +------------------------+
                                                                      |
                                                                      v
+------------------------+   +---------------------+      +------------------------+
|  Fraud Analysis Engine | <-| Operational DB      | <--- |  Data Warehouse Load   |
|  (0-100 Risk Scoring)  |   | (Transactions OLTP) |      | (Fact_Transactions DW) |
+------------------------+   +---------------------+      +------------------------+
```

### Stage 1: Data Cleaning (Module 1.B)
- **Primary Key Uniqueness**: Validates that `Transaction_ID` is present and does not collide with existing database records or repeat within the same ingestion batch.
- **Foreign Key Check**: Ensures `Account_ID` is present.
- **Value Domain Validation**: Filters out negative, zero, or non-numeric `Transaction_Amount` values.
- **Temporal Parsing**: Normalizes slash-delimited dates (`MM/DD/YYYY`, `DD/MM/YYYY`) into ISO standard `YYYY-MM-DD`.

### Stage 2: Dimensional Modeling (Star Schema)
The system separates operational processing (OLTP) from high-speed analytical querying (OLAP) via conformed dimensions:
- **Central Fact**: `Fact_Transactions` (Measures: Amount, Risk_Score, Anomaly_Flags)
- **Dimension 1**: `Dim_Date` (Attributes: Date_Key, Day_Name, Month, Quarter, Year, Is_Weekend)
- **Dimension 2**: `Dim_Account` (Attributes: Customer_Segment, Risk_Tier, First_Active_Date)
- **Dimension 3**: `Dim_Location` (Attributes: City_Name, Country, Region, Jurisdiction_Risk_Level)
- **Dimension 4**: `Dim_Transaction_Type` (Attributes: Type_Name, Channel_Category, Historical_Fraud_Rate)

---

## 3. Data Mining & Fraud Risk Scoring Engine

### Mathematical Formula:
The composite risk score $S \in [0, 100]$ is computed as:
$$S = \min\left(100, \, W_{\text{amt}} \cdot A_{\text{amt}} + W_{\text{time}} \cdot A_{\text{time}} + W_{\text{loc}} \cdot A_{\text{loc}} + W_{\text{freq}} \cdot A_{\text{freq}} + W_{\text{type}} \cdot A_{\text{type}}\right)$$

Where default weights are:
- $W_{\text{amt}} = 35$: Critical amount deviation (exceeding $\$10,000$ or $4\times$ account average)
- $W_{\text{time}} = 20$: Nocturnal activity (between 01:00 AM and 05:00 AM)
- $W_{\text{loc}} = 20$: High-risk offshore jurisdiction (Moscow, Lagos, Dubai, Zurich)
- $W_{\text{freq}} = 15$: Rapid carding burst ($\ge 3$ transactions within a 5-minute window)
- $W_{\text{type}} = 10$: High-value irreversible wire or ATM cash limits

### Classification Tiers:
- **0–30 (Low Risk)**: Nominal transactions. Automatically cleared.
- **31–60 (Medium Risk)**: Suspicious anomalies. Queued for standard compliance triage.
- **61–100 (High Risk)**: Severe compound risk. Immediate authorization hold and AML investigation required.

---

## 4. Academic Demonstration Checklist for Evaluators

1. **Authentication**: Sign in using `analyst@finguard.bank` / `FinGuard@2026`.
2. **Dashboard**: Observe real-time dynamic KPIs, daily volume trend area chart, risk distribution donut, and recent alerts.
3. **Module 1 (ETL)**: Click "Load Corrupt Test Sample" -> Click "Run Data Cleaning" -> Review row-by-row discrepancies -> Commit clean records to database.
4. **Module 2 (Fraud Engine)**: Adjust risk weights slider -> Save -> Observe instant re-scoring of transaction records. Run "Live Batch Anomaly Run".
5. **Alerts Queue**: Open alert -> Change status to "Confirmed Fraud" -> Add investigation notes -> Verify fact table synchronization.
6. **Data Warehouse**: Switch between Visual diagram, Dimension tables, and execute real OLAP Slice-and-Dice queries.
7. **Reports**: View Daily/Monthly rollups -> Export real CSV -> Print dossier.
