# Frontend To Backend Test Design Traceability

## 1. Scope

This document links frontend E2E design scenarios to backend JUnit/API behavior that has already been tested. It intentionally excludes Postman collection design.

## 2. Traceability Matrix

| Frontend flow | UI partition / boundary | Backend expected behavior | Backend/JUnit evidence |
|---|---|---|---|
| Login and route guard | Valid account by role | Authenticated role can access its own dashboard | `AdminControllerSecurityIntegrationTest`, `DoctorControllerSecurityIntegrationTest`, `PatientProfileControllerSecurityIntegrationTest` |
| Admin creates user | Valid user data; invalid email/password/status | Valid user is created; invalid DTO fields fail validation | `CreateUserRequestValidationTest`, `UpdateUserRequestValidationTest`, `AdminUserServiceImplTest` |
| Clinic manager manages patients | Valid create/update; duplicate email; doctor assignment variants | Patient is created/updated; duplicate rejected; assignment rules enforced | `ClinicPatientServiceImplTest` |
| Patient records health metric | Metric threshold boundaries | Metric is saved and classified correctly | `PatientHealthMetricServiceImplTest`, `CoreBusinessBvaTest` |
| Patient books appointment | `now+2h59m`, `now+3h`, `now+15d`, `now+15d+1m` | Lower and upper appointment bounds are enforced | `CoreBusinessBvaTest`, `PatientAppointmentServiceImplTest` |
| Patient views prescriptions/schedule | Taken, missed, pending, upcoming, expired/open-ended schedules | Today status and remaining days are mapped correctly | `PatientPrescriptionServiceImplTest` |
| Doctor views patient detail | Patient metrics/history/adherence partitions | Detail response contains metrics, prescriptions, appointments, and adherence rate | `DoctorPatientServiceImplTest` |
| AI assistant | API key missing, valid response, empty response, transport error | UI should show fail/fallback/success states consistently | `GeminiAiChatServiceImplTest`, `AiChatControllerTest` |

## 3. Evidence Checklist For E2E Runs

- [ ] Record backend commit and frontend commit used for the run.
- [ ] Attach backend verification evidence: `mvn -f backend/pom.xml -q verify`.
- [ ] Attach JaCoCo report evidence from `backend/target/site/jacoco/index.html`.
- [ ] For failed E2E cases, link screenshot/log evidence to one row in the traceability matrix above.
- [ ] If UI behavior conflicts with backend validation, record it as a product mismatch. Current known mismatch: frontend password minimum length may differ from backend minimum length.

