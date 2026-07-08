# Test Design vs Implementation Audit

Date: 2026-07-04

## 1. Scope

This audit checks whether the test design documents under `test/` are backed by executable tests in:

- `backend/src/test/java`
- `frontend/e2e_tests`
- `postman/DamDiep_Healthcare_API.postman_collection.json`

It does not re-run the full suite. It uses the current source tree and the latest available Surefire reports.

## 2. Current Evidence Snapshot

| Evidence | Result |
|---|---:|
| Backend Java test classes currently in source | 89 |
| Test classes referenced by docs and present in source | 67 |
| Latest Surefire total from reports | 635 tests, 0 failures, 0 errors, 0 skipped |
| Frontend E2E files currently in source | 7 |
| Postman collection JSON parse check | Valid JSON |

## 3. Areas That Are Implemented And Documented

| Area | Design documents | Implementation evidence | Status |
|---|---|---|---|
| Core business BVA | `01_bva_ep/core_business_bva_spec.md`, `01_bva_ep/junit_bva_ep_traceability.md` | `CoreBusinessBvaTest` has appointment lower/upper boundary tests, prescription item minimum tests, nested item validation, and blood sugar boundary tests. | Implemented. |
| Auth/User BVA and EP | `01_bva_ep/auth_user_general_spec.md`, `01_bva_ep/auth_user_ep_spec.md` | `CreateUserRequestValidationTest`, `ChangePasswordRequestTest`, `UpdateUserRequestValidationTest`, `AdminUserServiceImplTest`. | Implemented at DTO/service level; API exact error body remains optional. |
| CRUD data EP/BVA | `01_bva_ep/crud_data_ep_spec.md`, `01_bva_ep/crud_api_bva_spec.md` | `ClinicRequestValidationTest`, `AdminClinicServiceImplTest`, `AdminControllerTest`, `CreateUserRequestValidationTest`, `PatientAppointmentServiceImplTest`, `PatientHealthMetricServiceImplTest`. | Mostly implemented; duplicate/status-code exactness remains API-contract work. |
| Health metric EP/BVA | `01_bva_ep/health_metric_ep_bva_spec.md`, `01_bva_ep/code_based_bva_ep_completion.md` | `PatientHealthMetricServiceImplTest`, `PatientHealthMetricControllerTest`, `CreateHealthMetricRequestValidationTest`, `CoreBusinessBvaTest`. | Implemented for current code thresholds. |
| ID/status/pagination | `01_bva_ep/id_status_ep_spec.md`, `01_bva_ep/bva_cases_report.md` | `PaginationBvaTest`, `UpdateUserRequestValidationTest`, controller tests for not-found/unauthorized paths. | Partially implemented; some endpoint-specific id semantics remain layer-dependent. |
| Patient appointment EP/BVA | `01_bva_ep/patient_appointment_ep_spec.md`, `02_whitebox_backend/patient_appointment_whitebox.md` | `PatientAppointmentServiceImplTest`, `CreateAppointmentRequestValidationTest`, `PatientAppointmentControllerTest`, `CoreBusinessBvaTest`. | Implemented by layer; service tolerance vs DTO rejection remains documented. |
| Backend white-box service paths | `02_whitebox_backend/` documents | Service/controller tests exist for admin, clinic, doctor, patient, prescription, notification, risk alert, support ticket, AI chat, messages, dashboard, config, utilities. | Broadly implemented. |
| Frontend route guard/navigation/login/toast | `03_frontend/frontend_test_conditions_analysis.md`, `03_frontend/frontend_e2e_checklist.md`, `03_frontend/frontend_backend_traceability.md` | `auth_test.js`, `login_test.js`, `navigation_test.js`, `role_navigation_test.js`, `route_guard_test.js`, `frontend_error_toast_test.js`, `frontend_validation_test.js`. | Implemented for smoke, guard, login, toast, and validation paths. |
| Static review and requirement gaps | `05_reports_reviews/kcpm_813_static_review_requirements_test_cases.md` | Findings are mapped to target tests and docs. | Documented; some items are follow-up actions by design. |

## 4. Document References That Are Stale Or Not Present In Source

These names are referenced by docs or older reports, but the matching source file is not currently present under `backend/src/test/java`:

| Referenced test class | Likely source of reference | Action |
|---|---|---|
| `PatientPrescriptionControllerTest` | Older coverage/progress report or legacy controller plan | Legacy reference only; current controller coverage is represented by `PrescriptionControllerTest` and service coverage by `PatientPrescriptionServiceImplTest`. |
| `PrescriptionItemRequestTest` | Older coverage/progress report | Legacy reference only unless the class is restored in source. Current nested item validation evidence exists in `CoreBusinessBvaTest`. |
| `PrescriptionRequestTest` | Older coverage/progress report | Legacy reference only unless the class is restored in source. Current prescription validation evidence exists in `CoreBusinessBvaTest`. |
| `PrescriptionMapperTest` | Older coverage/progress report | Legacy reference only unless mapper coverage is restored in source. Do not treat as current required evidence. |

## 5. Design Items That Are Not Fully Implemented Yet

| Gap | Design evidence | Current implementation state | Recommendation |
|---|---|---|---|
| Postman docs still contain broad smoke expectations | `04_api_postman/`, Postman collection | Collection is executable JSON, but broad status-code assertions can pass non-strict behavior. | Split smoke checks from strict business contract tests. |
| Some frontend/backend validation mismatches are intentionally documented as gaps | `03_frontend/frontend_form_bva.md`, `05_reports_reviews/kcpm_813_static_review_requirements_test_cases.md` | Frontend E2E covers route/login/toast/required validation, but not every cross-layer bypass case. | Add focused E2E/API tests for password min mismatch, patient age, and phone bypass. |
| Appointment service accepts or tolerates some service-layer cases differently from API/DTO expectations | `01_bva_ep/patient_appointment_ep_spec.md`, `02_whitebox_backend/patient_appointment_whitebox.md` | DTO validates unsupported appointment type; service tests cover doctor-null paths. | Keep expected result separated by layer, or enforce service-level validation. |
| ID/not-found semantics vary by endpoint | `01_bva_ep/id_status_ep_spec.md` | Pagination BVA exists; not every endpoint has explicit `id=-1/0/abc/non-existing` tests. | Add endpoint-specific controller tests only for high-risk routes. |
| Coverage/progress docs mention old class names | `05_reports_reviews/coverage_progress_plan.md` | Some old tests are no longer in source, while latest source has newer replacements. | Treat historical rows as progress history; use this audit plus current Surefire/Jacoco output for final evidence. |

## 6. Conclusion

The test design folder is mostly aligned with real implementation. The strongest traceability exists for backend JUnit/Mockito tests and BVA/EP documents. Frontend docs are partially implemented through seven E2E files, but some backlog rows remain intentionally open. Postman artifacts exist and parse correctly, but their business assertions should be made stricter where the docs require exact behavior.

The remaining cleanup is documentation hygiene rather than a major implementation gap: remove or mark stale references to old test classes, and separate implemented cases from planned follow-up cases in progress/report documents.
