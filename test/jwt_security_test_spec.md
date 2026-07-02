# ĐẶC TẢ THIẾT KẾ CA KIỂM THỬ BẢO MẬT JWT VÀ PHÂN QUYỀN (JWT & ROLE/PERMISSION SECURITY TEST DESIGN)

**Mã Ticket Jira:** KCPM-819  
**Người thực hiện (Assignee):** Nguyễn Thị Ánh Ngọc  
**Email:** ngocnta4878@ut.edu.vn  
**Mục tiêu:** Thiết kế bộ ca kiểm thử bảo mật tự động xác thực token JWT và kiểm soát truy cập dựa trên vai trò (Role-Based Access Control - RBAC) tại các endpoint được bảo vệ (Protected Endpoints).

---

## 1. MÔ TẢ TÀI KHOẢN VÀ TOKEN KIỂM THỬ (TEST USERS & TOKENS)

Hệ thống kiểm thử sử dụng các tài khoản đại diện sau để sinh các Token kiểm thử tương ứng:

| Tên người dùng | Email đăng nhập | Mật khẩu mẫu | Vai trò (Role) | Token đại diện |
| :--- | :--- | :--- | :--- | :--- |
| **Admin User** | `admin@care.com` | `admin123` | `ROLE_ADMIN` | `{{adminToken}}` |
| **Clinic Manager** | `manager@clinic.com` | `123456` | `ROLE_CLINIC_MANAGER` | `{{managerToken}}` |
| **Doctor User** | `doctor@new.com` | `123456` | `ROLE_DOCTOR` | `{{doctorToken}}` |
| **Patient User** | `patient@gmail.com` | `DefaultPassword123` | `ROLE_PATIENT` | `{{patientToken}}` |

---

## 2. BẢNG THIẾT KẾ CA KIỂM THỬ BẢO MẬT (SECURITY TEST CASE TABLE)

Bộ kiểm thử được thiết kế để bao phủ đầy đủ các trạng thái của Token (Valid/Missing/Invalid/Expired) và kiểm soát truy cập (Allowed/Forbidden Role) đối với từng Endpoint.

### 2.1. Kiểm thử trạng thái Token JWT (Token Verification Tests)

| Mã TC | API Endpoint | Phương thức | Trạng thái Token kiểm thử | Header Authorization | Mã HTTP mong đợi | Nội dung lỗi mong đợi | Ý nghĩa kiểm thử |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :--- |
| **TC-SEC-JWT-01** | `/api/v1/admin/users` | `GET` | **Valid Token** (Allowed Role) | `Bearer {{adminToken}}` | **200 OK** | Trả về danh sách người dùng thành công | Xác minh Token hợp lệ và có quyền truy cập đi qua bình thường. |
| **TC-SEC-JWT-02** | `/api/v1/admin/users` | `GET` | **Missing Token** (Không truyền) | (Không gửi header) | **401 Unauthorized** | `Đăng nhập thất bại: Full authentication is required to access this resource` | Xác minh hệ thống chặn yêu cầu nặc danh đối với endpoint được bảo vệ. |
| **TC-SEC-JWT-03** | `/api/v1/admin/users` | `GET` | **Invalid Token** (Chữ ký hỏng) | `Bearer invalid_signature_token` | **401 Unauthorized** | `Đăng nhập thất bại: Invalid JWT signature` | Xác minh token có chữ ký sai hoặc bị chỉnh sửa trái phép bị chặn đứng. |
| **TC-SEC-JWT-04** | `/api/v1/admin/users` | `GET` | **Malformed Token** (Sai định dạng) | `Bearer not-a-jwt` | **401 Unauthorized** | `Đăng nhập thất bại: JWT strings must contain exactly 2 period characters` | Xác minh token sai định dạng JWT cơ bản bị chặn đứng. |
| **TC-SEC-JWT-05** | `/api/v1/admin/users` | `GET` | **Expired Token** (Hết hạn) | `Bearer {{expiredToken}}` | **401 Unauthorized** | `Đăng nhập thất bại: Expired JWT token` | Xác minh token đã hết hạn sử dụng không được phép gọi API. |

### 2.2. Kiểm thử phân quyền truy cập vai trò (Role-Based Access Control Tests)

| Mã TC | API Endpoint | Phương thức | Vai trò thực hiện | Token sử dụng | Mã HTTP mong đợi | Nội dung lỗi mong đợi | Ý nghĩa kiểm thử |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :--- |
| **TC-SEC-RBAC-01** | `/api/v1/admin/clinics` | `POST` | **PATIENT** | `{{patientToken}}` | **403 Forbidden** | `Access Denied: Access is denied` | Ngăn chặn Patient tạo mới phòng khám trái phép. |
| **TC-SEC-RBAC-02** | `/api/v1/admin/clinics` | `POST` | **DOCTOR** | `{{doctorToken}}` | **403 Forbidden** | `Access Denied: Access is denied` | Ngăn chặn Bác sĩ thực hiện vai trò Quản trị viên phòng khám. |
| **TC-SEC-RBAC-03** | `/api/v1/admin/users` | `GET` | **CLINIC_MANAGER** | `{{managerToken}}` | **403 Forbidden** | `Access Denied: Access is denied` | Ngăn chặn Quản lý phòng khám xem danh sách tất cả tài khoản hệ thống. |
| **TC-SEC-RBAC-04** | `/api/v1/admin/users` | `GET` | **ADMIN** | `{{adminToken}}` | **200 OK** | Trả về danh sách người dùng thành công | Xác nhận Admin có toàn quyền truy cập các endpoint quản trị. |
| **TC-SEC-RBAC-05** | `/api/v1/clinics/stats` | `GET` | **CLINIC_MANAGER** | `{{managerToken}}` | **200 OK** | Trả về số liệu thống kê phòng khám | Xác nhận Quản lý phòng khám được phép truy cập endpoint phân hệ phòng khám. |
| **TC-SEC-RBAC-06** | `/api/v1/clinics/stats` | `GET` | **DOCTOR** | `{{doctorToken}}` | **200 OK** | Trả về số liệu thống kê phòng khám | Xác nhận Bác sĩ được phép xem thống kê của phòng khám liên kết. |

---

## 3. KẾT LUẬN

*   Đặc tả đã xây dựng hoàn chỉnh **11 ca kiểm thử bảo mật nâng cao** bao phủ đầy đủ tất cả các nhánh kiểm tra xác thực JWT (đầy đủ các lỗi chữ ký, định dạng, hết hạn, và thiếu token) và cơ chế phân quyền RBAC.
*   Thiết kế đảm bảo đúng mã phản hồi chuẩn của Spring Security (`401 Unauthorized` cho lỗi xác thực, `403 Forbidden` cho lỗi phân quyền, và `200 OK` cho trường hợp truy cập hợp lệ).
