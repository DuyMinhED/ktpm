-- =============================================
-- PATIENT PROFILE - Additional Fields
-- Run against: chronic_disease_db (MySQL)
-- =============================================

ALTER TABLE patients ADD COLUMN identity_card VARCHAR(20);
ALTER TABLE patients ADD COLUMN occupation VARCHAR(100);
ALTER TABLE patients ADD COLUMN ethnicity VARCHAR(50);
ALTER TABLE patients ADD COLUMN health_insurance_number VARCHAR(50);
