# Code-Based BVA/EP Completion Matrix

Tai lieu nay bo sung cac dieu kien bien va phan hoach tuong duong con thieu trong cac file `test/*.md`. Noi dung duoc doi chieu voi code hien tai, khong dua tren gia dinh rieng le.

## 1. Code Basis

| Area | Source | Constraint / Rule |
|---|---|---|
| Auth/User | `CreateUserRequest.fullName` | Required, max 100 |
| Auth/User | `CreateUserRequest.email` | Required, email format, max 100 |
| Auth/User | `CreateUserRequest.password` | Required, min 8 |
| Auth/User | `CreateUserRequest.phone` | Optional, max 20 |
| Auth/User | `UpdateUserRequest.status` | Optional, pattern `ACTIVE|INACTIVE`, max 30 |
| Clinic | `CreateClinicRequest.name` | Required, max 200 |
| Clinic | `CreateClinicRequest.clinicCode` | Required, max 20 |
| Clinic | `CreateClinicRequest.phone` | Optional, max 20 |
| Patient Profile | `EmergencyContactRequest.contactName` | Required, max 100 |
| Patient Profile | `EmergencyContactRequest.relationship` | Required, max 50 |
| Patient Profile | `EmergencyContactRequest.phone` | Required, regex `^[+\d\s.-]{10,20}$` |
| Appointment | `CreateAppointmentRequest.doctorId` | Required |
| Appointment | `CreateAppointmentRequest.appointmentTime` | Required; patient booking service accepts roughly `now + 3h` through `now + 15d` |
| Appointment | `CreateAppointmentRequest.appointmentType` | Required |
| Prescription | `PrescriptionRequest.patientId` | Required |
| Prescription | `PrescriptionRequest.diagnosis` | Required, max 255 |
| Prescription | `PrescriptionRequest.items` | Required, min 1 |
| Prescription Item | `PrescriptionItemRequest.medicationName` | Required |
| Prescription Item | `PrescriptionItemRequest.dosage` | Required |
| Health Metric | `CreateHealthMetricRequest.metricType` | Required; expected values: `BLOOD_SUGAR`, `BLOOD_PRESSURE`, `HEART_RATE`, `HBA1C`, `SPO2` |
| Health Metric | `CreateHealthMetricRequest.value` | Required |
| Health Metric | `CreateHealthMetricRequest.unit` | Required |
| Pagination | Controllers using `PageRequest.of(page, size)` | Zero-based page. `page=0` is valid. Negative page or non-positive size may fail via Spring/PageRequest. No explicit max in code. |
| Frontend User Modal | `CreateUserModal.validateForm` | Password min 6 on UI, but backend create user requires min 8. This is a mismatch. |
| Frontend Patient Modal | `CreatePatientModal.validateForm` | Age 0..150, phone `0` or `+84` plus 9 digits, password min 6. |

## 2. Equivalence Partitioning Matrix

| Condition | Valid Partitions | Tag | Invalid Partitions | Tag | Valid Boundaries | Tag |
|---|---|---|---|---|---|---|
| User full name length | 1..100 chars | `EP-AUTH-V01` | blank/null; >100 chars | `EP-AUTH-I01`, `EP-AUTH-I02` | 1, 99, 100 | `BVA-AUTH-B01..B03` |
| User email | valid email, length <=100 | `EP-AUTH-V02` | blank/null; invalid format; >100 chars; duplicate | `EP-AUTH-I03..I06` | 99, 100, 101 | `BVA-AUTH-B04..B06` |
| User password on backend create | length >=8 | `EP-AUTH-V03` | blank/null; length <8 | `EP-AUTH-I07`, `EP-AUTH-I08` | 7, 8, 9 | `BVA-AUTH-B07..B09` |
| Change password new password | 8..100 chars | `EP-AUTH-V04` | blank/null; <8; >100 | `EP-AUTH-I09..I11` | 7, 8, 9, 99, 100, 101 | `BVA-AUTH-B10..B15` |
| User phone length | blank/null or <=20 chars | `EP-AUTH-V05` | >20 chars | `EP-AUTH-I12` | 19, 20, 21 | `BVA-AUTH-B16..B18` |
| User status | `ACTIVE`, `INACTIVE` | `EP-AUTH-V06` | empty; lowercase; unknown enum; >30 chars | `EP-AUTH-I13..I16` | `ACTIVE`, `INACTIVE`, 31 chars | `BVA-AUTH-B19..B21` |
| Clinic name | 1..200 chars | `EP-CLINIC-V01` | blank/null; >200 chars | `EP-CLINIC-I01`, `EP-CLINIC-I02` | 1, 199, 200, 201 | `BVA-CLINIC-B01..B04` |
| Clinic code | 1..20 chars, unique | `EP-CLINIC-V02` | blank/null; >20 chars; duplicate | `EP-CLINIC-I03..I05` | 1, 19, 20, 21 | `BVA-CLINIC-B05..B08` |
| Emergency contact phone | regex-valid 10..20 chars | `EP-PROFILE-V01` | blank/null; <10 chars; >20 chars; illegal characters | `EP-PROFILE-I01..I04` | 9, 10, 20, 21 | `BVA-PROFILE-B01..B04` |
| Emergency relationship | 1..50 chars | `EP-PROFILE-V02` | blank/null; >50 chars | `EP-PROFILE-I05`, `EP-PROFILE-I06` | 1, 49, 50, 51 | `BVA-PROFILE-B05..B08` |
| Patient appointment time | `now+3h` to `now+15d`, with service tolerance | `EP-APPT-V01` | null; before lower bound; after upper bound | `EP-APPT-I01..I03` | `now+2h59m`, `now+3h`, `now+15d`, `now+15d+1m` | `BVA-APPT-B01..B04` |
| Appointment type | non-blank | `EP-APPT-V02` | blank/null | `EP-APPT-I04` | one valid string | `BVA-APPT-B05` |
| Prescription diagnosis | 1..255 chars | `EP-RX-V01` | blank/null; >255 chars | `EP-RX-I01`, `EP-RX-I02` | 1, 254, 255, 256 | `BVA-RX-B01..B04` |
| Prescription items | list size >=1 | `EP-RX-V02` | null; empty list | `EP-RX-I03`, `EP-RX-I04` | 0, 1, 2 | `BVA-RX-B05..B07` |
| Prescription item fields | medicationName and dosage non-blank | `EP-RX-V03` | missing medicationName; missing dosage | `EP-RX-I05`, `EP-RX-I06` | first valid item | `BVA-RX-B08` |
| Metric type | one of 5 supported types | `EP-HM-V01` | null; unknown enum-like value | `EP-HM-I01`, `EP-HM-I02` | each supported type once | `BVA-HM-B01..B05` |
| Metric value | numeric value present | `EP-HM-V02` | null; non-numeric JSON type | `EP-HM-I03`, `EP-HM-I04` | classification thresholds below | `BVA-HM-B06..B30` |
| Pagination page | `page >= 0` | `EP-PAGE-V01` | `page < 0` | `EP-PAGE-I01` | -1, 0, 1 | `BVA-PAGE-B01..B03` |
| Pagination size | `size >= 1` | `EP-PAGE-V02` | `size <= 0` | `EP-PAGE-I02` | 0, 1, 2 | `BVA-PAGE-B04..B06` |
| Frontend patient age | 0..150 | `EP-FE-V01` | blank; non-numeric; <0; >150 | `EP-FE-I01..I04` | -1, 0, 1, 149, 150, 151 | `BVA-FE-B01..B06` |
| Frontend patient phone | `0` or `+84` plus 9 digits | `EP-FE-V02` | blank; 9 digits; 11 local digits; invalid prefix; letters | `EP-FE-I05..I09` | 9 local digits, 10 local digits, `+84` + 9 digits, 11 local digits | `BVA-FE-B07..B10` |

## 3. Health Metric Classification Boundaries

| Metric | Boundary Values | Expected Status |
|---|---|---|
| `BLOOD_SUGAR` | 3.9, 4.0, 5.9, 6.0, 6.1, 7.2, 7.3 | LOW, NORMAL, NORMAL, NORMAL, BORDERLINE_HIGH, BORDERLINE_HIGH, HIGH |
| `HBA1C` | 5.6, 5.7, 6.3, 6.4, 6.5 | NORMAL, BORDERLINE_HIGH, BORDERLINE_HIGH, BORDERLINE_HIGH, HIGH |
| `HEART_RATE` | 59, 60, 99, 100, 101 | LOW, NORMAL, NORMAL, NORMAL, HIGH |
| `SPO2` | 89, 90, 93, 94, 95 | LOW, BORDERLINE_LOW, BORDERLINE_LOW, NORMAL, NORMAL |
| `BLOOD_PRESSURE` | 119/79, 120/80, 140/90, 141/90, 140/91 | NORMAL, BORDERLINE_HIGH, BORDERLINE_HIGH, HIGH, HIGH |

## 4. Minimum Test Case Set To Add

| Test Case | Type | Preconditions | Input | Steps | Expected Outcome | New Tags Covered | Automation Target |
|---|---|---|---|---|---|---|---|
| TC-AUTH-BVA-001 | BVA | Admin token valid | Create user password length 7 | POST `/api/v1/admin/users` | 400 validation error | `BVA-AUTH-B07` | Postman + controller test |
| TC-AUTH-BVA-002 | BVA | Admin token valid | Create user password length 8 | POST `/api/v1/admin/users` | 200/201 if other fields valid and email unique | `BVA-AUTH-B08` | Postman + service/controller test |
| TC-AUTH-BVA-003 | BVA | Admin token valid | Create user email length 101 | POST `/api/v1/admin/users` | 400 validation error | `BVA-AUTH-B06` | Postman + DTO test |
| TC-AUTH-BVA-004 | EP | Admin token valid | `status="active"` | PUT `/api/v1/admin/users/{id}` | 400 validation error | `EP-AUTH-I14` | Postman + DTO test |
| TC-CLINIC-BVA-001 | BVA | Admin token valid | Clinic name length 201 | POST `/api/v1/admin/clinics` | 400 validation error | `BVA-CLINIC-B04` | Postman + DTO test |
| TC-CLINIC-BVA-002 | BVA | Admin token valid | Clinic code length 21 | POST `/api/v1/admin/clinics` | 400 validation error | `BVA-CLINIC-B08` | Postman + DTO test |
| TC-PROFILE-BVA-001 | BVA | Patient token valid | Emergency contact phone 9 chars | POST `/api/v1/patient/profile/emergency-contacts` | 400 validation error | `BVA-PROFILE-B01` | Postman + DTO test |
| TC-PROFILE-BVA-002 | BVA | Patient token valid | Emergency contact phone 20 valid chars | POST `/api/v1/patient/profile/emergency-contacts` | 200/201 | `BVA-PROFILE-B03` | Postman + DTO test |
| TC-APPT-BVA-001 | BVA | Patient token valid | `appointmentTime=now+2h59m` | POST `/api/v1/patient/appointments` | 400/business error | `BVA-APPT-B01` | Service test |
| TC-APPT-BVA-002 | BVA | Patient token valid | `appointmentTime=now+3h` | POST `/api/v1/patient/appointments` | 200/201 pending appointment | `BVA-APPT-B02` | Service test |
| TC-APPT-BVA-003 | BVA | Patient token valid | `appointmentTime=now+15d+1m` | POST `/api/v1/patient/appointments` | 400/business error | `BVA-APPT-B04` | Service test |
| TC-RX-BVA-001 | BVA | Doctor token valid | `items=[]` | POST `/api/v1/doctor/prescriptions` | 400 validation error | `BVA-RX-B05` | Postman + DTO test |
| TC-RX-BVA-002 | BVA | Doctor token valid | `diagnosis` length 256 | POST `/api/v1/doctor/prescriptions` | 400 validation error | `BVA-RX-B04` | Postman + DTO test |
| TC-HM-BVA-001 | BVA | Patient token valid | `BLOOD_SUGAR=3.9` | POST `/api/v1/patient/health-metrics` | Saved with `LOW` | `BVA-HM-B06` | JUnit service test |
| TC-HM-BVA-002 | BVA | Patient token valid | `BLOOD_SUGAR=4.0` | POST `/api/v1/patient/health-metrics` | Saved with `NORMAL` | `BVA-HM-B07` | JUnit service test |
| TC-HM-BVA-003 | BVA | Patient token valid | `BLOOD_PRESSURE=141/90` | POST `/api/v1/patient/health-metrics` | Saved with `HIGH` | `BVA-HM-B29` | JUnit service test |
| TC-PAGE-BVA-001 | BVA | Token valid | `page=-1&size=10` | GET a paged endpoint | 400/exception handled by Spring | `BVA-PAGE-B01` | Controller/API test |
| TC-PAGE-BVA-002 | BVA | Token valid | `page=0&size=1` | GET a paged endpoint | 200 with first zero-based page | `BVA-PAGE-B02`, `BVA-PAGE-B05` | Postman |
| TC-FE-BVA-001 | BVA | App loaded | Patient age `151` | Submit create patient modal | UI validation error | `BVA-FE-B06` | CodeceptJS |
| TC-FE-MISMATCH-001 | Gap | App loaded | Create user password length 6 | Submit admin create user modal | Frontend accepts, backend should reject; align product decision | `EP-AUTH-I08` | E2E + API |

## 5. Gaps To Fix In Existing Reports

| File | Gap |
|---|---|
| `bva_test_cases_report.md` | Treats `page=0` as invalid and assumes max page/size without code validation. |
| `bva_ep_test_cases_summary_report.md` | Repeats the same pagination assumption and lists password min 6 without noting backend min 8. |
| `frontend_form_bva_spec.md` | Correct for current frontend, but must mark backend mismatch for create-user password. |
| `auth_user_test_spec.md` | Needs `password min+1`, email `max-1`, empty/invalid email, phone invalid-pattern/empty, status enum invalid/lowercase. |
| Most `*_postman_test_spec.md` files | Need explicit BVA rows in addition to success/401/403/404 scenarios. |

