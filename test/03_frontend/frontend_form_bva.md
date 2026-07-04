# BÁO CÁO: THIẾT KẾ TEST CASE PHÂN TÍCH GIÁ TRỊ BIÊN (BVA) CHO CÁC FORM FRONTEND

**Mã Ticket Jira:** KCPM-752  
**Người thực hiện (Assignee):** Duy Hồ Văn  
**Mã số Sinh viên:** 089205001272  
**Phương pháp áp dụng:** Phân tích giá trị biên (Boundary Value Analysis - BVA)  

---

## 1. Mục tiêu kiểm thử

1. Xác định điều kiện kiểm thử của các trường dữ liệu trên các form giao diện chính (Login, Create User, Create Patient, Appointment Form, Support Ticket Form).
2. Áp dụng kỹ thuật phân tích giá trị biên (BVA) để xác định chính xác các điểm ranh giới nhạy cảm (min-1, min, min+1, valid/middle, max-1, max, max+1) theo đặc tả validation của frontend.
3. Thiết kế đúng **10 test cases** giá trị biên để tối ưu hóa độ bao phủ kiểm thử, phát hiện sớm các lỗi validation ở biên trước khi gửi dữ liệu lên API.

---

## 2. Đặc tả các trường dữ liệu và Quy tắc Biên

Dựa trên việc kiểm tra mã nguồn thực tế của dự án frontend tại các component:
* `CreateUserModal.tsx`
* `CreatePatientModal.tsx`
* `LoginModal.tsx`
* `AddAppointmentModal.tsx`
* `CreateTicketModal.tsx`

Chúng tôi xác định được các trường có quy tắc biên định lượng rõ ràng như sau:

### 2.1. Trường Mật khẩu (`password`) - Form Thêm người dùng mới (`CreateUserModal`)
* **Đặc tả mã nguồn:** `else if (formData.password.length < 6) { errors.password = 'Mật khẩu phải từ 6 ký tự'; }`
* **Quy tắc biên:** Độ dài tối thiểu là **6 ký tự** (Min = 6).
* **Các điểm biên cần xét:**
  * $min-1 = 5$ ký tự (Không hợp lệ, thông báo lỗi).
  * $min = 6$ ký tự (Hợp lệ).
  * $min+1 = 7$ ký tự (Hợp lệ).

### 2.2. Trường Tuổi (`age`) - Form Thêm hồ sơ bệnh nhân (`CreatePatientModal`)
* **Đặc tả mã nguồn:** `else if (isNaN(Number(formData.age)) || Number(formData.age) < 0 || Number(formData.age) > 150) { errors.age = 'Tuổi không hợp lệ (0-150)'; }`
* **Quy tắc biên:** Giá trị số nằm trong khoảng từ **0 đến 150** (Min = 0, Max = 150).
* **Các điểm biên cần xét:**
  * $min-1 = -1$ (Không hợp lệ, thông báo lỗi).
  * $min = 0$ (Hợp lệ).
  * $max = 150$ (Hợp lệ).
  * $max+1 = 151$ (Không hợp lệ, thông báo lỗi).

### 2.3. Trường Số điện thoại (`phone`) - Form Thêm hồ sơ bệnh nhân (`CreatePatientModal`)
* **Đặc tả mã nguồn:** Định dạng regex `/^(0|\+84)(\d{9})$/`. Khi nhập dạng bắt đầu bằng `0`, số điện thoại phải có độ dài đúng **10 chữ số**.
* **Quy tắc biên:** Độ dài chuỗi ký tự số (bắt đầu bằng `0`) phải bằng **10** (Min = 10, Max = 10).
* **Các điểm biên cần xét:**
  * $min-1 = 9$ chữ số (Không hợp lệ, thông báo lỗi).
  * $min/max = 10$ chữ số (Hợp lệ).
  * $max+1 = 11$ chữ số (Không hợp lệ, thông báo lỗi).

---

## 3. Bảng thiết kế 10 Test Cases chi tiết (BVA Table)

Dưới đây là danh sách chính xác **10 test cases biên** được thiết kế đáp ứng đầy đủ yêu cầu của ticket Jira **KCPM-752**:

| STT | Mã TC | Form / Giao diện | Trường kiểm thử | Quy tắc Biên (Min/Max Rule) | Loại Biên | Dữ liệu đầu vào (Input) | Kết quả mong đợi (Expected Result) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **TC-BVA-01** | CreateUserModal | Mật khẩu (`password`) | Độ dài tối thiểu 6 ký tự | $min - 1$ | `"12345"` (5 ký tự) | Hiển thị lỗi: `"Mật khẩu phải từ 6 ký tự"` |
| **2** | **TC-BVA-02** | CreateUserModal | Mật khẩu (`password`) | Độ dài tối thiểu 6 ký tự | $min$ | `"123456"` (6 ký tự) | Trường hợp lệ, không hiển thị lỗi mật khẩu |
| **3** | **TC-BVA-03** | CreateUserModal | Mật khẩu (`password`) | Độ dài tối thiểu 6 ký tự | $min + 1$ | `"1234567"` (7 ký tự) | Trường hợp lệ, không hiển thị lỗi mật khẩu |
| **4** | **TC-BVA-04** | CreatePatientModal | Tuổi (`age`) | Giá trị từ 0 đến 150 | $min - 1$ | `-1` | Hiển thị lỗi: `"Tuổi không hợp lệ (0-150)"` |
| **5** | **TC-BVA-05** | CreatePatientModal | Tuổi (`age`) | Giá trị từ 0 đến 150 | $min$ | `0` | Trường hợp lệ, không hiển thị lỗi tuổi |
| **6** | **TC-BVA-06** | CreatePatientModal | Tuổi (`age`) | Giá trị từ 0 đến 150 | $max$ | `150` | Trường hợp lệ, không hiển thị lỗi tuổi |
| **7** | **TC-BVA-07** | CreatePatientModal | Tuổi (`age`) | Giá trị từ 0 đến 150 | $max + 1$ | `151` | Hiển thị lỗi: `"Tuổi không hợp lệ (0-150)"` |
| **8** | **TC-BVA-08** | CreatePatientModal | Số điện thoại (`phone`) | Đúng 10 chữ số (bắt đầu bằng 0) | $min - 1$ | `"091234567"` (9 chữ số) | Hiển thị lỗi: `"Số điện thoại không hợp lệ (10 số)"` |
| **9** | **TC-BVA-09** | CreatePatientModal | Số điện thoại (`phone`) | Đúng 10 chữ số (bắt đầu bằng 0) | $min / max$ | `"0912345678"` (10 chữ số) | Trường hợp lệ, không hiển thị lỗi số điện thoại |
| **10**| **TC-BVA-10** | CreatePatientModal | Số điện thoại (`phone`) | Đúng 10 chữ số (bắt đầu bằng 0) | $max + 1$ | `"09123456789"` (11 chữ số) | Hiển thị lỗi: `"Số điện thoại không hợp lệ (10 số)"` |

---

## 4. Kết luận
* Toàn bộ 10 test cases được thiết kế trực tiếp dựa trên logic kiểm tra điều kiện của mã nguồn frontend hiện tại, đảm bảo tính thực tế và khả năng áp dụng cao.
* Các điểm kiểm thử bao phủ toàn bộ các trường hợp nhạy cảm tại biên ($min-1$, $min$, $min+1$, $max-1$, $max$, $max+1$) cho các form cốt lõi như `CreateUserModal` và `CreatePatientModal`.

---

## 5. Ghi chú đồng bộ frontend/backend

Phần BVA ở trên phản ánh đúng validation hiện tại của frontend, nhưng khi đối chiếu backend cần ghi rõ các điểm sau:

| Trường | Frontend hiện tại | Backend hiện tại | Kết luận kiểm thử |
|---|---|---|---|
| Create user password | Min = 6 ký tự trong `CreateUserModal` | Min = 8 ký tự trong `CreateUserRequest` | Case 6 và 7 ký tự là UI-valid nhưng API-invalid. Cần E2E/API test để phát hiện mismatch. |
| Create patient password | Min = 6 ký tự trong `CreatePatientModal` | `CreatePatientRequest.password` chưa có annotation min length | Nên bổ sung backend validation hoặc ghi rõ đây chỉ là ràng buộc UI. |
| Patient phone | Regex frontend: `0` hoặc `+84` + 9 chữ số | `CreatePatientRequest.phone` chỉ `@NotBlank` | Nên bổ sung backend pattern nếu muốn bảo đảm dữ liệu không bypass frontend. |
| Patient age | Frontend 0..150 | Backend lưu `age` là `String`, chưa có range validation | Nên bổ sung DTO validation hoặc service validation nếu đây là requirement bắt buộc. |

### Test case bổ sung bắt buộc

| Test Case | Type | Preconditions | Input | Steps | Expected Outcome | New Tags Covered | Automation Target |
|---|---|---|---|---|---|---|---|
| TC-FE-MISMATCH-001 | Cross-layer | Đăng nhập admin/clinic manager | Create user password `"123456"` | Submit form thêm user | Frontend cho qua, backend trả validation lỗi min 8 hoặc API reject | `EP-AUTH-I08` | CodeceptJS + API assertion |
| TC-FE-MISMATCH-002 | Cross-layer | Đăng nhập clinic manager | Create patient phone `"abc"` gửi trực tiếp API | Bypass UI bằng Postman/API | Backend hiện có thể không chặn vì chỉ `@NotBlank`; ghi nhận gap nếu request thành công | `EP-FE-I09` | Postman |
| TC-FE-MISMATCH-003 | Cross-layer | Đăng nhập clinic manager | Create patient age `"151"` gửi trực tiếp API | Bypass UI bằng Postman/API | Backend hiện có thể không chặn vì `age` là `String`; ghi nhận gap nếu request thành công | `BVA-FE-B06` | Postman |
