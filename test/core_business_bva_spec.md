# BÁO CÁO: THIẾT KẾ TEST CASE PHÂN TÍCH GIÁ TRỊ BIÊN (BVA) CHO NGÀY, SỐ LƯỢNG VÀ CÁC TRƯỜNG NGHIỆP VỤ CỐT LÕI

**Mã Ticket Jira:** KCPM-758  
**Người thực hiện (Assignee):** Nguyễn Thị Ánh Ngọc  
**Email:** ngocnta4878@ut.edu.vn  
**Phương pháp áp dụng:** Phân tích giá trị biên (Boundary Value Analysis - BVA)  

---

## 1. Mục tiêu kiểm thử

1. Xác định điều kiện kiểm thử và giá trị biên cho các trường thời gian đặt lịch hẹn (`appointmentTime`), số lượng danh sách thuốc kê đơn (`items`) và các chỉ số sức khỏe của bệnh nhân (`BLOOD_SUGAR`).
2. Áp dụng kỹ thuật phân tích giá trị biên (BVA) để xác định chính xác các điểm ranh giới nhạy cảm ($min-1$, $min$, $min+1$, $max-1$, $max$, $max+1$ nơi áp dụng) dựa theo tài liệu Đặc tả yêu cầu phần mềm (SRS).
3. Thiết kế đúng **10 test cases** giá trị biên để tối ưu hóa độ bao phủ kiểm thử và đảm bảo tính toàn vẹn của logic nghiệp vụ cốt lõi.

---

## 2. Đặc tả các trường dữ liệu và Quy tắc Biên

Dựa trên tài liệu `docs/SRS.md` và mã nguồn backend/frontend:

### 2.1. Thời gian hẹn (`appointmentTime`) - Chức năng đặt lịch khám
* **Quy tắc biên dưới (Tối thiểu):** Lịch hẹn phải sau thời điểm hiện tại ít nhất 3 giờ.
  * $t_{appt} \ge t_{now} + 3\text{ giờ}$ (Min = $t_{now} + 3\text{ giờ}$).
  * Các điểm biên xét với $t_{now}$ giả định là `2026-07-01T13:00:00`:
    * $min - 1$: `2026-07-01T15:59:00` (Không hợp lệ, thông báo lỗi).
    * $min$: `2026-07-01T16:00:00` (Hợp lệ).
* **Quy tắc biên trên (Tối đa):** Chỉ được đặt lịch hẹn trước tối đa 15 ngày.
  * $t_{appt} \le t_{now} + 15\text{ ngày}$ (Max = $t_{now} + 15\text{ ngày}$).
  * Các điểm biên xét với $t_{now}$ giả định là `2026-07-01T13:00:00`:
    * $max$: `2026-07-16T13:00:00` (Hợp lệ).
    * $max + 1$: `2026-07-16T13:01:00` (Không hợp lệ, thông báo lỗi).

### 2.2. Số lượng thuốc trong đơn (`items`) - Chức năng kê đơn
* **Quy tắc biên dưới:** Đơn thuốc phải chứa ít nhất 1 loại thuốc (Min = 1).
* Các điểm biên:
  * $min - 1$: 0 loại thuốc (Không hợp lệ, thông báo lỗi).
  * $min$: 1 loại thuốc (Hợp lệ).

### 2.3. Chỉ số Đường huyết (`BLOOD_SUGAR`) - Phân loại sức khỏe bệnh nhân
* **Quy tắc biên:** Phân loại trạng thái "Bình thường" (NORMAL) nằm trong khoảng $[4.0, 6.0]$ mmol/L theo đặc tả SRS (Min = 4.0, Max = 6.0).
* Các điểm biên:
  * $min - 1$: 3.9 mmol/L (Không hợp lệ cho NORMAL $\rightarrow$ Phân loại trạng thái `LOW`).
  * $min$: 4.0 mmol/L (Hợp lệ cho NORMAL $\rightarrow$ Phân loại trạng thái `NORMAL`).
  * $max$: 6.0 mmol/L (Hợp lệ cho NORMAL $\rightarrow$ Phân loại trạng thái `NORMAL`).
  * $max + 1$: 6.1 mmol/L (Không hợp lệ cho NORMAL $\rightarrow$ Phân loại trạng thái `BORDERLINE_HIGH`).

---

## 3. Bảng thiết kế 10 Test Cases chi tiết (BVA Table)

| STT | Mã TC | Chức năng / Form | Trường kiểm thử | Loại Biên | Dữ liệu đầu vào (Input) | Quy tắc Biên (Min/Max Rule) | Kết quả mong đợi (Expected Result) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **TC-BVA-CORE-01** | Đặt lịch hẹn | Thời gian hẹn (`appointmentTime`) | $min - 1$ | $t_{now} + 2\text{h } 59\text{m}$ | $t_{appt} \ge t_{now} + 3\text{ giờ}$ | Thất bại: API/Frontend trả lỗi: `"Thời gian hẹn phải sau thời điểm hiện tại ít nhất 3 giờ"` |
| **2** | **TC-BVA-CORE-02** | Đặt lịch hẹn | Thời gian hẹn (`appointmentTime`) | $min$ | $t_{now} + 3\text{ giờ}$ | $t_{appt} \ge t_{now} + 3\text{ giờ}$ | Thành công: Tạo lịch hẹn hợp lệ ở trạng thái `PENDING` |
| **3** | **TC-BVA-CORE-03** | Đặt lịch hẹn | Thời gian hẹn (`appointmentTime`) | $max$ | $t_{now} + 15\text{ ngày}$ | $t_{appt} \le t_{now} + 15\text{ ngày}$ | Thành công: Tạo lịch hẹn hợp lệ ở trạng thái `PENDING` |
| **4** | **TC-BVA-CORE-04** | Đặt lịch hẹn | Thời gian hẹn (`appointmentTime`) | $max + 1$ | $t_{now} + 15\text{ ngày } 1\text{ phút}$ | $t_{appt} \le t_{now} + 15\text{ ngày}$ | Thất bại: API/Frontend trả lỗi: `"Chỉ được phép đặt lịch hẹn trước tối đa 15 ngày"` |
| **5** | **TC-BVA-CORE-05** | Kê đơn thuốc | Danh sách thuốc (`items`) | $min - 1$ | Danh sách rỗng (0 loại thuốc) | $items \ge 1$ | Thất bại: API/Frontend trả lỗi: `"At least one medication is required"` hoặc `"At least 1 item is required"` |
| **6** | **TC-BVA-CORE-06** | Kê đơn thuốc | Danh sách thuốc (`items`) | $min$ | Danh sách có 1 loại thuốc | $items \ge 1$ | Thành công: Tạo đơn thuốc hợp lệ |
| **7** | **TC-BVA-CORE-07** | Nhập chỉ số đo | Đường huyết (`BLOOD_SUGAR`) | $min - 1$ (đối với NORMAL) | `3.9` mmol/L | Khoảng NORMAL: $[4.0, 6.0]$ | Thành công: Lưu chỉ số sức khỏe với trạng thái `LOW` |
| **8** | **TC-BVA-CORE-08** | Nhập chỉ số đo | Đường huyết (`BLOOD_SUGAR`) | $min$ (đối với NORMAL) | `4.0` mmol/L | Khoảng NORMAL: $[4.0, 6.0]$ | Thành công: Lưu chỉ số sức khỏe với trạng thái `NORMAL` |
| **9** | **TC-BVA-CORE-09** | Nhập chỉ số đo | Đường huyết (`BLOOD_SUGAR`) | $max$ (đối với NORMAL) | `6.0` mmol/L | Khoảng NORMAL: $[4.0, 6.0]$ | Thành công: Lưu chỉ số sức khỏe với trạng thái `NORMAL` |
| **10**| **TC-BVA-CORE-10** | Nhập chỉ số đo | Đường huyết (`BLOOD_SUGAR`) | $max + 1$ (đối với NORMAL) | `6.1` mmol/L | Khoảng NORMAL: $[4.0, 6.0]$ | Thành công: Lưu chỉ số sức khỏe với trạng thái `BORDERLINE_HIGH` |

---

## 4. Kết luận

* Đã thiết kế chính xác **10 test cases** phân tích giá trị biên (BVA) bao phủ đầy đủ các trường hợp liên quan đến thời gian đặt lịch (`appointmentTime`), số lượng danh sách thuốc (`items`), và chỉ số đo sức khỏe (`BLOOD_SUGAR`).
* Các test case tuân thủ chặt chẽ đặc tả nghiệp vụ trong tài liệu `docs/SRS.md`, giúp kiểm chứng tính đúng đắn của logic validation tại các vùng ranh giới nhạy cảm.
