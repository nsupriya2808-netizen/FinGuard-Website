# Data Mining & Data Warehousing Reference Guide
## FinGuard Capstone Project

This guide explains the foundational Data Warehousing (DW) and Data Mining (DM) concepts implemented throughout the **FinGuard** system.

---

## 1. Data Warehousing: Dimensional Modeling (Star Schema)

### Concept:
In contrast to 3NF (Third Normal Form) transactional databases that optimize for write integrity (OLTP), dimensional data warehouses optimize for **read-heavy multi-dimensional queries (OLAP)**.

### Star Schema vs Snowflake:
FinGuard adopts a clean **Star Schema** because:
1. Conformed dimensions (`Dim_Date`, `Dim_Location`, `Dim_Account`, `Dim_Transaction_Type`) are de-normalized for faster join execution.
2. The central fact table (`Fact_Transactions`) maintains additive measures (`Amount`, `Risk_Score`, `Is_Suspicious`).
3. Queries require fewer join operations compared to deeply normalized snowflake schemas.

### OLAP Operations Supported:
- **Rollup**: Aggregating granular transaction amounts up to daily and monthly summaries.
- **Drill-Down**: Moving from high-level geographic region down to individual merchant city.
- **Slice**: Filtering fact data on a single dimension (e.g., `Dim_Transaction_Type.Type_Name = 'Wire Transfer'`).
- **Dice**: Filtering fact data across multiple dimensions simultaneously (e.g., `Location = 'Moscow'` AND `Hour BETWEEN 1 AND 5` AND `Amount > 5000`).

---

## 2. Data Mining: Anomaly Detection & Fraud Classification

### A. Statistical Outlier Detection (Z-Score)
Identifies transaction amount values that deviate significantly from the population mean:
$$Z = \frac{X - \mu}{\sigma}$$
Transactions with $|Z| > 3$ are flagged as statistical anomalies.

### B. Account Behavioral Baseline Analysis
FinGuard dynamically tracks moving account averages:
$$\text{Threshold}_{\text{acc}} = 4 \times \bar{X}_{\text{historical}}$$
If an account that averages $\$85$ suddenly initiates a $\$4,200$ online transfer, an `Account Spending Anomaly` is flagged.

### C. Geographic Velocity Attack Detection
If two transactions occur on the same account within a short timeframe at geographically distant locations that cannot be traversed physically (e.g., New York POS at 10:00 AM, London POS at 10:20 AM), a **Velocity Anomaly** is recorded.

### D. Carding Burst Frequency
High-frequency repetitive authorization attempts (frequently with identical or incrementally varying amounts) signal automated bot attacks or brute-force card validation. FinGuard monitors rolling $k$-minute windows ($\le 5$ minutes, $\ge 3$ transactions).

---

## 3. Python Data Mining Script (`data_mining_pipeline.py`)

For offline analysis, FinGuard includes Python integration using Pandas, NumPy, and Scikit-Learn:

```python
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest

# Read warehouse transactions
df = pd.read_csv('dataset/sample_transactions.csv')

# Feature matrix
df['Amount'] = pd.to_numeric(df['Transaction_Amount'], errors='coerce').fillna(0)
df['Hour'] = pd.to_datetime(df['Transaction_Time']).dt.hour

features = pd.get_dummies(df[['Amount', 'Hour', 'Transaction_Type']])

# Isolation Forest unsupervised anomaly detection
iso = IsolationForest(contamination=0.08, random_state=42)
df['Anomaly_Predicted'] = iso.fit_predict(features)
```
