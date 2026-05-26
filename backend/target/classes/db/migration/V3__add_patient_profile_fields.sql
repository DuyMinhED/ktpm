-- =============================================
-- PATIENT PROFILE - Additional Fields
-- =============================================

ALTER TABLE patients ADD COLUMN IF NOT EXISTS identity_card VARCHAR(20);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS occupation VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS ethnicity VARCHAR(50);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS health_insurance_number VARCHAR(50);
