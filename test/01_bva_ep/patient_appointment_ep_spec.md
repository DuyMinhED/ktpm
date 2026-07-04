# ĐẶC TẢ KỊCH BẢN KIỂM THỬ PHÂN HOẠCH TƯƠNG ĐƯƠNG (EQUIVALENCE PARTITIONING - EP) - PHÂN HỆ ĐẶT LỊCH HẸN BỆNH NHÂN

**Phương pháp áp dụng:** Phân hoạch tương đương (Equivalence Partitioning), kiểm thử hộp đen, kiểm thử validation Frontend/API.  
**Module kiểm thử:** Patient Appointment - Đặt lịch khám mới và hủy lịch hẹn.  
**Nguồn tham chiếu:** `docs/SRS.md`, `AddAppointmentModal.tsx`, `CreateAppointmentRequest.java`, `PatientAppointmentController.java`, `PatientAppointmentServiceImpl.java`.

---

## 1. Mục tiêu kiểm thử

1. Thiết kế **7 test cases phân hoạch tương đương** cho luồng đặt lịch hẹn của bệnh nhân.
2. Bao phủ các nhóm đầu vào chính: form hợp lệ, trường bắt buộc để trống, sai định dạng, giá trị không hợp lệ theo biên nghiệp vụ, và luồng bị vô hiệu hóa.
3. Xác minh hành vi validation ở cả giao diện frontend và API backend cho endpoint `POST /api/v1/patient/appointments` và luồng `PUT /api/v1/patient/appointments/{id}/cancel`.

---

## 2. Phạm vi phân hoạch

### A. Form đặt lịch hợp lệ

* **Lớp tương đương hợp lệ:** Người dùng đã đăng nhập với vai trò `PATIENT`, chọn bác sĩ hợp lệ, chọn ngày giờ hẹn hợp lệ, chọn đúng hình thức khám (`IN_PERSON` hoặc `ONLINE`) và nhập lý do khám hợp lệ.
* **Kết quả mong đợi:** Hệ thống tạo lịch hẹn mới ở trạng thái `PENDING`, trả về `201 Created`.

### B. Trường bắt buộc

* **Lớp không hợp lệ 1:** Thiếu `doctorId`.
* **Lớp không hợp lệ 2:** Thiếu `appointmentTime`.
* **Lớp không hợp lệ 3:** Thiếu hoặc để trống `appointmentType`.
* **Kết quả mong đợi:** Frontend không cho gửi nếu chưa chọn bác sĩ; API trả về lỗi validation `400 Bad Request` nếu request thiếu trường bắt buộc.

### C. Định dạng dữ liệu

* **Lớp hợp lệ:** `appointmentTime` ở định dạng ISO datetime hợp lệ, ví dụ `2026-07-01T08:30:00`.
* **Lớp không hợp lệ:** `appointmentTime` sai định dạng JSON/API contract, ví dụ `2026/07/01 08:30`.
* **Kết quả mong đợi:** API từ chối request với lỗi parse/validation `400 Bad Request`.

### D. Quy tắc nghiệp vụ về thời gian đặt lịch

* **Lớp hợp lệ:** Thời gian hẹn nằm trong khoảng cho phép theo SRS: từ `now + 3 giờ` đến `now + 15 ngày`.
* **Lớp không hợp lệ:** Thời gian hẹn nhỏ hơn `now + 3 giờ` hoặc vượt quá `now + 15 ngày`.
* **Kết quả mong đợi:** API từ chối request và trả về lỗi nghiệp vụ rõ ràng.

### E. Luồng bị vô hiệu hóa hoặc không được phép

* **Lớp không hợp lệ trên Frontend:** Không có bác sĩ để chọn hoặc dropdown đang ở giá trị rỗng (`specialty = ""`), nút **Xác nhận đặt lịch** bị disabled.
* **Lớp không hợp lệ nghiệp vụ:** Bệnh nhân hủy lịch đã được bác sĩ xác nhận (`SCHEDULED`) hoặc đã hoàn tất (`COMPLETED`).
* **Kết quả mong đợi:** Frontend không gọi API trong luồng disabled; backend từ chối hủy lịch không được phép.

---

## 3. Bảng thiết kế 7 Test Cases phân hoạch tương đương

| STT | Mã TC | Chức năng / Giao diện | Loại phân hoạch | Lớp tương đương | Dữ liệu đại diện | Kết quả mong đợi |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **TC-EP-APPT-01** | Đặt lịch khám mới | Hợp lệ (Valid) | Form đầy đủ dữ liệu hợp lệ | `{ "doctorId": 10, "appointmentTime": "2026-07-01T08:30:00", "appointmentType": "IN_PERSON", "reason": "Tái khám định kỳ" }` | **Thành công:** API trả `201 Created`, tạo lịch hẹn trạng thái `PENDING`, có `location` phòng khám. |
| **2** | **TC-EP-APPT-02** | Đặt lịch khám mới | Không hợp lệ (Invalid) | Trường bắt buộc `doctorId` bị thiếu/rỗng | `{ "appointmentTime": "2026-07-01T08:30:00", "appointmentType": "IN_PERSON", "reason": "Tái khám định kỳ" }` | **Thất bại:** API trả `400 Bad Request`, thông báo `Doctor ID is required`. |
| **3** | **TC-EP-APPT-03** | Đặt lịch khám mới | Không hợp lệ (Invalid) | Trường bắt buộc `appointmentType` rỗng | `{ "doctorId": 10, "appointmentTime": "2026-07-01T08:30:00", "appointmentType": "", "reason": "Tư vấn kết quả xét nghiệm" }` | **Thất bại:** API trả `400 Bad Request`, thông báo `Appointment type is required`. |
| **4** | **TC-EP-APPT-04** | Đặt lịch khám mới | Không hợp lệ (Invalid) | Sai định dạng `appointmentTime` | `{ "doctorId": 10, "appointmentTime": "2026/07/01 08:30", "appointmentType": "ONLINE", "reason": "Tư vấn online" }` | **Thất bại:** API trả `400 Bad Request` do không parse được `LocalDateTime`; lịch hẹn không được tạo. |
| **5** | **TC-EP-APPT-05** | Đặt lịch khám mới | Không hợp lệ (Invalid) | Giá trị biên ngoài quy tắc thời gian tối thiểu | Với `now = 2026-06-29T09:00:00`, gửi `appointmentTime = "2026-06-29T11:59:00"` (`now + 2h59m`) | **Thất bại:** API phải từ chối vì thời gian hẹn chưa đạt tối thiểu `now + 3 giờ`, trả lỗi nghiệp vụ `400 Bad Request`. |
| **6** | **TC-EP-APPT-06** | Form AddAppointmentModal | Không hợp lệ (Disabled flow) | Không có bác sĩ được chọn, nút submit bị vô hiệu hóa | `specialty = ""`, danh sách bác sĩ rỗng hoặc dropdown ở option `"Chọn bác sĩ"` | **Thất bại có kiểm soát:** Nút **Xác nhận đặt lịch** ở trạng thái `disabled`, không gọi API `createAppointment`. |
| **7** | **TC-EP-APPT-07** | Hủy lịch hẹn | Không hợp lệ (Invalid business flow) | Hủy lịch đã được bác sĩ xác nhận | Appointment `id = 25`, `status = "SCHEDULED"` | **Thất bại:** API `PUT /api/v1/patient/appointments/25/cancel` từ chối hủy, trả lỗi nghiệp vụ: `Lịch hẹn đã được bác sĩ xác nhận, không thể tự hủy...`; trạng thái không đổi. |

---

## 3.1. Standardized Boundary Value Addendum

The original appointment EP design has one lower-bound negative value. The table below completes the BVA set required for appointment scheduling and cancellation.

| Field/Flow | Boundary rule | Minimum boundary values | Expected result | Minimum TC count |
|---|---|---|---|---:|
| `appointmentTime` lower bound | appointment must be at least `now + 3h` | `now + 2h59m`, `now + 3h`, `now + 3h1m` | lower-minus rejected; lower and lower-plus accepted | 3 |
| `appointmentTime` upper bound | appointment must be at most `now + 15d` | `now + 14d23h59m`, `now + 15d`, `now + 15d1m` | upper-plus rejected; upper-minus and upper accepted | 3 |
| `doctorId` | required positive id | `null`, `0`, `1 existing`, positive non-existing id | null/zero rejected; existing accepted; non-existing follows API/service rule | 4 |
| `appointmentType` | non-blank and valid by API contract | `""`, `"IN_PERSON"`, `"ONLINE"`, `"VIDEO_CALL"` | blank rejected; valid values accepted; unsupported value rejected or logged as validation gap | 4 |
| Cancel appointment status | patient can cancel only allowed states | `PENDING`, `SCHEDULED`, `COMPLETED`, `CANCELLED` | `PENDING` can be cancelled; confirmed/completed/cancelled states rejected or no-op per rule | 4 |

Minimum BVA cases to add for this document: `18` rows. A reduced implementation set can use `10` rows: six appointment-time values, doctorId `null/non-existing`, appointmentType `""/VIDEO_CALL`, cancel status `SCHEDULED`.

| New TC | Type | Input | Expected result | Automation target |
|---|---|---|---|---|
| TC-BVA-APPT-01 | BVA | `appointmentTime = now + 2h59m` | Business validation fails | `PatientAppointmentServiceImplTest` |
| TC-BVA-APPT-02 | BVA | `appointmentTime = now + 3h` | Appointment created | `PatientAppointmentServiceImplTest` |
| TC-BVA-APPT-03 | BVA | `appointmentTime = now + 3h1m` | Appointment created | `PatientAppointmentServiceImplTest` |
| TC-BVA-APPT-04 | BVA | `appointmentTime = now + 14d23h59m` | Appointment created | `PatientAppointmentServiceImplTest` |
| TC-BVA-APPT-05 | BVA | `appointmentTime = now + 15d` | Appointment created | `PatientAppointmentServiceImplTest` |
| TC-BVA-APPT-06 | BVA | `appointmentTime = now + 15d1m` | Business validation fails | `PatientAppointmentServiceImplTest` |
| TC-BVA-APPT-07 | EP/BVA | `doctorId = null` | DTO validation fails | `CreateAppointmentRequestValidationTest` |
| TC-BVA-APPT-08 | EP/BVA | positive non-existing `doctorId` | Not found or documented service behavior | `PatientAppointmentServiceImplTest` |
| TC-BVA-APPT-09 | EP/BVA | `appointmentType = ""` | DTO validation fails | `CreateAppointmentRequestValidationTest` |
| TC-BVA-APPT-10 | EP/BVA | cancel appointment with status `SCHEDULED` | Business validation fails | `PatientAppointmentServiceImplTest` |

## 4. Kết luận

* Tài liệu thiết kế đúng **7 test cases EP**, nằm trong giới hạn yêu cầu từ 5 đến 8 test cases.
* Các test case bao phủ cả lớp hợp lệ và không hợp lệ, gồm: form hợp lệ, trường bắt buộc rỗng, sai định dạng dữ liệu, giá trị biên không hợp lệ, disabled flow frontend và luồng nghiệp vụ bị từ chối.
* Dữ liệu đại diện và kết quả mong đợi được mô tả rõ ràng để có thể triển khai thành Postman test, frontend E2E test hoặc unit/integration test backend.
