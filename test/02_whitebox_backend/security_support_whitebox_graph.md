# WHITE-BOX GRAPH SPEC - SECURITY, CONFIG, SUPPORT MODULE

## 1. Pham vi

| Class | Method |
|---|---|
| `JwtTokenProvider` | `validateToken` |
| `RateLimitFilter` | `doFilter`, `getClientIp` |
| `RiskAlertServiceImpl` | `getRiskAlertDashboard`, `mapToRiskPatientItem`, `dismissAlert`, `markAlertAsRead` |

---

## 2. `JwtTokenProvider.validateToken`

### 2.1 Decision/exception paths

| ID | Path | Expected |
|---|---|---|
| D1 | Token parses successfully | Return `true` |
| D2 | `SecurityException` | Log invalid signature, return `false` |
| D3 | `MalformedJwtException` | Log malformed token, return `false` |
| D4 | `ExpiredJwtException` | Log expired token, return `false` |
| D5 | `UnsupportedJwtException` | Log unsupported token, return `false` |
| D6 | `IllegalArgumentException` | Log empty claims, return `false` |

### 2.2 CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Build HMAC key]
    N3[Parse claims JWS]
    N4([Return true])
    C1{SecurityException?}
    C2{MalformedJwtException?}
    C3{ExpiredJwtException?}
    C4{UnsupportedJwtException?}
    C5{IllegalArgumentException?}
    N5[Log error]
    N6([Return false])

    N1 --> N2 --> N3 --> N4
    N3 -. exception .-> C1
    C1 -- Yes --> N5 --> N6
    C1 -- No --> C2
    C2 -- Yes --> N5
    C2 -- No --> C3
    C3 -- Yes --> N5
    C3 -- No --> C4
    C4 -- Yes --> N5
    C4 -- No --> C5
    C5 -- Yes --> N5
```

### 2.3 CC va basis paths

| Metric | Value |
|---|---:|
| Nodes `N` | 11 |
| Edges `E` | 16 |
| `V(G)` | `16 - 11 + 2 = 7` |

| TC | Token fixture | Expected |
|---|---|---|
| TC-WB-JWT-01 | Valid signed token | `true` |
| TC-WB-JWT-02 | Token signed by wrong secret | `false` |
| TC-WB-JWT-03 | Malformed string | `false` |
| TC-WB-JWT-04 | Expired token | `false` |
| TC-WB-JWT-05 | Unsupported token | `false` |
| TC-WB-JWT-06 | Empty/null token | `false` |

---

## 3. `RateLimitFilter.doFilter`

### 3.1 Decision/condition

| ID | Condition | True branch | False branch |
|---|---|---|---|
| D1 | path contains `/api/v1/auth/login` | Check method | Pass chain |
| D2 | method POST | Apply rate limit | Pass chain |
| D3 | rate info missing/window expired | Reset count to 1 | Increment count |
| D4 | count > 10 | Return 429 | Continue chain |
| D5 | `X-Forwarded-For` present | Use first forwarded IP | Use remote addr |

### 3.2 CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Cast HttpServletRequest]
    N3{Login path?}
    N4{POST method?}
    N5[Resolve client IP]
    N6{existing null or window expired?}
    N7[Create new RateInfo count=1]
    N8[Increment existing count]
    N9{count > MAX_ATTEMPTS?}
    N10[Set 429 JSON response]
    NE429([Return])
    N11[chain.doFilter]
    NE([Return])

    N1 --> N2 --> N3
    N3 -- No --> N11
    N3 -- Yes --> N4
    N4 -- No --> N11
    N4 -- Yes --> N5 --> N6
    N6 -- Yes --> N7 --> N9
    N6 -- No --> N8 --> N9
    N9 -- Yes --> N10 --> NE429
    N9 -- No --> N11 --> NE
```

### 3.3 CC va basis paths

| Metric | Value |
|---|---:|
| Nodes `N` | 13 |
| Edges `E` | 17 |
| `V(G)` | `17 - 13 + 2 = 6` |

| TC | Expected |
|---|---|
| TC-WB-RATE-01 | Non-login path -> chain called |
| TC-WB-RATE-02 | Login path but GET -> chain called |
| TC-WB-RATE-03 | First POST login in window -> chain called |
| TC-WB-RATE-04 | 11th POST login same IP -> 429, chain not called |
| TC-WB-RATE-05 | Window expired -> count reset |
| TC-WB-RATE-06 | `X-Forwarded-For: a, b` -> client IP `a` |

---

## 4. `RiskAlertServiceImpl.getRiskAlertDashboard`

### 4.1 Decision/condition

| ID | Condition | True branch | False branch |
|---|---|---|
| D1 | `total > 0` | Calculate high risk percentage | Percentage = 0 |
| D2 | high risk patients present | Map each patient | Empty list |
| D3 | recent alerts present | Map each alert | Empty list |
| D4 | map patient has last metric | Use status/date | Default no data |
| D5 | patient has doctorId | Lookup doctor name | Default unassigned |
| D6 | next appointments empty | nextApp null | first appointment |
| D7 | nextApp before now | overdue true | overdue false |

### 4.2 CFG dashboard rut gon

```mermaid
flowchart TD
    N1([Start])
    N2[Load counts and unmonitored/overdue]
    N3{total > 0?}
    N4[Calculate percentage]
    N5[percentage = 0]
    N6[Find top high risk patients]
    N7{{Map patients}}
    N8[mapToRiskPatientItem]
    N9[Find recent alerts]
    N10{{Map alerts}}
    N11[mapToAlertItem]
    N12[Build response]
    NE([Return])

    N1 --> N2 --> N3
    N3 -- Yes --> N4 --> N6
    N3 -- No --> N5 --> N6
    N6 --> N7
    N7 --> N8 --> N7
    N7 --> N9
    N9 --> N10
    N10 --> N11 --> N10
    N10 --> N12 --> NE
```

| Metric | Value |
|---|---:|
| Nodes `N` | 13 |
| Edges `E` | 16 |
| `V(G)` | `16 - 13 + 2 = 5` |

### 4.3 `mapToRiskPatientItem` CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Find last metric]
    N3[doctorName = unassigned]
    N4{doctorId != null?}
    N5[Lookup doctor name or default]
    N6[Find next appointments]
    N7{nextApps empty?}
    N8[nextApp = null]
    N9[nextApp = first]
    N10{nextApp != null and before now?}
    N11[overdue = true]
    N12[overdue = false]
    N13[Build risk patient item]
    NE([Return])

    N1 --> N2 --> N3 --> N4
    N4 -- Yes --> N5 --> N6
    N4 -- No --> N6
    N6 --> N7
    N7 -- Yes --> N8 --> N10
    N7 -- No --> N9 --> N10
    N10 -- Yes --> N11 --> N13
    N10 -- No --> N12 --> N13
    N13 --> NE
```

| TC | Expected |
|---|---|
| TC-WB-RISK-01 | total = 0 -> percentage 0 |
| TC-WB-RISK-02 | total > 0 -> percentage computed |
| TC-WB-RISK-03 | patient without metric -> default last metric status |
| TC-WB-RISK-04 | patient with doctorId and doctor exists -> doctor name |
| TC-WB-RISK-05 | doctorId null/missing doctor -> unassigned |
| TC-WB-RISK-06 | no next appointment -> overdue false |
| TC-WB-RISK-07 | next appointment before now -> overdue true |

---

## 5. `RiskAlertServiceImpl.dismissAlert` va `markAlertAsRead`

```mermaid
flowchart TD
    N1([Start])
    N2{alertId != null?}
    N3[findById alert]
    N4{alert present?}
    N5[Set dismissed/read true]
    N6[Save alert]
    NE([Return])

    N1 --> N2
    N2 -- No --> NE
    N2 -- Yes --> N3 --> N4
    N4 -- No --> NE
    N4 -- Yes --> N5 --> N6 --> NE
```

| Path | Expected |
|---|---|
| P1 | `alertId = null` -> no repository action |
| P2 | Alert not found -> no save |
| P3 | Alert found -> flag changed and saved |

---

## 6. `JwtAuthenticationFilter.doFilterInternal`

### 6.1 CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Try getJwtFromRequest]
    N3{jwt has text?}
    N4{token valid?}
    N5[Get username from JWT]
    N6[Load UserDetails]
    N7[Build authentication]
    N8[Set request details]
    N9[Set SecurityContext authentication]
    N10[Catch any exception]
    N11[filterChain.doFilter]
    NE([Return])

    N1 --> N2 --> N3
    N2 -. exception .-> N10
    N3 -- No --> N11
    N3 -- Yes --> N4
    N4 -- No --> N11
    N4 -- Yes --> N5 --> N6 --> N7 --> N8 --> N9 --> N11
    N5 -. exception .-> N10
    N6 -. exception .-> N10
    N10 --> N11 --> NE
```

### 6.2 `getJwtFromRequest` CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Read Authorization header]
    N3{header has text and starts with Bearer?}
    N4[Return substring after Bearer]
    N5[Return null]

    N1 --> N2 --> N3
    N3 -- Yes --> N4
    N3 -- No --> N5
```

| Path | Expected |
|---|---|
| P1 | No Authorization header -> no auth set, chain continues |
| P2 | Non-Bearer header -> no auth set, chain continues |
| P3 | Bearer token invalid -> no auth set, chain continues |
| P4 | Bearer token valid -> SecurityContext authentication set |
| P5 | Token/user loading throws -> swallowed, chain continues |

---

## 7. `SecurityService.canAccessPatient`

### 7.1 CFG

```mermaid
flowchart TD
    N1([Start])
    N2[Get current user details]
    N3{user == null?}
    NF([Return false])
    N4[role = user.role]
    N5{role == null?}
    N6{role == ADMIN?}
    NT([Return true])
    N7[Find patient by id]
    N8{patient == null?}
    N9{role == CLINIC_MANAGER?}
    N10{user.clinicId != null and equals patient.clinicId?}
    N11{role == DOCTOR?}
    N12{user.clinicId != null and equals patient.clinicId?}
    N13{role == PATIENT?}
    N14{patient.userId == user.id?}

    N1 --> N2 --> N3
    N3 -- Yes --> NF
    N3 -- No --> N4 --> N5
    N5 -- Yes --> NF
    N5 -- No --> N6
    N6 -- Yes --> NT
    N6 -- No --> N7 --> N8
    N8 -- Yes --> NF
    N8 -- No --> N9
    N9 -- Yes --> N10
    N10 -- Yes --> NT
    N10 -- No --> NF
    N9 -- No --> N11
    N11 -- Yes --> N12
    N12 -- Yes --> NT
    N12 -- No --> NF
    N11 -- No --> N13
    N13 -- Yes --> N14
    N14 -- Yes --> NT
    N14 -- No --> NF
    N13 -- No --> NF
```

### 7.2 Basis paths

| Path | Expected |
|---|---|
| P1 | No authenticated user -> false |
| P2 | Role null -> false |
| P3 | ADMIN -> true without patient lookup dependency |
| P4 | Patient not found -> false |
| P5 | CLINIC_MANAGER same clinic -> true |
| P6 | CLINIC_MANAGER different/null clinic -> false |
| P7 | DOCTOR same clinic -> true |
| P8 | DOCTOR different/null clinic -> false |
| P9 | PATIENT owns profile -> true |
| P10 | PATIENT not owner -> false |
| P11 | Unknown role -> false |

---

## 8. `SecurityService.isClinicManagerOf`, `isDoctorOfClinic`, `isDoctorSelf`

```mermaid
flowchart TD
    N1([Start])
    N2[Get current user]
    N3{user null or role null?}
    NF([Return false])
    N4{role == ADMIN?}
    NT([Return true])
    N5{role matches required role?}
    N6{required id field not null?}
    N7{id equals target?}

    N1 --> N2 --> N3
    N3 -- Yes --> NF
    N3 -- No --> N4
    N4 -- Yes --> NT
    N4 -- No --> N5
    N5 -- No --> NF
    N5 -- Yes --> N6
    N6 -- No --> NF
    N6 -- Yes --> N7
    N7 -- Yes --> NT
    N7 -- No --> NF
```

| Method | Required role/id |
|---|---|
| `isClinicManagerOf` | `CLINIC_MANAGER`, compare `user.clinicId` to `clinicId`; ADMIN shortcut true |
| `isDoctorOfClinic` | `DOCTOR`, compare `user.clinicId` to `clinicId`; ADMIN shortcut true |
| `isDoctorSelf` | `DOCTOR`, compare `user.id` to `doctorId`; no ADMIN shortcut in source |

---

## 9. `AuditAspect.logAudit`

```mermaid
flowchart TD
    N1([Start])
    N2[status = success, details empty]
    N3[Try joinPoint.proceed]
    N4{proceed throws?}
    N5[result = proceed result]
    N6[details = success message]
    N7[status = danger]
    N8[details = error message]
    N9[finally saveLog]
    N10{saveLog throws?}
    N11[Log audit save failure]
    N12[Return result]
    NX([Rethrow original exception])

    N1 --> N2 --> N3 --> N4
    N4 -- No --> N5 --> N6 --> N9
    N4 -- Yes --> N7 --> N8 --> N9 --> NX
    N9 --> N10
    N10 -- Yes --> N11 --> N12
    N10 -- No --> N12
```

| Path | Expected |
|---|---|
| P1 | Proceed succeeds, audit save succeeds -> returns result |
| P2 | Proceed throws -> audit recorded danger, original exception rethrown |
| P3 | Audit save throws -> error logged, business result/exception flow preserved |

---

## 10. `SupportTicketServiceImpl.createTicket`

```mermaid
flowchart TD
    N1([Start])
    N2[Try read SecurityContext principal]
    N3{principal is CustomUserDetails?}
    N4[Find creator user]
    N5{clinicId != null?}
    N6[Find clinic]
    N7[Catch auth/context exception]
    N8[Save ticket]
    N9[Record audit]
    NE([Return saved ticket])

    N1 --> N2 --> N3
    N2 -. exception .-> N7
    N3 -- Yes --> N4 --> N5
    N3 -- No --> N8
    N5 -- Yes --> N6 --> N8
    N5 -- No --> N8
    N7 --> N8 --> N9 --> NE
```

| Path | Expected |
|---|---|
| P1 | Principal CustomUserDetails and clinicId present -> creator/clinic attached |
| P2 | Principal CustomUserDetails but clinicId null -> only creator attached |
| P3 | Principal not expected type -> ticket still saved |
| P4 | SecurityContext access throws -> fallback save still succeeds |

---

## 11. `SupportTicketServiceImpl.updateTicketStatus`

```mermaid
flowchart TD
    N1([Start])
    N2[Find ticket by id]
    NX([Exception exit])
    N3[oldStatus = ticket.status]
    N4[Set status and adminNote]
    N5{status resolved or closed?}
    N6[closedAt = now]
    N7[Save ticket]
    N8[Record audit]
    NE([Return updated ticket])

    N1 --> N2
    N2 -. not found .-> NX
    N2 --> N3 --> N4 --> N5
    N5 -- Yes --> N6 --> N7
    N5 -- No --> N7
    N7 --> N8 --> NE
```

| Path | Expected |
|---|---|
| P1 | Ticket not found -> runtime exception |
| P2 | Status resolved/closed -> `closedAt` set |
| P3 | Other status -> `closedAt` unchanged |

---

## 12. `SupportTicketServiceImpl` filter methods

```mermaid
flowchart TD
    N1([Start])
    N2{status filter active?}
    N3[Query by status scope]
    N4{priority filter active?}
    N5[Query by priority]
    N6[Query all/base scope]
    NE([Return page])

    N1 --> N2
    N2 -- Yes --> N3 --> NE
    N2 -- No --> N4
    N4 -- Yes --> N5 --> NE
    N4 -- No --> N6 --> NE
```

| Method | Branch detail |
|---|---|
| `getTicketsByClinic` | Active status -> `findByClinicIdAndStatus`; otherwise `findByClinicId` |
| `getTicketsByCreator` | Active status -> `findByCreatorIdAndStatus`; otherwise `findByCreatorId` |
| `getAllTickets` | Active status wins; else active priority; else `findAll` |

---

## 13. `NotificationServiceImpl.markAsRead` va `markAllAsRead`

### 13.1 `markAsRead`

```mermaid
flowchart TD
    N1([Start])
    N2[Find notification by id]
    N3{notification present?}
    N4[read = true]
    N5[Save notification]
    NE([Return])

    N1 --> N2 --> N3
    N3 -- Yes --> N4 --> N5 --> NE
    N3 -- No --> NE
```

### 13.2 `markAllAsRead`

```mermaid
flowchart TD
    N1([Start])
    N2[Resolve current user id]
    NX([Exception exit])
    N3[Find unread notifications]
    N4{{For each notification}}
    N5[read = true]
    N6{{Next notification}}
    N7[saveAll]
    NE([Return])

    N1 --> N2
    N2 -. no auth .-> NX
    N2 --> N3 --> N4 --> N5 --> N6
    N6 --> N4
    N6 --> N7 --> NE
```

| Path | Expected |
|---|---|
| P1 | `markAsRead` notification missing -> no save |
| P2 | `markAsRead` notification exists -> save read true |
| P3 | `markAllAsRead` no auth -> exception |
| P4 | `markAllAsRead` empty list -> saveAll empty |
| P5 | `markAllAsRead` unread list -> every item read true |

---

## 14. `PrescriptionServiceImpl.getDoctorPrescriptions`

```mermaid
flowchart TD
    N1([Start])
    N2{search has text?}
    N3[findByDoctorIdAndSearchTerm]
    N4{status active and not ALL?}
    N5[findByDoctorIdAndStatus]
    N6[findByDoctorId]
    N7[Map page to response DTO]
    NE([Return page])
    NX([Exception exit])

    N1 --> N2
    N2 -- Yes --> N3 --> N7
    N2 -- No --> N4
    N4 -- Yes --> N5 --> N7
    N4 -. invalid status enum .-> NX
    N4 -- No --> N6 --> N7
    N7 --> NE
```

| Path | Expected |
|---|---|
| P1 | Search text present -> search query wins |
| P2 | Status present and not `ALL` -> status query |
| P3 | Empty search/status or status `ALL` -> all doctor prescriptions |
| P4 | Invalid status enum -> `IllegalArgumentException` |

---

## 15. `PrescriptionServiceImpl.createPrescription`

```mermaid
flowchart TD
    N1([Start])
    N2[Find patient by request.patientId]
    NX([Exception exit])
    N3[Build ACTIVE prescription]
    N4{{For each request item}}
    N5[Build PrescriptionItem]
    N6[Add item to prescription]
    N7{{Next item}}
    N8[Save prescription]
    N9{patient.userId != null?}
    N10[Send patient notification]
    N11[Map response DTO]
    NE([Return])

    N1 --> N2
    N2 -. patient not found .-> NX
    N2 --> N3 --> N4 --> N5 --> N6 --> N7
    N7 --> N4
    N7 --> N8
    N8 --> N9
    N9 -- Yes --> N10 --> N11
    N9 -- No --> N11
    N11 --> NE
```

| Path | Expected |
|---|---|
| P1 | Patient not found -> `ResourceNotFoundException` |
| P2 | Empty items -> prescription saved without items; validation gap if controller allows |
| P3 | One or more items -> each item added |
| P4 | Patient has userId -> notification sent |
| P5 | Patient userId null -> no notification |

---

## 16. `PrescriptionServiceImpl.cancelPrescription`

```mermaid
flowchart TD
    N1([Start])
    N2[Find prescription by id]
    NX([Exception exit])
    N3{prescription.doctorId == doctorId?}
    N4[status = CANCELLED]
    N5[Save prescription]
    NE([Return])

    N1 --> N2
    N2 -. not found .-> NX
    N2 --> N3
    N3 -- No --> NX
    N3 -- Yes --> N4 --> N5 --> NE
```

| Path | Expected |
|---|---|
| P1 | Prescription not found -> `ResourceNotFoundException` |
| P2 | Doctor mismatch -> unauthorized |
| P3 | Owner doctor -> status `CANCELLED` saved |

---

## 17. `MedicalServiceServiceImpl.createService`

```mermaid
flowchart TD
    N1([Start])
    N2[Get current user]
    NX([Exception exit])
    N3{role == ROLE_CLINIC_MANAGER?}
    N4[service.clinicId = user.clinicId]
    N5{role == ROLE_ADMIN?}
    N6[Keep clinicId as provided/global]
    N7[AccessDeniedException]
    N8[Save service]
    N9[Record activity]
    NE([Return saved])

    N1 --> N2
    N2 -. unauthenticated .-> NX
    N2 --> N3
    N3 -- Yes --> N4 --> N8
    N3 -- No --> N5
    N5 -- Yes --> N6 --> N8
    N5 -- No --> N7 --> NX
    N8 --> N9 --> NE
```

| Path | Expected |
|---|---|
| P1 | Unauthenticated -> runtime exception |
| P2 | Clinic manager -> clinicId forced to manager clinic |
| P3 | Admin -> clinicId retained as provided/global |
| P4 | Other role -> access denied |

---

## 18. `MedicalServiceServiceImpl.validateWriteAccess`

```mermaid
flowchart TD
    N1([Start])
    N2[Get current user]
    NX([Exception exit])
    N3{role == ROLE_ADMIN?}
    NE([Return allowed])
    N4{role == ROLE_CLINIC_MANAGER?}
    N5{service.clinicId != null and equals user.clinicId?}
    N6[AccessDenied: system/other clinic service]
    N7[AccessDenied: unsupported role]

    N1 --> N2
    N2 -. unauthenticated .-> NX
    N2 --> N3
    N3 -- Yes --> NE
    N3 -- No --> N4
    N4 -- Yes --> N5
    N5 -- Yes --> NE
    N5 -- No --> N6 --> NX
    N4 -- No --> N7 --> NX
```

| Path | Expected |
|---|---|
| P1 | Admin -> allowed |
| P2 | Clinic manager owns service -> allowed |
| P3 | Clinic manager on global/other clinic service -> access denied |
| P4 | Other role -> access denied |

---

## 19. `MedicalServiceServiceImpl.toggleStatus`

```mermaid
flowchart TD
    N1([Start])
    N2[Get service by id]
    NX([Exception exit])
    N3[Validate write access]
    N4{status == Dang kinh doanh?}
    N5[newStatus = Ngung kinh doanh]
    N6[newStatus = Dang kinh doanh]
    N7[Set status]
    N8[Save service]
    N9[Record activity]
    NE([Return updated])

    N1 --> N2
    N2 -. not found .-> NX
    N2 --> N3
    N3 -. denied .-> NX
    N3 --> N4
    N4 -- Yes --> N5 --> N7
    N4 -- No --> N6 --> N7
    N7 --> N8 --> N9 --> NE
```

| Path | Expected |
|---|---|
| P1 | Service not found -> runtime exception |
| P2 | Access denied -> exception |
| P3 | Current active -> becomes inactive |
| P4 | Current inactive/other -> becomes active |

---

## 20. `MedicalServiceServiceImpl.getServiceStats`

```mermaid
flowchart TD
    N1([Start])
    N2[Try load all services]
    N3[Count total and active]
    N4[Sum non-null prices]
    N5[Build last 30 days range]
    N6[Try count new patient registrations]
    N7{count query throws?}
    N8[Log count error, keep 0]
    N9[Build full stats response]
    N10{outer block throws?}
    N11[Log stats failure]
    N12[Build fallback response]
    NE([Return])

    N1 --> N2 --> N3 --> N4 --> N5 --> N6 --> N7
    N2 -. exception .-> N10
    N3 -. exception .-> N10
    N4 -. exception .-> N10
    N7 -- Yes --> N8 --> N9
    N7 -- No --> N9
    N9 --> NE
    N10 -- Yes --> N11 --> N12 --> NE
```

| Path | Expected |
|---|---|
| P1 | Normal stats -> totals, active count, total value, new registrations |
| P2 | New registrations query fails -> response still returned with registration count `0` |
| P3 | Outer stats failure -> fallback response with growth `+0%` |
