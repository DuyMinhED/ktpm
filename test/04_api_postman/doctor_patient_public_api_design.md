# THIẾT KẾ TEST CASE API - PHÂN HỆ DOCTOR, PATIENT, NOTIFICATIONS, PUBLIC DOCTORS, MEDICAL SERVICES, VÀ SUPPORT TICKETS

## 1. Thông tin chung
- **Mã Ticket Jira:** KCPM-810
- **Phạm vi tài liệu:** Thiết kế các ca kiểm thử hộp đen (Black-box API Testing) cho toàn bộ các endpoint thuộc phân hệ Bác sĩ, Bệnh nhân, Thông báo, Danh sách Bác sĩ công khai, Dịch vụ y tế và Hỗ trợ kỹ thuật.
- **Tiêu chí bao phủ:**
  - **Success cases (200/201):** Dữ liệu đầu vào hợp lệ, trả về đúng định dạng chuẩn `ApiResponse<T>`.
  - **Validation cases (400):** Payload DTO lỗi định dạng, thiếu trường bắt buộc, vượt quá biên hợp lệ.
  - **Unauthorized cases (401):** Thiếu JWT token hoặc token hết hạn/không hợp lệ.
  - **Forbidden cases (403):** Người dùng có quyền truy cập nhưng truy cập trái vai trò (ví dụ: Patient gọi API của Doctor).
  - **Ownership cases (403):** Truy cập hoặc sửa đổi tài nguyên của người dùng khác hoặc phòng khám khác mà không có quyền sở hữu.
  - **Status cases:** Xác minh chuyển đổi trạng thái chính xác (ví dụ: Trạng thái lịch hẹn từ PENDING sang CONFIRMED).

---

## 2. Thiết kế chi tiết các ca kiểm thử (Test Cases)

### 2.1 Phân hệ Bác sĩ (Doctor Flow)

| Test Case ID | Test Flow | HTTP Request | User Role | Test Data | Expected Status | Expected Verification Point / Output Type | Type |
|---|---|---|---|---|---|---|---|
| **API-DOC-001** | Tạo lịch hẹn mới thành công | `POST /api/v1/doctor/appointments` | `DOCTOR` | `{"patientId": 1, "appointmentTime": "2026-08-01T09:00:00", "type": "TÁI_KHÁM", "notes": "Khám định kỳ"}` | `200 OK` | `success: true, message: "Appointment created successfully", data.id exists` | Success |
| **API-DOC-002** | Tạo lịch hẹn thiếu trường bắt buộc | `POST /api/v1/doctor/appointments` | `DOCTOR` | `{"patientId": null, "appointmentTime": ""}` | `400 Bad Request` | `success: false, message / validation errors containing fields` | Validation |
| **API-DOC-003** | Tạo lịch hẹn không có token | `POST /api/v1/doctor/appointments` | `NONE` | (Request hợp lệ) | `401 Unauthorized` | Không có token, bị từ chối bởi JwtAuthenticationEntryPoint | Unauthorized |
| **API-DOC-004** | Tạo lịch hẹn sai vai trò | `POST /api/v1/doctor/appointments` | `PATIENT` | (Request hợp lệ) | `403 Forbidden` | Bệnh nhân không được gọi API tạo lịch hẹn của Bác sĩ | Forbidden |
| **API-DOC-005** | Cập nhật trạng thái lịch hẹn thành công | `PUT /api/v1/doctor/appointments/1/status` | `DOCTOR` | `{"status": "CONFIRMED"}` | `200 OK` | `success: true, data.status: "CONFIRMED"` | Status / Success |
| **API-DOC-006** | Cập nhật trạng thái lịch hẹn sai logic nghiệp vụ | `PUT /api/v1/doctor/appointments/1/status` | `DOCTOR` | `{"status": "COMPLETED"}` khi đang `PENDING` | `400 Bad Request` | `success: false, message: "Invalid status transition"` | Status / Validation |
| **API-DOC-007** | Dời lịch hẹn đơn lẻ | `PUT /api/v1/doctor/appointments/1/reschedule` | `DOCTOR` | `{"newTime": "2026-08-05T10:00:00"}` | `200 OK` | `success: true, data.appointmentTime matches newTime` | Success |
| **API-DOC-008** | Dời lịch hẹn hàng loạt | `PUT /api/v1/doctor/appointments/batch-reschedule` | `DOCTOR` | `{"appointmentIds": [1, 2], "newDate": "2026-08-10"}` | `200 OK` | `success: true, data.movedCount: 2` | Success |
| **API-DOC-009** | Kê toa thuốc mới thành công | `POST /api/v1/doctor/prescriptions` | `DOCTOR` | `{"patientId": 1, "diagnosis": "Huyết áp cao", "items": [{"medicationName": "Amlodipine", "dosage": "5mg", "frequency": "1 viên/ngày", "durationDays": 30}]}` | `200 OK` | `success: true, message: "Prescription created successfully", data.items length: 1` | Success |
| **API-DOC-010** | Kê toa thuốc cho bệnh nhân thuộc phòng khám khác | `POST /api/v1/doctor/prescriptions` | `DOCTOR` | `{"patientId": 999}` (bệnh nhân thuộc phòng khám khác) | `403 Forbidden` | `success: false, message: "Access Denied / Not authorized to treat this patient"` | Ownership |

---

### 2.2 Phân hệ Bệnh nhân (Patient Flow)

| Test Case ID | Test Flow | HTTP Request | User Role | Test Data | Expected Status | Expected Verification Point / Output Type | Type |
|---|---|---|---|---|---|---|---|
| **API-PAT-001** | Lấy thông tin Dashboard bệnh nhân | `GET /api/v1/patient/dashboard` | `PATIENT` | None | `200 OK` | `success: true, data has upcomingAppointments, activePrescriptions, alerts` | Success |
| **API-PAT-002** | Xem dashboard bệnh nhân không có token | `GET /api/v1/patient/dashboard` | `NONE` | None | `401 Unauthorized` | Trả về thông điệp yêu cầu đăng nhập | Unauthorized |
| **API-PAT-003** | Lấy thông tin hồ sơ cá nhân bệnh nhân | `GET /api/v1/patient/profile` | `PATIENT` | None | `200 OK` | `success: true, data.email matches logging user` | Success |
| **API-PAT-004** | Cập nhật hồ sơ cá nhân thành công | `PUT /api/v1/patient/profile` | `PATIENT` | `{"fullName": "Nguyễn Văn D", "gender": "Nam", "phone": "0905555555", "email": "truongquocan@patient.com"}` | `200 OK` | `success: true, data.fullName: "Nguyễn Văn D"` | Success |
| **API-PAT-005** | Cập nhật hồ sơ cá nhân lỗi định dạng email | `PUT /api/v1/patient/profile` | `PATIENT` | `{"fullName": "Nguyễn Văn D", "email": "sai-dinh-dang"}` | `400 Bad Request` | `success: false, validation errors contain email` | Validation |
| **API-PAT-006** | Lấy danh sách danh bạ khẩn cấp | `GET /api/v1/patient/profile/emergency-contacts` | `PATIENT` | None | `200 OK` | `success: true, data is array of emergency contacts` | Success |
| **API-PAT-007** | Thêm danh bạ khẩn cấp mới | `POST /api/v1/patient/profile/emergency-contacts` | `PATIENT` | `{"contactName": "Nguyễn Thị Mẹ", "relationship": "Mẹ", "phone": "0901234567"}` | `200 OK` | `success: true, data.contactName: "Nguyễn Thị Mẹ"` | Success |
| **API-PAT-008** | Lấy danh sách lịch hẹn cá nhân | `GET /api/v1/patient/appointments` | `PATIENT` | None | `200 OK` | `success: true, data is array of appointments of this patient` | Success |
| **API-PAT-009** | Bệnh nhân cố ý truy cập hồ sơ bệnh nhân khác | `GET /api/v1/patient/profile/999` (nếu có id) | `PATIENT` | None | `403 Forbidden` | `success: false, message: "Access Denied"` | Ownership |

---

### 2.3 Phân hệ Thông báo (Notifications Flow)

| Test Case ID | Test Flow | HTTP Request | User Role | Test Data | Expected Status | Expected Verification Point / Output Type | Type |
|---|---|---|---|---|---|---|---|
| **API-NOT-001** | Lấy danh sách thông báo người dùng | `GET /api/v1/notifications` | `PATIENT` | None | `200 OK` | `success: true, data is array, items have id, title, content, isRead` | Success |
| **API-NOT-002** | Đánh dấu một thông báo đã đọc | `PUT /api/v1/notifications/1/read` | `PATIENT` | None | `200 OK` | `success: true, data.isRead: true` | Success / Status |
| **API-NOT-003** | Đánh dấu đọc thông báo của người khác | `PUT /api/v1/notifications/999/read` | `PATIENT` | (Thông báo thuộc user khác) | `403 Forbidden` | Bị chặn do vi phạm quyền sở hữu thông báo | Ownership |
| **API-NOT-004** | Xóa thông báo thành công | `DELETE /api/v1/notifications/1` | `PATIENT` | None | `200 OK` | `success: true, message: "Notification deleted"` | Success |
| **API-NOT-005** | Xóa thông báo không tồn tại | `DELETE /api/v1/notifications/99999` | `PATIENT` | None | `404 Not Found` | `success: false, message contains not found` | Validation / Logic |

---

### 2.4 Phân hệ Bác sĩ Công khai (Public Doctors Flow)

| Test Case ID | Test Flow | HTTP Request | User Role | Test Data | Expected Status | Expected Verification Point / Output Type | Type |
|---|---|---|---|---|---|---|---|
| **API-PUBDOC-001**| Lấy danh sách bác sĩ công khai không cần token | `GET /api/v1/public/doctors` | `NONE` | None | `200 OK` | `success: true, data is list of active doctors with public profiles` | Success |
| **API-PUBDOC-002**| Tìm kiếm bác sĩ theo chuyên khoa | `GET /api/v1/public/doctors?specialization=Tim%20mạch` | `NONE` | None | `200 OK` | `success: true, all doctor objects have specialization: "Tim mạch"` | Success |
| **API-PUBDOC-003**| Xem chi tiết bác sĩ công khai | `GET /api/v1/public/doctors/1` | `NONE` | None | `200 OK` | `success: true, data.id: 1, public details are visible` | Success |
| **API-PUBDOC-004**| Cập nhật bác sĩ công khai từ phía người dùng khách | `PUT /api/v1/public/doctors/1` (nếu có) | `NONE` | `{"fullName": "Hacker"}` | `401 Unauthorized` | Chặn chỉnh sửa nếu không có xác thực quản trị | Unauthorized |
| **API-PUBDOC-005**| Quản lý Phòng khám thêm Bác sĩ mới | `POST /api/v1/clinics/doctors` | `CLINIC_MANAGER`| `{"fullName": "Lê Văn C", "email": "levanc@care.com", "specialization": "Nhi", "phone": "0912999999"}` | `200 OK` | `success: true, data.fullName: "Lê Văn C"` | Success |
| **API-PUBDOC-006**| Quản lý Phòng khám khác cố gắng thêm bác sĩ vào phòng khám hiện tại | `POST /api/v1/clinics/1/doctors` | `CLINIC_MANAGER`| (Manager thuộc phòng khám 2 gọi API của phòng khám 1) | `403 Forbidden` | Từ chối do sai phạm phân quyền sở hữu cơ sở y tế | Ownership |

---

### 2.5 Phân hệ Dịch vụ Y tế (Medical Services Flow)

| Test Case ID | Test Flow | HTTP Request | User Role | Test Data | Expected Status | Expected Verification Point / Output Type | Type |
|---|---|---|---|---|---|---|---|
| **API-MED-001** | Lấy danh sách dịch vụ y tế công khai | `GET /api/v1/medical-services` | `NONE` | None | `200 OK` | `success: true, data is array of medical services` | Success |
| **API-MED-002** | Xem chi tiết một dịch vụ y tế | `GET /api/v1/medical-services/1` | `NONE` | None | `200 OK` | `success: true, data.id: 1` | Success |
| **API-MED-003** | Thêm mới dịch vụ y tế (chỉ cho phép Quản trị viên/Quản lý) | `POST /api/v1/medical-services` | `CLINIC_MANAGER`| `{"serviceName": "Khám tim mạch chuyên sâu", "price": 500000, "description": "Kiểm tra điện tâm đồ"}` | `200 OK` | `success: true, data.id exists` | Success |
| **API-MED-004** | Bệnh nhân cố tình thêm mới dịch vụ y tế | `POST /api/v1/medical-services` | `PATIENT` | (Request hợp lệ) | `403 Forbidden` | `success: false`, chặn do sai vai trò quyền hạn | Forbidden |
| **API-MED-005** | Thêm mới dịch vụ y tế với giá trị âm | `POST /api/v1/medical-services` | `CLINIC_MANAGER`| `{"serviceName": "Khám sai", "price": -50000}` | `400 Bad Request` | `success: false, validation errors contain price` | Validation |

---

### 2.6 Phân hệ Hỗ trợ Kỹ thuật (Support Tickets Flow)

| Test Case ID | Test Flow | HTTP Request | User Role | Test Data | Expected Status | Expected Verification Point / Output Type | Type |
|---|---|---|---|---|---|---|---|
| **API-SUP-001** | Bệnh nhân gửi yêu cầu hỗ trợ thành công | `POST /api/v1/support-tickets` | `PATIENT` | `{"title": "Lỗi chat", "description": "Không gửi được hình ảnh qua chat", "category": "KỸ_THUẬT"}` | `200 OK` | `success: true, data.status: "OPEN", data.ticketCode exists` | Success / Status |
| **API-SUP-002** | Bệnh nhân gửi yêu cầu thiếu nội dung | `POST /api/v1/support-tickets` | `PATIENT` | `{"title": "", "description": ""}` | `400 Bad Request` | `success: false, validation errors on title/description` | Validation |
| **API-SUP-003** | Bác sĩ lấy danh sách ticket hỗ trợ (không được quyền) | `GET /api/v1/support-tickets` | `DOCTOR` | None | `403 Forbidden` | Chặn do Bác sĩ không có chức năng xử lý support ticket | Forbidden |
| **API-SUP-004** | Quản trị viên (Admin) lấy danh sách support ticket | `GET /api/v1/support-tickets` | `ADMIN` | None | `200 OK` | `success: true, data is array of tickets` | Success |
| **API-SUP-005** | Quản trị viên cập nhật trạng thái support ticket | `PUT /api/v1/support-tickets/1/status` | `ADMIN` | `{"status": "IN_PROGRESS"}` | `200 OK` | `success: true, data.status: "IN_PROGRESS"` | Success / Status |
| **API-SUP-006** | Bệnh nhân xem danh sách support ticket cá nhân | `GET /api/v1/support-tickets/my-tickets` | `PATIENT` | None | `200 OK` | `success: true, data only contains tickets created by this patient` | Success / Ownership |
