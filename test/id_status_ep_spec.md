# BÁO CÁO: THIẾT KẾ TEST CASE PHÂN HOẠCH TƯƠNG ĐƯƠNG (EP) CHO ID, TRẠNG THÁI VÀ DỮ LIỆU KHÔNG TỒN TẠI

**Mã Ticket Jira:** KCPM-759  
**Người thực hiện (Assignee):** Nguyễn Thị Ánh Ngọc  
**Email:** ngocnta4878@ut.edu.vn  
**Phương pháp áp dụng:** Phân hoạch lớp tương đương (Equivalence Partitioning - EP)  

---

## 1. Mục tiêu kiểm thử

1. Xác định các phân hoạch lớp tương đương (hợp lệ và không hợp lệ) đối với dữ liệu đầu vào là Mã định danh (`ID`), Trạng thái (`Status`) và các trường hợp dữ liệu không tồn tại (`Non-existing data`) trong hệ thống.
2. Thiết kế từ **5 đến 8 test cases** phân hoạch tương đương (thực tế thiết kế **6 test cases**) nhằm đảm bảo bao phủ đầy đủ hành vi validation của API Backend và phản hồi trên giao diện Frontend.
3. Đảm bảo kết quả mong đợi khớp với xử lý thực tế của ứng dụng khi gặp lỗi dữ liệu (HTTP Status Codes: 200 OK, 400 Bad Request, 404 Not Found).

---

## 2. Xác định các lớp tương đương (Equivalence Partitioning)

### 2.1. Phân hoạch đối với Mã định danh (`ID`)
* **Lớp hợp lệ - Existing ID:** ID là số nguyên dương ($\ge 1$) và bản ghi có tồn tại trong cơ sở dữ liệu.
* **Lớp hợp lệ - Non-existing ID:** ID là số nguyên dương ($\ge 1$) nhưng không tồn tại bản ghi tương ứng trong cơ sở dữ liệu.
* **Lớp không hợp lệ - Invalid ID value:** ID có giá trị số nguyên $\le 0$.
* **Lớp không hợp lệ - Invalid ID format:** ID sai định dạng dữ liệu (ví dụ: chuỗi ký tự, ký tự đặc biệt hoặc số thực).

### 2.2. Phân hoạch đối với Trạng thái (`Status`)
* **Lớp hợp lệ - Valid Status:** Giá trị trạng thái nằm trong danh sách trạng thái được hệ thống cho phép đối với mỗi thực thể:
  * Trạng thái người dùng (`User`): `"ACTIVE"`, `"INACTIVE"`.
  * Trạng thái lịch hẹn (`Appointment`): `"PENDING"`, `"SCHEDULED"`, `"COMPLETED"`, `"CANCELLED"`.
* **Lớp không hợp lệ - Invalid Status:** Giá trị trạng thái nằm ngoài danh sách được hệ thống hỗ trợ (ví dụ: `"SUSPENDED"`, `"DELETED"`, `"UNKNOWN"`).

---

## 3. Bảng thiết kế 6 Test Cases phân hoạch tương đương (EP Table)

| STT | Mã TC | Phân hoạch phủ | API Endpoint đại diện | Dữ liệu đầu vào (Representative Input) | Kết quả mong đợi (Expected Result) |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **TC-EP-ID-01** | Existing ID (Hợp lệ) | `GET /api/v1/patient/appointments/{id}` | `id = 1` (Lịch hẹn có tồn tại trong DB) | **HTTP 200 OK**<br>Trả về chi tiết lịch hẹn thành công. |
| **2** | **TC-EP-ID-02** | Non-existing ID (Hợp lệ về định dạng) | `GET /api/v1/patient/appointments/{id}` | `id = 99999` (Lịch hẹn không tồn tại trong DB) | **HTTP 404 Not Found**<br>Trả về lỗi `ResourceNotFoundException`. |
| **3** | **TC-EP-ID-03** | Invalid ID value (Không hợp lệ về giá trị) | `GET /api/v1/patient/appointments/{id}` | `id = 0` (Hoặc số âm như `-5`) | **HTTP 400 Bad Request**<br>Lỗi validation đầu vào (ID phải $\ge 1$). |
| **4** | **TC-EP-ID-04** | Invalid ID format (Không hợp lệ về định dạng) | `GET /api/v1/patient/appointments/{id}` | `id = "abc"` (Chuỗi ký tự không phải số nguyên) | **HTTP 400 Bad Request**<br>Hệ thống báo lỗi đổi kiểu dữ liệu (`MethodArgumentTypeMismatchException`). |
| **5** | **TC-EP-STATUS-01** | Valid Status (Hợp lệ) | `PUT /api/v1/admin/users/{id}/status` | `id = 1`<br>Body: `{ "status": "INACTIVE" }` | **HTTP 200 OK**<br>Cập nhật trạng thái người dùng thành `"INACTIVE"` thành công. |
| **6** | **TC-EP-STATUS-02** | Invalid Status (Không hợp lệ) | `PUT /api/v1/admin/users/{id}/status` | `id = 1`<br>Body: `{ "status": "SUSPENDED" }` | **HTTP 400 Bad Request**<br>Báo lỗi validation vi phạm ràng buộc `@Pattern(regexp = "^(ACTIVE|INACTIVE)$")`. |

---

## 4. Kết luận

* Tài liệu đã thiết kế chính xác **6 test cases phân hoạch tương đương** cho các trường hợp ID, Trạng thái và Dữ liệu không tồn tại, đáp ứng đầy đủ yêu cầu hoàn thành của ticket **KCPM-759** (tối thiểu 5 và tối đa 8 test cases).
* Các test case bao phủ cả các lớp hợp lệ (tồn tại và không tồn tại trong DB) và lớp không hợp lệ (sai định dạng, ngoài vùng hỗ trợ), đảm bảo độ tin cậy khi kiểm thử giao diện và API.
