# KẾ HOẠCH KIỂM THỬ (TEST PLAN) - HỆ THỐNG DAMDIEP HEALTHCARE

## 1. Mục tiêu kiểm thử (Test Objectives)
Mục tiêu cốt lõi của kế hoạch kiểm thử này là nhằm thiết lập một hệ thống đảm bảo chất lượng toàn diện cho **Hệ thống Quản lý Bệnh Mãn Tính Trực Tuyến DamDiep Healthcare**:
- **Độ tin cậy của tính năng:** Xác minh rằng toàn bộ các tính năng được định nghĩa trong Đặc tả yêu cầu phần mềm ([SRS.md](file:///d:/UTH/KTPM/ktpm/docs/SRS.md)) hoạt động chính xác, ổn định và không phát sinh lỗi nghiêm trọng.
- **Tính toàn vẹn của phân quyền:** Đảm bảo hệ thống phân quyền (Role-based access control - RBAC) hoạt động chính xác giữa các nhóm đối tượng: Admin, Clinic Manager, Doctor, và Patient thông qua kiểm tra JWT Token.
- **Tính tức thời của hệ thống chat:** Kiểm thử luồng truyền nhận tin nhắn qua WebSocket (STOMP) thời gian thực giữa Bác sĩ và Bệnh nhân hoạt động mượt mà, không bị trễ hay mất thông điệp.
- **Khả năng tự động hóa và bao phủ API:** Xây dựng và thực thi bộ kịch bản kiểm thử API tự động nhằm kiểm tra hợp đồng API (API contract testing) và các logic nghiệp vụ phức tạp.

---

## 2. Phạm vi kiểm thử (Scope of Testing)

### 2.1 Trong phạm vi kiểm thử (In-Scope)
Kiểm thử toàn diện các phân hệ phần mềm bao gồm:
- **Hệ thống & Chung (Common & System):**
  - Đăng ký và Đăng nhập (Authentication & JWT).
  - Quản lý Hồ sơ cá nhân (Profile) & thay đổi mật khẩu.
  - Tải lên ảnh đại diện và hồ sơ bệnh án (File Upload).
  - Hệ thống thông báo thời gian thực (Notification).
  - Trợ lý ảo y tế AI Chatbot.
- **Phân hệ Bệnh nhân (Patient):**
  - Patient Dashboard: theo dõi biểu đồ chỉ số sinh tồn và danh sách lịch hẹn/lịch uống thuốc.
  - Quản lý Emergency Contacts (Danh bạ khẩn cấp).
  - Theo dõi chỉ số sức khỏe cá nhân (Health Metrics).
  - Lịch sử toa thuốc, phác đồ điều trị và đặt lịch hẹn khám bệnh.
- **Phân hệ Bác sĩ (Doctor):**
  - Doctor Dashboard: danh sách bệnh nhân và cảnh báo nguy cơ.
  - Quản lý hồ sơ bệnh án và lịch sử sinh tồn của bệnh nhân.
  - Kê toa thuốc và quản lý/reschedule lịch hẹn của bệnh nhân.
- **Phân hệ Quản lý Phòng khám (Clinic Manager):**
  - Thống kê hiệu suất bác sĩ và tỷ lệ bệnh nhân nguy cơ cao.
  - Quản lý danh sách nhân sự (Bác sĩ) thuộc phòng khám.
  - Xuất báo cáo dữ liệu định dạng Excel server-side.
- **Phân hệ Quản trị viên (Admin):**
  - Quản trị tài khoản người dùng và cơ sở y tế (Clinics).
  - Giám sát Audit Logs phục vụ bảo mật và truy vết.

### 2.2 Ngoài phạm vi kiểm thử (Out-of-Scope)
- **Tích hợp Zalo OA chính thức:** Chỉ kiểm thử thông qua stub/mock service ở môi trường phát triển (do tài khoản Zalo Official Account chính thức yêu cầu định danh thực tế).
- **Thanh toán trực tuyến:** Hệ thống chưa tích hợp cổng thanh toán trực tiếp trong giai đoạn này.
- **Kiểm thử xâm nhập chuyên sâu (Penetration Testing):** Không bao gồm việc tấn công khai thác lỗ hổng hạ tầng vật lý hay DDOS.

---

## 3. Các loại kiểm thử (Test Types)
Hệ thống sẽ được đánh giá qua các cấp độ kiểm thử sau:
1. **Kiểm thử đơn vị (Unit Testing):**
   - Viết các test case cô lập cho các Controller, Service và Repository trong Spring Boot bằng JUnit 5 và Mockito.
2. **Kiểm thử API (API & Integration Testing):**
   - Sử dụng Postman để thiết kế các kịch bản kiểm thử API tự động (`pm.test()`).
   - Sử dụng Newman để chạy tự động kiểm thử hàng loạt trong môi trường CLI.
3. **Kiểm thử hệ thống (System UI Testing):**
   - Kiểm thử thủ công (Manual Testing) và tự động hóa giao diện trên các trình duyệt Chrome, Edge, Firefox nhằm xác minh luồng người dùng (User flows).
4. **Kiểm thử phân quyền (Role-based Security Testing):**
   - Kiểm tra các HTTP status code (`200 OK`, `401 Unauthorized`, `403 Forbidden`) đối với từng endpoint để đảm bảo người dùng không truy cập được tài nguyên ngoài quyền hạn.

---

## 4. Công cụ và Tài liệu kiểm thử (Testware)
- **Công cụ kiểm thử:**
  - **Postman:** Công cụ thiết kế request, viết test script bằng Javascript.
  - **Newman:** CLI runner cho Postman collection phục vụ kiểm thử tích hợp.
  - **JUnit 5 & Mockito:** Framework viết unit test cho Spring Boot.
  - **H2 Database (In-Memory):** Cơ sở dữ liệu chạy test độc lập để cô lập dữ liệu.
- **Tài liệu tham chiếu:**
  - [Tài liệu Đặc tả Yêu cầu Phần mềm (SRS.md)](file:///d:/UTH/KTPM/ktpm/docs/SRS.md)
  - [Bộ sưu tập Postman (DamDiep_Healthcare_API.postman_collection.json)](file:///d:/UTH/KTPM/ktpm/postman/DamDiep_Healthcare_API.postman_collection.json)
  - [Môi trường Postman (DamDiep_Healthcare_API.postman_environment.json)](file:///d:/UTH/KTPM/ktpm/postman/DamDiep_Healthcare_API.postman_environment.json)

---

## 5. Lịch trình kiểm thử (Test Schedule)

| Giai đoạn | Nhiệm vụ chi tiết | Người thực hiện | Thời hạn | Trạng thái bằng chứng |
| :--- | :--- | :--- | :--- | :--- |
| **Giai đoạn 1** | Viết kịch bản kiểm thử API tự động cho phân hệ Admin & User (KCPM-775) | QA / QC | Đã hoàn thành | 34/34 Pass |
| **Giai đoạn 2** | Viết kịch bản kiểm thử API tự động cho phân hệ Clinic Doctors (KCPM-780) | QA / QC | Đã hoàn thành | 24/24 Pass |
| **Giai đoạn 3** | Viết kịch bản kiểm thử API tự động cho phân hệ Doctor Dashboard & Appointments (KCPM-785) | QA / QC | Đã hoàn thành | 24/24 Pass |
| **Giai đoạn 4** | Viết kịch bản kiểm thử API tự động cho phân hệ Patient Dashboard & Appointments (KCPM-790) | QA / QC | Đã hoàn thành | 32/32 Pass |
| **Giai đoạn 5** | Viết kịch bản kiểm thử API tự động cho phân hệ Patient Profile (KCPM-795) | QA / QC | Đã hoàn thành | 24/24 Pass |
| **Giai đoạn 6** | Thực hiện kiểm thử tích hợp toàn bộ hệ thống (System Integration Testing) và kiểm thử thủ công UI | QA / QC | Đang triển khai | Báo cáo lỗi chi tiết |

---

## 6. Rủi ro chính và Biện pháp giảm thiểu (Main Risks & Mitigation)

1. **Rủi ro ô nhiễm dữ liệu (Data Pollution):**
   - *Mô tả:* Các test case thay đổi thông tin nhạy cảm (như email đăng nhập) làm hỏng luồng chạy của các test case chạy sau.
   - *Biện pháp giảm thiểu:* Sử dụng các biến động động (ví dụ: `{{patientEmail}}`) trong payload thay vì email cứng, đồng thời khởi chạy Backend test trên CSDL in-memory H2 để reset dữ liệu sạch sau mỗi lần khởi động.
2. **Rủi ro độ trễ mạng (Network Latency & Timeout):**
   - *Mô tả:* Lệnh gọi API bị timeout hoặc chạy chậm hơn 3000ms gây fail assertion mặc dù logic đúng.
   - *Biện pháp giảm thiểu:* Thực hiện warm-up server trước khi chạy kiểm thử chính thức và tăng ngưỡng timeout kiểm tra hiệu năng lên 3000ms.

---

## 7. Tiêu chí bắt đầu (Entry Criteria)
- Tài liệu đặc tả [SRS.md](file:///d:/UTH/KTPM/ktpm/docs/SRS.md) đã được thống nhất và phê duyệt.
- Môi trường phát triển cục bộ (Backend Spring Boot + Frontend React) có thể chạy ổn định.
- Database đã được seed đầy đủ dữ liệu người dùng mẫu (Admin, Clinic Manager, Doctor, Patient) để kiểm thử đăng nhập và phân quyền.

---

## 8. Tiêu chí kết thúc (Exit Criteria)
- 100% các API endpoints chính yếu được bao phủ bởi các kịch bản kiểm thử tự động (`pm.test()`).
- Tỷ lệ pass các ca kiểm thử tự động API đạt 100% trên môi trường H2 Database cục bộ sạch.
- Không còn lỗi nghiêm trọng (Blocker/Critical) hoặc lỗi bảo mật phân quyền (401/403) chưa được xử lý.
- Kết quả chạy thử nghiệm bằng Newman được lưu trữ đầy đủ làm tài liệu nghiệm thu kỹ thuật.
---

## 9. Cap nhat Unit Test va JaCoCo - 2026-07-03

### 9.1. Trang thai moi nhat

| Hang muc | Ket qua |
|---|---|
| GitHub sync | Da pull `origin/main` den commit `b8e485a` |
| Conflict | Da xu ly 1 conflict tai `CoreBusinessBvaTest.java` |
| Maven verify | `627 tests, 0 failures, 0 errors, 0 skipped` |
| JaCoCo report | Da tao lai tai `backend/target/site/jacoco/index.html` |
| Tien do chi tiet | Xem `test/coverage_progress_plan.md` |
| Ban ghi pull/conflict | Xem `test/github_pull_conflict_resolution_report.md` |

### 9.2. Package da dat muc bao phu hoan tat

| Package | Trang thai |
|---|---|
| `com.project.controller` | 0 missed instructions, branches, lines, methods |
| `com.project.dto.response` | 0 missed instructions, lines, methods |
| `com.project.exception` | 0 missed instructions, lines, methods |
| `com.project.specification` | 0 missed instructions, branches, lines, methods |

### 9.3. Package/class can tiep tuc uu tien

| Nhom | Muc tieu tiep theo |
|---|---|
| Service implementation | `ClinicDashboardServiceImpl`, `AdminDashboardServiceImpl`, `PatientAppointmentServiceImpl`, `DoctorAppointmentServiceImpl`, `ClinicDoctorServiceImpl` |
| Cross-cutting | `AuditAspect`, `JwtTokenProvider`, `AuditService`, `RateLimitFilter` |
| Edge branches | Mapper/entity/util branches con lai |

### 9.4. Quy tac cap nhat tai lieu sau moi lan chay

1. Chay `mvn -f backend/pom.xml -q verify`.
2. Khong chinh tay file trong `backend/target/site/jacoco`.
3. Cap nhat `test/coverage_progress_plan.md` voi so test, coverage snapshot, va class gap con lai.
4. Neu co pull/merge conflict, cap nhat `test/github_pull_conflict_resolution_report.md`.
