INSERT INTO clinics (id, email, description, clinic_code, name, address, phone, image_url, manager_id, status, doctor_count, patient_count, high_risk_patient_count, is_deleted, created_at, updated_at)
VALUES
(1, 'clinic1@care.com', 'Integration clinic 1', 'CLINIC-01', 'Care Clinic 1', '123 Test St', '0243123456', NULL, 2, 'ACTIVE', 2, 2, 1, FALSE, TIMESTAMP '2026-01-01 08:00:00', TIMESTAMP '2026-01-01 08:00:00'),
(2, 'clinic2@care.com', 'Integration clinic 2', 'CLINIC-02', 'Care Clinic 2', '456 Test St', '0243999999', NULL, 3, 'ACTIVE', 1, 1, 0, FALSE, TIMESTAMP '2026-01-01 08:00:00', TIMESTAMP '2026-01-01 08:00:00');

INSERT INTO users (id, email, password, full_name, phone, role, status, clinic_id, specialization, department, license_number, degree, bio, experience, max_patients, avatar_url, is_deleted, created_at, updated_at)
VALUES
(1, 'admin@care.com', '$2a$10$W2BUZtQRHT8H6ss8cO0qHeKHU7G/4PMyGrhAiRrrJXIGkgxuFLnia', 'Admin User', '0888999000', 'ADMIN', 'ACTIVE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, TIMESTAMP '2026-01-01 08:00:00', TIMESTAMP '2026-01-01 08:00:00'),
(2, 'manager@care.com', '$2a$10$W2BUZtQRHT8H6ss8cO0qHeKHU7G/4PMyGrhAiRrrJXIGkgxuFLnia', 'Clinic One Manager', '0999888777', 'CLINIC_MANAGER', 'ACTIVE', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, TIMESTAMP '2026-01-01 08:00:00', TIMESTAMP '2026-01-01 08:00:00'),
(3, 'manager2@care.com', '$2a$10$W2BUZtQRHT8H6ss8cO0qHeKHU7G/4PMyGrhAiRrrJXIGkgxuFLnia', 'Clinic Two Manager', '0999888778', 'CLINIC_MANAGER', 'ACTIVE', 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, TIMESTAMP '2026-01-01 08:00:00', TIMESTAMP '2026-01-01 08:00:00'),
(4, 'mai.le@care.com', '$2a$10$W2BUZtQRHT8H6ss8cO0qHeKHU7G/4PMyGrhAiRrrJXIGkgxuFLnia', 'Le Thi Mai', '0911222333', 'DOCTOR', 'ACTIVE', 1, 'Noi tiet', 'Internal Medicine', 'DOC-001', 'BS', 'Doctor 1 bio', '5 years', 100, NULL, FALSE, TIMESTAMP '2026-01-01 08:00:00', TIMESTAMP '2026-01-01 08:00:00'),
(5, 'hung.nguyen@care.com', '$2a$10$W2BUZtQRHT8H6ss8cO0qHeKHU7G/4PMyGrhAiRrrJXIGkgxuFLnia', 'Nguyen Van Hung', '0922333444', 'DOCTOR', 'ACTIVE', 1, 'Tim mach', 'Cardiology', 'DOC-002', 'ThS', 'Doctor 2 bio', '8 years', 100, NULL, FALSE, TIMESTAMP '2026-01-01 08:00:00', TIMESTAMP '2026-01-01 08:00:00'),
(6, 'doctor2@care.com', '$2a$10$W2BUZtQRHT8H6ss8cO0qHeKHU7G/4PMyGrhAiRrrJXIGkgxuFLnia', 'Clinic Two Doctor', '0933444555', 'DOCTOR', 'ACTIVE', 2, 'Tong quat', 'General', 'DOC-003', 'BS', 'Doctor 3 bio', '4 years', 100, NULL, FALSE, TIMESTAMP '2026-01-01 08:00:00', TIMESTAMP '2026-01-01 08:00:00'),
(7, 'truongquocan@patient.com', '$2a$10$W2BUZtQRHT8H6ss8cO0qHeKHU7G/4PMyGrhAiRrrJXIGkgxuFLnia', 'Truong Quoc An', '0359891652', 'PATIENT', 'ACTIVE', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, TIMESTAMP '2026-01-01 08:00:00', TIMESTAMP '2026-01-01 08:00:00'),
(8, 'truonghue@patient.com', '$2a$10$W2BUZtQRHT8H6ss8cO0qHeKHU7G/4PMyGrhAiRrrJXIGkgxuFLnia', 'Truong Hue', '0359891653', 'PATIENT', 'ACTIVE', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, TIMESTAMP '2026-01-01 08:00:00', TIMESTAMP '2026-01-01 08:00:00'),
(9, 'patient2@care.com', '$2a$10$W2BUZtQRHT8H6ss8cO0qHeKHU7G/4PMyGrhAiRrrJXIGkgxuFLnia', 'Clinic Two Patient', '0359891654', 'PATIENT', 'ACTIVE', 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, TIMESTAMP '2026-01-01 08:00:00', TIMESTAMP '2026-01-01 08:00:00');

INSERT INTO patients (id, user_id, clinic_id, full_name, phone, email, gender, date_of_birth, address, avatar_url, patient_code, doctor_id, joined_date, chronic_condition, treatment_status, profile_status, risk_level, clinical_notes, room_location, identity_card, occupation, ethnicity, health_insurance_number, blood_type, height_cm, weight_kg, is_deleted, created_at, updated_at)
VALUES
(101, 7, 1, 'Truong Quoc An', '0359891652', 'truongquocan@patient.com', 'Nam', DATE '1990-01-01', 'Ha Noi', NULL, 'BN-DUC-001', 4, DATE '2026-01-01', 'Tieu duong', 'Dang dieu tri', 'ACTIVE', 'Nguy co cao', 'Need glucose follow up', 'Room 201', '001090123456', 'Engineer', 'Kinh', 'BHYT-123', 'O+', 170.00, 70.00, FALSE, TIMESTAMP '2026-01-01 08:00:00', TIMESTAMP '2026-01-01 08:00:00'),
(102, 8, 1, 'Truong Hue', '0359891653', 'truonghue@patient.com', 'Nu', DATE '1985-05-05', 'Da Nang', NULL, 'BN-DUC-002', 4, DATE '2026-01-01', 'Tang huyet ap', 'On dinh', 'ACTIVE', 'Binh thuong', 'Stable blood pressure', 'Outpatient', '031085987654', 'Teacher', 'Kinh', 'BHYT-987', 'A+', 160.00, 55.00, FALSE, TIMESTAMP '2026-01-01 08:00:00', TIMESTAMP '2026-01-01 08:00:00'),
(201, 9, 2, 'Clinic Two Patient', '0359891654', 'patient2@care.com', 'Nam', DATE '1970-10-10', 'HCM', NULL, 'BN-OTHER-001', 6, DATE '2026-01-01', 'Tim mach', 'Dang theo doi', 'ACTIVE', 'Binh thuong', 'Clinic 2 patient', 'Room 305', '001070112233', 'Business', 'Kinh', 'BHYT-222', 'B+', 172.00, 75.00, FALSE, TIMESTAMP '2026-01-01 08:00:00', TIMESTAMP '2026-01-01 08:00:00');

INSERT INTO appointments (id, doctor_id, patient_id, appointment_time, end_time, status, type, location, meeting_link, reason, diagnosis_summary, doctor_name, doctor_specialty, doctor_avatar_url, reminder_enabled, is_deleted, created_at, updated_at)
VALUES
(1001, 4, 101, TIMESTAMP '2026-07-10 09:00:00', TIMESTAMP '2026-07-10 09:30:00', 'SCHEDULED', 'ONLINE', 'Online clinic', 'https://meet.example/a', 'Monthly check', NULL, 'Le Thi Mai', 'Noi tiet', NULL, TRUE, FALSE, TIMESTAMP '2026-01-02 08:00:00', TIMESTAMP '2026-01-02 08:00:00'),
(1002, 4, 101, TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:30:00', 'COMPLETED', 'IN_PERSON', 'Room 201', NULL, 'Past check', 'Stable', 'Le Thi Mai', 'Noi tiet', NULL, FALSE, FALSE, TIMESTAMP '2026-01-03 08:00:00', TIMESTAMP '2026-01-03 08:00:00'),
(1003, 4, 102, TIMESTAMP '2026-07-11 10:00:00', TIMESTAMP '2026-07-11 10:30:00', 'CANCELLED', 'IN_PERSON', 'Room 202', NULL, 'Cancelled check', NULL, 'Le Thi Mai', 'Noi tiet', NULL, FALSE, FALSE, TIMESTAMP '2026-01-04 08:00:00', TIMESTAMP '2026-01-04 08:00:00'),
(2001, 6, 201, TIMESTAMP '2026-07-12 09:00:00', TIMESTAMP '2026-07-12 09:30:00', 'SCHEDULED', 'IN_PERSON', 'Clinic 2', NULL, 'Other clinic check', NULL, 'Clinic Two Doctor', 'Tong quat', NULL, TRUE, FALSE, TIMESTAMP '2026-01-05 08:00:00', TIMESTAMP '2026-01-05 08:00:00');

INSERT INTO health_metrics (id, patient_id, metric_type, value, value_secondary, unit, status, notes, measured_at, is_deleted, created_at, updated_at)
VALUES
(3001, 101, 'BLOOD_SUGAR', 5.80, NULL, 'mmol/L', 'NORMAL', 'Morning fasting', TIMESTAMP '2026-06-28 07:00:00', FALSE, TIMESTAMP '2026-06-28 07:00:00', TIMESTAMP '2026-06-28 07:00:00'),
(3002, 101, 'BLOOD_SUGAR', 7.30, NULL, 'mmol/L', 'HIGH', 'After meal', TIMESTAMP '2026-06-29 07:00:00', FALSE, TIMESTAMP '2026-06-29 07:00:00', TIMESTAMP '2026-06-29 07:00:00'),
(3003, 101, 'BLOOD_PRESSURE', 120.00, 80.00, 'mmHg', 'NORMAL', 'Rested', TIMESTAMP '2026-06-30 07:00:00', FALSE, TIMESTAMP '2026-06-30 07:00:00', TIMESTAMP '2026-06-30 07:00:00'),
(3004, 201, 'BLOOD_SUGAR', 6.10, NULL, 'mmol/L', 'NORMAL', 'Clinic 2 metric', TIMESTAMP '2026-06-30 07:00:00', FALSE, TIMESTAMP '2026-06-30 07:00:00', TIMESTAMP '2026-06-30 07:00:00');

INSERT INTO patient_alerts (id, patient_id, alert_type, severity, title, message, is_read, is_dismissed, created_at)
VALUES
(4001, 101, 'BLOOD_SUGAR', 'HIGH', 'High glucose', 'Blood sugar is high', FALSE, FALSE, TIMESTAMP '2026-06-29 08:00:00'),
(4002, 101, 'BLOOD_PRESSURE', 'NORMAL', 'Dismissed alert', 'Already dismissed', TRUE, TRUE, TIMESTAMP '2026-06-28 08:00:00');

INSERT INTO prescriptions (id, prescription_code, doctor_id, patient_id, diagnosis, status, notes, is_deleted, created_at, updated_at)
VALUES
(5001, 'RX-001', 4, 101, 'Tieu duong type 2', 'ACTIVE', 'Continue medication', FALSE, TIMESTAMP '2026-06-20 08:00:00', TIMESTAMP '2026-06-20 08:00:00'),
(5002, 'RX-002', 4, 101, 'Old prescription', 'EXPIRED', 'Expired medication', FALSE, TIMESTAMP '2026-05-20 08:00:00', TIMESTAMP '2026-05-20 08:00:00');

INSERT INTO prescription_items (id, prescription_id, medication_name, dosage, usage_instructions, created_at, updated_at)
VALUES
(5101, 5001, 'Metformin', '500mg', 'After breakfast', TIMESTAMP '2026-06-20 08:00:00', TIMESTAMP '2026-06-20 08:00:00'),
(5102, 5002, 'Amlodipine', '5mg', 'Before sleep', TIMESTAMP '2026-05-20 08:00:00', TIMESTAMP '2026-05-20 08:00:00');

INSERT INTO medication_schedules (id, patient_id, prescription_item_id, medication_name, dosage, scheduled_time, frequency, instructions, start_date, end_date, is_active, is_deleted, created_at, updated_at)
VALUES
(6001, 101, 5101, 'Metformin', '500mg', TIME '08:00:00', 'Daily', 'After breakfast', DATE '2026-06-20', NULL, TRUE, FALSE, TIMESTAMP '2026-06-20 08:00:00', TIMESTAMP '2026-06-20 08:00:00');

INSERT INTO medical_services (id, name, category, price, duration, description, status, clinic_id, is_deleted, created_at, updated_at)
VALUES
(7001, 'General consultation', 'CONSULTATION', 200000.00, '30m', 'General check', 'ACTIVE', 1, FALSE, TIMESTAMP '2026-01-01 08:00:00', TIMESTAMP '2026-01-01 08:00:00'),
(7002, 'Inactive service', 'LAB', 150000.00, '15m', 'Inactive', 'INACTIVE', 1, FALSE, TIMESTAMP '2026-01-01 08:00:00', TIMESTAMP '2026-01-01 08:00:00');

INSERT INTO system_configs (id, language, timezone, maintenance_mode, special_char_required, upper_number_required, bp_sys_threshold, bp_dia_threshold, hr_threshold, spo2threshold, notify_vital_signs, notify_support_requests, notify_revenue_reports, api_key, is_deleted, created_at, updated_at)
VALUES
(8001, 'vi', 'Asia/Ho_Chi_Minh', FALSE, TRUE, TRUE, '140', '90', '100', '95', TRUE, TRUE, TRUE, 'test-api-key', FALSE, TIMESTAMP '2026-01-01 08:00:00', TIMESTAMP '2026-01-01 08:00:00');

INSERT INTO audit_logs (id, user_id, user_name, user_avatar, action, module, details, ip_address, status, is_deleted, created_at, updated_at)
VALUES
(9001, 1, 'Admin User', NULL, 'LOGIN', 'AUTH', 'Admin login', '127.0.0.1', 'success', FALSE, TIMESTAMP '2026-01-01 09:00:00', TIMESTAMP '2026-01-01 09:00:00');
