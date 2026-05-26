-- =============================================
-- PATIENT PORTAL - Database Migration Script
-- Run against: chronic_disease_db (PostgreSQL)
-- =============================================

-- 1. Extend patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS patient_code VARCHAR(20) UNIQUE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender VARCHAR(10);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS email VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_type VARCHAR(10);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS height_cm DECIMAL(5,1);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,1);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS joined_date DATE;

-- 2. Extend appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS end_time TIMESTAMP;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS meeting_link VARCHAR(500);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS diagnosis_summary TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS doctor_name VARCHAR(100);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS doctor_specialty VARCHAR(100);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS doctor_avatar_url VARCHAR(500);

-- 3. Emergency contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patients(id),
    contact_name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- 4. Health metrics
CREATE TABLE IF NOT EXISTS health_metrics (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patients(id),
    metric_type VARCHAR(50) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    value_secondary DECIMAL(10,2),
    unit VARCHAR(20) NOT NULL,
    status VARCHAR(50),
    notes TEXT,
    measured_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_health_metrics_patient ON health_metrics(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_metrics_type ON health_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_health_metrics_measured_at ON health_metrics(measured_at);

-- 5. Medication schedules
CREATE TABLE IF NOT EXISTS medication_schedules (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patients(id),
    prescription_item_id BIGINT REFERENCES prescription_items(id),
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    scheduled_time TIME NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    instructions TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- 6. Medication logs
CREATE TABLE IF NOT EXISTS medication_logs (
    id BIGSERIAL PRIMARY KEY,
    schedule_id BIGINT NOT NULL REFERENCES medication_schedules(id),
    patient_id BIGINT NOT NULL REFERENCES patients(id),
    taken_at TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patients(id),
    doctor_id BIGINT NOT NULL,
    last_message_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- 8. Messages
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id),
    sender_id BIGINT NOT NULL,
    sender_type VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'TEXT',
    attachment_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at);

-- 9. Patient alerts
CREATE TABLE IF NOT EXISTS patient_alerts (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patients(id),
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
