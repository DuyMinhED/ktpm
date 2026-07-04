# [kcpm-ANALYSIS] Frontend Routes, Guards, Forms, and Validation Test Conditions

## 1. Scope and Source Basis

This analysis consolidates the frontend test conditions for login, navigation, route guards, CRUD flows, validation, and toast/error handling.

Source files reviewed:

| Area | Source files |
|---|---|
| Routes and lazy-loaded screens | `frontend/src/routes/AppRoutes.tsx`, `frontend/src/constants/routes.ts` |
| Route guards / RBAC | `frontend/src/components/auth/ProtectedRoute.tsx` |
| Layout/navigation shells | `frontend/src/layouts/AdminLayout.tsx`, `frontend/src/layouts/PatientLayout.tsx`, `frontend/src/components/common/*Sidebar.tsx`, `frontend/src/components/common/TopBar.tsx` |
| Login and auth UI | `frontend/src/features/auth/components/LoginModal.tsx`, `frontend/src/api/auth.ts`, `frontend/src/api/axios.ts` |
| CRUD/API clients | `frontend/src/api/admin.ts`, `frontend/src/api/clinic.ts`, `frontend/src/api/doctor.ts`, `frontend/src/api/patient.ts`, `frontend/src/api/support.ts`, `frontend/src/api/medicalService.ts` |
| Modal/form components | `CreateUserModal.tsx`, `CreatePatientModal.tsx`, `CreateDoctorModal.tsx`, `AddAppointmentModal.tsx`, `AddHealthMetricModal.tsx`, `CreateTicketModal.tsx`, `ChangePasswordModal.tsx`, `ForgotPasswordModal.tsx` |
| Toast/error system | `frontend/src/components/ui/ToastContext.tsx`, `frontend/src/components/ui/Toast.tsx`, page-level toast state in Admin/Clinic/Doctor/Patient pages |
| Existing automation | `frontend/e2e_tests/auth_test.js`, `route_guard_test.js`, `role_navigation_test.js`, `login_test.js`, `navigation_test.js` |

## 2. Frontend Test Condition Table

| ID | Feature / flow | Test condition | Partition / type | Test data | Expected UI behavior | Source basis | Automation target |
|---|---|---|---|---|---|---|---|
| FE-TC-001 | Login | User submits valid admin credentials | Happy path | `admin@care.com` / `admin123` | Token and role are stored; user is redirected to `/admin`; admin dashboard renders | Login modal/auth API, `ProtectedRoute`, `AppRoutes` | `auth_test.js` |
| FE-TC-002 | Login | User submits valid clinic manager credentials | Happy path | `manager@care.com` / `admin123` | User is redirected to `/clinic`; clinic dashboard renders | Login modal/auth API, route map | `auth_test.js`, `role_navigation_test.js` |
| FE-TC-003 | Login | User submits valid doctor credentials | Happy path | `mai.le@care.com` / `admin123` | User is redirected to `/doctor`; doctor dashboard renders | Login modal/auth API, route map | `auth_test.js`, `role_navigation_test.js` |
| FE-TC-004 | Login | User submits valid patient credentials | Happy path | `truongquocan@patient.com` / `admin123` | User is redirected to `/patient`; patient dashboard renders | Login modal/auth API, nested patient routes | `auth_test.js`, `role_navigation_test.js` |
| FE-TC-005 | Login | Password is wrong | Failed path | valid email + `wrong-password` | Login form remains open; URL still contains login action or login form remains visible; no protected page is shown | `LoginModal`, auth flow | `auth_test.js` |
| FE-TC-006 | Login | Required email and password are empty | Required field | empty email, empty password | Form remains open; required-field error is shown or browser/form blocks submit | `LoginModal.tsx` | `login_test.js` |
| FE-TC-007 | Login/API error | Backend returns 401 for an authenticated request | Failed path / auth expiry | expired or invalid token in localStorage | Axios interceptor clears auth keys and redirects to `/?action=login` | `frontend/src/api/axios.ts` | `frontend_error_toast_test.js` |
| FE-TC-008 | Route guard | Unauthenticated user opens admin route directly | Failed path / unauthenticated | `/admin/users` without token | Redirects to `/`; protected content is not rendered | `ProtectedRoute.tsx`, `AppRoutes.tsx` | `route_guard_test.js` |
| FE-TC-009 | Route guard | Unauthenticated user opens doctor route directly | Failed path / unauthenticated | `/doctor/appointments` without token | Redirects to `/`; protected content is not rendered | `ProtectedRoute.tsx` | `route_guard_test.js` |
| FE-TC-010 | Route guard | Patient tries to open admin route | Role mismatch | PATIENT token/role, `/admin/users` | Redirects back to `/patient`; admin page is not visible | `ProtectedRoute.tsx` redirect map | `route_guard_test.js` |
| FE-TC-011 | Route guard | Doctor tries to open patient route | Role mismatch | DOCTOR token/role, `/patient/profile` | Redirects back to `/doctor`; patient page is not visible | `ProtectedRoute.tsx` redirect map | `route_guard_test.js` |
| FE-TC-012 | Route guard | Admin opens clinic manager route | Happy path / allowed shared role | ADMIN token/role, `/clinic/patients` | Route is allowed because clinic routes accept `CLINIC_MANAGER` and `ADMIN` | `AppRoutes.tsx` clinic route guards | `route_guard_test.js` |
| FE-TC-013 | Navigation | Admin navigates to core admin pages | Happy path | `/admin/users`, `/admin/clinics`, `/admin/services` | URL changes and relevant page shell renders without full app crash | Admin layout/routes | `role_navigation_test.js` |
| FE-TC-014 | Navigation | Clinic manager navigates to core clinic pages | Happy path | `/clinic/patients`, `/clinic/doctors`, `/clinic/appointments` | URL changes; clinic page shell renders | Clinic routes/layout | `role_navigation_test.js` |
| FE-TC-015 | Navigation | Doctor navigates to core doctor pages | Happy path | `/doctor/appointments`, `/doctor/patients`, `/doctor/prescriptions` | URL changes; doctor page shell renders | Doctor routes/sidebar | `role_navigation_test.js` |
| FE-TC-016 | Navigation | Patient navigates to core patient pages | Happy path | `/patient/metrics`, `/patient/appointments`, `/patient/profile` | URL changes within nested patient layout | Patient nested routes/layout | `role_navigation_test.js` |
| FE-TC-017 | Public navigation | Unknown route is opened | Failed path / not found | `/route-khong-ton-tai-e2e` | 404 page renders; application does not crash | `AppRoutes.tsx` catch-all route | `navigation_test.js` |
| FE-TC-018 | Admin CRUD user | Admin creates user with valid data | CRUD happy path | valid name/email/password/role/status | Modal closes; success toast appears; list refreshes or new row appears | `AdminUsers.tsx`, `CreateUserModal.tsx`, `adminApi` | New E2E CRUD test |
| FE-TC-019 | Admin CRUD user | Create user missing required name/email/password | Required field | blank name, blank email, blank password | Field-level validation message or error toast appears; API is not called or backend 400 is surfaced | `CreateUserModal.tsx` | New E2E validation test |
| FE-TC-020 | Admin CRUD user | Create user invalid email format | Format invalid | `abc.example.com`, `patient@` | Email validation message appears; save is blocked or 400 is surfaced | `CreateUserModal.tsx`, backend DTO traceability | New E2E validation test |
| FE-TC-021 | Admin CRUD user | Create user password at UI/backend mismatch boundary | Boundary-invalid / cross-layer | `123456` when backend requires 8 chars | UI may allow, backend rejects; error toast/message must be shown and modal state preserved | `frontend_form_bva_spec.md`, backend DTO tests | New E2E + API assertion |
| FE-TC-022 | Clinic CRUD patient | Clinic manager creates patient with valid data | CRUD happy path | valid name, age, phone, email, password, doctor | Modal closes; success toast appears; patient list refreshes | `ClinicPatients.tsx`, `CreatePatientModal.tsx`, `clinicApi` | New E2E CRUD test |
| FE-TC-023 | Clinic CRUD patient | Age below min | Boundary-invalid input | age `-1` | Age validation message appears: value must be in `0..150`; submit is blocked | `CreatePatientModal.tsx`, `frontend_form_bva_spec.md` | New E2E BVA test |
| FE-TC-024 | Clinic CRUD patient | Age above max | Boundary-invalid input | age `151` | Age validation message appears; submit is blocked | `CreatePatientModal.tsx` | New E2E BVA test |
| FE-TC-025 | Clinic CRUD patient | Phone has invalid length or prefix | Format / boundary-invalid | `091234567`, `09123456789`, `abc` | Phone validation message appears; submit is blocked | `CreatePatientModal.tsx` | New E2E validation test |
| FE-TC-026 | Clinic CRUD doctor | Clinic manager creates doctor with valid data | CRUD happy path | valid doctor name, email, phone, password, specialty, license number/image | Modal closes; success toast appears; doctor list refreshes | `ClinicDoctors.tsx`, `CreateDoctorModal.tsx`, `clinicApi` | New E2E CRUD test |
| FE-TC-027 | Clinic CRUD doctor | Doctor form missing license number or license image | Required field | blank license number or no license image URL | Required validation message appears; submit is blocked | `CreateDoctorModal.tsx` | New E2E validation test |
| FE-TC-028 | Clinic CRUD doctor | Doctor email invalid | Format invalid | `doctor-hospital.com` | Email validation message appears; submit is blocked | `CreateDoctorModal.tsx` | New E2E validation test |
| FE-TC-029 | Patient appointment | Patient books appointment with doctor selected | CRUD happy path | doctor selected, valid type/reason/time | Appointment request is created; success toast appears; appointment list refreshes | `PatientAppointments.tsx`, `AddAppointmentModal.tsx`, `patientApi` | New E2E CRUD test |
| FE-TC-030 | Patient appointment | No doctor/specialty selected | Required field | empty doctor selection | Submit button is disabled or validation blocks save | `AddAppointmentModal.tsx`, `frontend_static_review_spec.md` | New E2E validation test |
| FE-TC-031 | Patient appointment | Appointment time below lower business boundary | Boundary-invalid input | `now + 2h59m` | Backend 400/business error is surfaced as toast/message; no appointment appears | `CoreBusinessBvaTest`, appointment API | New E2E/API-backed test |
| FE-TC-032 | Patient health metric | Patient records blood sugar with valid numeric value | CRUD happy path | `BLOOD_SUGAR`, `5.8` | Metric is saved; success toast appears; chart/list updates | `PatientHealthMetrics.tsx`, `AddHealthMetricModal.tsx`, `patientApi` | New E2E CRUD test |
| FE-TC-033 | Patient health metric | Metric value is non-numeric text | Format invalid | `abc` | UI should block or API error toast should be shown; no invalid metric appears | `AddHealthMetricModal.tsx` risk item | New E2E validation test |
| FE-TC-034 | Patient health metric | Blood pressure format invalid | Format invalid | `120`, `abc`, `999/abc` | UI should block or API error toast should be shown | `AddHealthMetricModal.tsx` risk item | New E2E validation test |
| FE-TC-035 | Support ticket | User creates support ticket with valid subject/category/priority/message | CRUD happy path | valid support form data | Success toast appears; ticket list refreshes with new ticket/code | `CreateTicketModal.tsx`, `supportApi` | New E2E CRUD test |
| FE-TC-036 | Support ticket | Required subject/message missing | Required field | blank subject or blank message | Validation message or error toast appears; create call is blocked or 400 surfaced | `CreateTicketModal.tsx` | `frontend_validation_test.js` |
| FE-TC-037 | Toast/error | API save succeeds | Toast success | any successful create/update/delete | Green/success toast appears and auto-dismisses after configured duration | `ToastContext.tsx`, page toast states | New E2E toast assertion |
| FE-TC-038 | Toast/error | API save fails with 400/500 | Toast/error path | mocked failed API response | Error toast/message appears; modal remains usable; destructive UI state is not falsely updated | `ToastContext.tsx`, `axios.ts` | `frontend_error_toast_test.js` |
| FE-TC-039 | Toast/error | Duplicate toast is triggered quickly | Boundary / UX | same toast message twice within 300ms | Duplicate prevention suppresses the second identical toast | `ToastContext.tsx` duplicate prevention | Component/E2E test |
| FE-TC-040 | Toast/error | Many toasts are triggered on small viewport | Boundary-invalid / UX | 5 quick actions on mobile viewport | Toasts stack without covering primary workflow controls | `ToastContext.tsx`, CSS layout | Responsive E2E test |

## 3. Coverage Mapping to Completion Criteria

| Completion criterion | Covered by conditions |
|---|---|
| Happy path | FE-TC-001 to FE-TC-004, FE-TC-012 to FE-TC-016, FE-TC-018, FE-TC-022, FE-TC-026, FE-TC-029, FE-TC-032, FE-TC-035 |
| Failed path | FE-TC-005, FE-TC-007, FE-TC-008, FE-TC-009, FE-TC-017, FE-TC-038 |
| Role mismatch | FE-TC-010, FE-TC-011 |
| Required field | FE-TC-006, FE-TC-019, FE-TC-027, FE-TC-030, FE-TC-036 |
| Format invalid | FE-TC-020, FE-TC-025, FE-TC-028, FE-TC-033, FE-TC-034 |
| Boundary-invalid input | FE-TC-021, FE-TC-023, FE-TC-024, FE-TC-031, FE-TC-039, FE-TC-040 |
| CRUD flow | FE-TC-018, FE-TC-022, FE-TC-026, FE-TC-029, FE-TC-032, FE-TC-035 |
| Toast/error messages | FE-TC-037 to FE-TC-040 plus failed CRUD cases |

## 4. Recommended E2E Implementation Backlog

| Priority | Test group | Conditions to automate next | Reason |
|---|---|---|---|
| P0 | Route guard and auth | FE-TC-007 to FE-TC-012 | Prevents unauthorized route visibility and stale-token loops |
| P0 | Form validation | FE-TC-019 to FE-TC-025, FE-TC-027, FE-TC-030 | Catches required, format, and boundary-invalid input before API calls |
| P1 | CRUD smoke | FE-TC-018, FE-TC-022, FE-TC-026, FE-TC-029, FE-TC-032, FE-TC-035 | Confirms real workflows work across UI and API client |
| P1 | Toast/error behavior | FE-TC-037 to FE-TC-040 | Confirms user-visible feedback is reliable in success and failure paths |

## 5. Notes and Known Cross-Layer Gaps

- Frontend password minimum length can differ from backend validation for some flows. Keep FE-TC-021 as a cross-layer mismatch check.
- Some modal fields rely on API/backend validation rather than complete client-side validation. When the UI allows submission, the expected frontend behavior is to surface the API error clearly and preserve user input.
- Client-side `ProtectedRoute` is a UX guard only. Backend JWT/RBAC must remain the security source of truth.
- Existing E2E automation already covers login, route guard, role navigation, public navigation, and login-modal required-field smoke. The remaining rows are ready to be converted into CodeceptJS/Playwright tests.
