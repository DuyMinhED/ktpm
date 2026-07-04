# Coverage Progress Plan

Mục tiêu: tăng dần Jacoco coverage cho backend, ưu tiên các package đang thấp nhất và có nhiều missed instructions/branches nhất.

## 1. Snapshot hiện tại

Nguồn tham chiếu: `backend/target/site/jacoco/index.html` và `backend/target/site/jacoco/jacoco.csv`.

| Package | Instruction Cov. | Branch Cov. | Trạng thái | Ghi chú |
|---|---:|---:|---|---|
| `com.project.service.impl` | 13% | 11% | In progress | Vùng lớn nhất, ưu tiên cao nhất |
| `com.project.controller` | 15% | 11% | Pending | Cần MockMvc/WebMvc tests |
| `com.project.mapper` | 50% | 31% | Pending | Dễ kéo coverage nhanh |
| `com.project.security` | 66% | 32% | Pending | Cần token/security branch tests |
| `com.project.service` | 2% | 0% | Pending | Chủ yếu service helpers/classes |
| `com.project.util` | 12% | 8% | Pending | Dễ test unit |
| `com.project.exception` | 48% | n/a | Pending | Test exception handler |
| `com.project.specification` | 0% | 0% | Pending | Test JPA specification predicates |
| `com.project.entity` | 76% | 18% | Pending | Test entity lifecycle/enum branches |
| `com.project.dto.response` | 68% | n/a | Pending | Test static factories/builders |
| `com.project.config` | 96% | 64% | Almost done | Chủ yếu RateLimit branches |
| `com.project.repository` | 0% | n/a | Optional | Repository interfaces khó cần 100 thực chất |

## 2. Đã triển khai

| Ngày | Hạng mục | File / Test | Kết quả |
|---|---|---|---|
| 2026-07-02 | BVA/EP DTO validation | `CreateUserRequestValidationTest`, `UpdateUserRequestValidationTest`, `ChangePasswordRequestTest` | Pass |
| 2026-07-02 | Clinic DTO validation | `ClinicRequestValidationTest` | Pass |
| 2026-07-02 | Patient/Profile DTO validation | `CreatePatientRequestTest`, `UpdatePatientProfileRequestTest`, `EmergencyContactRequestTest` | Pass |
| 2026-07-02 | Core DTO validation | `CreateAppointmentRequestValidationTest`, `PrescriptionRequestTest`, `PrescriptionItemRequestTest`, `CreateHealthMetricRequestValidationTest` | Pass |
| 2026-07-02 | Pagination BVA | `PaginationBvaTest` | Pass |
| 2026-07-02 | Full backend test run | `mvn -f backend/pom.xml test` | 159 tests, 0 failures |

## 3. Ưu tiên tiếp theo

### Phase 1: Hoàn tất DTO/request validation

| Task | Target files | Status |
|---|---|---|
| Add tests for AI chat request | `AiChatRequest` | Pending |
| Add tests for medication log | `LogMedicationRequest` | Pending |
| Add tests for send message | `SendMessageRequest` | Pending |
| Add tests for clinic update | `UpdateClinicRequest` | Pending |
| Add tests for system config | `UpdateSystemConfigRequest` | Pending |
| Add tests for doctor appointment request | `DoctorCreateAppointmentRequest` | Pending |

### Phase 2: Mapper / util / specification

| Task | Target class | Status |
|---|---|---|
| Mapper null/full-field coverage | `UserMapper` | Pending |
| Mapper null/full-field coverage | `PatientMapper` | Pending |
| Mapper null/full-field coverage | `PrescriptionMapper` | Pending |
| Mapper null/full-field coverage | `ClinicMapper` | Pending |
| Utility tests | `DateTimeUtils` | Pending |
| Utility tests | `RoleUtils` | Pending |
| Utility tests | `SecurityUtils` | Pending |
| Specification tests | `PatientSpecification` | Pending |

### Phase 3: Controller tests

| Priority | Controller | Cases cần có | Status |
|---:|---|---|---|
| 1 | `SupportTicketController` | success, 400, 404, delete, status update | Done |
| 2 | `PatientPrescriptionController` | list/detail/log/refill negative paths | Done |
| 3 | `NotificationController` | list/read/delete/count cases | Done |
| 4 | `MedicalServiceController` | CRUD/toggle status/not found | Done |
| 5 | `RiskAlertController` | dashboard/list/mark/dismiss | Done |
| 6 | `DoctorAppointmentController` | create/status/reschedule/batch | Done |
| 7 | `UserProfileController` | profile/change password negative paths | Done |
| 8 | `ClinicDashboardController` | patients/doctors/appointments/profile | Done |

### Phase 4: Service implementation tests

| Priority | Service class | Focus | Status |
|---:|---|---|---|
| 1 | `ClinicDashboardServiceImpl` | branches for dashboard charts, patients, doctors, appointments | High coverage |
| 2 | `AdminDashboardServiceImpl` | stats, reports, audit logs, chart branches | High coverage |
| 3 | `ClinicPatientServiceImpl` | filters, create/update/delete, not found | Pending |
| 4 | `DoctorAppointmentServiceImpl` | create, status, reschedule, batch branches | Pending |
| 5 | `DoctorPatientServiceImpl` | detail, metrics, schedules, risk branches | Pending |
| 6 | `ClinicDoctorServiceImpl` | create/update/delete/filter branches | Pending |
| 7 | `PatientProfileServiceImpl` | profile, emergency contacts, report | Pending |
| 8 | `PatientPrescriptionServiceImpl` | dashboard/list/detail/log/refill | Pending |
| 9 | `SupportTicketServiceImpl` | filters, status changes, audit branches | Almost done |
| 10 | `RiskAlertServiceImpl` | dashboard, high-risk list, dismiss/read alert boundaries | Almost done |
| 11 | `PatientMessageServiceImpl` | conversations, messages, send/read boundaries | High coverage |

### Phase 5: Security / config / exception

| Task | Target class | Status |
|---|---|---|
| JWT valid/expired/malformed/signature cases | `JwtTokenProvider` | Pending |
| Auth filter no header/valid/invalid cases | `JwtAuthenticationFilter` | Pending |
| Principal and permission branches | `SecurityService` | Pending |
| Success/error/no-principal branches | `AuditAspect` | Pending |
| Under/over limit branches | `RateLimitFilter` | Pending |
| Exception response tests | `GlobalExceptionHandler` | Pending |

## 4. Quy tắc làm việc

- Không chỉnh tay file trong `backend/target/site/jacoco`; đây là output sinh bởi Maven/Jacoco.
- Sau mỗi nhóm test, chạy:

```powershell
mvn -f backend/pom.xml test
```

- Khi cần cập nhật report HTML/XML:

```powershell
mvn -f backend/pom.xml verify
```

- Sau mỗi lần chạy, cập nhật bảng tiến độ này với:
  - ngày chạy
  - số test pass/fail
  - package/class đã cải thiện
  - gap còn lại

## 5. Ghi chú rủi ro

- 100% branch coverage có thể yêu cầu test một số nhánh không có nhiều giá trị nghiệp vụ, ví dụ Lombok-generated paths, null fallback, hoặc branch phòng thủ.
- Repository interfaces có thể không đáng ép 100% nếu chỉ là Spring Data method declarations.
- Một số gap hiện tại là gap thật của code, không nên viết test giả để pass:
  - `CreatePatientRequest.age` chưa có range validation backend.
  - `CreatePatientRequest.phone` chưa có pattern validation backend.
  - `PrescriptionRequest.items` chưa cascade validation item con vì thiếu `@Valid`.
  - `CreateHealthMetricRequest.metricType` chưa validate supported values ở DTO.

## 6. Progress update - 2026-07-02

### Implemented in this pass

| Area | Added/updated tests | Result |
|---|---|---|
| DTO request validation/data holders | `AiChatRequestTest`, `LogMedicationRequestTest`, `SendMessageRequestTest`, `UpdateClinicRequestTest`, `UpdateSystemConfigRequestTest`, `DoctorCreateAppointmentRequestTest` | Pass |
| Mapper coverage | `UserMapperTest`, `ClinicMapperTest`, `PatientMapperTest`, `PrescriptionMapperTest` | Pass |
| Utility coverage | `DateTimeUtilsTest`, `RoleUtilsTest` | Pass |
| Specification coverage | `PatientSpecificationTest` | Pass |
| Exception/API response coverage | `GlobalExceptionHandlerTest`, `ResourceNotFoundExceptionTest`, `ApiResponseTest` | Pass |
| AI chat response coverage | `AiChatResponseTest` | Pass |
| Service package coverage | `AuditServiceTest` | Pass |

### Verification

| Command | Result |
|---|---|
| `mvn -f backend/pom.xml test` | 220 tests, 0 failures, 0 errors; run before final `AiChatResponseTest` add |
| `mvn -f backend/pom.xml verify` | 223 tests, 0 failures, 0 errors; JaCoCo report regenerated |

### Coverage after this pass

Source: regenerated `backend/target/site/jacoco/jacoco.csv`.

| Package | Instruction coverage after pass | Branch coverage after pass | Status |
|---|---:|---:|---|
| `com.project.util` | ~96% | ~92% | Almost done |
| `com.project.specification` | 100% | 100% | Done |
| `com.project.mapper` | ~99% | ~89% | Almost done |
| `com.project.exception` | 100% | n/a | Done |
| `com.project.service` | ~86% | ~54% | In progress |
| `com.project.dto.response` | 100% | n/a | Done |

### Remaining focus for 100%

1. `com.project.service.impl` is still the biggest gap. Prioritize `ClinicDashboardServiceImpl`, `AdminDashboardServiceImpl`, `ClinicPatientServiceImpl`, `DoctorAppointmentServiceImpl`, `ClinicDoctorServiceImpl`.
2. `com.project.controller` still needs MockMvc tests for currently uncovered controllers, especially `SupportTicketController`, `PatientPrescriptionController`, `NotificationController`, `MedicalServiceController`, `RiskAlertController`, `UserProfileController`.
3. `com.project.security` still needs branch-focused tests for `SecurityService` and `AuditAspect`.
4. `com.project.entity` still has uncovered entities/branches: `SupportTicket`, `Prescription`, and `MetricType` edge branches.

## 7. Progress update - 2026-07-02 controller/service pass

### Implemented in this pass

| Area | Added tests | Result |
|---|---|---|
| Controller direct unit tests | `SupportTicketControllerTest`, `NotificationControllerTest`, `MedicalServiceControllerTest` | Pass |
| Patient/doctor message controllers | `PatientMessageControllerTest`, `DoctorMessageControllerTest` | Pass |
| Patient prescription and AI controllers | `PatientPrescriptionControllerTest`, `AiChatControllerTest` | Pass |
| Service implementation tests | `SupportTicketServiceImplTest`, `NotificationServiceImplTest` | Pass |

### Verification

| Command | Result |
|---|---|
| `mvn -f backend/pom.xml verify` | 253 tests, 0 failures, 0 errors; JaCoCo report regenerated |

### Coverage after this pass

Source: regenerated `backend/target/site/jacoco/jacoco.csv`.

| Package/class | Current state |
|---|---|
| `com.project.controller` | Many wrapper controllers now fully covered: `SupportTicketController`, `NotificationController`, `MedicalServiceController`, `PatientMessageController`, `DoctorMessageController`, `PatientPrescriptionController`, `AiChatController` |
| `NotificationServiceImpl` | 100% instruction/line/method coverage |
| `SupportTicketServiceImpl` | ~99% instruction coverage, all lines/methods covered; remaining gap is defensive branch coverage |

### Remaining focus

1. Large service implementations remain the main work: `ClinicDashboardServiceImpl`, `AdminDashboardServiceImpl`, `ClinicPatientServiceImpl`, `DoctorAppointmentServiceImpl`, `ClinicDoctorServiceImpl`.
2. Controller gaps now focus on `UserProfileController`, `ClinicDashboardController`, `RiskAlertController`, `DoctorAppointmentController`, `PatientProfileController`, `PrescriptionController`, `DashboardController`.
3. Security branch coverage remains mostly in `SecurityService` and `AuditAspect`.

## 8. Progress update - 2026-07-02 config/medical service pass

### Implemented in this pass

| Area | Added/updated tests | Result |
|---|---|---|
| Admin config service | `AdminConfigServiceImplTest` | Pass |
| Medical service service | `MedicalServiceServiceImplTest` | Pass |
| Existing flaky tests | Stabilized `PatientAppointmentServiceImplTest` appointment time and `AdminUserServiceImplTest` null-config password case | Pass |

### Verification

| Command | Result |
|---|---|
| `mvn -f backend/pom.xml "-Dtest=AdminUserServiceImplTest,PatientAppointmentServiceImplTest,AdminConfigServiceImplTest,MedicalServiceServiceImplTest" test` | 46 tests, 0 failures, 0 errors |
| `mvn -f backend/pom.xml -q verify` | 516 tests, 0 failures, 0 errors; JaCoCo report regenerated |

### Coverage after this pass

Source: regenerated `backend/target/site/jacoco/jacoco.csv`.

| Class | Instruction missed/covered | Branch missed/covered | Line missed/covered | Method missed/covered | Status |
|---|---:|---:|---:|---:|---|
| `AdminConfigServiceImpl` | 0 / 163 | 0 / 2 | 0 / 26 | 0 / 5 | Done |
| `MedicalServiceServiceImpl` | 11 / 342 | 3 / 25 | 2 / 84 | 0 / 15 | Almost done |

### Remaining focus

1. Close the last defensive branches in `MedicalServiceServiceImpl` only if 100% class coverage is required.
2. Continue large service classes with the biggest missed instruction counts: `AdminDashboardServiceImpl`, `ClinicPatientServiceImpl`, `DoctorAppointmentServiceImpl`, `DoctorPatientServiceImpl`, `RiskAlertServiceImpl`.
3. Re-check controller package after service pass; remaining controller gaps are likely security/error paths rather than simple success wrappers.

## 9. Progress update - 2026-07-02 controller completion pass

### Implemented in this pass

| Area | Added/updated tests | Result |
|---|---|---|
| User profile controller | `UserProfileControllerTest` | Pass |
| Risk alert controller | `RiskAlertControllerTest` | Pass |
| Doctor appointment controller | `DoctorAppointmentControllerTest` | Pass |
| Patient appointment controller | `PatientAppointmentControllerTest` | Pass |
| Patient health metric controller | `PatientHealthMetricControllerTest` | Pass |
| Doctor dashboard controller | `DashboardControllerTest` | Pass |
| Remaining admin/clinic endpoints | Updated `AdminControllerTest`, `ClinicDashboardControllerTest` | Pass |

### Verification

| Command | Result |
|---|---|
| `mvn -f backend/pom.xml "-Dtest=UserProfileControllerTest,RiskAlertControllerTest,DoctorAppointmentControllerTest,PatientAppointmentControllerTest,PatientHealthMetricControllerTest,DashboardControllerTest" test` | 21 tests, 0 failures, 0 errors |
| `mvn -f backend/pom.xml "-Dtest=AdminControllerTest,ClinicDashboardControllerTest" test` | 35 tests, 0 failures, 0 errors |
| `mvn -f backend/pom.xml "-Dtest=AdminControllerTest" test` | 13 tests, 0 failures, 0 errors |
| `mvn -f backend/pom.xml -q verify` | 542 tests, 0 failures, 0 errors; JaCoCo report regenerated |

### Coverage after this pass

Source: regenerated `backend/target/site/jacoco/jacoco.csv`.

| Class | Instruction missed/covered | Branch missed/covered | Line missed/covered | Method missed/covered | Status |
|---|---:|---:|---:|---:|---|
| `ClinicDashboardController` | 0 / 215 | 0 / 0 | 0 / 42 | 0 / 20 | Done |
| `UserProfileController` | 0 / 105 | 0 / 10 | 0 / 28 | 0 / 4 | Done |
| `RiskAlertController` | 0 / 69 | 0 / 4 | 0 / 18 | 0 / 5 | Done |
| `DoctorAppointmentController` | 0 / 63 | 0 / 0 | 0 / 15 | 0 / 6 | Done |
| `PatientAppointmentController` | 0 / 51 | 0 / 0 | 0 / 11 | 0 / 6 | Done |
| `PatientHealthMetricController` | 0 / 44 | 0 / 0 | 0 / 10 | 0 / 5 | Done |
| `DashboardController` | 0 / 13 | 0 / 0 | 0 / 3 | 0 / 1 | Done |
| `AdminController` | 0 / 192 | 0 / 4 | 0 / 26 | 0 / 19 | Done |

### Remaining focus

1. Controller package is complete at 100% instruction/branch/line/method coverage in `jacoco.csv`.
2. Next high-impact targets are service implementations: `AdminDashboardServiceImpl`, `ClinicDashboardServiceImpl`, `ClinicPatientServiceImpl`, `RiskAlertServiceImpl`, `PatientMessageServiceImpl`.
3. Security package still needs focused branch tests for `SecurityService` and `AuditAspect`.

## 10. Progress update - 2026-07-02 service implementation pass

### Implemented in this pass

| Area | Added/updated tests | Result |
|---|---|---|
| Admin dashboard service | `AdminDashboardServiceImplTest` | Pass |
| Risk alert service | `RiskAlertServiceImplTest` | Pass |

### Verification

| Command | Result |
|---|---|
| `mvn -f backend/pom.xml -q -Dtest=AdminDashboardServiceImplTest test` | Pass |
| `mvn -f backend/pom.xml -q -Dtest=RiskAlertServiceImplTest test` | Pass |
| `mvn -f backend/pom.xml -q verify` | 554 tests, 0 failures, 0 errors; JaCoCo report regenerated |

### Coverage after this pass

Source: regenerated `backend/target/site/jacoco/jacoco.csv`.

| Class | Instruction missed/covered | Branch missed/covered | Line missed/covered | Method missed/covered | Status |
|---|---:|---:|---:|---:|---|
| `AdminDashboardServiceImpl` | 164 / 1614 | 42 / 90 | 17 / 247 | 0 / 47 | High coverage |
| `RiskAlertServiceImpl` | 0 / 340 | 1 / 19 | 0 / 83 | 0 / 10 | Almost done |

### Remaining focus

1. `ClinicDashboardServiceImpl` is now the largest remaining service gap: 1766 missed instructions, 332 missed lines.
2. `ClinicPatientServiceImpl` and `PatientMessageServiceImpl` are still mostly uncovered and should be next after clinic dashboard.
3. `RiskAlertServiceImpl` only has one remaining branch gap, likely a defensive boundary around optional data.

## 11. Progress update - 2026-07-03 clinic dashboard service pass

### Implemented in this pass

| Area | Added/updated tests | Result |
|---|---|---|
| Clinic dashboard aggregate data | Updated `ClinicDashboardServiceImplTest` | Pass |
| Clinic appointment records | Updated `ClinicDashboardServiceImplTest` | Pass |
| Clinic appointment create/update/batch reschedule | Updated `ClinicDashboardServiceImplTest` | Pass |

### Verification

| Command | Result |
|---|---|
| `mvn -f backend/pom.xml -q -Dtest=ClinicDashboardServiceImplTest test` | Pass |
| `mvn -f backend/pom.xml -q verify` | 564 tests, 0 failures, 0 errors; JaCoCo report regenerated |

### Coverage after this pass

Source: regenerated `backend/target/site/jacoco/jacoco.csv`.

| Class | Instruction missed/covered | Branch missed/covered | Line missed/covered | Method missed/covered | Status |
|---|---:|---:|---:|---:|---|
| `ClinicDashboardServiceImpl` | 209 / 1740 | 66 / 112 | 26 / 353 | 4 / 35 | High coverage |
| `AdminDashboardServiceImpl` | 164 / 1614 | 42 / 90 | 17 / 247 | 0 / 47 | High coverage |
| `RiskAlertServiceImpl` | 0 / 340 | 1 / 19 | 0 / 83 | 0 / 10 | Almost done |

### Remaining focus

1. The largest remaining service gaps are now `ClinicPatientServiceImpl` and `PatientMessageServiceImpl`.
2. `ClinicDashboardServiceImpl` still has a few method/branch gaps, mostly defensive or alternate appointment/dashboard paths.
3. Security remains a separate branch-coverage target: `SecurityService`, `AuditAspect`.

## 12. Progress update - 2026-07-03 patient message service pass

### Implemented in this pass

| Area | Added/updated tests | Result |
|---|---|---|
| Patient message service | `PatientMessageServiceImplTest` | Pass |

### Verification

| Command | Result |
|---|---|
| `mvn -f backend/pom.xml -q -Dtest=PatientMessageServiceImplTest test` | Pass |
| `mvn -f backend/pom.xml -q verify` | 571 tests, 0 failures, 0 errors; JaCoCo report regenerated |

### Coverage after this pass

Source: regenerated `backend/target/site/jacoco/jacoco.csv`.

| Class | Instruction missed/covered | Branch missed/covered | Line missed/covered | Method missed/covered | Status |
|---|---:|---:|---:|---:|---|
| `PatientMessageServiceImpl` | 32 / 357 | 18 / 20 | 3 / 98 | 2 / 11 | High coverage |
| `ClinicDashboardServiceImpl` | 209 / 1740 | 66 / 112 | 26 / 353 | 4 / 35 | High coverage |
| `RiskAlertServiceImpl` | 0 / 340 | 1 / 19 | 0 / 83 | 0 / 10 | Almost done |

### Remaining focus

1. `ClinicPatientServiceImpl` is now the clearest remaining low-coverage service target.
2. `DoctorMessageServiceImpl` mirrors the patient message service and can be covered with a similar test shape.
3. Remaining service branch gaps are mostly defensive paths and alternate authorization/not-found flows.

## 13. Progress update - 2026-07-03 clinic patient service pass

### Implemented in this pass

| Area | Added/updated tests | Result |
|---|---|---|
| Clinic patient listing/filter mapping | `ClinicPatientServiceImplTest` | Pass |
| Patient creation defaults and duplicate email boundary | `ClinicPatientServiceImplTest` | Pass |
| Doctor assignment by id/name/clear boundary | `ClinicPatientServiceImplTest` | Pass |
| Baseline health metrics and appointment creation branches | `ClinicPatientServiceImplTest` | Pass |
| Update/delete/notification authorization and not-found paths | `ClinicPatientServiceImplTest` | Pass |

### Verification

| Command | Result |
|---|---|
| `mvn -f backend/pom.xml -q -Dtest=ClinicPatientServiceImplTest test` | Pass |
| `mvn -f backend/pom.xml -q verify` | 582 tests, 0 failures, 0 errors; JaCoCo report regenerated |

### Coverage after this pass

Source: regenerated `backend/target/site/jacoco/jacoco.csv`.

| Class | Instruction missed/covered | Branch missed/covered | Line missed/covered | Method missed/covered | Status |
|---|---:|---:|---:|---:|---|
| `ClinicPatientServiceImpl` | 22 / 773 | 37 / 71 | 5 / 169 | 1 / 15 | High coverage |
| `PatientMessageServiceImpl` | 32 / 357 | 18 / 20 | 3 / 98 | 2 / 11 | High coverage |
| `ClinicDashboardServiceImpl` | 209 / 1740 | 66 / 112 | 26 / 353 | 4 / 35 | High coverage |

### Remaining focus

1. `DoctorMessageServiceImpl` is the next efficient target because it mirrors the already-covered patient messaging workflow.
2. `ClinicDashboardServiceImpl` still has some defensive branch gaps, but the main line and methods are largely covered.
3. Security/config/util classes should be handled after service-level gaps because they contribute branch misses across cross-cutting behavior.

## 14. Progress update - 2026-07-03 doctor message service pass

### Implemented in this pass

| Area | Added/updated tests | Result |
|---|---|---|
| Doctor conversation listing and empty-last-message fallback | `DoctorMessageServiceImplTest` | Pass |
| Doctor message paging mapper | `DoctorMessageServiceImplTest` | Pass |
| Sending by conversation id and receiver id | `DoctorMessageServiceImplTest` | Pass |
| On-demand conversation creation | `DoctorMessageServiceImplTest` | Pass |
| Unauthenticated, missing, unauthorized and invalid-target boundaries | `DoctorMessageServiceImplTest` | Pass |
| Mark conversation as read | `DoctorMessageServiceImplTest` | Pass |

### Verification

| Command | Result |
|---|---|
| `mvn -f backend/pom.xml -q -Dtest=DoctorMessageServiceImplTest test` | Pass |
| `mvn -f backend/pom.xml -q verify` | 591 tests, 0 failures, 0 errors; JaCoCo report regenerated |

### Coverage after this pass

Source: regenerated `backend/target/site/jacoco/jacoco.csv`.

| Class | Instruction missed/covered | Branch missed/covered | Line missed/covered | Method missed/covered | Status |
|---|---:|---:|---:|---:|---|
| `DoctorMessageServiceImpl` | 0 / 241 | 0 / 10 | 0 / 72 | 0 / 9 | Complete |
| `ClinicPatientServiceImpl` | 22 / 773 | 37 / 71 | 5 / 169 | 1 / 15 | High coverage |
| `PatientMessageServiceImpl` | 32 / 357 | 18 / 20 | 3 / 98 | 2 / 11 | High coverage |
| `ClinicDashboardServiceImpl` | 209 / 1740 | 66 / 112 | 26 / 353 | 4 / 35 | High coverage |

### Remaining focus

1. `ClinicPatientServiceImpl` still has branch gaps around optional field combinations, but main behavior is now covered.
2. `PatientMessageServiceImpl` has some remaining patient-specific alternate branches; it can be tightened after higher-value service gaps.
3. Cross-cutting `security`, `config`, and `util` packages remain important for total branch coverage.

## 15. Progress update - 2026-07-03 patient health metric service pass

### Implemented in this pass

| Area | Added/updated tests | Result |
|---|---|---|
| Patient metric creation with current security context | `PatientHealthMetricServiceImplTest` | Pass |
| Doctor/clinic-manager/patient alert flow for abnormal metrics | `PatientHealthMetricServiceImplTest` | Pass |
| Risk-level transition HIGH_RISK/STABLE | `PatientHealthMetricServiceImplTest` | Pass |
| Boundary value checks for blood sugar, blood pressure, heart rate, HbA1c, SpO2 | `PatientHealthMetricServiceImplTest` | Pass |
| Summary/chart/history mapping, trend and percentage change | `PatientHealthMetricServiceImplTest` | Pass |
| Delete ownership, missing metric, missing auth/profile paths | `PatientHealthMetricServiceImplTest` | Pass |

### Verification

| Command | Result |
|---|---|
| `mvn -f backend/pom.xml -q -Dtest=PatientHealthMetricServiceImplTest test` | Pass |
| `mvn -f backend/pom.xml -q verify` | 580 tests, 0 failures, 0 errors; JaCoCo report regenerated |

### Coverage after this pass

Source: regenerated `backend/target/site/jacoco/jacoco.csv`.

| Class | Instruction missed/covered | Branch missed/covered | Line missed/covered | Method missed/covered | Status |
|---|---:|---:|---:|---:|---|
| `PatientHealthMetricServiceImpl` | 16 / 845 | 9 / 79 | 5 / 168 | 0 / 21 | High coverage |
| `DoctorMessageServiceImpl` | 0 / 241 | 0 / 10 | 0 / 72 | 0 / 9 | Complete |
| `ClinicPatientServiceImpl` | 22 / 773 | 37 / 71 | 5 / 169 | 1 / 15 | High coverage |

### Remaining focus

1. `PatientPrescriptionServiceImpl` is now one of the largest low-coverage patient-side service gaps.
2. `GeminiAiChatServiceImpl` and `ClinicalAnalyticsServiceImpl` are still mostly uncovered, but may need careful mocking around external/API-style behavior.
3. `SecurityService` remains a high branch-count target for total branch coverage.

## 16. Progress update - 2026-07-03 patient prescription service pass

### Implemented in this pass

| Area | Added/updated tests | Result |
|---|---|---|
| Active prescription mapping with item details and created date | `PatientPrescriptionServiceImplTest` | Pass |
| Prescription history and non-active status path | `PatientPrescriptionServiceImplTest` | Pass |
| Today medication schedule statuses: taken, pending, upcoming | `PatientPrescriptionServiceImplTest` | Pass |
| Remaining-day boundary for expired and open-ended schedules | `PatientPrescriptionServiceImplTest` | Pass |
| Missing patient profile boundary | `PatientPrescriptionServiceImplTest` | Pass |

### Verification

| Command | Result |
|---|---|
| `mvn -f backend/pom.xml -q -Dtest=PatientPrescriptionServiceImplTest test` | Pass |
| `mvn -f backend/pom.xml -q verify` | 584 tests, 0 failures, 0 errors; JaCoCo report regenerated |

### Coverage after this pass

Source: regenerated `backend/target/site/jacoco/jacoco.csv`.

| Class | Instruction missed/covered | Branch missed/covered | Line missed/covered | Method missed/covered | Status |
|---|---:|---:|---:|---:|---|
| `PatientPrescriptionServiceImpl` | 0 / 351 | 1 / 13 | 0 / 97 | 0 / 15 | Almost complete |
| `PatientHealthMetricServiceImpl` | 16 / 845 | 9 / 79 | 5 / 168 | 0 / 21 | High coverage |
| `DoctorMessageServiceImpl` | 0 / 241 | 0 / 10 | 0 / 72 | 0 / 9 | Complete |

### Remaining focus

1. `GeminiAiChatServiceImpl` and `ClinicalAnalyticsServiceImpl` are still the clearest low-coverage classes by line/instruction ratio.
2. `DoctorPatientServiceImpl` remains a meaningful service target with 183 missed instructions and 33 missed lines.
3. `SecurityService` remains the largest branch-coverage target outside business services.

## 17. Progress update - 2026-07-03 clinical analytics service pass

### Implemented in this pass

| Area | Added/updated tests | Result |
|---|---|---|
| Clinic high-risk insight | `ClinicalAnalyticsServiceImplTest` | Pass |
| Clinic increasing blood-pressure trend insight | `ClinicalAnalyticsServiceImplTest` | Pass |
| Clinic fallback insight when no issues exist | `ClinicalAnalyticsServiceImplTest` | Pass |
| Doctor high-risk and missing metric reminders | `ClinicalAnalyticsServiceImplTest` | Pass |
| Doctor fallback insight when no issues exist | `ClinicalAnalyticsServiceImplTest` | Pass |

### Verification

| Command | Result |
|---|---|
| `mvn -f backend/pom.xml -q -Dtest=ClinicalAnalyticsServiceImplTest test` | Pass |
| `mvn -f backend/pom.xml -q verify` | 588 tests, 0 failures, 0 errors; JaCoCo report regenerated |

### Coverage after this pass

Source: regenerated `backend/target/site/jacoco/jacoco.csv`.

| Class | Instruction missed/covered | Branch missed/covered | Line missed/covered | Method missed/covered | Status |
|---|---:|---:|---:|---:|---|
| `ClinicalAnalyticsServiceImpl` | 0 / 141 | 0 / 18 | 0 / 31 | 0 / 3 | Complete |
| `PatientPrescriptionServiceImpl` | 0 / 351 | 1 / 13 | 0 / 97 | 0 / 15 | Almost complete |
| `PatientHealthMetricServiceImpl` | 16 / 845 | 9 / 79 | 5 / 168 | 0 / 21 | High coverage |

### Remaining focus

1. `GeminiAiChatServiceImpl` is the largest remaining near-empty service class.
2. `DoctorPatientServiceImpl` still has a meaningful instruction/line gap.
3. `SecurityService` still has the highest branch gap outside business logic.

## 18. Progress update - 2026-07-03 gemini AI chat service pass

### Implemented in this pass

| Area | Added/updated tests | Result |
|---|---|---|
| Missing API key short-circuit | `GeminiAiChatServiceImplTest` | Pass |
| Successful Gemini response with chat history | `GeminiAiChatServiceImplTest` | Pass |
| Null Gemini response fallback | `GeminiAiChatServiceImplTest` | Pass |
| Empty candidates and empty parts fallbacks | `GeminiAiChatServiceImplTest` | Pass |
| Invalid response shape parse fallback | `GeminiAiChatServiceImplTest` | Pass |
| WebClient exception failure response | `GeminiAiChatServiceImplTest` | Pass |

### Verification

| Command | Result |
|---|---|
| `mvn -f backend/pom.xml -q -Dtest=GeminiAiChatServiceImplTest test` | Pass |
| `mvn -f backend/pom.xml -q verify` | 595 tests, 0 failures, 0 errors; JaCoCo report regenerated |

### Coverage after this pass

Source: regenerated `backend/target/site/jacoco/jacoco.csv`.

| Class | Instruction missed/covered | Branch missed/covered | Line missed/covered | Method missed/covered | Status |
|---|---:|---:|---:|---:|---|
| `GeminiAiChatServiceImpl` | 2 / 206 | 4 / 16 | 0 / 52 | 0 / 4 | Almost complete |
| `ClinicalAnalyticsServiceImpl` | 0 / 141 | 0 / 18 | 0 / 31 | 0 / 3 | Complete |
| `PatientPrescriptionServiceImpl` | 0 / 351 | 1 / 13 | 0 / 97 | 0 / 15 | Almost complete |

### Remaining focus

1. `DoctorPatientServiceImpl` remains the next service target with missed mapping and trend branches.
2. `SecurityService` still has the highest branch gap outside business logic.
3. `ClinicPatientServiceImpl` has branch gaps, but line coverage is already high.

## 19. Progress update - 2026-07-03 doctor patient service pass

### Implemented in this pass

| Area | Added/updated tests | Result |
|---|---|---|
| Monitoring count repository path | `DoctorPatientServiceImplTest` | Pass |
| Daily metric trend averaging, rounding, and missing-day boundary | `DoctorPatientServiceImplTest` | Pass |
| Latest glucose, blood pressure, heart rate, SpO2 mapping | `DoctorPatientServiceImplTest` | Pass |
| Health trend branches: increasing, decreasing, high-stable, normal-stable, fallback | `DoctorPatientServiceImplTest` | Pass |
| Metric repository exceptions falling back to safe display defaults | `DoctorPatientServiceImplTest` | Pass |
| Patient detail history mapping for prescriptions and appointments | `DoctorPatientServiceImplTest` | Pass |
| Adherence boundaries: no schedules, partial adherence, repository exception | `DoctorPatientServiceImplTest` | Pass |

### Verification

| Command | Result |
|---|---|
| `mvn -f backend/pom.xml -q -Dtest=DoctorPatientServiceImplTest test` | Pass |
| `mvn -f backend/pom.xml -q verify` | 603 tests, 0 failures, 0 errors; JaCoCo report regenerated |

### Coverage after this pass

Source: regenerated `backend/target/site/jacoco/jacoco.csv`.

| Class | Instruction missed/covered | Branch missed/covered | Line missed/covered | Method missed/covered | Status |
|---|---:|---:|---:|---:|---|
| `DoctorPatientServiceImpl` | 1 / 746 | 2 / 32 | 0 / 199 | 0 / 18 | Almost complete |
| `GeminiAiChatServiceImpl` | 2 / 206 | 4 / 16 | 0 / 52 | 0 / 4 | Almost complete |
| `ClinicalAnalyticsServiceImpl` | 0 / 141 | 0 / 18 | 0 / 31 | 0 / 3 | Complete |

### Remaining focus

1. `SecurityService` is now the clearest remaining branch target: 42 missed branches and 15 missed lines.
2. `ClinicPatientServiceImpl` still has 37 missed branches despite strong line coverage.
3. `PatientHealthMetricServiceImpl` still has 9 missed branches and 5 missed lines.

## 20. Progress update - 2026-07-03 security service pass

### Implemented in this pass

| Area | Added/updated tests | Result |
|---|---|---|
| `canAccessPatient` unauthenticated, null role, missing patient, unknown role | `SecurityServiceTest` | Pass |
| `canAccessPatient` admin bypass without repository lookup | `SecurityServiceTest` | Pass |
| Clinic manager same/mismatched/null clinic access | `SecurityServiceTest` | Pass |
| Doctor same/mismatched/null clinic access | `SecurityServiceTest` | Pass |
| Patient self vs other patient access | `SecurityServiceTest` | Pass |
| `isClinicManagerOf` admin, manager, null-role, null-clinic, mismatch, rejected role branches | `SecurityServiceTest` | Pass |
| `isDoctorOfClinic` admin, doctor, null-role, null-clinic, mismatch, rejected role branches | `SecurityServiceTest` | Pass |
| `isDoctorSelf` matching, null id, mismatch, non-doctor, missing user branches | `SecurityServiceTest` | Pass |

### Verification

| Command | Result |
|---|---|
| `mvn -f backend/pom.xml -q -Dtest=SecurityServiceTest test` | Pass |
| `mvn -f backend/pom.xml -q verify` | 611 tests, 0 failures, 0 errors; JaCoCo report regenerated |

### Coverage after this pass

Source: regenerated `backend/target/site/jacoco/jacoco.csv`.

| Class | Instruction missed/covered | Branch missed/covered | Line missed/covered | Method missed/covered | Status |
|---|---:|---:|---:|---:|---|
| `SecurityService` | 0 / 182 | 0 / 56 | 0 / 31 | 0 / 4 | Complete |
| `DoctorPatientServiceImpl` | 1 / 746 | 2 / 32 | 0 / 199 | 0 / 18 | Almost complete |
| `GeminiAiChatServiceImpl` | 2 / 206 | 4 / 16 | 0 / 52 | 0 / 4 | Almost complete |

### Remaining focus

1. `ClinicPatientServiceImpl` still has the largest service branch gap: 37 missed branches and 5 missed lines.
2. `PatientHealthMetricServiceImpl` has a smaller but useful gap: 9 missed branches and 5 missed lines.
3. Remaining near-complete classes such as `DoctorPatientServiceImpl`, `GeminiAiChatServiceImpl`, and `PatientPrescriptionServiceImpl` can be polished after the larger branch gaps.

## 21. Progress update - 2026-07-03 clinic patient service branch pass

### Implemented in this pass

| Area | Added/updated tests | Result |
|---|---|---|
| Duplicate doctor IDs while building clinic doctor map | `ClinicPatientServiceImplTest` | Pass |
| Null email fallback, invalid age parsing, empty assigned doctor | `ClinicPatientServiceImplTest` | Pass |
| Assigned doctor as numeric string | `ClinicPatientServiceImplTest` | Pass |
| Assigned doctor name not found | `ClinicPatientServiceImplTest` | Pass |
| Cross-clinic doctor assignment ignored | `ClinicPatientServiceImplTest` | Pass |
| Blank update request preserving optional fields and user credentials | `ClinicPatientServiceImplTest` | Pass |
| Explicit birth date and default appointment type | `ClinicPatientServiceImplTest` | Pass |
| Appointment persistence exception still saves patient | `ClinicPatientServiceImplTest` | Pass |

### Verification

| Command | Result |
|---|---|
| `mvn -f backend/pom.xml -q -Dtest=ClinicPatientServiceImplTest test` | Pass |
| `mvn -f backend/pom.xml -q verify` | 619 tests, 0 failures, 0 errors; JaCoCo report regenerated |

### Coverage after this pass

Source: regenerated `backend/target/site/jacoco/jacoco.csv`.

| Class | Instruction missed/covered | Branch missed/covered | Line missed/covered | Method missed/covered | Status |
|---|---:|---:|---:|---:|---|
| `ClinicPatientServiceImpl` | 1 / 794 | 4 / 104 | 0 / 174 | 0 / 16 | Almost complete |
| `SecurityService` | 0 / 182 | 0 / 56 | 0 / 31 | 0 / 4 | Complete |
| `DoctorPatientServiceImpl` | 1 / 746 | 2 / 32 | 0 / 199 | 0 / 18 | Almost complete |

### Remaining focus

1. `PatientHealthMetricServiceImpl` is now the largest remaining service gap: 9 missed branches and 5 missed lines.
2. `ClinicPatientServiceImpl` has only 4 missed branches left and can be polished later.
3. Near-complete classes (`DoctorPatientServiceImpl`, `GeminiAiChatServiceImpl`, `PatientPrescriptionServiceImpl`) remain small cleanup targets.

## 22. Progress update - 2026-07-03 patient health metric service completion pass

### Implemented in this pass

| Area | Added/updated tests | Result |
|---|---|---|
| High blood pressure without diastolic value | `PatientHealthMetricServiceImplTest` | Pass |
| Clinic lookup with no manager id | `PatientHealthMetricServiceImplTest` | Pass |
| Blood-pressure boundary `119/80` | `PatientHealthMetricServiceImplTest` | Pass |
| Summary trend DOWN and equal-value STABLE | `PatientHealthMetricServiceImplTest` | Pass |
| Negative change percentage formatting | `PatientHealthMetricServiceImplTest` | Pass |
| `YEAR` and `WEEK` date-range branches | `PatientHealthMetricServiceImplTest` | Pass |

### Verification

| Command | Result |
|---|---|
| `mvn -f backend/pom.xml -q -Dtest=PatientHealthMetricServiceImplTest test` | Pass |
| `mvn -f backend/pom.xml -q verify` | 621 tests, 0 failures, 0 errors; JaCoCo report regenerated |

### Coverage after this pass

Source: regenerated `backend/target/site/jacoco/jacoco.csv`.

| Class | Instruction missed/covered | Branch missed/covered | Line missed/covered | Method missed/covered | Status |
|---|---:|---:|---:|---:|---|
| `PatientHealthMetricServiceImpl` | 0 / 861 | 0 / 88 | 0 / 173 | 0 / 21 | Complete |
| `ClinicPatientServiceImpl` | 1 / 794 | 4 / 104 | 0 / 174 | 0 / 16 | Almost complete |
| `DoctorPatientServiceImpl` | 1 / 746 | 2 / 32 | 0 / 199 | 0 / 18 | Almost complete |

### Remaining focus

1. `ClinicPatientServiceImpl` still has 4 missed branches and 1 missed instruction.
2. `GeminiAiChatServiceImpl` still has 4 missed branches and 2 missed instructions.
3. `DoctorPatientServiceImpl` and `PatientPrescriptionServiceImpl` each have a tiny remaining branch gap.

## 23. Progress update - 2026-07-03 clinic patient service completion pass

### Implemented in this pass

| Area | Added/updated tests | Result |
|---|---|---|
| Update with invalid age leaves existing birth date intact | `ClinicPatientServiceImplTest` | Pass |
| Update with null email/password/avatar leaves user credentials intact | `ClinicPatientServiceImplTest` | Pass |
| Update with blank age skips birth-date recalculation | `ClinicPatientServiceImplTest` | Pass |

### Verification

| Command | Result |
|---|---|
| `mvn -f backend/pom.xml -q -Dtest=ClinicPatientServiceImplTest test` | Pass |
| `mvn -f backend/pom.xml -q verify` | 623 tests, 0 failures, 0 errors; JaCoCo report regenerated |

### Coverage after this pass

Source: regenerated `backend/target/site/jacoco/jacoco.csv`.

| Class | Instruction missed/covered | Branch missed/covered | Line missed/covered | Method missed/covered | Status |
|---|---:|---:|---:|---:|---|
| `ClinicPatientServiceImpl` | 0 / 795 | 0 / 108 | 0 / 174 | 0 / 16 | Complete |
| `PatientHealthMetricServiceImpl` | 0 / 861 | 0 / 88 | 0 / 173 | 0 / 21 | Complete |
| `SecurityService` | 0 / 182 | 0 / 56 | 0 / 31 | 0 / 4 | Complete |

### Remaining focus

1. `GeminiAiChatServiceImpl` still has 4 missed branches and 2 missed instructions.
2. `DoctorPatientServiceImpl` still has 2 missed branches and 1 missed instruction.
3. `PatientPrescriptionServiceImpl` still has 1 missed branch.

## 24. Progress update - 2026-07-03 near-complete service cleanup pass

### Implemented in this pass

| Area | Added/updated tests/code | Result |
|---|---|---|
| Doctor patient daily trend defensive branch | Simplified unreachable empty-group branch in `DoctorPatientServiceImpl` | Pass |
| Doctor patient prescription mapping null created date | `DoctorPatientServiceImplTest` | Pass |
| Patient prescription non-TAKEN existing log branch | `PatientPrescriptionServiceImplTest` | Pass |
| Gemini API-key null branch | `GeminiAiChatServiceImplTest` | Pass |
| Gemini user-history role branch | `GeminiAiChatServiceImplTest` | Pass |
| Gemini null candidates and null parts fallbacks | `GeminiAiChatServiceImplTest` | Pass |

### Verification

| Command | Result |
|---|---|
| `mvn -f backend/pom.xml -q "-Dtest=DoctorPatientServiceImplTest,PatientPrescriptionServiceImplTest,GeminiAiChatServiceImplTest" test` | Pass |
| `mvn -f backend/pom.xml -q verify` | 627 tests, 0 failures, 0 errors; JaCoCo report regenerated |

### Coverage after this pass

Source: regenerated `backend/target/site/jacoco/jacoco.csv`.

| Class | Instruction missed/covered | Branch missed/covered | Line missed/covered | Method missed/covered | Status |
|---|---:|---:|---:|---:|---|
| `DoctorPatientServiceImpl` | 0 / 744 | 0 / 32 | 0 / 199 | 0 / 18 | Complete |
| `PatientPrescriptionServiceImpl` | 0 / 351 | 0 / 14 | 0 / 97 | 0 / 15 | Complete |
| `GeminiAiChatServiceImpl` | 0 / 208 | 0 / 20 | 0 / 52 | 0 / 4 | Complete |

### Remaining focus

1. The previously listed near-complete service classes are now complete.
2. The largest remaining project gaps are still in broader service classes: `ClinicDashboardServiceImpl`, `AdminDashboardServiceImpl`, `DoctorAppointmentServiceImpl`, `PatientAppointmentServiceImpl`, `ClinicDoctorServiceImpl`.
3. Cross-cutting leftovers remain in `AuditAspect`, `JwtTokenProvider`, `AuditService`, `RateLimitFilter`, mapper/entity/util edge branches, and one repository interface row.

## 25. Progress update - 2026-07-03 GitHub sync and documentation pass

### Repository sync

| Item | Result |
|---|---|
| Pulled branch | `origin/main` |
| Latest commit after pull | `b8e485a Merge pull request #125 from DuyMinhED/feature/KCPM-843-fix-appointment-time-bva` |
| Conflict count | 1 |
| Conflict resolved | Kept upstream `CoreBusinessBvaTest.java`; restored `JiraBugSyncExtension.java` because the upstream test still uses it |
| Stash state | Temporary stash was applied and dropped |
| Unmerged files | None |

### Verification after sync

| Command | Result |
|---|---|
| `mvn -f backend/pom.xml -q verify` | 627 tests, 0 failures, 0 errors; JaCoCo report regenerated |

### Coverage snapshot after sync

Source: regenerated `backend/target/site/jacoco/jacoco.csv`.

| Package | Instruction missed/covered | Branch missed/covered | Line missed/covered | Method missed/covered | Status |
|---|---:|---:|---:|---:|---|
| `com.project.controller` | 0 / 1389 | 0 / 18 | 0 / 285 | 0 / 126 | Complete |
| `com.project.dto.response` | 0 / 72 | 0 / 0 | 0 / 30 | 0 / 7 | Complete |
| `com.project.exception` | 0 / 102 | 0 / 0 | 0 / 25 | 0 / 10 | Complete |
| `com.project.specification` | 0 / 48 | 0 / 8 | 0 / 10 | 0 / 6 | Complete |
| `com.project.service.impl` | 1016 / 11981 | 276 / 814 | 142 / 2574 | 23 / 332 | In progress |
| `com.project.security` | 55 / 438 | 1 / 63 | 20 / 102 | 2 / 24 | In progress |
| `com.project.mapper` | 4 / 565 | 8 / 80 | 2 / 143 | 0 / 11 | Almost complete |
| `com.project.util` | 4 / 164 | 1 / 23 | 1 / 36 | 1 / 11 | Almost complete |
| `com.project.config` | 10 / 302 | 5 / 9 | 1 / 58 | 0 / 18 | Almost complete |

### Highest remaining class gaps

| Class | Instruction missed | Branch missed | Line missed | Method missed |
|---|---:|---:|---:|---:|
| `ClinicDashboardServiceImpl` | 209 | 66 | 26 | 4 |
| `AdminDashboardServiceImpl` | 164 | 42 | 17 | 0 |
| `PatientAppointmentServiceImpl` | 162 | 26 | 36 | 8 |
| `DoctorAppointmentServiceImpl` | 152 | 13 | 33 | 3 |
| `ClinicDoctorServiceImpl` | 92 | 28 | 14 | 1 |
| `PatientProfileServiceImpl` | 61 | 20 | 6 | 2 |
| `AdminUserServiceImpl` | 54 | 21 | 2 | 0 |
| `AuditAspect` | 41 | 0 | 15 | 2 |

### Remaining focus

1. Continue service implementation gaps, starting with `ClinicDashboardServiceImpl`, `AdminDashboardServiceImpl`, `PatientAppointmentServiceImpl`, and `DoctorAppointmentServiceImpl`.
2. Add focused cross-cutting tests for `AuditAspect`, `JwtTokenProvider`, `RateLimitFilter`, and remaining mapper/entity/util edge branches.
3. Keep `CoreBusinessBvaTest.java` aligned with upstream BVA appointment-time rules because GitHub now includes the `KCPM-843` fix branch.
