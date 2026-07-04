# WHITE-BOX GRAPH SPEC - CLINIC VA ADMIN MODULE

## 1. Pham vi

| Nhom | Class/method |
|---|---|
| Clinic patient | `ClinicPatientServiceImpl.createPatient`, `updatePatient`, `deletePatient`, `sendNotificationToPatient`, `getDoctorId` |
| Admin user | `AdminUserServiceImpl.createUser`, `updateUser`, `deleteUser`, `toggleUserStatus`, `validatePasswordPolicy` |

---

## 2. `ClinicPatientServiceImpl.createPatient`

### 2.1 Decision/condition

| ID | Condition | True branch | False branch |
|---|---|---|---|
| D1 | email null/blank | Generate email from phone | Use request email |
| D2 | email already exists | Throw runtime | Continue |
| D3 | password null | Use default `password` | Encode request password |
| D4 | doctor id/request assigned doctor exists | Resolve doctor | No doctor assigned |
| D5 | age parse succeeds | DOB fallback uses age | DOB fallback uses 0 years |
| D6 | dateOfBirth present | Use request DOB | Use `now - age` |
| D7 | primaryCondition present | Use primaryCondition | Use condition |
| D8 | treatmentStatus present | Use request value | Default dang dieu tri |
| D9 | status present | Use request value | Default hoat dong |
| D10 | initialGlucose present | Record blood sugar baseline | Skip |
| D11 | initialBpSystolic present | Record blood pressure baseline | Skip |

### 2.2 CFG

```mermaid
flowchart TD
    N1([Start])
    N2{email blank?}
    N3[Generate email phone@care.com]
    N4{email exists?}
    NX([Exception exit])
    N5[Build and save User]
    N6[Resolve doctor id]
    N7[Parse age with fallback]
    N8[Build Patient with defaults]
    N9[Save Patient]
    N10{initialGlucose != null?}
    N11[Record BLOOD_SUGAR baseline]
    N12{initialBpSystolic != null?}
    N13[Record BLOOD_PRESSURE baseline]
    NE([Return])

    N1 --> N2
    N2 -- Yes --> N3 --> N4
    N2 -- No --> N4
    N4 -- Yes --> NX
    N4 -- No --> N5 --> N6 --> N7 --> N8 --> N9 --> N10
    N10 -- Yes --> N11 --> N12
    N10 -- No --> N12
    N12 -- Yes --> N13 --> NE
    N12 -- No --> NE
```

### 2.3 CC va basis paths

| Metric | Value |
|---|---:|
| Nodes `N` | 15 |
| Edges `E` | 19 |
| `V(G)` | `19 - 15 + 2 = 6` |

| TC | Path | Expected |
|---|---|---|
| TC-WB-CLINIC-PAT-CREATE-01 | Email blank | Generated email, user saved |
| TC-WB-CLINIC-PAT-CREATE-02 | Email duplicate | Throw runtime, no save |
| TC-WB-CLINIC-PAT-CREATE-03 | Password null | Encodes default password |
| TC-WB-CLINIC-PAT-CREATE-04 | initialGlucose present | Records blood sugar metric |
| TC-WB-CLINIC-PAT-CREATE-05 | initialBpSystolic present | Records blood pressure metric |
| TC-WB-CLINIC-PAT-CREATE-06 | age invalid and DOB missing | Uses fallback age `0` |

---

## 3. `ClinicPatientServiceImpl.updatePatient`

### 3.1 Decision/condition

| ID | Condition | True branch | False branch |
|---|---|---|---|
| D1 | patient exists | Continue | Throw not found |
| D2 | patient clinic matches | Continue | `AccessDeniedException` |
| D3 | linked user exists | Update user fields | Skip user update |
| D4 | resolved doctor id not null | Assignment logic | Leave doctor unchanged |
| D5 | `drId == -1` | Clear doctor | Validate doctor clinic |
| D6 | doctor exists and same clinic | Assign doctor | Do not assign |
| D7 | assignment date/time and doctor present | Create appointment | Skip appointment |
| D8 | appointment creation throws | Log error | Continue |

### 3.2 CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Find patient]
    NX([Exception exit])
    N3{clinic matches?}
    N4[Update patient fields]
    N5[Find linked user]
    N6{user != null?}
    N7[Update and save user]
    N8[Resolve doctor id]
    N9{drId != null?}
    N10{drId == -1?}
    N11[Clear doctor]
    N12[Find doctor]
    N13{doctor clinic matches?}
    N14[Assign doctor]
    N15{assignment date/time and doctorId?}
    N16[Try create scheduled appointment]
    N17[Catch/log appointment error]
    N18[Save patient]
    NE([Return])

    N1 --> N2
    N2 -. not found .-> NX
    N2 --> N3
    N3 -- No --> NX
    N3 -- Yes --> N4 --> N5 --> N6
    N6 -- Yes --> N7 --> N8
    N6 -- No --> N8
    N8 --> N9
    N9 -- No --> N15
    N9 -- Yes --> N10
    N10 -- Yes --> N11 --> N15
    N10 -- No --> N12 --> N13
    N13 -- Yes --> N14 --> N15
    N13 -- No --> N15
    N15 -- Yes --> N16 --> N18
    N16 -. exception .-> N17 --> N18
    N15 -- No --> N18
    N18 --> NE
```

### 3.3 CC va paths

| Metric | Value |
|---|---:|
| Nodes `N` | 20 |
| Edges `E` | 29 |
| `V(G)` | `29 - 20 + 2 = 11` |

| TC | Expected |
|---|---|
| TC-WB-CLINIC-PAT-UPD-01 | Patient not found |
| TC-WB-CLINIC-PAT-UPD-02 | Clinic mismatch denied |
| TC-WB-CLINIC-PAT-UPD-03 | User exists and request has mutable fields |
| TC-WB-CLINIC-PAT-UPD-04 | User missing, still save patient |
| TC-WB-CLINIC-PAT-UPD-05 | `drId == -1`, clear doctor |
| TC-WB-CLINIC-PAT-UPD-06 | Doctor same clinic, assign doctor |
| TC-WB-CLINIC-PAT-UPD-07 | Doctor other clinic, do not assign |
| TC-WB-CLINIC-PAT-UPD-08 | Assignment date/time create appointment |
| TC-WB-CLINIC-PAT-UPD-09 | Appointment creation error is logged, patient still saved |

---

## 4. `ClinicPatientServiceImpl.getDoctorId`

```mermaid
flowchart TD
    N1([Start])
    N2[drId = request.doctorId]
    N3{drId null and assignedDoctor has text?}
    N4[drStr = assignedDoctor]
    N5{parse Long succeeds?}
    N6[drId = parsed id]
    N7[Normalize doctor name]
    N8[Search active doctor in clinic]
    N9{foundDrs not empty?}
    N10[drId = first doctor id]
    NE([Return drId])

    N1 --> N2 --> N3
    N3 -- No --> NE
    N3 -- Yes --> N4 --> N5
    N5 -- Yes --> N6 --> NE
    N5 -- No --> N7 --> N8 --> N9
    N9 -- Yes --> N10 --> NE
    N9 -- No --> NE
```

| Path | Expected |
|---|---|
| P1 | request doctorId present -> return it |
| P2 | assignedDoctor numeric -> parsed id |
| P3 | assignedDoctor name found -> matched id |
| P4 | assignedDoctor name not found -> null |

---

## 5. `AdminUserServiceImpl.createUser`

### 5.1 CFG

```mermaid
flowchart TD
    N1([Start])
    N2{email exists?}
    NX([Exception exit])
    N3[Validate password policy]
    N4[Build user]
    N5[Save user]
    N6{saved.role == PATIENT?}
    N7[Create linked Patient]
    N8[Record audit]
    N9[Map response]
    NE([Return])

    N1 --> N2
    N2 -- Yes --> NX
    N2 -- No --> N3
    N3 -. policy violation .-> NX
    N3 --> N4 --> N5 --> N6
    N6 -- Yes --> N7 --> N8
    N6 -- No --> N8
    N8 --> N9 --> NE
```

| Metric | Value |
|---|---:|
| Nodes `N` | 10 |
| Edges `E` | 12 |
| `V(G)` | `12 - 10 + 2 = 4` |

| TC | Expected |
|---|---|
| TC-WB-ADMIN-USER-CREATE-01 | Duplicate email -> exception |
| TC-WB-ADMIN-USER-CREATE-02 | Password policy fail -> exception |
| TC-WB-ADMIN-USER-CREATE-03 | Create PATIENT -> linked patient created |
| TC-WB-ADMIN-USER-CREATE-04 | Create DOCTOR/ADMIN -> no linked patient |

---

## 6. `AdminUserServiceImpl.validatePasswordPolicy`

### 6.1 CFG

```mermaid
flowchart TD
    N1([Start])
    N2{password null or length < 8?}
    NX([Exception exit])
    N3[Load SystemConfig]
    N4{config == null?}
    NE([Return])
    N5{specialCharRequired?}
    N6{password has special char?}
    N7{upperNumberRequired?}
    N8{password has uppercase and digit?}

    N1 --> N2
    N2 -- Yes --> NX
    N2 -- No --> N3 --> N4
    N4 -- Yes --> NE
    N4 -- No --> N5
    N5 -- Yes --> N6
    N5 -- No --> N7
    N6 -- No --> NX
    N6 -- Yes --> N7
    N7 -- No --> NE
    N7 -- Yes --> N8
    N8 -- No --> NX
    N8 -- Yes --> NE
```

| Metric | Value |
|---|---:|
| Nodes `N` | 10 |
| Edges `E` | 15 |
| `V(G)` | `15 - 10 + 2 = 7` |

| TC | Expected |
|---|---|
| TC-WB-ADMIN-PASS-01 | null/short password -> exception |
| TC-WB-ADMIN-PASS-02 | config null -> pass if length ok |
| TC-WB-ADMIN-PASS-03 | special required missing -> exception |
| TC-WB-ADMIN-PASS-04 | special required present -> continue |
| TC-WB-ADMIN-PASS-05 | upper/number required missing uppercase -> exception |
| TC-WB-ADMIN-PASS-06 | upper/number required missing digit -> exception |
| TC-WB-ADMIN-PASS-07 | all required satisfied -> pass |

---

## 7. `AdminUserServiceImpl.deleteUser`

```mermaid
flowchart TD
    N1([Start])
    N2[Find user]
    NX([Exception exit])
    N3[Set user.deleted = true]
    N4[Save user]
    N5{role == PATIENT?}
    N6[Find linked patient]
    N7{linked patient exists?}
    N8[Set patient.deleted = true and save]
    N9[Record audit]
    NE([Return])

    N1 --> N2
    N2 -. not found .-> NX
    N2 --> N3 --> N4 --> N5
    N5 -- Yes --> N6 --> N7
    N7 -- Yes --> N8 --> N9
    N7 -- No --> N9
    N5 -- No --> N9
    N9 --> NE
```

| Path | Expected |
|---|---|
| P1 | User not found |
| P2 | Non-patient user -> only user soft-deleted |
| P3 | Patient user with linked patient -> both soft-deleted |
| P4 | Patient user without linked patient -> only user soft-deleted |

---

## 8. `ClinicPatientServiceImpl.deletePatient`

### 8.1 CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Find patient by patientId]
    NX([Exception exit])
    N3{patient.clinicId == clinicId?}
    N4[patient.deleted = true]
    N5[Save patient]
    N6[Find linked user by patient.userId]
    N7{linked user exists?}
    N8[user.deleted = true]
    N9[Save user]
    NE([Return])

    N1 --> N2
    N2 -. not found .-> NX
    N2 --> N3
    N3 -- No --> NX
    N3 -- Yes --> N4 --> N5 --> N6 --> N7
    N7 -- Yes --> N8 --> N9 --> NE
    N7 -- No --> NE
```

### 8.2 Basis paths

| Path | Expected |
|---|---|
| P1 | Patient not found -> runtime exception |
| P2 | Patient belongs to another clinic -> `AccessDeniedException` |
| P3 | Patient deleted, linked user exists -> both soft-deleted |
| P4 | Patient deleted, linked user missing -> only patient soft-deleted |

---

## 9. `ClinicPatientServiceImpl.sendNotificationToPatient`

### 9.1 CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Find patient by id]
    NX([Exception exit])
    N3{patient.clinicId == clinicId?}
    N4[Build notification]
    N5[Save notification]
    NE([Return])

    N1 --> N2
    N2 -. not found .-> NX
    N2 --> N3
    N3 -- No --> NX
    N3 -- Yes --> N4 --> N5 --> NE
```

### 9.2 Basis paths

| Path | Expected |
|---|---|
| P1 | Patient not found -> runtime exception |
| P2 | Clinic mismatch -> `AccessDeniedException` |
| P3 | Clinic matches -> notification saved |

---

## 10. `AdminUserServiceImpl.updateUser`

### 10.1 Decision/condition

| ID | Condition | True branch | False branch |
|---|---|---|
| D1 | user exists | Continue | Exception |
| D2 | `fullName != null` | Update fullName | Keep old value |
| D3 | `email != null` | Update email | Keep old value |
| D4 | `role != null` | Parse/update role | Keep old role |
| D5 | `status != null` | Update status | Keep old status |
| D6 | password present and not blank | Validate and encode | Keep old password |
| D7 | doctor profile fields present | Update each present field | Keep missing fields |

### 10.2 CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Find user by id]
    NX([Exception exit])
    N3{fullName != null?}
    N4[Set fullName]
    N5{email != null?}
    N6[Set email]
    N7{role != null?}
    N8[Set role from enum]
    N9{status != null?}
    N10[Set status]
    N11{password has text?}
    N12[Validate password policy]
    N13[Encode password]
    N14[Set clinicId]
    N15[Apply optional doctor fields]
    N16[Save user]
    N17[Record audit]
    N18[Map response]
    NE([Return])

    N1 --> N2
    N2 -. not found .-> NX
    N2 --> N3
    N3 -- Yes --> N4 --> N5
    N3 -- No --> N5
    N5 -- Yes --> N6 --> N7
    N5 -- No --> N7
    N7 -- Yes --> N8 --> N9
    N7 -- No --> N9
    N8 -. invalid role .-> NX
    N9 -- Yes --> N10 --> N11
    N9 -- No --> N11
    N11 -- Yes --> N12 --> N13 --> N14
    N12 -. policy violation .-> NX
    N11 -- No --> N14
    N14 --> N15 --> N16 --> N17 --> N18 --> NE
```

### 10.3 Basis paths

| Path | Expected |
|---|---|
| P1 | User not found -> exception |
| P2 | Invalid role -> exception |
| P3 | Password policy violation -> exception |
| P4 | Only basic fields present -> update and audit |
| P5 | Password blank -> old password retained |
| P6 | Password valid -> encoded password saved |
| P7 | Doctor profile fields present -> fields mapped |

---

## 11. `AdminUserServiceImpl.toggleUserStatus`

### 11.1 CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Find user by id]
    NX([Exception exit])
    N3{user.status == ACTIVE?}
    N4[nextStatus = INACTIVE]
    N5[nextStatus = ACTIVE]
    N6[Set status]
    N7[Save user]
    N8[Record audit warning]
    NE([Return])

    N1 --> N2
    N2 -. not found .-> NX
    N2 --> N3
    N3 -- Yes --> N4 --> N6
    N3 -- No --> N5 --> N6
    N6 --> N7 --> N8 --> NE
```

### 11.2 Basis paths

| Path | Expected |
|---|---|
| P1 | User not found -> exception |
| P2 | Current `ACTIVE` -> next `INACTIVE` |
| P3 | Current not `ACTIVE` -> next `ACTIVE` |

---

## 12. `AdminClinicServiceImpl.createClinic`

### 12.1 CFG

```mermaid
flowchart TD
    N1([Start])
    N2{clinicCode exists?}
    NX([Exception exit])
    N3[Build Clinic status ACTIVE]
    N4[Save clinic]
    N5[Build CLINIC_MANAGER user]
    N6[Save manager]
    N7[Set clinic.managerId]
    N8[Save clinic again]
    N9[Record audit]
    N10[Map response]
    NE([Return])

    N1 --> N2
    N2 -- Yes --> NX
    N2 -- No --> N3 --> N4 --> N5 --> N6 --> N7 --> N8 --> N9 --> N10 --> NE
```

### 12.2 Basis paths

| Path | Expected |
|---|---|
| P1 | Duplicate clinic code -> runtime exception |
| P2 | New clinic -> clinic and manager saved, managerId linked |

---

## 13. `AdminClinicServiceImpl.updateClinic`

### 13.1 CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Find clinic by id]
    NX([Exception exit])
    N3{name != null?}
    N4[Set name]
    N5{address != null?}
    N6[Set address]
    N7{phone != null?}
    N8[Set phone]
    N9{imageUrl != null?}
    N10[Set imageUrl]
    N11{status != null?}
    N12[Set clinic status]
    N13[Update users by clinic status]
    N14[Save clinic]
    N15[Record audit]
    N16[Map response]
    NE([Return])

    N1 --> N2
    N2 -. not found .-> NX
    N2 --> N3
    N3 -- Yes --> N4 --> N5
    N3 -- No --> N5
    N5 -- Yes --> N6 --> N7
    N5 -- No --> N7
    N7 -- Yes --> N8 --> N9
    N7 -- No --> N9
    N9 -- Yes --> N10 --> N11
    N9 -- No --> N11
    N11 -- Yes --> N12 --> N13 --> N14
    N11 -- No --> N14
    N14 --> N15 --> N16 --> NE
```

### 13.2 Basis paths

| Path | Expected |
|---|---|
| P1 | Clinic not found -> exception |
| P2 | Only name/address/phone/image changes -> clinic saved |
| P3 | Status present -> clinic status and all clinic users updated |
| P4 | Status null -> no user status update |

---

## 14. `AdminClinicServiceImpl.toggleClinicStatus`

### 14.1 CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Find clinic]
    NX([Exception exit])
    N3{clinic.status == ACTIVE?}
    N4[nextStatus = INACTIVE]
    N5[nextStatus = ACTIVE]
    N6[Set clinic status]
    N7[Save clinic]
    N8[Update users by clinic status]
    N9[Record audit]
    NE([Return])

    N1 --> N2
    N2 -. not found .-> NX
    N2 --> N3
    N3 -- Yes --> N4 --> N6
    N3 -- No --> N5 --> N6
    N6 --> N7 --> N8 --> N9 --> NE
```

### 14.2 Basis paths

| Path | Expected |
|---|---|
| P1 | Clinic not found -> exception |
| P2 | Current `ACTIVE` -> clinic/users become `INACTIVE` |
| P3 | Current not `ACTIVE` -> clinic/users become `ACTIVE` |

---

## 15. `ClinicDoctorServiceImpl.createDoctor`

### 15.1 CFG

```mermaid
flowchart TD
    N1([Start])
    N2{email exists?}
    NX([Exception exit])
    N3[Build DOCTOR user]
    N4[Encode password]
    N5[Set clinicId and doctor profile fields]
    N6[Save user]
    NE([Return])

    N1 --> N2
    N2 -- Yes --> NX
    N2 -- No --> N3 --> N4 --> N5 --> N6 --> NE
```

### 15.2 Basis paths

| Path | Expected |
|---|---|
| P1 | Duplicate email -> runtime exception |
| P2 | New email -> doctor user saved |

---

## 16. `ClinicDoctorServiceImpl.updateDoctor`

### 16.1 CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Find doctor]
    NX([Exception exit])
    N3{doctor.clinicId == clinicId?}
    N4[Set required profile fields]
    N5{avatarUrl has text?}
    N6[Set avatarUrl]
    N7{licenseImageUrl has text?}
    N8[Set licenseImageUrl]
    N9{bio != null?}
    N10[Set bio]
    N11{password has text?}
    N12[Encode password]
    N13{status != null?}
    N14[Set status]
    N15[Save user]
    NE([Return])

    N1 --> N2
    N2 -. not found .-> NX
    N2 --> N3
    N3 -- No --> NX
    N3 -- Yes --> N4 --> N5
    N5 -- Yes --> N6 --> N7
    N5 -- No --> N7
    N7 -- Yes --> N8 --> N9
    N7 -- No --> N9
    N9 -- Yes --> N10 --> N11
    N9 -- No --> N11
    N11 -- Yes --> N12 --> N13
    N11 -- No --> N13
    N13 -- Yes --> N14 --> N15
    N13 -- No --> N15
    N15 --> NE
```

### 16.2 Basis paths

| Path | Expected |
|---|---|
| P1 | Doctor not found -> runtime exception |
| P2 | Clinic mismatch -> `AccessDeniedException` |
| P3 | Optional image/bio/password/status missing -> only required fields updated |
| P4 | Optional fields present -> all mapped and saved |
| P5 | Password present -> encoded password saved |

---

## 17. `ClinicDoctorServiceImpl.deleteDoctor`

### 17.1 CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Find doctor]
    NX([Exception exit])
    N3{doctor.clinicId == clinicId?}
    N4[user.deleted = true]
    N5[Save user]
    NE([Return])

    N1 --> N2
    N2 -. not found .-> NX
    N2 --> N3
    N3 -- No --> NX
    N3 -- Yes --> N4 --> N5 --> NE
```

### 17.2 Basis paths

| Path | Expected |
|---|---|
| P1 | Doctor not found -> runtime exception |
| P2 | Clinic mismatch -> `AccessDeniedException` |
| P3 | Clinic matches -> doctor soft-deleted |
