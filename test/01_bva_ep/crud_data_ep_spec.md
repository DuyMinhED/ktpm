# BÁO CÁO: THIẾT KẾ CA KIỂM THỬ PHÂN VÙNG TƯƠNG ĐƯƠNG (EQUIVALENCE PARTITIONING) CHO DỮ LIỆU CRUD CHÍNH

**Mã Ticket Jira:** KCPM-755  
**Người thực hiện (Assignee):** Trần Lê Quang (quangtl9558)  
**Email:** quangtl9558@ut.edu.vn  
**Đối tượng phân tích:** Các API CRUD chính thuộc các module: Clinic, User, Patient, Health Metrics, Appointment — dựa trên đặc tả SRS, DTO validation và API contract.  
**Kỹ thuật áp dụng:** Equivalence Partitioning (EP) — Phân vùng tương đương

---

## 1. PHÂN TÍCH PHÂN VÙNG TƯƠNG ĐƯƠNG

### 1.1. Module Phòng khám — Create Clinic (POST /api/v1/admin/clinics)

**DTO:** `CreateClinicRequest`  
**Các trường bắt buộc:** `name` (@NotBlank, @Size max=200), `clinicCode` (@NotBlank, @Size max=20), `adminFullName` (@NotBlank), `adminEmail` (@NotBlank), `adminPassword` (@NotBlank).

| Phân vùng | Mô tả | Đại diện |
| :--- | :--- | :--- |
| **Valid** | Tất cả trường bắt buộc hợp lệ, clinicCode chưa tồn tại | `{ name: "PK ABC", clinicCode: "PK001", adminFullName: "Nguyễn A", adminEmail: "admin@pk.com", adminPassword: "12345678" }` |
| **Invalid — Missing Required** | Một hoặc nhiều trường bắt buộc bị bỏ trống | `{ name: "", clinicCode: "", ... }` |
| **Invalid — Duplicate** | `clinicCode` đã tồn tại trong hệ thống | `{ clinicCode: "PK001" }` (đã tạo trước đó) |

### 1.2. Module Người dùng — Create User (POST /api/v1/admin/users)

**DTO:** `CreateUserRequest`  
**Các trường bắt buộc:** `fullName` (@NotBlank, @Size max=100), `email` (@NotBlank, @Email, @Size max=100), `password` (@NotBlank, @Size min=8), `role` (@NotBlank — ADMIN/DOCTOR/CLINIC_MANAGER/PATIENT).

| Phân vùng | Mô tả | Đại diện |
| :--- | :--- | :--- |
| **Valid** | Email đúng format, role hợp lệ, password ≥ 8 ký tự | `{ fullName: "BS. Trần B", email: "bs@pk.com", password: "Pass1234", role: "DOCTOR" }` |
| **Invalid — Email Format** | Email không đúng định dạng RFC 5322 | `{ email: "not-an-email" }` |
| **Invalid — Role** | Role không thuộc tập hợp cho phép | `{ role: "SUPERADMIN" }` |
| **Invalid — Duplicate Email** | Email đã tồn tại trong hệ thống | `{ email: "bs@pk.com" }` (đã tạo trước đó) |

### 1.3. Module Chỉ số Sức khỏe — Create Health Metric (POST /api/v1/patient/health-metrics)

**DTO:** `CreateHealthMetricRequest`  
**Các trường bắt buộc:** `metricType` (@NotNull — BLOOD_SUGAR/BLOOD_PRESSURE/HEART_RATE/HBA1C/SPO2), `value` (@NotNull), `unit` (@NotBlank).  
**Quy tắc nghiệp vụ (SRS §6.1):** Nếu `metricType = BLOOD_PRESSURE` thì bắt buộc phải có `valueSecondary` (dia).

| Phân vùng | Mô tả | Đại diện |
| :--- | :--- | :--- |
| **Valid** | Loại chỉ số hợp lệ, giá trị hợp lệ | `{ metricType: "BLOOD_SUGAR", value: 5.5, unit: "mmol/L" }` |
| **Invalid — Wrong Type** | `metricType` không thuộc tập hợp cho phép | `{ metricType: "TEMPERATURE", value: 37.5, unit: "°C" }` |
| **Invalid — Missing Secondary** | `BLOOD_PRESSURE` thiếu `valueSecondary` (dia) | `{ metricType: "BLOOD_PRESSURE", value: 120, unit: "mmHg", valueSecondary: null }` |

### 1.4. Module Lịch hẹn — Create Appointment (POST /api/v1/patient/appointments)

**DTO:** `CreateAppointmentRequest`  
**Các trường bắt buộc:** `doctorId` (@NotNull), `appointmentTime` (@NotNull), `appointmentType` (@NotBlank — IN_PERSON/ONLINE).  
**Quy tắc nghiệp vụ (SRS §6.3.A):** `appointmentTime` phải trong khoảng `[t_now + 3h, t_now + 15d]`.

| Phân vùng | Mô tả | Đại diện |
| :--- | :--- | :--- |
| **Valid** | Thời gian hợp lệ, bác sĩ tồn tại, loại hẹn hợp lệ | `{ doctorId: 5, appointmentTime: t_now + 4h, appointmentType: "ONLINE" }` |
| **Invalid — Wrong Type** | `appointmentType` không hợp lệ | `{ appointmentType: "VIDEO_CALL" }` |
| **Invalid — Relationship** | `doctorId` không tồn tại trong hệ thống | `{ doctorId: 99999 }` |

---

## 2. BẢNG CA KIỂM THỬ EP (7 TEST CASES)

| Mã TC | Module / API | Phân vùng | Dữ liệu đại diện | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **TC-EP-01** | Create Clinic (POST /api/v1/admin/clinics) | **Valid** — Tất cả trường hợp lệ | `{ name: "PK Đa khoa ABC", clinicCode: "DKABC", phone: "0281234567", adminFullName: "Nguyễn Văn A", adminEmail: "admin@dkabc.vn", adminPassword: "Admin@123" }` | `201 Created` — Tạo phòng khám thành công, trả về `AdminClinicResponse`. |
| **TC-EP-02** | Create Clinic (POST /api/v1/admin/clinics) | **Invalid — Missing Required** — Thiếu trường bắt buộc | `{ name: "", clinicCode: "", adminFullName: null, adminEmail: "", adminPassword: "" }` | `400 Bad Request` — Validation failed: "Tên phòng khám không được để trống", "Mã định danh không được để trống", v.v. |
| **TC-EP-03** | Create Clinic (POST /api/v1/admin/clinics) | **Invalid — Duplicate** — Mã phòng khám trùng | `{ name: "PK Mới", clinicCode: "DKABC", adminFullName: "Trần B", adminEmail: "new@pk.vn", adminPassword: "Pass1234" }` (clinicCode `"DKABC"` đã tồn tại từ TC-EP-01) | `409 Conflict` hoặc `400 Bad Request` — "Mã phòng khám đã tồn tại". |
| **TC-EP-04** | Create User (POST /api/v1/admin/users) | **Invalid — Wrong Type (Email)** — Email sai định dạng | `{ fullName: "BS. Lê C", email: "not-an-email", password: "Doctor@123", role: "DOCTOR" }` | `400 Bad Request` — Validation failed: "Email không hợp lệ". |
| **TC-EP-05** | Create User (POST /api/v1/admin/users) | **Invalid — Wrong Type (Role)** — Role không hợp lệ | `{ fullName: "Nguyễn D", email: "d@pk.vn", password: "User@1234", role: "SUPERADMIN" }` | `400 Bad Request` — "Vai trò không hợp lệ" hoặc `IllegalArgumentException`. |
| **TC-EP-06** | Create Health Metric (POST /api/v1/patient/health-metrics) | **Invalid — Wrong Type (MetricType)** — Loại chỉ số không hợp lệ | `{ metricType: "TEMPERATURE", value: 37.5, unit: "°C" }` | `400 Bad Request` — "Loại chỉ số không hợp lệ" hoặc `IllegalArgumentException`. |
| **TC-EP-07** | Create Appointment (POST /api/v1/patient/appointments) | **Invalid — Relationship** — Bác sĩ không tồn tại | `{ doctorId: 99999, appointmentTime: "t_now + 4h", appointmentType: "IN_PERSON" }` | `404 Not Found` — `ResourceNotFoundException`: "Bác sĩ không tồn tại". |

---

## 3. MA TRẬN BAO PHỦ PHÂN VÙNG

| Loại phân vùng | Số TC | Các TC bao phủ |
| :--- | :---: | :--- |
| **Valid** (Dữ liệu hợp lệ) | 1 | TC-EP-01 |
| **Invalid — Missing Required** (Thiếu trường bắt buộc) | 1 | TC-EP-02 |
| **Invalid — Duplicate** (Dữ liệu trùng lặp) | 1 | TC-EP-03 |
| **Invalid — Wrong Type** (Sai định dạng / kiểu dữ liệu) | 3 | TC-EP-04, TC-EP-05, TC-EP-06 |
| **Invalid — Relationship** (Quan hệ dữ liệu không hợp lệ) | 1 | TC-EP-07 |
| **Tổng** | **7** | |

---

## 4. KẾT LUẬN

*   Đã thiết kế thành công **7 ca kiểm thử EP** bao phủ đầy đủ 5 loại phân vùng tương đương theo yêu cầu đề bài: Valid, Duplicate, Missing Required Field, Wrong Type, Invalid Relationship.
*   Các ca kiểm thử được phân bố trên **4 module** chính của hệ thống:
    *   **Clinic Management:** 3 TC (valid, missing, duplicate).
    *   **User Management:** 2 TC (wrong email format, wrong role).
    *   **Health Metrics:** 1 TC (wrong metric type).
    *   **Appointment:** 1 TC (invalid relationship — bác sĩ không tồn tại).
*   Mỗi ca kiểm thử bao gồm dữ liệu đại diện cụ thể và kết quả mong đợi rõ ràng (HTTP status code + thông báo lỗi), đảm bảo tính khả thi khi triển khai kiểm thử thực tế trên Postman hoặc JUnit.
---

## 5. Completion Matrix For Execution

The original EP table provides representative data and expected results. The following matrix adds the missing execution information: preconditions, steps, automation target, and traceability.

| Test Case | Preconditions | Steps | Automation Target | Evidence / Traceability |
|---|---|---|---|---|
| TC-EP-01 | Admin token valid; clinic code unused | POST `/api/v1/admin/clinics` with valid payload; assert created clinic and manager link | Postman + controller/service JUnit | `AdminClinicServiceImplTest`, `AdminControllerTest` |
| TC-EP-02 | Admin token valid | POST `/api/v1/admin/clinics` with blank required fields; assert 400 validation errors | DTO/controller test + Postman | `ClinicRequestValidationTest`, `AdminControllerTest` |
| TC-EP-03 | Admin token valid; duplicate clinic code already exists | POST clinic with existing `clinicCode`; assert business error | Service/API test | `AdminClinicServiceImplTest` |
| TC-EP-04 | Admin token valid | POST `/api/v1/admin/users` with invalid email; assert DTO validation error | DTO/controller test | `CreateUserRequestValidationTest` |
| TC-EP-05 | Admin token valid | POST `/api/v1/admin/users` with invalid role; assert validation/business error | DTO/service test | `CreateUserRequestValidationTest`, `AdminUserServiceImplTest` |
| TC-EP-06 | Patient token valid | POST health metric with unsupported `metricType`; assert parse/validation error | Service/API test | `PatientHealthMetricServiceImplTest`, `PatientHealthMetricControllerTest` |
| TC-EP-07 | Patient token valid; doctor id does not exist | POST appointment with missing doctor id; assert current code behavior and record gap if service allows nullable doctor metadata | Service/API test | `PatientAppointmentServiceImplTest`, `patient_appointment_whitebox_spec.md` |

## 6. Code-Based Gaps To Record

| Gap | Impact | Required handling |
|---|---|---|
| `CreateAppointmentRequest.appointmentType` is non-blank but not strongly enum-validated in service | Invalid values may still create appointment with null location/link | Keep EP test as negative API/DTO case, and record service validation gap if request bypasses controller |
| Patient appointment doctor lookup currently uses `orElse(null)` | Non-existing doctor can become a soft success path instead of 404 in direct service tests | Align expected result by layer: API requirement may expect 404, service code currently tolerates null doctor |
| Some DTO rules are stricter than service rules | Direct service tests may pass values that controller rejects | Record automation target per layer before executing |

## 7. Standardized Boundary Value Addendum

This EP file covers representative CRUD partitions. The following BVA table must be used to make the CRUD data design complete.

| Module | Field | Boundary rule | Minimum boundary values | Expected result | Minimum TC count |
|---|---|---|---|---|---:|
| Clinic | `name` | `1..200` characters | length `0`, `1`, `199`, `200`, `201` | blank and `201` rejected; `1/199/200` accepted | 5 |
| Clinic | `clinicCode` | `1..20` characters and unique | length `0`, `1`, `19`, `20`, `21`, duplicate valid code | blank, `21`, duplicate rejected; `1/19/20` accepted | 6 |
| Clinic admin | `adminPassword` | minimum `8` | length `7`, `8`, `9` | `7` rejected; `8/9` accepted | 3 |
| User | `fullName` | `1..100` characters | length `0`, `1`, `99`, `100`, `101` | blank and `101` rejected; `1/99/100` accepted | 5 |
| User | `email` | valid format, max `100` | valid length `99`, valid length `100`, valid length `101`, invalid format | `101` and invalid format rejected | 4 |
| User | `password` | minimum `8` | length `7`, `8`, `9` | `7` rejected; `8/9` accepted | 3 |
| Health metric | `metricType` | supported enum values only | each supported value once, `TEMPERATURE`, `null` | supported values accepted; unsupported/null rejected | 7 |
| Health metric | `BLOOD_PRESSURE.valueSecondary` | required for blood pressure | missing secondary, secondary present | missing rejected or recorded as service gap; present accepted | 2 |
| Appointment | `appointmentTime` | `now + 3h` to `now + 15d` | `now+2h59m`, `now+3h`, `now+3h1m`, `now+14d23h59m`, `now+15d`, `now+15d1m` | outside rejected; inside accepted | 6 |
| Appointment | `doctorId` | positive existing id | `null`, `0`, `1 existing`, positive non-existing id | null/0 rejected; existing accepted; non-existing follows service/API rule | 4 |

Minimum BVA cases to add for CRUD data: `45` independent rows. For a practical smoke set, use `16` rows: clinic name `0/1/200/201`, clinicCode `20/21/duplicate`, user password `7/8`, health metric unsupported type, blood pressure missing secondary, appointment lower and upper four boundary values.

| New TC | Module | Input | Expected result | Automation target |
|---|---|---|---|---|
| TC-BVA-CRUD-01 | Clinic | `name` length `201` | DTO validation fails | `ClinicRequestValidationTest` |
| TC-BVA-CRUD-02 | Clinic | `clinicCode` length `21` | DTO validation fails | `ClinicRequestValidationTest` |
| TC-BVA-CRUD-03 | Clinic | duplicate `clinicCode` length within valid range | Business validation fails | `AdminClinicServiceImplTest` |
| TC-BVA-CRUD-04 | User | `fullName` length `101` | DTO validation fails | `CreateUserRequestValidationTest` |
| TC-BVA-CRUD-05 | User | `email` length `101` | DTO validation fails | `CreateUserRequestValidationTest` |
| TC-BVA-CRUD-06 | Health Metric | `metricType = TEMPERATURE` | Validation or enum parse fails | `CreateHealthMetricRequestValidationTest` |
| TC-BVA-CRUD-07 | Health Metric | `BLOOD_PRESSURE` without `valueSecondary` | Rejected or recorded as gap | `PatientHealthMetricServiceImplTest` |
| TC-BVA-CRUD-08 | Appointment | `appointmentTime = now + 15d1m` | Business validation fails | `PatientAppointmentServiceImplTest` |
