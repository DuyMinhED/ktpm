-- =============================================
-- PATIENT PORTAL - Database Migration Script
-- Run against: chronic_disease_db (MySQL)
-- =============================================

-- 1. Extend patients table
ALTER TABLE patients ADD COLUMN patient_code VARCHAR(20) UNIQUE;
ALTER TABLE patients ADD COLUMN gender VARCHAR(10);
ALTER TABLE patients ADD COLUMN phone VARCHAR(20);
ALTER TABLE patients ADD COLUMN email VARCHAR(100);
ALTER TABLE patients ADD COLUMN address TEXT;
ALTER TABLE patients ADD COLUMN blood_type VARCHAR(10);
ALTER TABLE patients ADD COLUMN height_cm DECIMAL(5,1);
ALTER TABLE patients ADD COLUMN weight_kg DECIMAL(5,1);
ALTER TABLE patients ADD COLUMN avatar_url VARCHAR(500);
ALTER TABLE patients ADD COLUMN joined_date DATE;

-- 2. Extend appointments table
ALTER TABLE appointments ADD COLUMN end_time TIMESTAMP NULL;
ALTER TABLE appointments ADD COLUMN location VARCHAR(255);
ALTER TABLE appointments ADD COLUMN meeting_link VARCHAR(500);
ALTER TABLE appointments ADD COLUMN reason TEXT;
ALTER TABLE appointments ADD COLUMN diagnosis_summary TEXT;
ALTER TABLE appointments ADD COLUMN doctor_name VARCHAR(100);
ALTER TABLE appointments ADD COLUMN doctor_specialty VARCHAR(100);
ALTER TABLE appointments ADD COLUMN doctor_avatar_url VARCHAR(500);

-- 3. Emergency contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    contact_name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- 4. Health metrics
CREATE TABLE IF NOT EXISTS health_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    value_secondary DECIMAL(10,2),
    unit VARCHAR(20) NOT NULL,
    status VARCHAR(50),
    notes TEXT,
    measured_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE INDEX idx_health_metrics_patient ON health_metrics(patient_id);
CREATE INDEX idx_health_metrics_type ON health_metrics(metric_type);
CREATE INDEX idx_health_metrics_measured_at ON health_metrics(measured_at);

-- 5. Medication schedules
CREATE TABLE IF NOT EXISTS medication_schedules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    prescription_item_id BIGINT,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    scheduled_time TIME NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    instructions TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (prescription_item_id) REFERENCES prescription_items(id)
);

-- 6. Medication logs
CREATE TABLE IF NOT EXISTS medication_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    schedule_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    taken_at TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES medication_schedules(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- 7. Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    last_message_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- 8. Messages
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    sender_type VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'TEXT',
    attachment_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at);

-- 9. Patient alerts
CREATE TABLE IF NOT EXISTS patient_alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);
