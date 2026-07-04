# WHITE-BOX GRAPH SPEC - PATIENT MODULE

## 1. Pham vi

| Class | Method | Ly do chon |
|---|---|---|
| `PatientAppointmentServiceImpl` | `create` | Tao lich co validation thoi gian, clinic fallback, doctor notification |
| `PatientAppointmentServiceImpl` | `cancel` | Co ownership check, status guard, try/catch bao loi |
| `PatientHealthMetricServiceImpl` | `processAndSave` | Xu ly metric, risk level, notification doctor/clinic/patient |
| `PatientHealthMetricServiceImpl` | `evaluateStatus` | Switch theo `MetricType`, nhieu nguong bien |
| `PatientHealthMetricServiceImpl` | `delete` | Ownership check va soft delete |

---

## 2. `PatientAppointmentServiceImpl.create`

### 2.1 Decision/condition

| ID | Code point | True branch | False/exception branch |
|---|---|---|---|
| D1 | Current patient resolve | Co patient | NX: user/patient not found |
| D2 | `appointmentTime != null` | Check lower/upper bound | Bo qua validation thoi gian |
| D3 | `appointmentTime.isBefore(now.plusHours(3))` | NX: qua som | Tiep tuc |
| D4 | `appointmentTime.isAfter(now.plusDays(15))` | NX: qua xa | Tiep tuc |
| D5 | `patient.getClinicId() != null` | Resolve clinic | Dung fallback location |
| D6 | Clinic lookup throws | Catch/log, dung fallback | Tiep tuc kiem tra clinic |
| D7 | `clinic != null && clinic.name != null` | Lay ten clinic | Dung fallback |
| D8 | `appointmentType == IN_PERSON` | Set location | location null |
| D9 | `appointmentType == ONLINE` | Set meeting link | meetingLink null |
| D10 | `doctor != null` | Gui notification | Khong gui |

### 2.2 CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Resolve current patient]
    NX([Exception exit])
    N3{appointmentTime != null?}
    N4{time < now + 3h?}
    N5{time > now + 15d?}
    N6[Find doctor or null]
    N7[Set fallback location]
    N8{patient.clinicId != null?}
    N9[Find clinic]
    N10{clinic != null and name != null?}
    N11[finalLocation = clinic.name]
    N12[Catch clinic exception]
    N13[Build appointment]
    N14{type == IN_PERSON?}
    N15[Set location]
    N16{type == ONLINE?}
    N17[Set meetingLink]
    N18[Save appointment]
    N19{doctor != null?}
    N20[Send notification]
    N21[Map response]
    NE([Return])

    N1 --> N2
    N2 --> N3
    N2 -. not authenticated/profile missing .-> NX
    N3 -- Yes --> N4
    N3 -- No --> N6
    N4 -- Yes --> NX
    N4 -- No --> N5
    N5 -- Yes --> NX
    N5 -- No --> N6
    N6 --> N7 --> N8
    N8 -- No --> N13
    N8 -- Yes --> N9
    N9 --> N10
    N9 -. exception .-> N12
    N10 -- Yes --> N11 --> N13
    N10 -- No --> N13
    N12 --> N13
    N13 --> N14
    N14 -- Yes --> N15
    N14 -- No --> N15
    N15 --> N16
    N16 -- Yes --> N17
    N16 -- No --> N17
    N17 --> N18 --> N19
    N19 -- Yes --> N20 --> N21
    N19 -- No --> N21
    N21 --> NE
```

### 2.3 Cyclomatic Complexity

| Metric | Value |
|---|---:|
| Nodes `N` | 23 |
| Edges `E` | 33 |
| Components `P` | 1 |
| `V(G)` | `33 - 23 + 2 = 12` |

Decision cross-check: 10 decision/error branches + 1 base path = about 11-12 paths depending whether `getCurrentPatient` is expanded. This spec expands it as an exception edge, so `V(G)=12`.

### 2.4 Independent paths

| Path | Noi dung |
|---|---|
| P1 | Patient resolve fail -> exception |
| P2 | appointmentTime qua som -> exception |
| P3 | appointmentTime qua xa -> exception |
| P4 | appointmentTime null, khong clinic, khong doctor |
| P5 | Valid time, co clinic hop le, IN_PERSON, co doctor |
| P6 | Valid time, co clinic nhung lookup exception |
| P7 | Valid time, co clinic nhung clinic/name null |
| P8 | ONLINE, co doctor, meeting link mac dinh |
| P9 | Appointment type khac IN_PERSON/ONLINE |
| P10 | Doctor null, khong gui notification |

### 2.5 Basis path test case

| TC | Path | Input/fixture | Expected |
|---|---|---|---|
| TC-WB-PAT-APPT-01 | P1 | SecurityUtils empty hoac patient missing | Throw `ResourceNotFoundException`, khong save |
| TC-WB-PAT-APPT-02 | P2 | `appointmentTime = now + 2h59m` | Throw business error lower bound |
| TC-WB-PAT-APPT-03 | P3 | `appointmentTime = now + 15d + 1m` | Throw business error upper bound |
| TC-WB-PAT-APPT-04 | P4/P10 | Patient clinic null, doctor missing | Save `PENDING`, no notification |
| TC-WB-PAT-APPT-05 | P5 | Clinic co name, type `IN_PERSON`, doctor exists | Location = clinic name, notify doctor |
| TC-WB-PAT-APPT-06 | P6 | Clinic repository throws | Save with fallback location |
| TC-WB-PAT-APPT-07 | P8 | Type `ONLINE` | meetingLink default, location null |
| TC-WB-PAT-APPT-08 | P9 | Type `HOME_VISIT` | Save with null location/link; note validation gap |

---

## 3. `PatientAppointmentServiceImpl.cancel`

### 3.1 Decision/condition

| ID | Condition | True branch | False branch |
|---|---|---|---|
| D1 | current patient exists | Continue | Catch/rethrow runtime |
| D2 | appointment exists | Continue | Catch/rethrow runtime |
| D3 | appointment belongs to patient | Continue | Throw unauthorized |
| D4 | status == COMPLETED | Throw cannot cancel | Continue |
| D5 | status == SCHEDULED | Throw cannot self-cancel | Continue |
| D6 | any exception in try | Wrap with system error | Normal save |

### 3.2 CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Try resolve current patient]
    N3[Find appointment by id]
    N4{Owner matches?}
    N5{Status COMPLETED?}
    N6{Status SCHEDULED?}
    N7[Set CANCELLED]
    N8[saveAndFlush]
    N9([Return])
    NX[Catch Exception and throw RuntimeException]

    N1 --> N2 --> N3 --> N4
    N2 -. exception .-> NX
    N3 -. not found .-> NX
    N4 -- No --> NX
    N4 -- Yes --> N5
    N5 -- Yes --> NX
    N5 -- No --> N6
    N6 -- Yes --> NX
    N6 -- No --> N7 --> N8 --> N9
```

### 3.3 CC va path

| Metric | Value |
|---|---:|
| Nodes `N` | 10 |
| Edges `E` | 15 |
| `V(G)` | `15 - 10 + 2 = 7` |

| Path | Expected test |
|---|---|
| P1 | current patient missing |
| P2 | appointment not found |
| P3 | appointment cua patient khac |
| P4 | appointment COMPLETED |
| P5 | appointment SCHEDULED |
| P6 | appointment PENDING -> CANCELLED |
| P7 | repository save throws -> wrapped system error |

---

## 4. `PatientHealthMetricServiceImpl.processAndSave`

### 4.1 Decision/condition

| ID | Condition | True branch | False branch |
|---|---|---|---|
| D1 | `MetricType.valueOf` valid | Continue | `IllegalArgumentException` |
| D2 | `request.unit != null` | Use request unit | Use default unit |
| D3 | `measuredAt != null` | Use request time | Use now |
| D4 | status HIGH or LOW | Update patient risk and alert | Check NORMAL branch |
| D5 | `patient.doctorId != null` | Notify doctor/clinic/patient | Only patient risk saved |
| D6 | clinic exists | Check manager | Skip clinic notification |
| D7 | `clinic.managerId != null` | Notify manager | Skip manager notification |
| D8 | status NORMAL | Maybe stabilize patient | No risk transition |
| D9 | patient risk HIGH_RISK | Set STABLE | Leave current risk |
| D10 | `valueSecondary != null` | Include secondary value | Only primary value |

### 4.2 CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Parse MetricType]
    NX([Exception exit])
    N3[Evaluate status]
    N4[Build metric]
    N5[Save metric]
    N6{status HIGH or LOW?}
    N7[Set patient HIGH_RISK and save]
    N8{doctorId != null?}
    N9[Send doctor notification]
    N10[Find clinic]
    N11{clinic.managerId != null?}
    N12[Send clinic manager notification]
    N13[Create PatientAlert]
    N14{status NORMAL?}
    N15{patient risk HIGH_RISK?}
    N16[Set STABLE and save]
    N17[Map response]
    NE([Return])

    N1 --> N2
    N2 -. invalid enum .-> NX
    N2 --> N3 --> N4 --> N5 --> N6
    N6 -- Yes --> N7 --> N8
    N8 -- Yes --> N9 --> N10
    N8 -- No --> N17
    N10 --> N11
    N10 -. clinic missing .-> N13
    N11 -- Yes --> N12 --> N13
    N11 -- No --> N13
    N13 --> N17
    N6 -- No --> N14
    N14 -- Yes --> N15
    N14 -- No --> N17
    N15 -- Yes --> N16 --> N17
    N15 -- No --> N17
    N17 --> NE
```

### 4.3 CC va basis paths

| Metric | Value |
|---|---:|
| Nodes `N` | 19 |
| Edges `E` | 27 |
| `V(G)` | `27 - 19 + 2 = 10` |

| TC | Path | Expected |
|---|---|---|
| TC-WB-HM-PROC-01 | Invalid metric type | Throw `IllegalArgumentException` |
| TC-WB-HM-PROC-02 | HIGH/LOW, doctor null | Patient risk set HIGH_RISK, no notification |
| TC-WB-HM-PROC-03 | HIGH/LOW, doctor exists, clinic manager exists | Send doctor + manager + patient alert |
| TC-WB-HM-PROC-04 | HIGH/LOW, clinic missing/no manager | Send doctor + patient alert only |
| TC-WB-HM-PROC-05 | NORMAL and patient HIGH_RISK | Patient risk becomes STABLE |
| TC-WB-HM-PROC-06 | NORMAL and patient not HIGH_RISK | No risk update |
| TC-WB-HM-PROC-07 | BORDERLINE_* | Save metric, no risk transition |
| TC-WB-HM-PROC-08 | unit null/measuredAt null | Default unit/time |
| TC-WB-HM-PROC-09 | secondary value present | Message contains `primary/secondary` |

---

## 5. `PatientHealthMetricServiceImpl.evaluateStatus`

### 5.1 Status partition

| MetricType | Branches |
|---|---|
| `BLOOD_SUGAR` | `<4 LOW`, `<=6 NORMAL`, `<=7.2 BORDERLINE_HIGH`, `>7.2 HIGH` |
| `BLOOD_PRESSURE` | `<120 && <80 NORMAL`, `<=sysThreshold && <=diaThreshold BORDERLINE_HIGH`, otherwise HIGH |
| `HEART_RATE` | `60..threshold NORMAL`, `<60 LOW`, `>threshold HIGH` |
| `HBA1C` | `<5.7 NORMAL`, `<=6.4 BORDERLINE_HIGH`, `>6.4 HIGH` |
| `SPO2` | `>=threshold NORMAL`, `>=90 BORDERLINE_LOW`, `<90 LOW` |

### 5.2 CFG rut gon

```mermaid
flowchart TD
    N1([Start])
    N2[Load SystemConfig or null]
    N3{MetricType}
    BS{Blood sugar ranges}
    BP{Blood pressure ranges}
    HR{Heart rate ranges}
    HBA{HbA1c ranges}
    SPO{SpO2 ranges}
    RLOW([LOW])
    RN([NORMAL])
    RBH([BORDERLINE_HIGH])
    RBL([BORDERLINE_LOW])
    RH([HIGH])

    N1 --> N2 --> N3
    N3 --> BS
    N3 --> BP
    N3 --> HR
    N3 --> HBA
    N3 --> SPO
    BS --> RLOW
    BS --> RN
    BS --> RBH
    BS --> RH
    BP --> RN
    BP --> RBH
    BP --> RH
    HR --> RN
    HR --> RLOW
    HR --> RH
    HBA --> RN
    HBA --> RBH
    HBA --> RH
    SPO --> RN
    SPO --> RBL
    SPO --> RLOW
```

### 5.3 Boundary test data

| Metric | Values |
|---|---|
| BLOOD_SUGAR | `3.9`, `4.0`, `6.0`, `6.1`, `7.2`, `7.3` |
| BLOOD_PRESSURE | `119/79`, `120/80`, threshold, threshold + 1 |
| HEART_RATE | `59`, `60`, threshold, threshold + 1 |
| HBA1C | `5.6`, `5.7`, `6.4`, `6.5` |
| SPO2 | threshold, threshold - 1, `90`, `89` |

---

## 6. `PatientHealthMetricServiceImpl.delete`

```mermaid
flowchart TD
    N1([Start])
    N2[Resolve current patient]
    N3[Find metric by id]
    N4{metric.patient.id == currentPatient.id?}
    N5[metric.deleted = true]
    N6[Save metric]
    NE([Return])
    NX([Exception exit])

    N1 --> N2 --> N3 --> N4
    N2 -. missing auth/profile .-> NX
    N3 -. not found .-> NX
    N4 -- No --> NX
    N4 -- Yes --> N5 --> N6 --> NE
```

| Path | Expected |
|---|---|
| P1 | Missing current patient -> exception |
| P2 | Metric not found -> `ResourceNotFoundException` |
| P3 | Metric belongs to another patient -> `AccessDeniedException` |
| P4 | Owner metric -> soft delete and save |

---

## 7. `PatientAppointmentServiceImpl.toggleReminder`

```mermaid
flowchart TD
    N1([Start])
    N2[Resolve current patient]
    N3[Find appointment by id]
    NX([Exception exit])
    N4{appointment.patient.id == currentPatient.id?}
    N5[Set reminderEnabled]
    N6[saveAndFlush]
    NE([Return])

    N1 --> N2 --> N3 --> N4
    N2 -. missing auth/profile .-> NX
    N3 -. not found .-> NX
    N4 -- No --> NX
    N4 -- Yes --> N5 --> N6 --> NE
```

| Path | Expected |
|---|---|
| P1 | Missing current patient -> exception |
| P2 | Appointment not found -> `ResourceNotFoundException` |
| P3 | Appointment belongs to another patient -> unauthorized |
| P4 | Owner appointment -> reminder flag saved |

---

## 8. `PatientPrescriptionServiceImpl.getTodaySchedule`

### 8.1 CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Resolve current patient]
    NX([Exception exit])
    N3[Build today time range]
    N4[Load active schedules]
    N5[Load today logs]
    N6{{For each schedule}}
    N7[Find matching log]
    N8{log exists and status TAKEN?}
    N9[status = TAKEN, takenAt = log time]
    N10{scheduledTime before now?}
    N11[status = PENDING]
    N12[status = UPCOMING]
    N13{endDate != null?}
    N14[remainingDays = days between now and endDate]
    N15{remainingDays < 0?}
    N16[remainingDays = 0]
    N17[Build schedule response]
    N18{{Next schedule}}
    NE([Return list])

    N1 --> N2
    N2 -. missing auth/profile .-> NX
    N2 --> N3 --> N4 --> N5 --> N6 --> N7 --> N8
    N8 -- Yes --> N9 --> N13
    N8 -- No --> N10
    N10 -- Yes --> N11 --> N13
    N10 -- No --> N12 --> N13
    N13 -- Yes --> N14 --> N15
    N13 -- No --> N17
    N15 -- Yes --> N16 --> N17
    N15 -- No --> N17
    N17 --> N18
    N18 --> N6
    N18 --> NE
```

### 8.2 Basis paths

| Path | Expected |
|---|---|
| P1 | Current patient missing -> exception |
| P2 | Matching TAKEN log -> status `TAKEN`, `takenAt` populated |
| P3 | No taken log and schedule time before now -> status `PENDING` |
| P4 | No taken log and schedule time after now -> status `UPCOMING` |
| P5 | `endDate` null -> remainingDays `0` |
| P6 | `endDate` in future -> positive remainingDays |
| P7 | `endDate` in past -> remainingDays clamped to `0` |

---

## 9. `PatientPrescriptionServiceImpl.logMedication`

```mermaid
flowchart TD
    N1([Start])
    N2[Resolve current patient]
    N3[Find medication schedule]
    NX([Exception exit])
    N4{schedule.patient.id == patient.id?}
    N5[Build MedicationLog]
    N6[Save log]
    NE([Return])

    N1 --> N2
    N2 -. missing auth/profile .-> NX
    N2 --> N3
    N3 -. not found .-> NX
    N3 --> N4
    N4 -- No --> NX
    N4 -- Yes --> N5 --> N6 --> NE
```

| Path | Expected |
|---|---|
| P1 | Patient missing -> exception |
| P2 | Schedule not found -> `ResourceNotFoundException` |
| P3 | Schedule belongs to another patient -> unauthorized |
| P4 | Owner schedule -> medication log saved |

---

## 10. `PatientPrescriptionServiceImpl.requestRefill`

```mermaid
flowchart TD
    N1([Start])
    N2[Find prescription by id]
    NX([Exception exit])
    N3[Set status PENDING_RENEWAL]
    N4[Save prescription]
    N5[Build doctor notification]
    N6[Save notification]
    NE([Return])

    N1 --> N2
    N2 -. not found .-> NX
    N2 --> N3 --> N4 --> N5 --> N6 --> NE
```

| Path | Expected |
|---|---|
| P1 | Prescription missing -> `ResourceNotFoundException` |
| P2 | Prescription found -> status updated and doctor notified |

---

## 11. `PatientProfileServiceImpl.updateProfile`

### 11.1 CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Resolve current patient]
    NX([Exception exit])
    N3[Set direct profile fields]
    N4{dateOfBirth != null?}
    N5[Set dateOfBirth]
    N6{avatarUrl has text?}
    N7[Set avatarUrl]
    N8[Find linked user]
    N9{user exists?}
    N10{patient.email has text?}
    N11[Set user.email]
    N12{patient.fullName != null?}
    N13[Set user.fullName]
    N14{patient.phone != null?}
    N15[Set user.phone]
    N16{patient.avatarUrl != null?}
    N17[Set user.avatarUrl]
    N18[Save user]
    N19[Save patient]
    N20[Map profile response]
    NE([Return])

    N1 --> N2
    N2 -. missing auth/profile .-> NX
    N2 --> N3 --> N4
    N4 -- Yes --> N5 --> N6
    N4 -- No --> N6
    N6 -- Yes --> N7 --> N8
    N6 -- No --> N8
    N8 --> N9
    N9 -- No --> N19
    N9 -- Yes --> N10
    N10 -- Yes --> N11 --> N12
    N10 -- No --> N12
    N12 -- Yes --> N13 --> N14
    N12 -- No --> N14
    N14 -- Yes --> N15 --> N16
    N14 -- No --> N16
    N16 -- Yes --> N17 --> N18
    N16 -- No --> N18
    N18 --> N19
    N19 --> N20 --> NE
```

### 11.2 Basis paths

| Path | Expected |
|---|---|
| P1 | Current patient missing -> exception |
| P2 | DOB/avatar absent -> direct fields only |
| P3 | DOB/avatar present -> patient fields updated |
| P4 | Linked user missing -> only patient saved |
| P5 | Linked user exists with email/name/phone/avatar -> user synced |
| P6 | Email blank -> user email not overwritten |

---

## 12. `PatientProfileServiceImpl.mapToProfileResponse`

```mermaid
flowchart TD
    N1([Start])
    N2{dateOfBirth != null?}
    N3[Calculate age]
    N4[age = 0]
    N5[Load emergency contacts]
    N6{primary contact exists?}
    N7[Use primary contact]
    N8{any contact exists?}
    N9[Use first contact]
    N10[emergencyContact = null]
    N11{medicalHistory has text?}
    N12[Split medicalHistory]
    N13{clinicalNotes has text?}
    N14[Use clinicalNotes list]
    N15[Use empty chronicDiseases]
    N16{allergies has text?}
    N17[Split allergies]
    N18[Use empty allergies]
    N19[Load active prescription medication names]
    N20[Build response]
    NE([Return])

    N1 --> N2
    N2 -- Yes --> N3 --> N5
    N2 -- No --> N4 --> N5
    N5 --> N6
    N6 -- Yes --> N7 --> N11
    N6 -- No --> N8
    N8 -- Yes --> N9 --> N11
    N8 -- No --> N10 --> N11
    N11 -- Yes --> N12 --> N16
    N11 -- No --> N13
    N13 -- Yes --> N14 --> N16
    N13 -- No --> N15 --> N16
    N16 -- Yes --> N17 --> N19
    N16 -- No --> N18 --> N19
    N19 --> N20 --> NE
```

| Path | Expected |
|---|---|
| P1 | DOB present -> age calculated |
| P2 | DOB null -> age `0` |
| P3 | Primary emergency contact exists -> use primary |
| P4 | No primary but contact exists -> use first |
| P5 | No contacts -> emergencyContact null |
| P6 | medicalHistory text -> split list |
| P7 | no medicalHistory but clinicalNotes text -> one-item list |
| P8 | allergies text -> split list |

---

## 13. `PatientProfileServiceImpl.addEmergencyContact`

```mermaid
flowchart TD
    N1([Start])
    N2[Resolve current patient]
    NX([Exception exit])
    N3[Build EmergencyContact from request]
    N4[Save contact]
    N5[Map emergency contact response]
    NE([Return])

    N1 --> N2
    N2 -. missing auth/profile .-> NX
    N2 --> N3 --> N4 --> N5 --> NE
```

| Path | Expected |
|---|---|
| P1 | Current patient missing -> exception |
| P2 | Current patient exists -> contact saved and response returned |

---

## 14. `PatientProfileServiceImpl.updateEmergencyContact`

```mermaid
flowchart TD
    N1([Start])
    N2[Find emergency contact by id]
    NX([Exception exit])
    N3[Set contactName]
    N4[Set relationship]
    N5[Set phone]
    N6[Set primary flag]
    N7[Save contact]
    N8[Map emergency contact response]
    NE([Return])

    N1 --> N2
    N2 -. not found .-> NX
    N2 --> N3 --> N4 --> N5 --> N6 --> N7 --> N8 --> NE
```

| Path | Expected |
|---|---|
| P1 | Contact not found -> `ResourceNotFoundException` |
| P2 | Contact found -> all fields updated and saved |
