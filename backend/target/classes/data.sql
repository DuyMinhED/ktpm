-- SEED DATA for Patient Portal
-- 0. Ensure columns exist before data load (fixing cached plan mismatch)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS medical_history TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS allergies TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS doctor_id BIGINT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS treatment_status TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS risk_level TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS patient_code VARCHAR(50);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS email VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_type VARCHAR(10);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS height_cm DECIMAL(5,2);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,2);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS joined_date DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS identity_card VARCHAR(20);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS occupation VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS ethnicity VARCHAR(50);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS health_insurance_number VARCHAR(50);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS clinical_notes TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS room_location VARCHAR(100);

-- appointments columns
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT FALSE;
UPDATE appointments SET reminder_enabled = FALSE WHERE reminder_enabled IS NULL;
-- Ensure column is not nullable going forward
ALTER TABLE appointments ALTER COLUMN reminder_enabled SET NOT NULL;

-- users columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;

-- 1. Create Sample Users (Admin, Manager, Doctors, Patients)
INSERT INTO users (email, password, full_name, phone, role, status, clinic_id, is_deleted, created_at)
VALUES 
('admin@care.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMne.9Lb8sY.', 'Hùng Admin', '0888999000', 'ADMIN', 'ACTIVE', NULL, FALSE, CURRENT_TIMESTAMP),
('manager@care.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMne.9Lb8sY.', 'Dr. Manager', '0999888777', 'CLINIC_MANAGER', 'ACTIVE', 1, FALSE, CURRENT_TIMESTAMP),
('mai.le@care.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMne.9Lb8sY.', 'Lê Thị Mai', '0911222333', 'DOCTOR', 'ACTIVE', 1, FALSE, CURRENT_TIMESTAMP),
('hung.nguyen@care.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMne.9Lb8sY.', 'Nguyễn Văn Hùng', '0922333444', 'DOCTOR', 'ACTIVE', 1, FALSE, CURRENT_TIMESTAMP),
('van.tran@care.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMne.9Lb8sY.', 'Trần Thanh Vân', '0933444555', 'DOCTOR', 'ACTIVE', 1, FALSE, CURRENT_TIMESTAMP),
('truongquocan@patient.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMne.9Lb8sY.', 'Trương Quốc An', '0359891652', 'PATIENT', 'ACTIVE', 1, FALSE, CURRENT_TIMESTAMP),
('truonghue@patient.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMne.9Lb8sY.', 'Trương Đình Huệ', '0359891653', 'PATIENT', 'ACTIVE', 1, FALSE, CURRENT_TIMESTAMP),
('tolam@gmail.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMne.9Lb8sY.', 'Tô Lâm', '0359891654', 'PATIENT', 'ACTIVE', 1, FALSE, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO UPDATE SET 
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;

-- 2. Create corresponding Patient records for Clinic 1
INSERT INTO patients (user_id, clinic_id, full_name, phone, email, gender, date_of_birth, address, patient_code, doctor_id, joined_date, chronic_condition, treatment_status, risk_level, clinical_notes, room_location, identity_card, occupation, ethnicity, health_insurance_number, is_deleted, created_at)
VALUES 
((SELECT id FROM users WHERE email = 'truongquocan@patient.com' LIMIT 1), 1, 'Trương Quốc An', '0359891652', 'truongquocan@patient.com', 'Nam', '1990-01-01', 'Hai Bà Trưng, Hà Nội', 'BN-DUC-001', (SELECT id FROM users WHERE email = 'mai.le@care.com' LIMIT 1), CURRENT_DATE, 'Tiểu đường Type 2', 'Đang điều trị', 'Nguy cơ cao', 'Bệnh nhân có tiền sử tiểu đường 5 năm, cần theo dõi đường huyết hàng ngày.', 'Phòng 201 - Khu A', '001090123456', 'Kỹ sư phần mềm', 'Kinh', 'BHYT-123456789', FALSE, CURRENT_TIMESTAMP),
((SELECT id FROM users WHERE email = 'truonghue@patient.com' LIMIT 1), 1, 'Trương Đình Huệ', '0359891653', 'truonghue@patient.com', 'Nữ', '1985-05-05', 'Hải Châu, Đà Nẵng', 'BN-DUC-002', (SELECT id FROM users WHERE email = 'hung.nguyen@care.com' LIMIT 1), CURRENT_DATE, 'Tăng huyết áp', 'Ổn định', 'Bình thường', 'Huyết áp ổn định ở mức 120/80 mmHg. Tiếp tục duy trì chế độ ăn ít muối.', 'Ngoại trú', '031085987654', 'Giáo viên', 'Kinh', 'BHYT-987654321', FALSE, CURRENT_TIMESTAMP),
((SELECT id FROM users WHERE email = 'tolam@gmail.com' LIMIT 1), 1, 'Tô Lâm', '0359891654', 'tolam@gmail.com', 'Nam', '1970-10-10', 'Quận 1, TP. HCM', 'BN-DUC-003', (SELECT id FROM users WHERE email = 'van.tran@care.com' LIMIT 1), CURRENT_DATE, 'Tim mạch', 'Đang theo dõi', 'Đang theo dõi', 'Theo dõi nhịp tim và các dấu hiện đau thắt ngực. Khám lại sau 1 tháng.', 'Phòng 305 - Khu C', '001070112233', 'Kinh doanh', 'Kinh', 'BHYT-112233445', FALSE, CURRENT_TIMESTAMP)
ON CONFLICT (patient_code) DO NOTHING;
