# BÁO CÁO: PHÂN TÍCH ĐIỀU KIỆN KIỂM THỬ BACKEND (SERVICE/CONTROLLER VÀ DATABASE)

**Mã Ticket Jira:** KCPM-807  
**Người thực hiện (Assignee):** Trần Lê Quang (quangtl9558)  
**Email:** quangtl9558@ut.edu.vn  
**Đối tượng phân tích:** Toàn bộ Controllers/Services thuộc 6 module chính (Auth, Admin, Clinic, Doctor, Patient, Support) và các mối quan hệ dữ liệu (Entity/Repository) của hệ thống DamDiep Healthcare.  
**Nguồn phân tích:** 22 Controllers, DTO validation annotations, Entity relationships (`@ManyToOne`, `@OneToMany`), `GlobalExceptionHandler.java`, `application-test.yml`.  
**Kỹ thuật áp dụng:** Backend Analysis, API Analysis, Database Test, Test Condition Design.

---

## 1. TỔNG QUAN CƠ CHẾ XỬ LÝ NGOẠI LỆ TOÀN CỤC

Hệ thống sử dụng `GlobalExceptionHandler.java` để ánh xạ ngoại lệ sang HTTP status code:

| Exception | HTTP Status | Ghi chú |
| :--- | :---: | :--- |
| `ResourceNotFoundException` | 404 | Dùng đúng chuẩn cho "not found" |
| `AccessDeniedException` | 403 | Dùng cho lỗi phân quyền |
| `AuthenticationException` | 401 | Dùng cho lỗi xác thực |
| `MethodArgumentNotValidException` | 400 | Lỗi validate DTO (`@Valid`) |
| `RuntimeException` (chung) | **500** | ⚠️ Nhiều service ném `RuntimeException`/`IllegalStateException` thô cho lỗi nghiệp vụ (not-found, business rule) thay vì dùng `ResourceNotFoundException` — gây sai lệch mã lỗi (đã ghi nhận bug thực tế ở KCPM-782, KCPM-802). |
| `Exception` (chung) | 500 | Bắt tất cả lỗi không xác định |

---

## 2. BẢNG ĐIỀU KIỆN KIỂM THỬ THEO MODULE

### 2.1. Module AUTH (`AuthRestController`)

| # | Điều kiện | Nhánh | Input | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Health check | Success | `GET /auth/health` | 200, `status = "UP"` |
| 2 | Login đúng thông tin | Success | email + password hợp lệ | 200, trả `accessToken`, `role`, `fullName` |
| 3 | Login sai mật khẩu | Exception (Auth) | password sai | 401, `AuthenticationException` |
| 4 | Login email không tồn tại | Exception (Auth) | email không có trong DB | 401 |
| 5 | Login thiếu field bắt buộc | Validation | `email = ""`, `password = null` | 400, `MethodArgumentNotValidException` |
| 6 | Login tài khoản bị khóa (status = INACTIVE) | Exception | user status ≠ ACTIVE | 401/403 tùy cấu hình `UserDetails.isEnabled()` |

### 2.2. Module ADMIN (`AdminController`, `AdminUserService`, `AdminClinicService`)

| # | Điều kiện | Nhánh | Input | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Lấy dashboard/reports/audit-logs | Success | JWT role=ADMIN | 200, data hợp lệ |
| 2 | Truy cập `/admin/*` không có token | Unauthorized | Không header Authorization | 401 |
| 3 | Truy cập `/admin/*` với role khác ADMIN | Forbidden | JWT role=DOCTOR/PATIENT | 403 (do `@PreAuthorize("hasRole('ADMIN')")` cấp Controller) |
| 4 | Tạo Clinic với `clinicCode` trùng | Validation/Duplicate | `clinicCode` đã tồn tại | 400/409 |
| 5 | Tạo Clinic thiếu trường bắt buộc | Validation | `name = ""`, `adminEmail = null` | 400 |
| 6 | Tạo User với email trùng | Duplicate | email đã tồn tại | 400, `IllegalArgumentException("Email already exists")` |
| 7 | Tạo User với password < 8 ký tự | Validation | `password.length() < 8` | 400, `"Mật khẩu phải có ít nhất 8 ký tự"` |
| 8 | Cập nhật User không tồn tại | Not Found | `id = 99999` | Hiện tại: `NoSuchElementException` → **500** (nên là 404) |
| 9 | Toggle Clinic status | Success | `id` hợp lệ | 200, đảo trạng thái ACTIVE ↔ INACTIVE |
| 10 | Toggle status với `id` không tồn tại | Not Found | `id = 99999` | `NoSuchElementException` → **500** (nên là 404) |

### 2.3. Module CLINIC (`ClinicDashboardController`, `ClinicDashboardServiceImpl`)

| # | Điều kiện | Nhánh | Input | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Lấy dashboard/profile/conditions của clinic mình quản lý | Success | JWT role=CLINIC_MANAGER, đúng `clinicId` | 200 |
| 2 | Truy cập clinic của người khác | Forbidden (data-level) | Đúng role CLINIC_MANAGER nhưng sai `clinicId` | 403, `@securityService.isClinicManagerOf(#clinicId)` trả `false` |
| 3 | Không có token | Unauthorized | Thiếu Authorization header | 401 |
| 4 | Cập nhật Appointment đã COMPLETED/CANCELLED | Exception (Business rule) | `appointment.status ∈ {COMPLETED, CANCELLED}` | Hiện tại: `IllegalStateException` → **500** (bug đã ghi nhận ở KCPM-782, nên là 400) |
| 5 | Cập nhật Appointment không tồn tại trong clinic | Not Found | `appointmentId` không thuộc `clinicId` | 403/404 tùy điều kiện `appointment.getPatient().getClinicId()` |
| 6 | Tạo/Update Medical Service | Exception (Role format bug) | Role field không đồng nhất `"ADMIN"` vs `"ROLE_ADMIN"` | Hiện tại: 403 sai cho tài khoản hợp lệ (bug đã ghi nhận ở KCPM-802) |

### 2.4. Module DOCTOR (`DoctorController`, `DoctorPatientController`, `DoctorAppointmentController`)

| # | Điều kiện | Nhánh | Input | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Lấy danh sách bệnh nhân của bác sĩ | Success | JWT role=DOCTOR | 200, Page schema |
| 2 | Lọc bệnh nhân theo `riskLevel`/`condition`/`search` | Success (filter) | Query params hợp lệ | 200, dữ liệu khớp điều kiện lọc |
| 3 | Truy cập chi tiết bệnh nhân không thuộc quản lý | Forbidden (data-level) | `@securityService.canAccessPatient(#id)` = false | 403 |
| 4 | Bác sĩ cập nhật trạng thái Appointment (Update status) | Success | `status ∈ {SCHEDULED, CANCELLED, COMPLETED}` | 200, gửi notification tương ứng |
| 5 | Bác sĩ cập nhật Appointment không phải của mình | Forbidden | `appointment.doctorId ≠ currentDoctorId` | 403 |
| 6 | Tạo Doctor mới | Forbidden (role) | JWT role ≠ ADMIN | 403 (`@PreAuthorize("hasRole('ADMIN')")`) |
| 7 | Doctor tự cập nhật hồ sơ của mình | Success | `@securityService.isDoctorSelf(#id)` = true | 200 |
| 8 | Doctor cập nhật hồ sơ bác sĩ khác | Forbidden | `isDoctorSelf` = false, role ≠ ADMIN | 403 |
| 9 | Xóa Doctor không tồn tại | Not Found | `id = 99999` | 404 (nếu dùng `ResourceNotFoundException`) hoặc lỗi khác tùy implementation |

### 2.5. Module PATIENT (`PatientProfileController`, `PatientHealthMetricController`, `PatientAppointmentController`)

| # | Điều kiện | Nhánh | Input | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Lấy/Cập nhật hồ sơ cá nhân | Success | JWT role=PATIENT | 200 |
| 2 | Ghi nhận chỉ số sức khỏe hợp lệ | Success | `metricType`, `value`, `unit` đầy đủ | 201 Created, `status` được phân loại tự động (theo SRS §6.1) |
| 3 | Ghi nhận chỉ số thiếu trường bắt buộc | Validation | `metricType = null` | 400 |
| 4 | Ghi nhận `metricType` không hợp lệ | Validation | `metricType = "TEMPERATURE"` (ngoài enum) | 400/`IllegalArgumentException` |
| 5 | Đặt lịch hẹn (`create`) trong vòng < 3 giờ tới | Validation (Business rule, SRS §6.3.A) | `appointmentTime < now + 3h` | 400 |
| 6 | Đặt lịch hẹn > 15 ngày tới | Validation (Business rule) | `appointmentTime > now + 15d` | 400 |
| 7 | Hủy lịch hẹn đã SCHEDULED | Exception (Business rule) | `status = SCHEDULED` | 400, không cho tự hủy (phải liên hệ phòng khám) |
| 8 | Hủy lịch hẹn không phải của mình | Forbidden | `appointment.patient.userId ≠ currentUserId` | 403 |
| 9 | Xóa chỉ số sức khỏe (`DELETE /health-metrics/{id}`) không tồn tại | Not Found | `id = 99999` | 404/400 |
| 10 | Xem thông tin bệnh nhân khác (thông qua endpoint Doctor) | Forbidden (data-level) | Không có quan hệ patient-doctor hợp lệ | 403 |

### 2.6. Module SUPPORT (`SupportTicketController`)

| # | Điều kiện | Nhánh | Input | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Tạo ticket hỗ trợ mới | Success | Body hợp lệ | 200/201, `SupportTicket` được tạo |
| 2 | Lấy danh sách ticket toàn hệ thống | Success | Không giới hạn role (⚠️ xem ghi chú bảo mật) | 200, Page schema |
| 3 | Lấy ticket theo `clinicId` | Success | `clinicId` hợp lệ | 200 |
| 4 | Lấy ticket theo `creatorId` | Success | `creatorId` hợp lệ | 200 |
| 5 | Lấy ticket theo `id` không tồn tại | Not Found | `id = 99999` | Tùy implementation (`Optional.orElseThrow()` nếu có) |
| 6 | Lấy ticket theo `code` không tồn tại | Not Found | `code = "INVALID"` | Tương tự trên |
| 7 | Cập nhật status ticket | Success | `status` hợp lệ (OPEN/IN_PROGRESS/RESOLVED/CLOSED) | 200 |
| 8 | Xóa ticket | Success | `id` hợp lệ | 200/204 |
| **⚠️ Ghi chú bảo mật** | **`SupportTicketController` KHÔNG có bất kỳ `@PreAuthorize` nào** ở cấp Controller lẫn method — mọi người dùng đã đăng nhập (hoặc thậm chí chưa đăng nhập, tùy cấu hình `SecurityFilterChain`) đều có thể xem/sửa/xóa ticket của **bất kỳ ai**. Đây là **lỗ hổng bảo mật tiềm ẩn** cần rà soát thêm. | | | |

---

## 3. ĐIỀU KIỆN KIỂM THỬ QUAN HỆ DỮ LIỆU (DATABASE RELATIONSHIPS)

Hệ thống có **23 entity** với **18 mối quan hệ** (`@ManyToOne`/`@OneToMany`/`@ManyToMany`). Các điều kiện kiểm thử quan trọng liên quan đến toàn vẹn dữ liệu:

| # | Quan hệ | Điều kiện kiểm thử | Kết quả mong đợi |
| :--- | :--- | :--- | :--- |
| 1 | `Appointment.patient` (`@ManyToOne`, `nullable = false`) | Tạo Appointment với `patientId` không tồn tại | Lỗi ràng buộc khóa ngoại hoặc `ResourceNotFoundException` ở tầng Service trước khi chạm DB |
| 2 | `Patient.prescriptions/appointments/healthMetrics` (`@OneToMany`, `cascade = CascadeType.ALL`) | Xóa một `Patient` (nếu có nghiệp vụ xóa) | Toàn bộ `Prescription`, `Appointment`, `HealthMetric` liên quan bị xóa theo (cascade) — cần kiểm thử để tránh xóa nhầm dữ liệu quan trọng |
| 3 | `User.clinicId` (không phải FK chính thức, chỉ là `Long`) | Tạo/Update User với `clinicId` không tồn tại trong bảng `clinics` | **Không có ràng buộc DB** — hệ thống chấp nhận `clinicId` "mồ côi" (orphan reference), có thể gây lỗi logic khi join dữ liệu sau này |
| 4 | `Clinic.managerId` (không phải FK chính thức) | Tương tự trên | Cùng rủi ro "orphan reference" |
| 5 | Soft-delete pattern (`isDeleted` field) | Truy vấn danh sách sau khi soft-delete một bản ghi | Phải đảm bảo tất cả query dùng `...AndIsDeletedFalse` để không hiển thị bản ghi đã xóa mềm — rủi ro nếu quên thêm điều kiện này ở một số Repository method mới |
| 6 | Ràng buộc `UNIQUE` trên `email` (User), `clinicCode` (Clinic) | Insert trùng giá trị unique | DB ném `DataIntegrityViolationException` nếu tầng Service không check trước — cần xác nhận có `@ExceptionHandler` xử lý riêng cho lỗi này hay bị rơi vào handler `Exception` chung (500) |

---

## 4. TỔNG HỢP SỐ LƯỢNG ĐIỀU KIỆN KIỂM THỬ

| Module | Success | Validation | Unauthorized/Forbidden | Not Found | Exception (Business) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Auth | 2 | 1 | 2 | 0 | 1 |
| Admin | 3 | 2 | 2 | 2 | 1 |
| Clinic | 1 | 0 | 2 | 1 | 2 |
| Doctor | 4 | 0 | 3 | 1 | 1 |
| Patient | 2 | 3 | 2 | 1 | 2 |
| Support | 5 | 0 | 0 (⚠️ lỗ hổng) | 2 | 0 |
| Database | — | — | — | — | 5 (toàn vẹn dữ liệu) |
| **Tổng** | **17** | **6** | **11** | **7** | **12** |

---

## 5. KẾT LUẬN

*   Đã phân tích đầy đủ **22 Controllers** thuộc 6 module (Auth, Admin, Clinic, Doctor, Patient, Support), xác định **53 điều kiện kiểm thử** trải đều trên 5 nhóm nhánh: Success, Validation, Unauthorized/Forbidden, Not Found, Exception (Business rule).
*   Phát hiện **3 vấn đề đáng chú ý** trong quá trình phân tích:
    1.  **Anti-pattern lặp lại:** Nhiều service (`AdminUserServiceImpl`, `ClinicDashboardServiceImpl`, `MedicalServiceServiceImpl`) ném `RuntimeException`/`IllegalStateException`/`NoSuchElementException` thô cho lỗi nghiệp vụ, dẫn đến sai mã lỗi HTTP (500 thay vì 400/404) — đã xác nhận bằng kiểm thử thực tế ở KCPM-782 và KCPM-802.
    2.  **Lỗ hổng bảo mật tiềm ẩn:** `SupportTicketController` không có bất kỳ ràng buộc `@PreAuthorize` nào, cần rà soát và bổ sung phân quyền phù hợp (ví dụ: chỉ ADMIN/CLINIC_MANAGER được xem toàn bộ ticket, người tạo chỉ xem được ticket của mình).
    3.  **Thiếu ràng buộc khóa ngoại chính thức:** Các trường `clinicId`, `managerId`, `doctorId` trong nhiều entity chỉ là kiểu `Long` thông thường (không phải `@ManyToOne` với `@JoinColumn`), khiến DB không tự động ngăn chặn dữ liệu "mồ côi" — rủi ro toàn vẹn dữ liệu về lâu dài.
*   Bảng điều kiện kiểm thử này có thể dùng làm cơ sở để thiết kế test case chi tiết (Unit Test, Integration Test, Postman Test) cho các task kiểm thử tiếp theo của từng module.