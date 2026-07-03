# Backend Service White-Box Test Design Specification

## 1. Scope

This document records the service-level white-box test design implemented in JUnit/Mockito. It does not cover Postman scripts or Postman collections.

Verification baseline: `mvn -f backend/pom.xml -q verify` passed with `627 tests, 0 failures, 0 errors`.

## 2. Branch And Path Design

| Target class | Decision / path | Test data | Expected result | JUnit evidence |
|---|---|---|---|---|
| `DoctorPatientServiceImpl` | Daily trend date has metrics | Metrics for today and two days ago | Result contains rounded daily averages | `getDailyMetricTrend_averagesRoundsAndKeepsEmptyDays` |
| `DoctorPatientServiceImpl` | Daily trend date has no metrics | No metric for middle date | Result contains `null` for that date | `getDailyMetricTrend_averagesRoundsAndKeepsEmptyDays` |
| `DoctorPatientServiceImpl` | Latest glucose/BP/heart rate/SpO2 exists | Each latest metric repository returns value | Response contains formatted latest values | `getMyPatients_mapsLatestMetricBranchesAndIncreasingTrend` |
| `DoctorPatientServiceImpl` | Blood pressure secondary missing | BP has systolic only | Response uses `?` for diastolic | `getMyPatients_mapsDecreasingTrendAndMissingBloodPressureSecondary` |
| `DoctorPatientServiceImpl` | Metric repository throws | Repository methods throw runtime exception | Display values fall back to `N/A`; trend color fallback | `getMyPatients_metricRepositoriesThrow_fallsBackToDefaults` |
| `DoctorPatientServiceImpl` | Health trend increasing/decreasing/stable | Latest and previous glucose values vary | Trend color follows branch rule | `getMyPatients_mapsLatestMetricBranchesAndIncreasingTrend`, `getMyPatients_mapsDecreasingTrendAndMissingBloodPressureSecondary`, `getMyPatients_mapsStableHighAndNormalTrendBoundaries` |
| `DoctorPatientServiceImpl` | Adherence partial / empty / error | Taken/missed logs; no schedules; repository exception | Partial rate, `100.0`, or `0.0` | `getPatientDetail_*` tests |
| `PatientPrescriptionServiceImpl` | Today schedule with taken log | Matching log status `TAKEN` | Status `TAKEN`, taken time mapped | `getTodaySchedule_mapsTakenPendingUpcomingAndRemainingDays` |
| `PatientPrescriptionServiceImpl` | Today schedule with non-taken log | Matching log status `MISSED` | Status follows time-based pending/upcoming branch | `getTodaySchedule_mapsTakenPendingUpcomingAndRemainingDays` |
| `PatientPrescriptionServiceImpl` | Today schedule without log | No matching log | Status follows scheduled-time branch | `getTodaySchedule_mapsTakenPendingUpcomingAndRemainingDays` |
| `PatientPrescriptionServiceImpl` | Log medication unauthorized | Schedule belongs to another patient | Runtime exception; no save | `logMedication_unauthorizedPatient_throwsException` |
| `PatientPrescriptionServiceImpl` | Refill missing/present | Missing id and existing id | Missing throws; existing updates status and creates notification | `requestRefill_prescriptionNotFound_throwsException`, `requestRefill_success` |
| `GeminiAiChatServiceImpl` | API key null/blank | `apiKey = null` or blank | Failure response; no WebClient call | `chat_nullApiKey`, `chat_missingApiKey` |
| `GeminiAiChatServiceImpl` | History role user/non-user | `role=user`, `role=assistant` | User role remains; non-user maps to model | `chat_successWithUserHistoryRole`, `chat_successWithHistory` |
| `GeminiAiChatServiceImpl` | Candidates null/empty | `candidates = null` or `[]` | Fallback reply | `chat_nullCandidates`, `chat_emptyCandidates` |
| `GeminiAiChatServiceImpl` | Parts null/empty | `parts = null` or `[]` | Fallback reply | `chat_nullParts`, `chat_emptyParts` |
| `GeminiAiChatServiceImpl` | Invalid shape / transport error | Bad response shape; WebClient error | Parse fallback or failure response | `chat_invalidResponseShape`, `chat_webClientThrows` |

## 3. Completed Class-Level Targets

| Class | JaCoCo status after implementation |
|---|---|
| `DoctorPatientServiceImpl` | 0 missed instructions, branches, lines, methods |
| `PatientPrescriptionServiceImpl` | 0 missed instructions, branches, lines, methods |
| `GeminiAiChatServiceImpl` | 0 missed instructions, branches, lines, methods |
| `ClinicPatientServiceImpl` | 0 missed instructions, branches, lines, methods |
| `PatientHealthMetricServiceImpl` | 0 missed instructions, branches, lines, methods |
| `SecurityService` | 0 missed instructions, branches, lines, methods |

## 4. Remaining White-Box Design Targets

| Priority | Class | Main remaining decision areas |
|---:|---|---|
| 1 | `ClinicDashboardServiceImpl` | Dashboard chart branches, empty data, appointment mapping, report fallbacks |
| 2 | `AdminDashboardServiceImpl` | Aggregate count defaults, report branches, audit-log mapping |
| 3 | `PatientAppointmentServiceImpl` | Appointment-time tolerance, cancel/toggle reminder branches |
| 4 | `DoctorAppointmentServiceImpl` | Create/update/reschedule and patient/doctor relation checks |
| 5 | `ClinicDoctorServiceImpl` | Create/update/delete, duplicate email/license, clinic ownership boundaries |

