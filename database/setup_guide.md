# FinGuard Database & Data Processing Setup Guide

This guide documents the relational database configuration (MySQL 8.0), Data Warehouse Star Schema setup, and Python data mining integration for the **FinGuard – Financial Transaction Analysis and Fraud Detection System** Capstone Project.

---

## 1. Relational Database Setup (MySQL 8.0)

### Prerequisites
- MySQL Community Server 8.0 or higher
- MySQL Workbench or `mysql` CLI client

### Execution Steps
1. Open a terminal or MySQL client:
   ```bash
   mysql -u root -p
   ```

2. Execute the operational database schema:
   ```sql
   SOURCE database/finguard_schema.sql;
   ```

3. Execute the data warehousing dimensional star schema:
   ```sql
   SOURCE database/warehouse_star_schema.sql;
   ```

4. Verify table creation:
   ```sql
   USE finguard;
   SHOW TABLES;
   ```

Expected tables:
- `Users` (Application analysts, fraud officers)
- `Transactions` (Operational cleaned transaction repository)
- `Risk_Analysis` (Risk scoring 0–100, factors breakdown, model logs)
- `Suspicious_Alerts` (Triage queue with investigation states)
- `Investigation_Records` (Audit trail & resolution notes)
- `Data_Upload_History` & `ETL_Processing_History`
- `Dim_Date`, `Dim_Account`, `Dim_Location`, `Dim_Transaction_Type`
- `Fact_Transactions` (Warehouse central star-schema fact table)

---

## 2. Python Data Mining & Anomaly Detection Pipeline

In addition to FinGuard's real-time engine running in Node.js/TypeScript, you can run the equivalent offline Python data mining script using Pandas, NumPy, and Scikit-learn (Isolation Forest).

### Script: `data_mining_pipeline.py`
```python
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest

def run_finguard_data_mining(csv_path="dataset/sample_transactions.csv"):
    # 1. Load Data
    df = pd.read_csv(csv_path)
    print(f"Loaded {len(df)} transactions.")

    # 2. Preprocessing & Feature Engineering
    df['Transaction_Amount'] = pd.to_numeric(df['Transaction_Amount'], errors='coerce')
    df['Hour'] = pd.to_datetime(df['Transaction_Time'], format='%H:%M:%S').dt.hour
    
    # Z-Score Anomaly on Transaction Amount
    mean_amt = df['Transaction_Amount'].mean()
    std_amt = df['Transaction_Amount'].std()
    df['Amount_ZScore'] = (df['Transaction_Amount'] - mean_amt) / std_amt

    # Feature matrix for Isolation Forest
    features = pd.get_dummies(df[['Transaction_Amount', 'Hour', 'Transaction_Type']])
    features = features.fillna(0)

    # 3. Model Training (Isolation Forest)
    model = IsolationForest(n_estimators=100, contamination=0.08, random_state=42)
    df['Anomaly_Flag'] = model.fit_predict(features)
    # -1 indicates anomaly in Scikit-Learn
    df['Is_Anomaly'] = df['Anomaly_Flag'].map({1: 'Normal', -1: 'Suspicious'})

    print("\nAnomaly Detection Summary:")
    print(df['Is_Anomaly'].value_counts())
    
    return df

if __name__ == "__main__":
    run_finguard_data_mining()
```

---

## 3. Environment Architecture in AI Studio

Within the AI Studio container environment, FinGuard runs a full-stack Node.js + Express backend with an integrated persistent relational engine with Star Schema OLAP queries, so faculty can test 100% of the UI, ETL, fraud detection, and reports out of the box without configuring an external MySQL host. The SQL files above represent the production MySQL 8.0 deployment.
