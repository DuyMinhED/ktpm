# BÁO CÁO: CHECKLIST KIỂM THỬ ĐƠN VỊ (UNIT TEST) CHO APPOINTMENT, PRESCRIPTION VÀ NOTIFICATION SERVICES

**Mã Ticket Jira:** KCPM-817  
**Người thực hiện (Assignee):** Trần Lê Quang (quangtl9558)  
**Email:** quangtl9558@ut.edu.vn  
**Đối tượng phân tích:** 4 service chứa business rule nhiều nhánh điều kiện:
1.  `DoctorAppointmentServiceImpl` — `updateStatus()`, `createAppointment()`, `rescheduleAppointment()`
2.  `PatientAppointmentServiceImpl` — `create()`, `cancel()`, `toggleReminder()`
3.  `PrescriptionServiceImpl` (Doctor) + `PatientPrescriptionServiceImpl` — `createPrescription()`, `cancelPrescription()`, `logMedication()`, `requestRefill()`
4.  `NotificationServiceImpl` — `markAsRead()`, `markAllAsRead()`, `delete()`, `getMyNotifications()`

**Kỹ thuật áp dụng:** JUnit 5, Mockito, Branch Coverage, Condition Coverage.

---

## 1. CHECKLIST — DOCTOR APPOINTMENT SERVICE

### 1.1. `updateStatus(Long appointmentId, String status, String meetingLink, String diagnosis)` — Status Transition

| # | Nhánh nghiệp vụ | Mocked Repository | Input | Expected Result / Exception |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Chuyển PENDING → SCHEDULED (ONLINE) + có meetingLink | `appointmentRepository.findById` trả về appt PENDING+ONLINE | `status="SCHEDULED"`, `meetingLink="https://..."` | `status=SCHEDULED`, `meetingLink` được set đúng, gửi notification "đã được xác nhận" |
| 2 | Chuyển sang SCHEDULED (ONLINE) không có meetingLink, chưa có link cũ | `appointment.meetingLink = null` | `meetingLink=null` | Fallback link tự sinh (`https://meet.google.com/abc-xyz`) |
| 3 | Chuyển sang SCHEDULED (ONLINE) không có meetingLink, đã có link cũ | `appointment.meetingLink = "old-link"` | `meetingLink=null` | Giữ nguyên `meetingLink` cũ |
| 4 | Chuyển sang CANCELLED | — | `status="CANCELLED"` | `status=CANCELLED`, notification "đã bị hủy" (type=warning) |
| 5 | Chuyển sang COMPLETED kèm diagnosis | — | `status="COMPLETED"`, `diagnosis="Cảm cúm"` | `diagnosisSummary` được set, notification "đã hoàn tất" |
| 6 | **Invalid ownership** — bác sĩ khác cố cập nhật appointment không thuộc mình | `appointment.doctorId ≠ currentDoctorId` | bất kỳ status | `RuntimeException`/`AccessDeniedException` |
| 7 | Appointment không tồn tại | `findById` trả `Optional.empty()` | `appointmentId=99999` | `ResourceNotFoundException` |
| 8 | SCHEDULED nhưng type=IN_PERSON | — | `type="IN_PERSON"` | Bỏ qua logic `meetingLink`, không set |

### 1.2. `createAppointment(DoctorCreateAppointmentRequest request)`

| # | Nhánh nghiệp vụ | Mocked Repository | Input | Expected Result / Exception |
| :--- | :--- | :--- | :--- | :--- |
| 9 | Tạo appointment ONLINE có meetingLink tự nhập | `patientRepository.findById`, `userRepository.findById` (doctor) | `type="ONLINE"`, `meetingLink="custom"` | `meetingLink="custom"`, gửi notification cho patient |
| 10 | Tạo appointment ONLINE không nhập meetingLink | — | `meetingLink=null` | Fallback link tự sinh |
| 11 | Tạo appointment IN_PERSON | — | `type="IN_PERSON"` | `location` được set, `meetingLink=null` |
| 12 | Doctor null (không tìm thấy bác sĩ hiện tại) | `userRepository.findById` trả `Optional.empty()` | — | `doctorName=null`, vẫn tạo thành công (không throw) |
| 13 | **Patient không tồn tại** | `patientRepository.findById` trả `Optional.empty()` | `patientId=99999` | `ResourceNotFoundException` |

### 1.3. `rescheduleAppointment(Long appointmentId, DoctorCreateAppointmentRequest request)` — Reschedule

| # | Nhánh nghiệp vụ | Mocked Repository | Input | Expected Result / Exception |
| :--- | :--- | :--- | :--- | :--- |
| 14 | Reschedule sang ONLINE với link mới | `appointmentRepository.findById` | `type="ONLINE"`, `meetingLink="new-link"` | `meetingLink` cập nhật thành link mới |
| 15 | Reschedule sang ONLINE không link, có link cũ | — | `meetingLink=null` | Giữ link cũ |
| 16 | Reschedule sang IN_PERSON | — | `type="IN_PERSON"` | `location` set, `meetingLink=null` (xóa link cũ nếu có) |
| 17 | Reschedule kèm đổi bác sĩ (doctor != null) | `userRepository.findById` | `doctorId` mới | `doctorName`, `doctorSpecialty` cập nhật theo bác sĩ mới |
| 18 | Reschedule không đổi bác sĩ (doctor null) | `userRepository.findById` trả `empty` | — | Giữ nguyên `doctorName` cũ, không throw |
| 19 | **Appointment không tồn tại** | `findById` trả `empty` | `appointmentId=99999` | `ResourceNotFoundException` |

---

## 2. CHECKLIST — PATIENT APPOINTMENT SERVICE

### 2.1. `create(CreateAppointmentRequest request)`

| # | Nhánh nghiệp vụ | Mocked Repository | Input | Expected Result / Exception |
| :--- | :--- | :--- | :--- | :--- |
| 20 | Đặt lịch IN_PERSON có clinic hợp lệ | `clinicRepository.findById`, `userRepository.findById` | `clinicId=1`, `type="IN_PERSON"` | `location = clinic.name`, notify doctor |
| 21 | Đặt lịch ONLINE, không có clinicId | `patient.clinicId = null` | `type="ONLINE"` | `meetingLink` được set, không gọi `clinicRepository` |
| 22 | Clinic tồn tại nhưng exception khi truy vấn | `clinicRepository.findById` ném `RuntimeException` | — | Catch nội bộ, fallback `location = "Phòng khám Đa khoa"` |
| 23 | Doctor null | `userRepository.findById` trả `empty` | — | Không gửi notification, vẫn tạo thành công |
| 24 | **Thời gian đặt < now + 3h** (SRS §6.3.A, boundary) | — | `appointmentTime = now + 2h59m` | `IllegalArgumentException` |
| 25 | **Thời gian đặt > now + 15 ngày** (SRS §6.3.A, boundary) | — | `appointmentTime = now + 15d01h` | `IllegalArgumentException` |

### 2.2. `cancel(Long appointmentId)`

| # | Nhánh nghiệp vụ | Mocked Repository | Input | Expected Result / Exception |
| :--- | :--- | :--- | :--- | :--- |
| 26 | Hủy thành công appointment PENDING | `appointmentRepository.findById` | `status=PENDING` | `status=CANCELLED`, `saveAndFlush` được gọi |
| 27 | **Invalid ownership** — patient khác cố hủy | `appointment.patient.userId ≠ currentUserId` | — | `RuntimeException` |
| 28 | Appointment không tồn tại | `findById` trả `empty` | `id=99999` | `RuntimeException` (wrapped) |
| 29 | Hủy appointment đã COMPLETED | `status=COMPLETED` | — | `RuntimeException` — không cho hủy |
| 30 | Hủy appointment SCHEDULED (đã xác nhận) | `status=SCHEDULED` | — | `RuntimeException` — không tự hủy được, phải liên hệ phòng khám |

### 2.3. `toggleReminder(Long appointmentId, boolean enabled)`

| # | Nhánh nghiệp vụ | Mocked Repository | Input | Expected Result / Exception |
| :--- | :--- | :--- | :--- | :--- |
| 31 | Bật/tắt reminder thành công | `appointmentRepository.findById` | `enabled=true/false` | `reminderEnabled` cập nhật đúng, `saveAndFlush` |
| 32 | **Invalid ownership** | `appointment.patient.userId ≠ currentUserId` | — | `RuntimeException` |
| 33 | Appointment không tồn tại | `findById` trả `empty` | `id=99999` | `ResourceNotFoundException` |

---

## 3. CHECKLIST — PRESCRIPTION SERVICE

### 3.1. `createPrescription()` / `cancelPrescription()` (Doctor — `PrescriptionServiceImpl`)

*Đã được kiểm thử chi tiết ở KCPM-38/41/42 (8 WebMvc test cases + 13 Security test cases). Checklist dưới đây bổ sung góc nhìn Unit Test thuần Mockito (không qua MockMvc):*

| # | Nhánh nghiệp vụ | Mocked Repository | Input | Expected Result / Exception |
| :--- | :--- | :--- | :--- | :--- |
| 34 | Tạo đơn thuốc hợp lệ, đầy đủ items | `patientRepository.findById`, `prescriptionRepository.save` | `items` hợp lệ | Trả về `PrescriptionResponse`, status mặc định |
| 35 | **Patient không tồn tại** | `patientRepository.findById` trả `empty` | `patientId=99999` | `ResourceNotFoundException` |
| 36 | Hủy đơn thuốc thành công | `prescriptionRepository.findById` | `status=PENDING` | `status=CANCELLED` |
| 37 | **Invalid ownership** — bác sĩ khác cố hủy đơn không phải mình kê | `prescription.doctorId ≠ currentDoctorId` | — | `AccessDeniedException`/`RuntimeException` |

### 3.2. `logMedication(LogMedicationRequest request)` — Log Medication

| # | Nhánh nghiệp vụ | Mocked Repository | Input | Expected Result / Exception |
| :--- | :--- | :--- | :--- | :--- |
| 38 | Log thành công (status = TAKEN) | `medicationScheduleRepository.findById`, `medicationLogRepository.save` | `scheduleId` hợp lệ, `status="TAKEN"` | `MedicationLog` được lưu với `takenAt=now`, `status=TAKEN` |
| 39 | Log thành công (status = MISSED/SKIPPED) | — | `status="MISSED"` | `MedicationLog` lưu đúng status khác |
| 40 | **Schedule không tồn tại** | `medicationScheduleRepository.findById` trả `empty` | `scheduleId=99999` | `ResourceNotFoundException` |
| 41 | **Invalid ownership** — patient khác cố log lịch uống thuốc không phải của mình | `schedule.patient.id ≠ currentPatient.id` | — | `RuntimeException("Unauthorized to log medication for this schedule")` |

### 3.3. `requestRefill(Long prescriptionId)` — Refill Medication

| # | Nhánh nghiệp vụ | Mocked Repository | Input | Expected Result / Exception |
| :--- | :--- | :--- | :--- | :--- |
| 42 | Yêu cầu tái cấp thuốc thành công | `prescriptionRepository.findById`, `notificationRepository.save` | `prescriptionId` hợp lệ | `status=PENDING_RENEWAL`, notification gửi cho `doctorId` với `targetUrl` đúng |
| 43 | **Prescription không tồn tại** | `prescriptionRepository.findById` trả `empty` | `prescriptionId=99999` | `ResourceNotFoundException` |
| 44 | ⚠️ **Không kiểm tra ownership** | `prescription.patient.userId ≠ currentUserId` | — | **Ghi chú: code hiện tại KHÔNG có bước kiểm tra bệnh nhân hiện tại có phải chủ đơn thuốc hay không** — cần bổ sung test case xác nhận đây là **lỗ hổng tiềm ẩn** (patient A có thể request refill cho đơn thuốc của patient B nếu biết `prescriptionId`) |

---

## 4. CHECKLIST — NOTIFICATION SERVICE

### 4.1. `markAsRead(Long id)` — Read

| # | Nhánh nghiệp vụ | Mocked Repository | Input | Expected Result / Exception |
| :--- | :--- | :--- | :--- | :--- |
| 45 | Đánh dấu đã đọc thành công | `notificationRepository.findById` trả `Optional.of(notification)` | `id` hợp lệ | `read=true`, `save` được gọi |
| 46 | Notification không tồn tại | `findById` trả `Optional.empty()` | `id=99999` | Không throw exception — `ifPresent()` bỏ qua im lặng (silent no-op) |
| 47 | ⚠️ **Không kiểm tra ownership** | `notification.userId ≠ currentUserId` | — | **Ghi chú: code hiện tại dùng `findById(id).ifPresent(...)` mà KHÔNG so sánh `userId`** — cần viết test case xác nhận **lỗ hổng bảo mật**: user A có thể đánh dấu đã đọc notification của user B nếu biết `id` |

### 4.2. `delete(Long id)` — Delete

| # | Nhánh nghiệp vụ | Mocked Repository | Input | Expected Result / Exception |
| :--- | :--- | :--- | :--- | :--- |
| 48 | Xóa notification thành công | `notificationRepository.deleteById` | `id` hợp lệ | `deleteById` được gọi đúng 1 lần |
| 49 | Xóa `id` không tồn tại | `deleteById` (Spring Data JPA mặc định không throw nếu không tồn tại tùy driver) | `id=99999` | Cần xác nhận hành vi thực tế: có thể throw `EmptyResultDataAccessException` hoặc im lặng — **cần bổ sung `ResourceNotFoundException` tường minh trước khi xóa** |
| 50 | ⚠️ **Không kiểm tra ownership** (nghiêm trọng hơn #47) | `notification.userId ≠ currentUserId` | — | **Ghi chú: đây là lỗ hổng nghiêm trọng nhất trong 4 service** — bất kỳ user nào cũng xóa được notification của người khác nếu biết `id`, vì `delete()` gọi thẳng `deleteById()` không qua bước load + so sánh `userId` |

### 4.3. `getMyNotifications()` / `markAllAsRead()` — Bổ sung

| # | Nhánh nghiệp vụ | Mocked Repository | Input | Expected Result / Exception |
| :--- | :--- | :--- | :--- | :--- |
| 51 | Lấy danh sách notification của user hiện tại (có dữ liệu) | `findByUserIdAndIsDeletedFalseOrderByCreatedAtDesc` trả list | — | Trả về đúng danh sách, sắp xếp theo `createdAt DESC` |
| 52 | Lấy danh sách rỗng (chưa có notification nào) | Repository trả `Collections.emptyList()` | — | Trả về `[]`, không throw |
| 53 | `markAllAsRead()` — có notification chưa đọc | `findAllByUserIdAndReadFalseAndIsDeletedFalse` trả list | — | Toàn bộ `read=true`, `saveAll` được gọi |
| 54 | `markAllAsRead()` — không có notification chưa đọc | Repository trả list rỗng | — | `saveAll` được gọi với list rỗng, không lỗi |

---

## 5. TỔNG HỢP SỐ LƯỢNG TEST CASE THEO SERVICE

| Service | Số Unit Test Case | Nhánh Exception | Nhánh Invalid Ownership |
| :--- | :---: | :---: | :---: |
| DoctorAppointmentService | 19 | 3 | 1 |
| PatientAppointmentService | 14 | 5 | 2 |
| PrescriptionService (+ Patient) | 11 | 3 | 2 (1 đã có check, 1 phát hiện thiếu) |
| NotificationService | 10 | 1 | 2 (cả 2 đều phát hiện **thiếu** check) |
| **Tổng** | **54** | **12** | **7** |

---

## 6. LỖ HỔNG PHÁT HIỆN QUA QUÁ TRÌNH THIẾT KẾ CHECKLIST

| # | Service | Method | Vấn đề | Mức độ |
| :---: | :--- | :--- | :--- | :---: |
| 1 | `NotificationServiceImpl` | `markAsRead(id)` | Không kiểm tra `notification.userId == currentUserId` trước khi cập nhật | Trung bình |
| 2 | `NotificationServiceImpl` | `delete(id)` | Không kiểm tra ownership trước khi xóa — gọi thẳng `deleteById()` | **Cao** |
| 3 | `PatientPrescriptionServiceImpl` | `requestRefill(prescriptionId)` | Không kiểm tra `prescription.patient.userId == currentUserId` trước khi tạo yêu cầu tái cấp thuốc | Trung bình |

*Các lỗ hổng này nên được chuyển thành Bug Ticket riêng và bổ sung `@securityService.isOwner(...)` hoặc kiểm tra thủ công tương tự như đã áp dụng ở `PatientAppointmentServiceImpl.cancel()`.*

---

## 7. KẾT LUẬN

*   Đã thiết kế checklist **54 unit test case** cho 4 service nghiệp vụ chính: Doctor Appointment (19), Patient Appointment (14), Prescription (11), Notification (10).
*   Checklist bao phủ đầy đủ các yêu cầu completion criteria: **status transition** (updateStatus), **reschedule** (rescheduleAppointment), **refill/log medication** (requestRefill/logMedication), **read/delete** (markAsRead/delete), và **invalid ownership** (7 trường hợp).
*   Phát hiện **3 lỗ hổng bảo mật tiềm ẩn** liên quan đến thiếu kiểm tra ownership ở `NotificationServiceImpl.markAsRead()`, `NotificationServiceImpl.delete()`, và `PatientPrescriptionServiceImpl.requestRefill()` — trong đó `delete()` được đánh giá mức độ **Cao** vì cho phép xóa dữ liệu của người khác.
*   Checklist này là cơ sở để triển khai code JUnit 5 + Mockito thực tế ở các task tiếp theo, đồng thời các dòng có ký hiệu ⚠️ cần được ưu tiên viết test **trước** để xác nhận lỗ hổng, làm bằng chứng đề xuất backend team khắc phục.