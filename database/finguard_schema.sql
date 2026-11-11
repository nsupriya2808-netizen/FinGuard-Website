-- ============================================================================
-- FinGuard – Financial Transaction Analysis and Fraud Detection System
-- Database Schema: Operational Database (OLTP)
-- Target RDBMS: MySQL 8.0+
-- College Capstone Project: Data Warehousing and Data Mining
-- ============================================================================

CREATE DATABASE IF NOT EXISTS finguard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE finguard;

-- ----------------------------------------------------------------------------
-- Table: Users
-- Stores application analysts, administrators, and risk officers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('analyst', 'fraud_investigator', 'admin') DEFAULT 'analyst',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Table: Data_Upload_History
-- Tracks CSV ingestion history for Data Collection & ETL audit
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Data_Upload_History (
    upload_id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    uploaded_by INT,
    total_rows INT DEFAULT 0,
    valid_rows INT DEFAULT 0,
    rejected_rows INT DEFAULT 0,
    status ENUM('pending', 'cleaning', 'transformed', 'loaded', 'failed') DEFAULT 'pending',
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES Users(user_id) ON DELETE SET NULL,
    INDEX idx_upload_time (upload_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Table: ETL_Processing_History
-- Records detailed metrics from ETL data cleaning and transformation runs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ETL_Processing_History (
    etl_id INT AUTO_INCREMENT PRIMARY KEY,
    upload_id INT NOT NULL,
    missing_values_count INT DEFAULT 0,
    duplicate_records_count INT DEFAULT 0,
    invalid_amounts_count INT DEFAULT 0,
    invalid_dates_count INT DEFAULT 0,
    cleaned_records_count INT DEFAULT 0,
    processing_duration_ms INT DEFAULT 0,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (upload_id) REFERENCES Data_Upload_History(upload_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Table: Transactions
-- Core operational transactions table (cleaned and validated)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Transactions (
    transaction_id VARCHAR(64) PRIMARY KEY,
    account_id VARCHAR(64) NOT NULL,
    transaction_amount DECIMAL(12, 2) NOT NULL,
    transaction_date DATE NOT NULL,
    transaction_time TIME NOT NULL,
    location VARCHAR(120) NOT NULL,
    transaction_type ENUM('POS', 'Online', 'ATM', 'Wire Transfer', 'Mobile Transfer') NOT NULL,
    source_upload_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_upload_id) REFERENCES Data_Upload_History(upload_id) ON DELETE SET NULL,
    INDEX idx_account_id (account_id),
    INDEX idx_date (transaction_date),
    INDEX idx_location (location),
    INDEX idx_type (transaction_type),
    INDEX idx_amount (transaction_amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Table: Risk_Analysis
-- Stores calculated risk score (0-100), classification, and ML/rule rationale
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Risk_Analysis (
    analysis_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL UNIQUE,
    risk_score INT NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    risk_level ENUM('Low', 'Medium', 'High') NOT NULL,
    anomaly_amount_flag BOOLEAN DEFAULT FALSE,
    anomaly_location_flag BOOLEAN DEFAULT FALSE,
    anomaly_time_flag BOOLEAN DEFAULT FALSE,
    anomaly_frequency_flag BOOLEAN DEFAULT FALSE,
    anomaly_type_flag BOOLEAN DEFAULT FALSE,
    reasons_breakdown JSON NOT NULL,
    model_version VARCHAR(32) DEFAULT 'v1.4-statistical-ensemble',
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id) ON DELETE CASCADE,
    INDEX idx_risk_level (risk_level),
    INDEX idx_risk_score (risk_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Table: Suspicious_Alerts
-- High-priority queue for transactions flagged as Medium/High risk
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Suspicious_Alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL UNIQUE,
    investigation_status ENUM('Pending', 'Under Review', 'Confirmed Fraud', 'False Positive / Resolved') DEFAULT 'Pending',
    assigned_to INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES Users(user_id) ON DELETE SET NULL,
    INDEX idx_status (investigation_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Table: Investigation_Records
-- Audit trail and notes added by compliance officers and fraud investigators
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Investigation_Records (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    alert_id INT NOT NULL,
    investigator_id INT NOT NULL,
    action_taken VARCHAR(100) NOT NULL,
    notes TEXT NOT NULL,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alert_id) REFERENCES Suspicious_Alerts(alert_id) ON DELETE CASCADE,
    FOREIGN KEY (investigator_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    INDEX idx_alert (alert_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
