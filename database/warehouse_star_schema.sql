-- ============================================================================
-- FinGuard – Data Warehousing and Data Mining Capstone Project
-- Data Warehouse Star Schema (Dimensional Modeling)
-- Target RDBMS: MySQL 8.0+
-- ============================================================================

USE finguard;

-- ----------------------------------------------------------------------------
-- Dimension 1: Dim_Date
-- Conformed date dimension supporting temporal OLAP rollups and slice/dice
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Dim_Date (
    date_key INT PRIMARY KEY,              -- Format: YYYYMMDD (e.g., 20261001)
    full_date DATE NOT NULL UNIQUE,
    day_of_month TINYINT NOT NULL,
    day_name VARCHAR(15) NOT NULL,
    day_of_week TINYINT NOT NULL,          -- 1 = Sunday, 7 = Saturday
    is_weekend BOOLEAN NOT NULL,
    month_number TINYINT NOT NULL,
    month_name VARCHAR(15) NOT NULL,
    quarter TINYINT NOT NULL,
    year_val SMALLINT NOT NULL,
    INDEX idx_dim_date (full_date),
    INDEX idx_dim_year_month (year_val, month_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Dimension 2: Dim_Account
-- Account profiling dimension with risk tiering and customer segment
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Dim_Account (
    account_key INT AUTO_INCREMENT PRIMARY KEY,
    account_id VARCHAR(64) NOT NULL UNIQUE,
    customer_segment ENUM('Retail', 'Business', 'Corporate', 'Private Banking') DEFAULT 'Retail',
    risk_tier ENUM('Low', 'Standard', 'Elevated', 'High') DEFAULT 'Standard',
    first_active_date DATE,
    INDEX idx_dim_acc_id (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Dimension 3: Dim_Location
-- Geographic dimension with risk index and territory grouping
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Dim_Location (
    location_key INT AUTO_INCREMENT PRIMARY KEY,
    city_name VARCHAR(120) NOT NULL UNIQUE,
    country VARCHAR(100) DEFAULT 'United States',
    region VARCHAR(60) DEFAULT 'North America',
    jurisdiction_risk_level ENUM('Low', 'Medium', 'High', 'Sanctioned') DEFAULT 'Low',
    INDEX idx_dim_city (city_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Dimension 4: Dim_Transaction_Type
-- Channel dimension distinguishing card present, online, wire, and ATM
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Dim_Transaction_Type (
    type_key INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(40) NOT NULL UNIQUE,
    channel_category ENUM('Card-Present', 'Digital-CNP', 'Automated-Cash', 'Interbank-Wire') NOT NULL,
    is_immediate_settlement BOOLEAN DEFAULT TRUE,
    historical_fraud_rate_pct DECIMAL(5,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Central Fact Table: Fact_Transactions
-- Grain: One record per individual financial transaction
-- Measures: Amount, Risk_Score, Anomaly_Weight
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Fact_Transactions (
    fact_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_key VARCHAR(64) NOT NULL UNIQUE,
    date_key INT NOT NULL,
    account_key INT NOT NULL,
    location_key INT NOT NULL,
    type_key INT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    risk_score INT NOT NULL,
    risk_level ENUM('Low', 'Medium', 'High') NOT NULL,
    is_suspicious BOOLEAN NOT NULL,
    is_confirmed_fraud BOOLEAN DEFAULT FALSE,
    etl_load_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (date_key) REFERENCES Dim_Date(date_key),
    FOREIGN KEY (account_key) REFERENCES Dim_Account(account_key),
    FOREIGN KEY (location_key) REFERENCES Dim_Location(location_key),
    FOREIGN KEY (type_key) REFERENCES Dim_Transaction_Type(type_key),
    INDEX idx_fact_date (date_key),
    INDEX idx_fact_account (account_key),
    INDEX idx_fact_location (location_key),
    INDEX idx_fact_type (type_key),
    INDEX idx_fact_risk (risk_level, risk_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- OLAP Materialized / Aggregated Views for Rapid Executive Reporting
-- ----------------------------------------------------------------------------

-- View 1: Daily Risk & Volume Rollup
CREATE OR REPLACE VIEW V_Daily_Risk_Summary AS
SELECT 
    d.full_date,
    d.day_name,
    COUNT(f.fact_id) AS total_transactions,
    SUM(f.amount) AS total_volume_usd,
    AVG(f.risk_score) AS avg_risk_score,
    SUM(CASE WHEN f.risk_level = 'Low' THEN 1 ELSE 0 END) AS low_risk_count,
    SUM(CASE WHEN f.risk_level = 'Medium' THEN 1 ELSE 0 END) AS medium_risk_count,
    SUM(CASE WHEN f.risk_level = 'High' THEN 1 ELSE 0 END) AS high_risk_count,
    SUM(CASE WHEN f.is_suspicious THEN 1 ELSE 0 END) AS suspicious_transactions_count
FROM Fact_Transactions f
JOIN Dim_Date d ON f.date_key = d.date_key
GROUP BY d.full_date, d.day_name
ORDER BY d.full_date DESC;

-- View 2: Channel & Geographic Risk Slice
CREATE OR REPLACE VIEW V_Channel_Location_Risk_Matrix AS
SELECT 
    t.type_name,
    l.city_name,
    l.jurisdiction_risk_level,
    COUNT(f.fact_id) AS transaction_count,
    SUM(f.amount) AS total_amount,
    AVG(f.risk_score) AS avg_risk_score,
    SUM(CASE WHEN f.risk_level = 'High' THEN 1 ELSE 0 END) AS high_risk_flagged
FROM Fact_Transactions f
JOIN Dim_Transaction_Type t ON f.type_key = t.type_key
JOIN Dim_Location l ON f.location_key = l.location_key
GROUP BY t.type_name, l.city_name, l.jurisdiction_risk_level;
