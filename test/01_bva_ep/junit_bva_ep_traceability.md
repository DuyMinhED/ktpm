# JUnit BVA/EP Traceability Specification

## 1. Scope

This document maps the implemented backend JUnit tests to Boundary Value Analysis (BVA) and Equivalence Partitioning (EP) design items.

This file intentionally excludes Postman/API collection design. It focuses only on code-level automated tests in `backend/src/test/java`.

Latest available Surefire baseline: `635 tests, 0 failures, 0 errors, 0 skipped`. Current source contains `89` backend Java test classes.

## 2. Boundary Value Analysis Coverage

| ID | Feature | Boundary | Test data | Expected result | JUnit evidence |
|---|---|---|---|---|---|
| BVA-JUNIT-001 | Patient appointment booking | Lower bound minus one | `appointmentTime = now + 2h59m` | Business validation fails | `CoreBusinessBvaTest.testAppointmentTime_MinMinus1_TC_BVA_CORE_01` |
| BVA-JUNIT-002 | Patient appointment booking | Lower bound | `appointmentTime = now + 3h` | Appointment is created | `CoreBusinessBvaTest.testAppointmentTime_Min_TC_BVA_CORE_02` |
| BVA-JUNIT-003 | Patient appointment booking | Upper bound | `appointmentTime = now + 15d` | Appointment is created | `CoreBusinessBvaTest.testAppointmentTime_Max_TC_BVA_CORE_03` |
| BVA-JUNIT-004 | Patient appointment booking | Upper bound plus one | `appointmentTime = now + 15d + 1m` | Business validation fails | `CoreBusinessBvaTest.testAppointmentTime_MaxPlus1_TC_BVA_CORE_04` |
| BVA-JUNIT-005 | Prescription request | Minimum item count minus one | `items = []` | Validation fails: at least one medication is required | `CoreBusinessBvaTest.testPrescriptionItems_MinMinus1_TC_BVA_CORE_05` |
| BVA-JUNIT-006 | Prescription request | Minimum item count | `items.size = 1` | Validation passes | `CoreBusinessBvaTest.testPrescriptionItems_Min_TC_BVA_CORE_06` |
| BVA-JUNIT-007 | Blood sugar classification | Normal lower bound minus one | `3.9 mmol/L` | Status `LOW` | `CoreBusinessBvaTest.testBloodSugar_MinMinus1_TC_BVA_CORE_07` |
| BVA-JUNIT-008 | Blood sugar classification | Normal lower bound | `4.0 mmol/L` | Status `NORMAL` | `CoreBusinessBvaTest.testBloodSugar_Min_TC_BVA_CORE_08` |
| BVA-JUNIT-009 | Blood sugar classification | Normal upper bound | `6.0 mmol/L` | Status `NORMAL` | `CoreBusinessBvaTest.testBloodSugar_Max_TC_BVA_CORE_09` |
| BVA-JUNIT-010 | Blood sugar classification | Normal upper bound plus one | `6.1 mmol/L` | Status `BORDERLINE_HIGH` | `CoreBusinessBvaTest.testBloodSugar_MaxPlus1_TC_BVA_CORE_10` |
| BVA-JUNIT-011 | Doctor daily trend | Empty day inside range | No metric on one date in the trend window | Output keeps `null` for the missing day | `DoctorPatientServiceImplTest.getDailyMetricTrend_averagesRoundsAndKeepsEmptyDays` |
| BVA-JUNIT-012 | Doctor daily trend | Multiple values on same day | `5.11` and `5.28` | Average is rounded to `5.2` | `DoctorPatientServiceImplTest.getDailyMetricTrend_averagesRoundsAndKeepsEmptyDays` |
| BVA-JUNIT-013 | Prescription schedule | Expired schedule | `endDate = yesterday` | Remaining days is clamped to `0` | `PatientPrescriptionServiceImplTest.getTodaySchedule_mapsTakenPendingUpcomingAndRemainingDays` |
| BVA-JUNIT-014 | Prescription mapping | Null created date | `createdAt = null` | Response `createdDate = null` | `DoctorPatientServiceImplTest.getPatientDetail_adherenceRepositoryThrows_returnsZeroAndUnknownDoctor` |

## 3. Equivalence Partitioning Coverage

| ID | Feature | Partition | Representative data | Expected result | JUnit evidence |
|---|---|---|---|---|---|
| EP-JUNIT-001 | Patient prescription schedule | Schedule has taken log | Log status `TAKEN` | Today status `TAKEN`, taken time mapped | `PatientPrescriptionServiceImplTest.getTodaySchedule_mapsTakenPendingUpcomingAndRemainingDays` |
| EP-JUNIT-002 | Patient prescription schedule | Schedule has non-taken log | Log status `MISSED` | Falls through to pending/upcoming status logic | `PatientPrescriptionServiceImplTest.getTodaySchedule_mapsTakenPendingUpcomingAndRemainingDays` |
| EP-JUNIT-003 | Patient prescription schedule | Schedule has no log | No matching log for schedule | Status is `PENDING` or `UPCOMING` based on scheduled time | `PatientPrescriptionServiceImplTest.getTodaySchedule_mapsTakenPendingUpcomingAndRemainingDays` |
| EP-JUNIT-004 | Patient prescription access | Missing patient profile | Authenticated user has no patient row | `ResourceNotFoundException` | `PatientPrescriptionServiceImplTest.getCurrentPatient_patientProfileNotFound_throwsException` |
| EP-JUNIT-005 | Medication log ownership | Schedule belongs to another patient | Schedule patient id differs from current patient id | Runtime exception; no log saved | `PatientPrescriptionServiceImplTest.logMedication_unauthorizedPatient_throwsException` |
| EP-JUNIT-006 | Prescription refill | Existing prescription | Prescription id exists | Status becomes `PENDING_RENEWAL`, notification is created | `PatientPrescriptionServiceImplTest.requestRefill_success` |
| EP-JUNIT-007 | Prescription refill | Missing prescription | Prescription id does not exist | `ResourceNotFoundException`, no save/notification | `PatientPrescriptionServiceImplTest.requestRefill_prescriptionNotFound_throwsException` |
| EP-JUNIT-008 | Doctor patient detail | Doctor exists | Prescription doctor id resolves to user | Doctor name is mapped | `DoctorPatientServiceImplTest.getPatientDetail_mapsHistoryAndCalculatesPartialAdherence` |
| EP-JUNIT-009 | Doctor patient detail | Doctor missing | Prescription doctor id does not resolve | Doctor name falls back to `N/A` | `DoctorPatientServiceImplTest.getPatientDetail_adherenceRepositoryThrows_returnsZeroAndUnknownDoctor` |
| EP-JUNIT-010 | AI chat configuration | API key missing | `apiKey = null` or blank | Failure response, WebClient is not called | `GeminiAiChatServiceImplTest.chat_nullApiKey`, `chat_missingApiKey` |
| EP-JUNIT-011 | AI chat history role | User role | History role is `user` | Role remains `user` in Gemini payload | `GeminiAiChatServiceImplTest.chat_successWithUserHistoryRole` |
| EP-JUNIT-012 | AI chat history role | Non-user role | History role is `assistant` | Role maps to `model` in Gemini payload | `GeminiAiChatServiceImplTest.chat_successWithHistory` |
| EP-JUNIT-013 | AI chat Gemini response | Valid response | candidates/content/parts/text exists | Success reply is returned | `GeminiAiChatServiceImplTest.chat_successWithHistory` |
| EP-JUNIT-014 | AI chat Gemini response | Empty/null candidates | `candidates = null` or `[]` | Fallback reply is returned | `GeminiAiChatServiceImplTest.chat_nullCandidates`, `chat_emptyCandidates` |
| EP-JUNIT-015 | AI chat Gemini response | Empty/null parts | `parts = null` or `[]` | Fallback reply is returned | `GeminiAiChatServiceImplTest.chat_nullParts`, `chat_emptyParts` |
| EP-JUNIT-016 | AI chat transport | WebClient throws | `Mono.error(new RuntimeException(...))` | Failure response contains error message | `GeminiAiChatServiceImplTest.chat_webClientThrows` |

## 4. Design Notes

- These cases are white-box/code-aware designs, so expected results follow the current service code, not an external Postman collection.
- `page=0` should be treated as valid for current backend pagination because Spring `PageRequest.of(page, size)` is zero-based.
- Appointment-time tests should use fixed/mocked time or values far enough from the tolerance window to avoid flaky results.
- Frontend password validation and backend password validation are not identical; this mismatch should be tracked as a product/design gap.

## 5. Implementation Status

| Area | Status | Evidence |
|---|---|---|
| Core BVA rows `BVA-JUNIT-001..010` | Implemented | `CoreBusinessBvaTest` currently has 11 test methods, including nested prescription item validation. |
| Additional BVA rows `BVA-JUNIT-011..014` | Implemented | `DoctorPatientServiceImplTest` and `PatientPrescriptionServiceImplTest`. |
| EP rows `EP-JUNIT-001..016` | Implemented | `PatientPrescriptionServiceImplTest`, `DoctorPatientServiceImplTest`, `GeminiAiChatServiceImplTest`. |
| Pagination BVA referenced elsewhere | Implemented separately | `PaginationBvaTest`. |
| Frontend/backend mismatch rows | Follow-up | These are tracked in frontend/API docs, not this JUnit traceability file. |

