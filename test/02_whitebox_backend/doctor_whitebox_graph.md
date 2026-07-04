# WHITE-BOX GRAPH SPEC - DOCTOR MODULE

## 1. Pham vi

| Class | Method | Ly do chon |
|---|---|---|
| `DoctorAppointmentServiceImpl` | `updateStatus` | Phan quyen doctor, status transition, meeting link, notification message |
| `DoctorAppointmentServiceImpl` | `rescheduleAppointment` | Doi type online/offline, fallback meeting link, patch doctor info |
| `DoctorAppointmentServiceImpl` | `batchReschedule` | Loop danh sach appointment, notify trong try/catch |

---

## 2. `DoctorAppointmentServiceImpl.updateStatus`

### 2.1 Decision/condition

| ID | Condition | True branch | False/exception branch |
|---|---|---|---|
| D1 | current doctor id exists | Continue | Exception |
| D2 | appointment exists | Continue | `ResourceNotFoundException` |
| D3 | `appointment.doctorId == doctorId` | Continue | Unauthorized |
| D4 | `diagnosisSummary` has text | Set diagnosis | Keep old value |
| D5 | `status` maps to enum | Set status | `IllegalArgumentException` |
| D6 | `status == SCHEDULED && type == ONLINE` | Handle meeting link | Skip meeting link logic |
| D7 | `meetingLink` has text | Use provided link | Check existing link |
| D8 | existing meetingLink missing | Set default link | Keep existing |
| D9 | status message branch | SCHEDULED/CANCELLED/COMPLETED/default | Notification message/type |

### 2.2 CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Resolve doctorId]
    N3[Find appointment]
    NX([Exception exit])
    N4{Owned by doctor?}
    N5{Diagnosis text?}
    N6[Set diagnosis]
    N7[Set enum status]
    N8{Scheduled and Online?}
    N9{Provided meetingLink?}
    N10[Set provided link]
    N11{Existing link missing?}
    N12[Set default link]
    N13[Save appointment]
    N14{Status for message}
    N15[Build notification]
    N16[Send notification]
    N17[Map response]
    NE([Return])

    N1 --> N2 --> N3 --> N4
    N2 -. no auth .-> NX
    N3 -. not found .-> NX
    N4 -- No --> NX
    N4 -- Yes --> N5
    N5 -- Yes --> N6 --> N7
    N5 -- No --> N7
    N7 -. invalid enum .-> NX
    N7 --> N8
    N8 -- No --> N13
    N8 -- Yes --> N9
    N9 -- Yes --> N10 --> N13
    N9 -- No --> N11
    N11 -- Yes --> N12 --> N13
    N11 -- No --> N13
    N13 --> N14 --> N15 --> N16 --> N17 --> NE
```

### 2.3 CC va path

| Metric | Value |
|---|---:|
| Nodes `N` | 19 |
| Edges `E` | 28 |
| `V(G)` | `28 - 19 + 2 = 11` |

| TC | Path | Expected |
|---|---|---|
| TC-WB-DOC-APPT-01 | Appointment not found | `ResourceNotFoundException` |
| TC-WB-DOC-APPT-02 | Doctor mismatch | Unauthorized runtime |
| TC-WB-DOC-APPT-03 | Diagnosis blank | Diagnosis unchanged |
| TC-WB-DOC-APPT-04 | Invalid status | `IllegalArgumentException` |
| TC-WB-DOC-APPT-05 | SCHEDULED + ONLINE + provided link | Set provided link, success notification |
| TC-WB-DOC-APPT-06 | SCHEDULED + ONLINE + missing existing link | Set default link |
| TC-WB-DOC-APPT-07 | SCHEDULED + ONLINE + existing link | Keep existing link |
| TC-WB-DOC-APPT-08 | CANCELLED | Warning notification message |
| TC-WB-DOC-APPT-09 | COMPLETED | Info completed message |
| TC-WB-DOC-APPT-10 | Other status | Default update message |

---

## 3. `DoctorAppointmentServiceImpl.rescheduleAppointment`

### 3.1 CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Find appointment]
    NX([Exception exit])
    N3[Parse new date/time]
    N4[Set time/type/reason]
    N5{request.type == ONLINE?}
    N6[location = null]
    N7{request.meetingLink present?}
    N8[Set provided meetingLink]
    N9{existing meetingLink missing?}
    N10[Set default meetingLink]
    N11[location = Phong kham, meetingLink = null]
    N12[Find doctor by appointment.doctorId]
    N13{doctor != null?}
    N14[Patch doctor cached fields]
    N15[status = SCHEDULED]
    N16[Save]
    N17[Notify patient]
    N18[Map response]
    NE([Return])

    N1 --> N2
    N2 -. not found .-> NX
    N2 --> N3 --> N4 --> N5
    N5 -- Yes --> N6 --> N7
    N7 -- Yes --> N8 --> N12
    N7 -- No --> N9
    N9 -- Yes --> N10 --> N12
    N9 -- No --> N12
    N5 -- No --> N11 --> N12
    N12 --> N13
    N13 -- Yes --> N14 --> N15
    N13 -- No --> N15
    N15 --> N16 --> N17 --> N18 --> NE
```

### 3.2 CC va basis paths

| Metric | Value |
|---|---:|
| Nodes `N` | 20 |
| Edges `E` | 27 |
| `V(G)` | `27 - 20 + 2 = 9` |

| TC | Path | Expected |
|---|---|---|
| TC-WB-DOC-RESCH-01 | Appointment missing | `ResourceNotFoundException` |
| TC-WB-DOC-RESCH-02 | ONLINE + provided link | location null, provided meetingLink |
| TC-WB-DOC-RESCH-03 | ONLINE + no provided link + existing missing | default meetingLink |
| TC-WB-DOC-RESCH-04 | ONLINE + no provided link + existing present | keep existing meetingLink |
| TC-WB-DOC-RESCH-05 | IN_PERSON | location set, meetingLink null |
| TC-WB-DOC-RESCH-06 | Doctor exists | cached doctor fields patched |
| TC-WB-DOC-RESCH-07 | Doctor missing | cached doctor fields unchanged/null |

---

## 4. `DoctorAppointmentServiceImpl.batchReschedule`

### 4.1 CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Resolve doctorId]
    N3[Build source day range]
    N4[Find appointments]
    NX([Exception exit])
    N5{appointments empty?}
    N6([Return 0])
    N7[daysDiff = target - source]
    N8{{For each appointment}}
    N9[Shift appointment time]
    N10{endTime != null?}
    N11[Shift endTime]
    N12[Save appointment]
    N13[Try notify patient]
    N14{Notification throws?}
    N15[Log warning]
    N16{{Next appointment}}
    N17([Return count])

    N1 --> N2 --> N3 --> N4
    N2 -. no auth .-> NX
    N4 --> N5
    N5 -- Yes --> N6
    N5 -- No --> N7 --> N8 --> N9 --> N10
    N10 -- Yes --> N11 --> N12
    N10 -- No --> N12
    N12 --> N13 --> N14
    N14 -- Yes --> N15 --> N16
    N14 -- No --> N16
    N16 --> N8
    N16 --> N17
```

### 4.2 CC va basis paths

| Metric | Value |
|---|---:|
| Nodes `N` | 18 |
| Edges `E` | 24 |
| `V(G)` | `24 - 18 + 2 = 8` |

| TC | Path | Expected |
|---|---|---|
| TC-WB-DOC-BATCH-01 | No appointments | Return `0`, no save |
| TC-WB-DOC-BATCH-02 | One appointment without endTime | Shift start only |
| TC-WB-DOC-BATCH-03 | Appointment with endTime | Shift start and end |
| TC-WB-DOC-BATCH-04 | Notification success | No warning, returns count |
| TC-WB-DOC-BATCH-05 | Notification throws | Log warning, still returns count |
| TC-WB-DOC-BATCH-06 | Multiple appointments | Loop saves each item |

---

## 5. `DoctorAppointmentServiceImpl.createAppointment`

### 5.1 CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Resolve doctorId]
    NX([Exception exit])
    N3[Find patient]
    N4[Parse appointment date/time]
    N5[Find doctor user or null]
    N6{doctor != null?}
    N7[Set cached doctor fields]
    N8[Doctor fields null]
    N9{request.type == ONLINE?}
    N10[location = Truc tuyen]
    N11{meetingLink has text?}
    N12[Use provided link]
    N13[Use default meeting link]
    N14[location = Phong kham, meetingLink = null]
    N15[Build SCHEDULED appointment]
    N16[Save appointment]
    N17[Notify patient]
    N18[Map response]
    NE([Return])

    N1 --> N2
    N2 -. no auth .-> NX
    N2 --> N3
    N3 -. patient not found .-> NX
    N3 --> N4 --> N5 --> N6
    N6 -- Yes --> N7 --> N9
    N6 -- No --> N8 --> N9
    N9 -- Yes --> N10 --> N11
    N11 -- Yes --> N12 --> N15
    N11 -- No --> N13 --> N15
    N9 -- No --> N14 --> N15
    N15 --> N16 --> N17 --> N18 --> NE
```

### 5.2 Basis paths

| Path | Expected |
|---|---|
| P1 | Missing doctor auth -> exception |
| P2 | Patient not found -> `ResourceNotFoundException` |
| P3 | Doctor user found -> cached fields set |
| P4 | Doctor user missing -> cached fields null |
| P5 | ONLINE with provided link -> use provided link |
| P6 | ONLINE without link -> default meeting link |
| P7 | Non-ONLINE -> location `Phong kham`, meetingLink null |

---

## 6. `DoctorMessageServiceImpl.getConversations`

### 6.1 CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Resolve doctorId]
    NX([Exception exit])
    N3[Find active conversations]
    N4{{For each conversation}}
    N5[Find last message]
    N6{last message exists?}
    N7[lastMsg = content]
    N8[lastMsg = empty string]
    N9[Count unread messages from others]
    N10[Build ConversationResponse]
    N11{{Next conversation}}
    NE([Return list])

    N1 --> N2
    N2 -. no auth .-> NX
    N2 --> N3 --> N4 --> N5 --> N6
    N6 -- Yes --> N7 --> N9
    N6 -- No --> N8 --> N9
    N9 --> N10 --> N11
    N11 --> N4
    N11 --> NE
```

### 6.2 Basis paths

| Path | Expected |
|---|---|
| P1 | Missing doctor auth -> exception |
| P2 | No conversations -> empty list |
| P3 | Conversation with last message -> response uses content |
| P4 | Conversation without message -> lastMessage empty |

---

## 7. `DoctorMessageServiceImpl.sendMessage`

### 7.1 CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Resolve doctorId]
    NX([Exception exit])
    N3{conversationId != null?}
    N4[Find conversation by id]
    N5{receiverId != null?}
    N6[Find conversation by patientId and doctorId]
    N7{conversation exists?}
    N8[Find patient by receiverId]
    N9[Create conversation]
    N10[Save conversation]
    N11[Throw missing id error]
    N12{conversation.doctorId == doctorId?}
    N13[Build Message]
    N14{messageType != null?}
    N15[Use request messageType]
    N16[Use TEXT]
    N17[Save message]
    N18[Update conversation.lastMessageAt]
    N19[Save conversation]
    N20[Map response]
    NE([Return])

    N1 --> N2
    N2 -. no auth .-> NX
    N2 --> N3
    N3 -- Yes --> N4
    N4 -. not found .-> NX
    N4 --> N12
    N3 -- No --> N5
    N5 -- No --> N11 --> NX
    N5 -- Yes --> N6 --> N7
    N7 -- Yes --> N12
    N7 -- No --> N8
    N8 -. patient not found .-> NX
    N8 --> N9 --> N10 --> N12
    N12 -- No --> NX
    N12 -- Yes --> N13 --> N14
    N14 -- Yes --> N15 --> N17
    N14 -- No --> N16 --> N17
    N17 --> N18 --> N19 --> N20 --> NE
```

### 7.2 Basis paths

| Path | Expected |
|---|---|
| P1 | Missing auth -> exception |
| P2 | conversationId present but missing -> `ResourceNotFoundException` |
| P3 | no conversationId and no receiverId -> `IllegalArgumentException` |
| P4 | receiverId present, existing conversation found -> send message |
| P5 | receiverId present, patient not found -> `ResourceNotFoundException` |
| P6 | receiverId present, no conversation -> create conversation then send |
| P7 | conversation doctor mismatch -> unauthorized |
| P8 | messageType null -> defaults to `TEXT` |
| P9 | messageType present -> uses request value |

---

## 8. `DoctorMessageServiceImpl.markAsRead`

```mermaid
flowchart TD
    N1([Start])
    N2[Resolve doctorId]
    NX([Exception exit])
    N3[markAllAsRead conversationId excluding doctorId]
    NE([Return])

    N1 --> N2
    N2 -. no auth .-> NX
    N2 --> N3 --> NE
```

| Path | Expected |
|---|---|
| P1 | Missing auth -> exception |
| P2 | Authenticated doctor -> messages marked read |
