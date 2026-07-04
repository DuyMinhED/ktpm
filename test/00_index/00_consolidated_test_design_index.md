# Consolidated Test Design Index

## 1. Purpose

This file is the main entry point for non-Postman test design documents. It groups the existing test specs by purpose, removes overlap at reading time, and records the minimum BVA/EP/white-box case set that should be used for implementation and reporting.

Postman collection specs are intentionally out of scope for this consolidation pass.

## 2. Document Groups

### 2.1 Primary JUnit, BVA, and EP Design

| Group | Primary Document | Related Documents | Usage |
|---|---|---|---|
| Core business BVA | `../01_bva_ep/core_business_bva_spec.md` | `../01_bva_ep/junit_bva_ep_traceability.md`, `../01_bva_ep/code_based_bva_ep_completion.md` | Use for appointment time, prescription items, health metric boundary values, and code-based JUnit traceability. |
| CRUD/API data partitions | `../01_bva_ep/crud_data_ep_spec.md` | `../01_bva_ep/crud_api_bva_spec.md`, `../01_bva_ep/id_status_ep_spec.md` | Use for valid/invalid data classes, status values, id values, pagination, and DTO validation. |
| Auth and user partitions | `../01_bva_ep/auth_user_ep_spec.md` | `../01_bva_ep/auth_user_general_spec.md`, `../02_whitebox_backend/auth_admin_unit_test_plan.md` | Use for login/register/user-management EP and boundary values. |
| JUnit implementation traceability | `../01_bva_ep/junit_bva_ep_traceability.md` | `../02_whitebox_backend/backend_service_whitebox_design.md` | Use to map design rows to concrete JUnit classes under `backend/src/test/java`. |

### 2.2 Primary White-Box Design

| Group | Primary Document | Related Documents | Usage |
|---|---|---|---|
| Service branch/path testing | `../02_whitebox_backend/backend_service_whitebox_design.md` | `../02_whitebox_backend/patient_appointment_whitebox.md`, `../02_whitebox_backend/patient_health_metric_whitebox.md`, `../02_whitebox_backend/prescription_whitebox.md` | Use for service-level branches, null/error paths, repository failures, and mapper behavior. |
| Admin and clinic white-box | `../02_whitebox_backend/admin_user_whitebox.md` | `../02_whitebox_backend/admin_clinic_whitebox.md`, `../04_api_postman/auth_admin_clinic_api.md` | Use for admin/clinic service and controller logic that is covered by JUnit or MockMvc. |
| Auth/security white-box | `../02_whitebox_backend/auth_login_whitebox.md` | `../02_whitebox_backend/jwt_validation_whitebox.md`, `../02_whitebox_backend/jwt_security_spec.md`, `../02_whitebox_backend/jwt_permission_ep.md` | Use for authentication, JWT validation, role checks, and permission partitions. |
| Other service branches | `../02_whitebox_backend/risk_alert_dashboard_whitebox.md` | `../02_whitebox_backend/support_ticket_whitebox.md`, `../02_whitebox_backend/notification_whitebox.md` | Use for remaining service-specific branch/path cases. |

### 2.3 Frontend and Cross-Layer Design

| Group | Primary Document | Related Documents | Usage |
|---|---|---|---|
| Frontend condition analysis | `../03_frontend/frontend_test_conditions_analysis.md` | `../03_frontend/frontend_static_review.md`, `../03_frontend/frontend_e2e_scenarios.md`, `../03_frontend/frontend_e2e_checklist.md` | Use as the source of truth for login, navigation, route guard, CRUD, validation, and toast/error frontend test conditions. |
| Frontend form BVA | `../03_frontend/frontend_form_bva.md` | `../03_frontend/frontend_e2e_checklist.md` | Use for form field constraints, required states, and UI boundary values. |
| Frontend E2E scenarios | `../03_frontend/frontend_e2e_scenarios.md` | `../03_frontend/frontend_backend_traceability.md` | Use for role-based UI workflows and mapping to backend JUnit/API behavior. |

### 2.4 Reference and Report Documents

| Document | Role |
|---|---|
| `../01_bva_ep/bva_ep_summary_report.md` | Summary/report of BVA and EP cases. |
| `../01_bva_ep/bva_cases_report.md` | BVA execution/reporting reference. |
| `../01_bva_ep/bva_ep_design_completeness_audit.md` | Completeness audit for BVA/EP design files and code-based correction routing. |
| `../05_reports_reviews/backend_static_code_review.md` | Static review reference, not a test design source of truth. |
| `../05_reports_reviews/bug_tracking_standard.md` | Bug-reporting standard. |
| `../05_reports_reviews/seeded_bug_catalog_100.md` | Seeded defect catalog for defect-based testing. |
| `../06_testware_env/testware_environment_data_plan.md` | Environment and test data reference. |

## 3. Minimum Test Case Rules

| Technique | Minimum Rule | Example |
|---|---|---|
| Equivalence Partitioning | At least 1 representative value per valid partition and 1 representative value per invalid partition. | For role: `ADMIN`, `DOCTOR`, `PATIENT`, plus invalid/unknown role. |
| One-sided lower boundary | At least 3 values: `min - 1`, `min`, `min + 1`. | Password length: `7`, `8`, `9` when backend requires min 8. |
| One-sided upper boundary | At least 3 values: `max - 1`, `max`, `max + 1`. | Clinic code max 20: length `19`, `20`, `21`. |
| Closed interval boundary | At least 6 values: `min - 1`, `min`, `min + 1`, `max - 1`, `max`, `max + 1`. | Appointment time range from `now + 3h` to `now + 15d`. |
| Boolean branch | At least 2 values: true path and false path. | `taken = true` and `taken = false` for prescription schedule logs. |
| Null/empty/object branch | At least 3 values when the code branches on all three states. | `null`, empty list, non-empty list. |
| Exception path | At least 1 case for each handled exception branch. | Repository throws, external API throws, mapper input invalid. |

## 4. Current Minimum Case Set

| Area | Minimum Count | Current Source | Status |
|---|---:|---|---|
| Core business BVA implemented in JUnit | 10 | `CoreBusinessBvaTest`, `../01_bva_ep/core_business_bva_spec.md` | Implemented. |
| JUnit BVA rows | 14 | `../01_bva_ep/junit_bva_ep_traceability.md` | Documented and mostly implemented. |
| JUnit EP rows | 16 | `../01_bva_ep/junit_bva_ep_traceability.md` | Documented and mostly implemented. |
| Backend service white-box rows | 17 | `../02_whitebox_backend/backend_service_whitebox_design.md` | Documented and mostly implemented for high-priority services. |
| Frontend-to-backend workflow rows | 8 | `../03_frontend/frontend_backend_traceability.md` | Documented as traceability; E2E execution depends on frontend test runner. |
| Remaining service white-box minimum | 15 | `../02_whitebox_backend/backend_service_whitebox_design.md` | Recommended next implementation set. |

The latest verified backend baseline was `627` Maven tests passing with `0` failures, `0` errors, and `0` skipped.

## 5. Consolidated Boundary Condition Table

| Feature/Field | Boundary Rule | Minimum Values To Use | Current Primary Spec | Notes |
|---|---|---|---|---|
| Appointment start time | Valid range: `now + 3h` to `now + 15d` | `now + 2h59m`, `now + 3h`, `now + 3h1m`, `now + 14d23h59m`, `now + 15d`, `now + 15d1m` | `../01_bva_ep/core_business_bva_spec.md`, `../01_bva_ep/junit_bva_ep_traceability.md` | Use fixed or mocked clock in JUnit. |
| Prescription item count | Must contain at least 1 item | `0`, `1`, `2` | `../01_bva_ep/core_business_bva_spec.md`, `../02_whitebox_backend/prescription_whitebox.md` | `0` is invalid; `1` is minimum valid. |
| Blood sugar | Normal range: `4.0` to `6.0` | `3.9`, `4.0`, `4.1`, `5.9`, `6.0`, `6.1` | `../01_bva_ep/core_business_bva_spec.md`, `../01_bva_ep/health_metric_ep_bva_spec.md` | Keep expected status aligned with service code. |
| HbA1c | Thresholds around `5.7` and `6.4` | `5.6`, `5.7`, `6.3`, `6.4`, `6.5` | `../01_bva_ep/code_based_bva_ep_completion.md`, `../01_bva_ep/health_metric_ep_bva_spec.md` | Use code-based matrix when older docs conflict. |
| Heart rate | Thresholds around `60` and `100` | `59`, `60`, `61`, `99`, `100`, `101` | `../01_bva_ep/code_based_bva_ep_completion.md`, `../01_bva_ep/health_metric_ep_bva_spec.md` | Covers low, normal, and high classes. |
| SpO2 | Code-based thresholds around `90` and `94` | `89`, `90`, `93`, `94`, `95` | `../01_bva_ep/code_based_bva_ep_completion.md`, `../01_bva_ep/health_metric_ep_bva_spec.md` | Older docs may use `91/95`; code-based matrix is preferred. |
| Blood pressure | Thresholds around `120/80` and `140/90` | `119/79`, `120/80`, `139/89`, `140/90`, `141/90`, `140/91` | `../01_bva_ep/code_based_bva_ep_completion.md`, `../01_bva_ep/health_metric_ep_bva_spec.md` | Systolic and diastolic boundaries must be varied independently. |
| Backend password | Minimum length is 8 | length `7`, `8`, `9` | `../01_bva_ep/auth_user_ep_spec.md`, `../01_bva_ep/auth_user_general_spec.md` | Frontend may still allow min 6; record this as mismatch. |
| Pagination page | Zero-based page index | `-1`, `0`, `1` | `../01_bva_ep/crud_data_ep_spec.md`, `../01_bva_ep/crud_api_bva_spec.md` | `page=0` is valid. |
| Pagination size | Size must be positive when validation exists | `0`, `1`, default size, max configured size if any | `../01_bva_ep/crud_data_ep_spec.md`, `../01_bva_ep/crud_api_bva_spec.md` | Do not invent max size unless code/SRS defines it. |
| Entity id | Positive id expected by repository lookup | `null`, `0`, `1`, non-existing positive id | `../01_bva_ep/id_status_ep_spec.md`, `../01_bva_ep/crud_data_ep_spec.md` | Separate invalid id from not-found id. |
| Clinic code | Max length 20 when DTO validation applies | length `19`, `20`, `21` | `../01_bva_ep/crud_data_ep_spec.md`, `../02_whitebox_backend/admin_clinic_whitebox.md` | Pair with duplicate-code EP. |
| Display/name fields | Common max length 200 when DTO validation applies | length `199`, `200`, `201` | `../01_bva_ep/crud_data_ep_spec.md` | Confirm exact DTO annotation before execution. |
| Diagnosis/note fields | Common max length 255 when DTO validation applies | length `254`, `255`, `256` | `../02_whitebox_backend/prescription_whitebox.md`, `../01_bva_ep/crud_data_ep_spec.md` | Confirm field-specific annotations before execution. |

## 6. Remaining Non-Postman Test Design Gaps

| Gap | Minimum Cases | Suggested Target |
|---|---:|---|
| `ClinicDashboardServiceImpl` dashboard aggregation branches | 4 | Empty data, single clinic, multiple clinics, repository error/default handling. |
| `AdminDashboardServiceImpl` summary branches | 3 | Empty data, populated data, repository failure or null metric branch. |
| `PatientAppointmentServiceImpl` scheduling branches | 3 | Valid schedule, boundary rejection, conflict/not-found path. |
| `DoctorAppointmentServiceImpl` appointment state branches | 3 | Valid transition, invalid transition, unauthorized/not-found path. |
| `ClinicDoctorServiceImpl` doctor assignment/search branches | 2 | Empty result and populated result, plus duplicate/not-found if implemented. |

Total minimum remaining non-Postman design set: `15` focused JUnit/white-box cases.

## 7. Cleanup Rules For Future Updates

- Treat this file as the navigation source of truth for non-Postman test design.
- Keep detailed values in the primary documents listed above; avoid copying the same table into every report file.
- When a spec conflicts with implementation, prefer the code-based document and update the older document as a gap.
- Do not add Postman collection design into this index unless that work is explicitly requested later.
- Every new BVA/EP spec should include: scope, code basis, boundary/partition table, minimum test case count, concrete cases, and automation target.
