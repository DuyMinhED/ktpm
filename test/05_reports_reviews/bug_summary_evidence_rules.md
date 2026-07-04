# BÁO CÁO: BẢNG TỔNG HỢP LỖI (BUG SUMMARY TABLE) VÀ QUY TẮC MINH CHỨNG (EVIDENCE RULES)

**Mã Ticket Jira:** KCPM-822  
**Người thực hiện (Assignee):** Trần Lê Quang (quangtl9558)  
**Email:** quangtl9558@ut.edu.vn  
**Đối tượng phân tích:** Tổng hợp toàn bộ lỗi thực tế phát hiện được từ các task kiểm thử (Postman, White-box, Unit Test Checklist) và chuẩn hóa quy tắc minh chứng áp dụng cho Backend, Frontend, API, Security, E2E.  
**Tài liệu tham chiếu:** `bug_tracking_standard_spec.md` (KCPM-821, tác giả Hồ Văn Duy) — kế thừa định nghĩa Severity/Priority đã được nhóm thống nhất.  
**Kỹ thuật áp dụng:** Bug Tracking, Reporting, Traceability.

---

## 1. BẢNG TỔNG HỢP LỖI THỰC TẾ (BUG SUMMARY TABLE)

| Bug ID | Module | Severity | Status | Evidence | Assignee | Reproduction Link |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| BUG-KCPM-01 | Clinic Appointments (Backend API) | Major | Open | Postman Run Result: `PUT /clinics/{id}/appointments/{id}` trả `500` thay vì `400` khi cập nhật appointment đã COMPLETED/CANCELLED | Backend Team (chưa gán cụ thể) | KCPM-782 — `clinic_appointments_postman_spec.md`, Mục 3 |
| BUG-KCPM-02 | Medical Services (Backend API + Security) | Critical | Open | Postman Run Result: `POST /medical-services` trả `403 Forbidden` cho tài khoản Admin hợp lệ do sai định dạng chuỗi role (`"ADMIN"` vs `"ROLE_ADMIN"`) | Backend Team (chưa gán cụ thể) | KCPM-802 — `medical_services_postman_spec.md`, Mục 3.1 |
| BUG-KCPM-03 | Medical Services (Backend API) | Major | Open | Postman Run Result: `PUT`/`PATCH`/`DELETE /medical-services/{id}` trả `500` thay vì `404` khi `id` không tồn tại — pattern lặp lại hệ thống | Backend Team (chưa gán cụ thể) | KCPM-802 — `medical_services_postman_spec.md`, Mục 3.2 |
| BUG-KCPM-04 | Support Tickets (Security) | Critical | Open | Phân tích mã nguồn: `SupportTicketController` không có `@PreAuthorize` ở bất kỳ endpoint nào | Backend Team (chưa gán cụ thể) | KCPM-807 — `backend_test_conditions_analysis.md`, Mục 2.6 |
| BUG-KCPM-05 | Notifications (Backend Service) | Major | Open | Phân tích mã nguồn: `NotificationServiceImpl.delete(id)` gọi thẳng `deleteById()` không kiểm tra `userId` — cho phép xóa notification của người khác | Backend Team (chưa gán cụ thể) | KCPM-817 — `appointment_prescription_notification_unit_test_checklist.md`, Mục 6, dòng #2 |
| BUG-KCPM-06 | Notifications (Backend Service) | Minor | Open | Phân tích mã nguồn: `NotificationServiceImpl.markAsRead(id)` dùng `findById(id).ifPresent()` không kiểm tra ownership | Backend Team (chưa gán cụ thể) | KCPM-817 — checklist Mục 6, dòng #1 |
| BUG-KCPM-07 | Prescriptions (Backend Service) | Minor | Open | Phân tích mã nguồn: `PatientPrescriptionServiceImpl.requestRefill()` không kiểm tra `prescription.patient.userId == currentUserId` | Backend Team (chưa gán cụ thể) | KCPM-817 — checklist Mục 6, dòng #3 |

**Ghi chú trạng thái:** Tất cả 7 lỗi ở trên đều được phát hiện thông qua kiểm thử tự động (Postman) hoặc phân tích mã nguồn tĩnh (White-box/Unit Test Checklist), **chưa qua bước fix chính thức** từ team backend tại thời điểm báo cáo này — trạng thái `Open` là chính xác. Bảng này sẽ được cập nhật `Status` (Open → In Progress → Fixed → Verified → Closed) khi có commit fix tương ứng.

---

## 2. QUY TẮC PHÂN LOẠI TRẠNG THÁI (STATUS WORKFLOW)

Áp dụng quy trình vòng đời lỗi chuẩn, dùng chung cho mọi loại lỗi (Backend/Frontend/API/Security/E2E):

```
Open → In Progress → Fixed → Verified → Closed
                ↓                            ↑
            Reopened ───────────────────────┘
                ↓
             Rejected / Won't Fix (kèm lý do)
```

| Trạng thái | Điều kiện chuyển | Người phụ trách cập nhật |
| :--- | :--- | :--- |
| **Open** | Lỗi mới được phát hiện, đã ghi nhận đầy đủ bằng chứng | Tester (người phát hiện) |
| **In Progress** | Developer đã nhận task và đang sửa | Developer |
| **Fixed** | Developer đã commit fix, chờ kiểm thử lại | Developer |
| **Verified** | Tester đã re-test và xác nhận lỗi không còn tái hiện | Tester |
| **Closed** | Verified + đã merge vào `main`, không cần theo dõi thêm | Tester/Lead |
| **Reopened** | Lỗi tái hiện lại sau khi đã Fixed/Verified | Tester |
| **Rejected/Won't Fix** | Không phải lỗi (by design) hoặc quyết định không sửa | Lead/Product Owner |

---

## 3. QUY TẮC MINH CHỨNG (EVIDENCE RULES) THEO LOẠI LỖI

Mỗi loại lỗi (Backend/Frontend/API/Security/E2E) yêu cầu loại minh chứng khác nhau để đảm bảo có thể tái hiện và xác nhận fix. Bảng dưới đây chuẩn hóa **loại minh chứng bắt buộc tối thiểu** cho từng nhóm:

| Loại lỗi | Minh chứng bắt buộc | Minh chứng bổ sung (nếu có) | Công cụ thu thập |
| :--- | :--- | :--- | :--- |
| **Backend (Service/Logic)** | Đoạn code nguồn liên quan (file + số dòng) kèm giải thích nguyên nhân gốc rễ | JUnit test case tái hiện lỗi (đỏ khi chưa fix, xanh sau khi fix) | Đọc mã nguồn trực tiếp, IDE/VS Code |
| **API (REST endpoint)** | Response Body đầy đủ (JSON) + HTTP Status Code thực tế vs mong đợi | Postman Console log (Request Headers, Response Time), Newman/CI run report | Postman, Newman CLI |
| **Frontend (UI/UX)** | Ảnh chụp màn hình (screenshot) hiển thị lỗi trực quan | Video ghi màn hình các bước tái hiện, DevTools Console log | Trình duyệt (Chrome DevTools), công cụ chụp màn hình |
| **Security (Auth/RBAC)** | JWT token/role dùng để tái hiện (che thông tin nhạy cảm khi báo cáo công khai) + đoạn code kiểm tra quyền liên quan | Chứng minh khai thác (Proof of Concept) — ví dụ: gọi API với token của user A thao tác lên dữ liệu user B | Postman + đọc mã nguồn `@PreAuthorize`/`SecurityService` |
| **E2E (CodeceptJS)** | Log chạy scenario (`output/` directory) kèm bước fail cụ thể | Screenshot tại thời điểm fail (CodeceptJS tự động chụp khi fail), video full flow | CodeceptJS + Playwright report |
| **Database/Data Integrity** | Câu lệnh SQL/JPQL tái hiện + kết quả trước/sau | Ảnh chụp bảng dữ liệu bất thường (orphan record, duplicate) | DBeaver/DB client, H2 Console |

### 3.1. Nguyên tắc chung áp dụng cho mọi loại minh chứng

1. **Không chỉnh sửa ảnh/log** — mọi minh chứng phải là bản gốc chưa qua chỉnh sửa (trừ việc che thông tin nhạy cảm như mật khẩu, token thật).
2. **Gắn timestamp** — mọi minh chứng (screenshot, log) phải thể hiện được thời điểm chụp (đồng hồ hệ thống hoặc timestamp trong log) để đối chiếu với version code tại thời điểm đó.
3. **Liên kết Jira ticket** — mọi minh chứng phải được đính kèm hoặc dẫn link trực tiếp vào Jira ticket tương ứng, không để rời rạc trong chat/tin nhắn cá nhân.
4. **Một bug — một minh chứng tối thiểu, nhiều minh chứng càng tốt** — chấp nhận 1 loại minh chứng bắt buộc tối thiểu theo bảng trên, nhưng khuyến khích bổ sung càng nhiều loại càng tăng độ tin cậy khi bàn giao cho Developer.
5. **Minh chứng "trước và sau" khi Verify** — khi chuyển trạng thái `Fixed → Verified`, phải có minh chứng mới (không dùng lại minh chứng cũ) xác nhận hành vi đã đúng.

---

## 4. MẪU MINH CHỨNG THAM CHIẾU TỪ CÁC BUG THỰC TẾ

Để minh họa cách áp dụng Evidence Rules ở Mục 3, dưới đây là minh chứng thực tế đã thu thập cho 2 bug tiêu biểu:

### 4.1. BUG-KCPM-01 (Loại: API)

**Minh chứng bắt buộc — Response Body + Status Code:**
```json
{
    "success": false,
    "message": "Internal server error"
}
```
Status thực tế: `500` | Status mong đợi: `400`

**Minh chứng bổ sung — Đoạn code nguyên nhân** (`ClinicDashboardServiceImpl.java`, dòng 468-470):
```java
if (appointment.getStatus() == AppointmentStatus.COMPLETED || appointment.getStatus() == AppointmentStatus.CANCELLED) {
    throw new IllegalStateException("Không thể cập nhật thông tin lịch hẹn đã hoàn thành hoặc đã hủy!");
}
```

### 4.2. BUG-KCPM-04 (Loại: Security)

**Minh chứng bắt buộc — Đoạn code kiểm tra quyền (thiếu):**
```java
@RequestMapping("/api/v1/support-tickets")
// ⚠️ Không có @PreAuthorize ở cấp class lẫn method nào bên dưới
public class SupportTicketController { ... }
```

**Minh chứng bổ sung — Proof of Concept (đề xuất thực hiện ở lần kiểm thử tiếp theo):** Gọi `GET /api/v1/support-tickets` bằng JWT token của role PATIENT bất kỳ → nếu trả về `200` với danh sách toàn bộ ticket (kể cả của user khác) thay vì `403`, xác nhận lỗ hổng.

---

## 5. TỔNG HỢP THỐNG KÊ

| Severity | Số lượng Bug | Module ảnh hưởng |
| :---: | :---: | :--- |
| Critical | 2 | Medical Services (role check), Support Tickets (missing auth) |
| Major | 3 | Clinic Appointments, Medical Services (not-found), Notifications (delete) |
| Minor | 2 | Notifications (markAsRead), Prescriptions (refill ownership) |
| **Tổng** | **7** | 5 module |

---

## 6. KẾT LUẬN

*   Đã tổng hợp thành công **Bảng tổng hợp lỗi (Bug Summary Table)** với đầy đủ 7 cột yêu cầu: `id`, `module`, `severity`, `status`, `evidence`, `assignee`, `reproduction link` — tổng hợp **7 lỗi thực tế** đã phát hiện xuyên suốt các task KCPM-782, KCPM-802, KCPM-807, KCPM-817.
*   Đã chuẩn hóa **Quy tắc minh chứng (Evidence Rules)** áp dụng riêng biệt cho 6 loại lỗi: Backend, API, Frontend, Security, E2E, và Database — đảm bảo bảng tổng hợp có thể tái sử dụng cho **mọi loại defect** phát sinh trong các đợt kiểm thử tiếp theo, đúng theo completion criteria của đề bài.
*   Áp dụng **quy trình vòng đời lỗi 5 trạng thái** (Open → In Progress → Fixed → Verified → Closed) kèm nhánh Reopened/Rejected, thống nhất với `bug_tracking_standard_spec.md` (KCPM-821) đã có sẵn của nhóm.
*   Bảng này sẽ đóng vai trò là **nguồn dữ liệu sống (living document)** cho báo cáo kiểm thử cuối kỳ — cần cập nhật liên tục khi có bug mới phát hiện hoặc bug cũ được fix/verify.