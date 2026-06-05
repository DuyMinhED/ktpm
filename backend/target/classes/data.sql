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
('admin@care.com', '$2a$10$W2BUZtQRHT8H6ss8cO0qHeKHU7G/4PMyGrhAiRrrJXIGkgxuFLnia', 'Hùng Admin', '0888999000', 'ADMIN', 'ACTIVE', NULL, FALSE, CURRENT_TIMESTAMP),
('manager@care.com', '$2a$10$W2BUZtQRHT8H6ss8cO0qHeKHU7G/4PMyGrhAiRrrJXIGkgxuFLnia', 'Dr. Manager', '0999888777', 'CLINIC_MANAGER', 'ACTIVE', 1, FALSE, CURRENT_TIMESTAMP),
('mai.le@care.com', '$2a$10$W2BUZtQRHT8H6ss8cO0qHeKHU7G/4PMyGrhAiRrrJXIGkgxuFLnia', 'Lê Thị Mai', '0911222333', 'DOCTOR', 'ACTIVE', 1, FALSE, CURRENT_TIMESTAMP),
('hung.nguyen@care.com', '$2a$10$W2BUZtQRHT8H6ss8cO0qHeKHU7G/4PMyGrhAiRrrJXIGkgxuFLnia', 'Nguyễn Văn Hùng', '0922333444', 'DOCTOR', 'ACTIVE', 1, FALSE, CURRENT_TIMESTAMP),
('van.tran@care.com', '$2a$10$W2BUZtQRHT8H6ss8cO0qHeKHU7G/4PMyGrhAiRrrJXIGkgxuFLnia', 'Trần Thanh Vân', '0933444555', 'DOCTOR', 'ACTIVE', 1, FALSE, CURRENT_TIMESTAMP),
('truongquocan@patient.com', '$2a$10$W2BUZtQRHT8H6ss8cO0qHeKHU7G/4PMyGrhAiRrrJXIGkgxuFLnia', 'Trương Quốc An', '0359891652', 'PATIENT', 'ACTIVE', 1, FALSE, CURRENT_TIMESTAMP),
('truonghue@patient.com', '$2a$10$W2BUZtQRHT8H6ss8cO0qHeKHU7G/4PMyGrhAiRrrJXIGkgxuFLnia', 'Trương Đình Huệ', '0359891653', 'PATIENT', 'ACTIVE', 1, FALSE, CURRENT_TIMESTAMP),
('tolam@gmail.com', '$2a$10$W2BUZtQRHT8H6ss8cO0qHeKHU7G/4PMyGrhAiRrrJXIGkgxuFLnia', 'Tô Lâm', '0359891654', 'PATIENT', 'ACTIVE', 1, FALSE, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO UPDATE SET 
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    is_deleted = EXCLUDED.is_deleted,
    status = EXCLUDED.status;

-- 2. Create corresponding Patient records for Clinic 1
INSERT INTO patients (user_id, clinic_id, full_name, phone, email, gender, date_of_birth, address, patient_code, doctor_id, joined_date, chronic_condition, treatment_status, risk_level, clinical_notes, room_location, identity_card, occupation, ethnicity, health_insurance_number, is_deleted, created_at)
VALUES 
((SELECT id FROM users WHERE email = 'truongquocan@patient.com' LIMIT 1), 1, 'Trương Quốc An', '0359891652', 'truongquocan@patient.com', 'Nam', '1990-01-01', 'Hai Bà Trưng, Hà Nội', 'BN-DUC-001', (SELECT id FROM users WHERE email = 'mai.le@care.com' LIMIT 1), CURRENT_DATE, 'Tiểu đường Type 2', 'Đang điều trị', 'Nguy cơ cao', 'Bệnh nhân có tiền sử tiểu đường 5 năm, cần theo dõi đường huyết hàng ngày.', 'Phòng 201 - Khu A', '001090123456', 'Kỹ sư phần mềm', 'Kinh', 'BHYT-123456789', FALSE, CURRENT_TIMESTAMP),
((SELECT id FROM users WHERE email = 'truonghue@patient.com' LIMIT 1), 1, 'Trương Đình Huệ', '0359891653', 'truonghue@patient.com', 'Nữ', '1985-05-05', 'Hải Châu, Đà Nẵng', 'BN-DUC-002', (SELECT id FROM users WHERE email = 'hung.nguyen@care.com' LIMIT 1), CURRENT_DATE, 'Tăng huyết áp', 'Ổn định', 'Bình thường', 'Huyết áp ổn định ở mức 120/80 mmHg. Tiếp tục duy trì chế độ ăn ít muối.', 'Ngoại trú', '031085987654', 'Giáo viên', 'Kinh', 'BHYT-987654321', FALSE, CURRENT_TIMESTAMP),
((SELECT id FROM users WHERE email = 'tolam@gmail.com' LIMIT 1), 1, 'Tô Lâm', '0359891654', 'tolam@gmail.com', 'Nam', '1970-10-10', 'Quận 1, TP. HCM', 'BN-DUC-003', (SELECT id FROM users WHERE email = 'van.tran@care.com' LIMIT 1), CURRENT_DATE, 'Tim mạch', 'Đang theo dõi', 'Đang theo dõi', 'Theo dõi nhịp tim và các dấu hiện đau thắt ngực. Khám lại sau 1 tháng.', 'Phòng 305 - Khu C', '001070112233', 'Kinh doanh', 'Kinh', 'BHYT-112233445', FALSE, CURRENT_TIMESTAMP)
ON CONFLICT (patient_code) DO NOTHING;

-- 3. Create Clinic 1 (Care Clinic)
INSERT INTO clinics (id, email, description, clinic_code, name, address, phone, image_url, manager_id, status, doctor_count, patient_count, high_risk_patient_count, is_deleted, created_at)
SELECT 1, 'clinic1@care.com', 'Phòng khám đa khoa quốc tế hàng đầu khu vực Hà Nội.', 'CLINIC-01', 'Phòng khám Đa khoa Care 1', '123 Đường Láng, Đống Đa, Hà Nội', '0243123456', NULL, (SELECT id FROM users WHERE email = 'manager@care.com' LIMIT 1), 'ACTIVE', 3, 3, 1, FALSE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM clinics WHERE id = 1);

-- 4. Create Sample Appointments
INSERT INTO appointments (doctor_id, patient_id, appointment_time, end_time, status, type, location, meeting_link, reason, diagnosis_summary, doctor_name, doctor_specialty, doctor_avatar_url, reminder_enabled, is_deleted, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'mai.le@care.com' LIMIT 1),
  (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1),
  CURRENT_TIMESTAMP + INTERVAL '3 days',
  CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '30 minutes',
  'SCHEDULED', 'ONLINE', 'Phòng khám trực tuyến', 'https://meet.google.com/abc-xyz-123',
  'Khám định kỳ tiểu đường hàng tháng và kiểm tra chỉ số HbA1c.', NULL,
  'Lê Thị Mai', 'Nội tiết', NULL, TRUE, FALSE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a 
  JOIN patients p ON a.patient_id = p.id 
  WHERE p.email = 'truongquocan@patient.com' AND a.status = 'SCHEDULED'
);

INSERT INTO appointments (doctor_id, patient_id, appointment_time, end_time, status, type, location, meeting_link, reason, diagnosis_summary, doctor_name, doctor_specialty, doctor_avatar_url, reminder_enabled, is_deleted, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'mai.le@care.com' LIMIT 1),
  (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1),
  CURRENT_TIMESTAMP - INTERVAL '14 days',
  CURRENT_TIMESTAMP - INTERVAL '14 days' + INTERVAL '30 minutes',
  'COMPLETED', 'IN_PERSON', 'Phòng 201 - Khu A', NULL,
  'Kiểm tra chỉ số đường huyết tăng bất thường.', 'Đường huyết có dấu hiệu tăng do chế độ ăn uống thiếu kiểm soát. Đã điều chỉnh liều Metformin và dặn dò chế độ ăn giảm đường.',
  'Lê Thị Mai', 'Nội tiết', NULL, FALSE, FALSE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a 
  JOIN patients p ON a.patient_id = p.id 
  WHERE p.email = 'truongquocan@patient.com' AND a.status = 'COMPLETED'
);

INSERT INTO appointments (doctor_id, patient_id, appointment_time, end_time, status, type, location, meeting_link, reason, diagnosis_summary, doctor_name, doctor_specialty, doctor_avatar_url, reminder_enabled, is_deleted, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'hung.nguyen@care.com' LIMIT 1),
  (SELECT id FROM patients WHERE email = 'truonghue@patient.com' LIMIT 1),
  CURRENT_TIMESTAMP + INTERVAL '5 days',
  CURRENT_TIMESTAMP + INTERVAL '5 days' + INTERVAL '30 minutes',
  'SCHEDULED', 'IN_PERSON', 'Phòng 102 - Khu B', NULL,
  'Tái khám tăng huyết áp và cấp toa thuốc mới.', NULL,
  'Nguyễn Văn Hùng', 'Tim mạch', NULL, TRUE, FALSE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a 
  JOIN patients p ON a.patient_id = p.id 
  WHERE p.email = 'truonghue@patient.com' AND a.status = 'SCHEDULED'
);

INSERT INTO appointments (doctor_id, patient_id, appointment_time, end_time, status, type, location, meeting_link, reason, diagnosis_summary, doctor_name, doctor_specialty, doctor_avatar_url, reminder_enabled, is_deleted, created_at)
SELECT 
  (SELECT id FROM users WHERE email = 'van.tran@care.com' LIMIT 1),
  (SELECT id FROM patients WHERE email = 'tolam@gmail.com' LIMIT 1),
  CURRENT_TIMESTAMP - INTERVAL '7 days',
  CURRENT_TIMESTAMP - INTERVAL '7 days' + INTERVAL '30 minutes',
  'COMPLETED', 'IN_PERSON', 'Phòng 305 - Khu C', NULL,
  'Khám lâm sàng đo điện tâm đồ định kỳ.', 'Nhịp tim xoang bình thường, huyết áp ổn định. Tiếp tục sử dụng thuốc huyết áp theo toa cũ.',
  'Trần Thanh Vân', 'Tim mạch', NULL, FALSE, FALSE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a 
  JOIN patients p ON a.patient_id = p.id 
  WHERE p.email = 'tolam@gmail.com' AND a.status = 'COMPLETED'
);

-- 5. Create Sample Health Metrics (for charts and dashboards)
-- Patient: Trương Quốc An (truongquocan@patient.com) - BLOOD_SUGAR
INSERT INTO health_metrics (patient_id, metric_type, value, value_secondary, unit, status, notes, measured_at, is_deleted, created_at)
SELECT (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1), 'BLOOD_SUGAR', 115.00, NULL, 'mg/dL', 'NORMAL', 'Đo lúc đói buổi sáng.', CURRENT_TIMESTAMP - INTERVAL '3 days', FALSE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM health_metrics WHERE patient_id = (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1) AND metric_type = 'BLOOD_SUGAR' AND measured_at > CURRENT_TIMESTAMP - INTERVAL '3 days' - INTERVAL '1 hour' AND measured_at < CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '1 hour');

INSERT INTO health_metrics (patient_id, metric_type, value, value_secondary, unit, status, notes, measured_at, is_deleted, created_at)
SELECT (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1), 'BLOOD_SUGAR', 145.00, NULL, 'mg/dL', 'HIGH', 'Đo sau bữa ăn tối nhiều tinh bột.', CURRENT_TIMESTAMP - INTERVAL '2 days', FALSE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM health_metrics WHERE patient_id = (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1) AND metric_type = 'BLOOD_SUGAR' AND measured_at > CURRENT_TIMESTAMP - INTERVAL '2 days' - INTERVAL '1 hour' AND measured_at < CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '1 hour');

INSERT INTO health_metrics (patient_id, metric_type, value, value_secondary, unit, status, notes, measured_at, is_deleted, created_at)
SELECT (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1), 'BLOOD_SUGAR', 130.00, NULL, 'mg/dL', 'NORMAL', 'Đo trước khi đi ngủ.', CURRENT_TIMESTAMP - INTERVAL '1 day', FALSE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM health_metrics WHERE patient_id = (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1) AND metric_type = 'BLOOD_SUGAR' AND measured_at > CURRENT_TIMESTAMP - INTERVAL '1 day' - INTERVAL '1 hour' AND measured_at < CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '1 hour');

INSERT INTO health_metrics (patient_id, metric_type, value, value_secondary, unit, status, notes, measured_at, is_deleted, created_at)
SELECT (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1), 'BLOOD_SUGAR', 122.00, NULL, 'mg/dL', 'NORMAL', 'Đo lúc đói buổi sáng.', CURRENT_TIMESTAMP, FALSE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM health_metrics WHERE patient_id = (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1) AND metric_type = 'BLOOD_SUGAR' AND measured_at > CURRENT_TIMESTAMP - INTERVAL '1 hour');

-- Patient: Trương Quốc An (truongquocan@patient.com) - BLOOD_PRESSURE
INSERT INTO health_metrics (patient_id, metric_type, value, value_secondary, unit, status, notes, measured_at, is_deleted, created_at)
SELECT (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1), 'BLOOD_PRESSURE', 135.00, 85.00, 'mmHg', 'BORDERLINE_HIGH', 'Huyết áp hơi tăng nhẹ sau tập thể dục.', CURRENT_TIMESTAMP - INTERVAL '3 days', FALSE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM health_metrics WHERE patient_id = (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1) AND metric_type = 'BLOOD_PRESSURE' AND measured_at > CURRENT_TIMESTAMP - INTERVAL '3 days' - INTERVAL '1 hour' AND measured_at < CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '1 hour');

INSERT INTO health_metrics (patient_id, metric_type, value, value_secondary, unit, status, notes, measured_at, is_deleted, created_at)
SELECT (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1), 'BLOOD_PRESSURE', 140.00, 90.00, 'mmHg', 'HIGH', 'Cảm thấy hơi chóng mặt, đau đầu nhẹ.', CURRENT_TIMESTAMP - INTERVAL '2 days', FALSE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM health_metrics WHERE patient_id = (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1) AND metric_type = 'BLOOD_PRESSURE' AND measured_at > CURRENT_TIMESTAMP - INTERVAL '2 days' - INTERVAL '1 hour' AND measured_at < CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '1 hour');

INSERT INTO health_metrics (patient_id, metric_type, value, value_secondary, unit, status, notes, measured_at, is_deleted, created_at)
SELECT (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1), 'BLOOD_PRESSURE', 125.00, 80.00, 'mmHg', 'NORMAL', 'Nghỉ ngơi yên tĩnh trước khi đo.', CURRENT_TIMESTAMP - INTERVAL '1 day', FALSE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM health_metrics WHERE patient_id = (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1) AND metric_type = 'BLOOD_PRESSURE' AND measured_at > CURRENT_TIMESTAMP - INTERVAL '1 day' - INTERVAL '1 hour' AND measured_at < CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '1 hour');

INSERT INTO health_metrics (patient_id, metric_type, value, value_secondary, unit, status, notes, measured_at, is_deleted, created_at)
SELECT (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1), 'BLOOD_PRESSURE', 120.00, 80.00, 'mmHg', 'NORMAL', 'Chỉ số huyết áp lý tưởng.', CURRENT_TIMESTAMP, FALSE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM health_metrics WHERE patient_id = (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1) AND metric_type = 'BLOOD_PRESSURE' AND measured_at > CURRENT_TIMESTAMP - INTERVAL '1 hour');

-- SpO2 and Heart Rate for Trương Quốc An
INSERT INTO health_metrics (patient_id, metric_type, value, value_secondary, unit, status, notes, measured_at, is_deleted, created_at)
SELECT (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1), 'SPO2', 98.00, NULL, '%', 'NORMAL', 'Độ bão hòa oxy tốt.', CURRENT_TIMESTAMP, FALSE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM health_metrics WHERE patient_id = (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1) AND metric_type = 'SPO2' AND measured_at > CURRENT_TIMESTAMP - INTERVAL '1 hour');

INSERT INTO health_metrics (patient_id, metric_type, value, value_secondary, unit, status, notes, measured_at, is_deleted, created_at)
SELECT (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1), 'HEART_RATE', 72.00, NULL, 'bpm', 'NORMAL', 'Nhịp tim lúc nghỉ ngơi.', CURRENT_TIMESTAMP, FALSE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM health_metrics WHERE patient_id = (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1) AND metric_type = 'HEART_RATE' AND measured_at > CURRENT_TIMESTAMP - INTERVAL '1 hour');

-- 6. Create Sample Medication Schedules
INSERT INTO medication_schedules (patient_id, medication_name, dosage, scheduled_time, frequency, instructions, start_date, end_date, is_active, is_deleted, created_at)
SELECT 
  (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1),
  'Metformin', '500mg', '08:00:00', 'Hàng ngày', 'Uống ngay sau bữa ăn sáng.', CURRENT_DATE - INTERVAL '30 days', NULL, TRUE, FALSE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM medication_schedules WHERE patient_id = (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1) AND medication_name = 'Metformin'
);

INSERT INTO medication_schedules (patient_id, medication_name, dosage, scheduled_time, frequency, instructions, start_date, end_date, is_active, is_deleted, created_at)
SELECT 
  (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1),
  'Amlodipine', '5mg', '20:00:00', 'Hàng ngày', 'Uống trước khi đi ngủ, cố định khung giờ.', CURRENT_DATE - INTERVAL '30 days', NULL, TRUE, FALSE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM medication_schedules WHERE patient_id = (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1) AND medication_name = 'Amlodipine'
);

-- 7. Create Sample Patient Alerts
INSERT INTO patient_alerts (patient_id, alert_type, severity, title, message, is_read, is_dismissed, created_at)
SELECT 
  (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1),
  'BLOOD_SUGAR', 'HIGH', 'Chỉ số Đường Huyết Vượt Ngưỡng Bình Thường', 'Hệ thống ghi nhận chỉ số đường huyết của bạn tăng lên mức 145 mg/dL vào tối qua. Vui lòng theo dõi thêm và hạn chế tinh bột.', FALSE, FALSE, CURRENT_TIMESTAMP - INTERVAL '2 days'
WHERE NOT EXISTS (
  SELECT 1 FROM patient_alerts WHERE patient_id = (SELECT id FROM patients WHERE email = 'truongquocan@patient.com' LIMIT 1) AND alert_type = 'BLOOD_SUGAR' AND severity = 'HIGH'
);

