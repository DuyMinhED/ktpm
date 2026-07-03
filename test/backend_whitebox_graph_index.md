# WHITE-BOX GRAPH INDEX CHO BACKEND

## 1. Muc tieu

Tai lieu nay la muc luc truy vet cac class/method can ve do thi cho white-box testing. Pham vi tap trung vao code co nhanh dieu kien, exception path, switch/ternary, try/catch, stream/filter hoac business rule. Cac DTO/entity chi gom getter/setter don gian khong dua vao pham vi ve CFG rieng.

## 2. Quy uoc

| Ky hieu | Y nghia |
|---|---|
| CFG | Control Flow Graph |
| CC | Cyclomatic Complexity |
| BP | Basis Path |
| D | Decision/branch |
| NX | Exception exit |
| NE | Normal exit |

Cong thuc dung cho moi method:

```text
V(G) = E - N + 2P
```

Trong do `E` la so edge, `N` la so node, `P = 1` voi tung method lien thong.

## 3. Pham vi class can thiet

| Nhom | Class/method uu tien | Tai lieu CFG |
|---|---|---|
| Patient | `PatientAppointmentServiceImpl.create`, `cancel`, `toggleReminder`, `mapToResponse` | `test/patient_whitebox_graph_spec.md` |
| Patient | `PatientHealthMetricServiceImpl.processAndSave`, `evaluateStatus`, `delete`, `getDateRange` | `test/patient_whitebox_graph_spec.md` |
| Patient | `PatientPrescriptionServiceImpl.logMedication`, `requestRefill` | `test/patient_whitebox_graph_spec.md` |
| Patient | `PatientProfileServiceImpl.updateProfile`, `addEmergencyContact`, `updateEmergencyContact` | `test/patient_whitebox_graph_spec.md` |
| Doctor | `DoctorAppointmentServiceImpl.updateStatus`, `createAppointment`, `rescheduleAppointment`, `batchReschedule` | `test/doctor_whitebox_graph_spec.md` |
| Doctor | `DoctorPatientServiceImpl.getPatientDetail`, metric/risk helpers | `test/doctor_whitebox_graph_spec.md` |
| Doctor | `DoctorMessageServiceImpl.sendMessage`, `markAsRead` | `test/doctor_whitebox_graph_spec.md` |
| Clinic | `ClinicPatientServiceImpl.createPatient`, `updatePatient`, `deletePatient`, `getDoctorId` | `test/clinic_admin_whitebox_graph_spec.md` |
| Clinic | `ClinicDoctorServiceImpl.createDoctor`, `updateDoctor`, `deleteDoctor` | `test/clinic_admin_whitebox_graph_spec.md` |
| Clinic | `ClinicDashboardServiceImpl.getDashboardData`, appointment/profile methods | `test/clinic_admin_whitebox_graph_spec.md` |
| Clinic | `ClinicReportServiceImpl.getClinicReport`, `getDiseaseDetailReport` | `test/clinic_admin_whitebox_graph_spec.md` |
| Admin | `AdminUserServiceImpl.createUser`, `updateUser`, `deleteUser`, `validatePasswordPolicy` | `test/clinic_admin_whitebox_graph_spec.md` |
| Admin | `AdminClinicServiceImpl.createClinic`, `updateClinic`, `toggleClinicStatus` | `test/clinic_admin_whitebox_graph_spec.md` |
| Admin | `AdminDashboardServiceImpl.getDashboardData`, `getReportsData`, `getAuditLogs` | `test/clinic_admin_whitebox_graph_spec.md` |
| Security | `JwtTokenProvider.validateToken`, `JwtAuthenticationFilter.doFilterInternal` | `test/security_support_whitebox_graph_spec.md` |
| Security | `SecurityService`, `AuditAspect`, `RateLimitFilter.doFilter` | `test/security_support_whitebox_graph_spec.md` |
| Support | `SupportTicketServiceImpl.createTicket`, `updateTicketStatus`, filters/delete | `test/security_support_whitebox_graph_spec.md` |
| Support | `RiskAlertServiceImpl.getRiskAlertDashboard`, `mapToRiskPatientItem`, `dismissAlert`, `markAlertAsRead` | `test/security_support_whitebox_graph_spec.md` |
| Support | `NotificationServiceImpl`, `MedicalServiceServiceImpl`, `PrescriptionServiceImpl` | `test/security_support_whitebox_graph_spec.md` |

## 4. Muc uu tien thuc hien

| Priority | Ly do | Module |
|---:|---|---|
| P1 | Luong nghiep vu cot loi va co nhieu branch | Patient appointment, health metric, doctor appointment |
| P2 | Quan ly phong kham/admin, anh huong CRUD va phan quyen | Clinic patient/doctor, admin user |
| P3 | Cross-cutting risk cao | JWT, rate limit, audit, exception |
| P4 | Ho tro va bao cao | Risk alert, notification, support ticket, report |

## 5. Mapping voi test hien co

| Khu vuc | Test evidence hien co |
|---|---|
| Patient appointment | `PatientAppointmentServiceImplTest`, `PatientAppointmentControllerTest`, `patient_appointment_whitebox_spec.md` |
| Patient health metric | `PatientHealthMetricServiceImplTest`, `PatientHealthMetricControllerTest`, `patient_health_metric_whitebox_spec.md` |
| Doctor appointment | `DoctorAppointmentServiceImplTest`, `DoctorAppointmentControllerTest` |
| Clinic/admin | `ClinicPatientServiceImplTest`, `ClinicDoctorServiceImplTest`, `AdminUserServiceImplTest`, `AdminClinicServiceImplTest` |
| Security/config | `JwtTokenProvider` gap noted in coverage plan, `RateLimitFilter` branch target |
| Support/risk/notification | `SupportTicketServiceImplTest`, `RiskAlertServiceImplTest`, `NotificationServiceImplTest` |

## 6. Tieu chi hoan thanh

Mot class/method duoc xem la du white-box design khi co:

1. Bang decision/condition.
2. CFG Mermaid.
3. CC theo `E - N + 2P`.
4. Independent paths.
5. Bang test case basis path.
6. Ghi chu coverage/gap neu branch chua co JUnit evidence.
