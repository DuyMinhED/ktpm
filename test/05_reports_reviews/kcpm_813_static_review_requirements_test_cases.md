# KCPM-813 Static Review - README, Requirements, and Test Cases

## 1. Scope

Ticket: `KCPM-813 [kcpm-STATIC] Review README/requirements and test cases for ambiguity`

Objective: review documentation and test cases to capture requirement gaps and test gaps.

Input reviewed:

| Input | Local evidence |
|---|---|
| Assignment description | `docs/assignment_kiem_thu_dang_ky_hoc_phan.md` |
| Requirements/SRS | `docs/SRS.md` |
| Test plan | `docs/TEST_PLAN.md` |
| API/Postman matrix draft | `postman/DamDiep_Healthcare_API.postman_collection.json`, `test/04_api_postman/` |
| BVA/EP test drafts | `test/01_bva_ep/` |
| Backend static review | `test/05_reports_reviews/backend_static_code_review.md` |
| Frontend static review | `test/03_frontend/frontend_static_review.md`, `test/03_frontend/frontend_test_conditions_analysis.md` |
| Regression matrix | `test/00_index/02_regression_suite_traceability_matrix.md` |

## 2. Review Checklist

| Checklist item | Status | Evidence / action |
|---|---|---|
| Requirement source exists for each major module | Done | SRS and test plan reviewed. |
| Test specs are grouped and findable | Done | `test/README.md` and `test/00_index/00_consolidated_test_design_index.md` group documents by BVA/EP, white-box, frontend, API/Postman, reports, and testware. |
| BVA/EP docs include boundary tables | Done | Added boundary addenda to `auth_user_ep_spec.md`, `crud_data_ep_spec.md`, `id_status_ep_spec.md`, and `patient_appointment_ep_spec.md`. |
| Test cases include expected result and automation target | Mostly done | Core BVA/EP and white-box specs include expected result plus JUnit/API/E2E targets. Some legacy report files remain summary-only. |
| Ambiguous requirements are identified | Done | See Section 3. |
| Test gaps are mapped to modules/tasks/test cases | Done | See Section 4. |
| Follow-up actions are prioritized | Done | See Section 5. |

## 3. Ambiguous Points By Module

| ID | Module | Ambiguous point | Impact | Follow-up owner/task |
|---|---|---|---|---|
| AMB-AUTH-001 | Auth/User | Frontend create-user/password flows allow minimum 6 characters in some forms, while backend DTO/service requires minimum 8. | Frontend may let users submit data that backend rejects; test expectation differs by layer. | Align requirement in SRS and update frontend validation or document backend as source of truth. |
| AMB-AUTH-002 | Auth/User | Password complexity rules depend on system config in service tests, but DTO only enforces length. | Tests may incorrectly expect uppercase/number/special-character rejection when config is off. | Add requirement row for policy mode and map cases to config state. |
| AMB-APPT-001 | Patient Appointment | Appointment type is non-blank, but service behavior for unsupported values such as `VIDEO_CALL` is not consistently specified. | API, service, and frontend tests may disagree whether unsupported appointment type is rejected or saved with null metadata. | Add enum validation or document supported values: `IN_PERSON`, `ONLINE`. |
| AMB-APPT-002 | Patient Appointment | Non-existing doctor ID expectation differs: API requirement often expects `404`, while some service paths tolerate `null` doctor metadata. | Direct service tests and API tests can produce conflicting expected results. | Decide whether doctor lookup must be hard-fail and update `PatientAppointmentServiceImplTest`. |
| AMB-HM-001 | Health Metrics | Some older docs use SPO2 thresholds `91/95`, while code-based docs use `90/94`. | Boundary tests can assert the wrong status. | Treat `code_based_bva_ep_completion.md` as source of truth, then update SRS if needed. |
| AMB-HM-002 | Health Metrics | Blood pressure boundary differs between SRS-style interpretation and current code classification around `120/80`. | BVA tests may fail if expected status is copied from older docs. | Keep code-based BVA table and add a requirement clarification note. |
| AMB-CRUD-001 | CRUD/Admin Clinic | Clinic duplicate behavior is documented as `409` or `400`. | API tests may allow too broad a status set or assert the wrong one. | Choose one error contract in API matrix and global exception handling. |
| AMB-ID-001 | ID/Status | Positive but non-existing ID is valid input format but invalid relationship/data state. | Test cases need separate expected results for `400` validation vs `404` not found. | Keep separate EP rows for invalid format/value and non-existing valid ID. |
| AMB-FE-001 | Frontend | Patient age/phone validation exists on frontend but backend may store some values as strings or only check non-blank. | API bypass can persist data frontend would reject. | Either enforce backend validation or mark frontend-only validation in test specs. |
| AMB-API-001 | Postman/API matrix | Several collection tests accept broad status-code sets such as `200/400/401/403/404`. | Newman can pass even when business behavior is wrong. | Split smoke availability checks from strict business assertions. |

## 4. Test Gaps And Required Updates

| Gap ID | Module | Gap | Existing evidence | Required update / target test |
|---|---|---|---|---|
| GAP-AUTH-001 | Auth/User | Need explicit boundary tests for `newPassword` length `7/8/9/99/100/101`. | `test/01_bva_ep/auth_user_ep_spec.md` Section 5. | `ChangePasswordRequestTest`, auth API negative cases. |
| GAP-AUTH-002 | Auth/User | Status casing and unknown values need DTO/controller checks. | `auth_user_ep_spec.md`, `id_status_ep_spec.md`. | `UpdateUserRequestValidationTest`: `active`, `SUSPENDED`, empty status. |
| GAP-CRUD-001 | Clinic | Need clinic name/code length boundaries and duplicate-code path. | `crud_data_ep_spec.md` Section 7. | `ClinicRequestValidationTest`, `AdminClinicServiceImplTest`. |
| GAP-CRUD-002 | User | Need fullName/email/password CRUD boundary cases tied to DTO annotations. | `crud_data_ep_spec.md`, `auth_user_general_spec.md`. | `CreateUserRequestValidationTest`, `UpdateUserRequestValidationTest`. |
| GAP-HM-001 | Health Metrics | Need one authoritative threshold suite for BLOOD_SUGAR, HBA1C, HEART_RATE, SPO2, BLOOD_PRESSURE. | `code_based_bva_ep_completion.md`, `health_metric_ep_bva_spec.md`. | `PatientHealthMetricServiceImplTest`, `CoreBusinessBvaTest`. |
| GAP-HM-002 | Health Metrics | Missing/invalid `valueSecondary` for BLOOD_PRESSURE must be tested by layer. | `crud_data_ep_spec.md` Section 7. | DTO/API test if validation exists; service test records gap if not enforced. |
| GAP-APPT-001 | Patient Appointment | Need full lower/upper appointment time BVA around `now+3h` and `now+15d`. | `patient_appointment_ep_spec.md` Section 3.1. | `PatientAppointmentServiceImplTest`, `CreateAppointmentRequestValidationTest`. |
| GAP-APPT-002 | Patient Appointment | Need `doctorId=null`, `doctorId=0`, non-existing doctor, and unsupported appointment type cases. | `patient_appointment_ep_spec.md`, `crud_data_ep_spec.md`. | DTO/service/controller tests with layer-specific expected result. |
| GAP-ID-001 | ID/Status/Pagination | Need path id and pagination BVA: `id=-1/0/1/abc`, `page=-1/0`, `size=0/1`. | `id_status_ep_spec.md` Section 3.1. | Controller tests, `PaginationBvaTest`. |
| GAP-FE-001 | Frontend Forms | Need E2E cases for toast errors and frontend/backend mismatch paths. | `frontend_test_conditions_analysis.md`, `frontend_form_bva.md`. | `frontend/e2e_tests/frontend_error_toast_test.js`, form BVA E2E specs. |
| GAP-POSTMAN-001 | API/Postman | Broad status-code assertions reduce defect detection. | Postman collection tests. | Add strict assertions for business-negative cases and keep broad checks only for smoke endpoints. |
| GAP-DOC-001 | Documentation | Legacy documents had inconsistent names and locations. | `test/README.md`, grouped folder structure. | Keep `test/README.md` as navigation source and avoid adding new root-level spec files. |

## 5. Follow-Up Actions

| Priority | Action | Module | Target artifact |
|---|---|---|---|
| P0 | Resolve password minimum mismatch: choose min 8 or update backend/frontend together. | Auth/User | SRS, frontend forms, `CreateUserRequestValidationTest`, E2E login/create-user tests. |
| P0 | Clarify appointment type enum and non-existing doctor behavior. | Appointment | SRS/API matrix, `PatientAppointmentServiceImplTest`, API negative cases. |
| P0 | Treat code-based health metric threshold table as source of truth until SRS is corrected. | Health Metrics | `code_based_bva_ep_completion.md`, `health_metric_ep_bva_spec.md`, JUnit BVA tests. |
| P1 | Split Postman tests into smoke checks and strict business-contract checks. | API/Postman | `postman/DamDiep_Healthcare_API.postman_collection.json`, `test/04_api_postman/`. |
| P1 | Add or confirm DTO validation for `clinicCode`, `fullName`, `email`, `phone`, `status`, `appointmentTime`. | CRUD/Auth/Appointment | DTO validation tests and controller tests. |
| P1 | Add frontend E2E checks for validation errors, route guards, and toast rendering. | Frontend | `frontend/e2e_tests/`, `frontend_test_conditions_analysis.md`. |
| P2 | Keep report/index files synchronized after moving or renaming test docs. | Documentation | `test/README.md`, `test/00_index/`. |

## 6. Completion Criteria Mapping

| Completion criterion | Result |
|---|---|
| Findings organized by module | Satisfied in Sections 3 and 4. |
| Findings mapped to tasks/test cases needing updates | Satisfied in Section 4 and Section 5. |
| Review checklist present | Satisfied in Section 2. |
| Ambiguous points listed | Satisfied in Section 3. |
| Test gaps listed | Satisfied in Section 4. |
| Follow-up actions listed | Satisfied in Section 5. |

Conclusion: KCPM-813 documentation review is complete after this report, with remaining work converted into module-level follow-up actions and concrete target tests.
