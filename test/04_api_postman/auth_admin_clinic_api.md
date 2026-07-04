# ĐẶC TẢ THIẾT KẾ TEST CASE API CHO PHÂN HỆ AUTH, ADMIN VÀ CLINIC

**Mã Ticket Jira:** KCPM-809  
**Người thực hiện (Assignee):** Nguyễn Thị Ánh Ngọc  
**Email:** ngocnta4878@ut.edu.vn  
**Mục tiêu:** Thiết kế bộ ca kiểm thử hộp đen (Black-box API Testing) cho các nhóm API chính: Auth, Admin - Users (Quản lý người dùng), và Admin - Clinics (Quản lý phòng khám) bao gồm các trạng thái: Thành công, Dữ liệu không hợp lệ, Chưa xác thực, Bị cấm truy cập, Không tìm thấy dữ liệu, và Phân trang/Lọc.

---

## 1. PHÂN HỆ XÁC THỰC (AUTH GROUP)

### Bảng Thiết kế Ca kiểm thử API Auth

| Mã TC | API Endpoint | Phương thức | Phân loại kiểm thử | Dữ liệu đầu vào (Test Data) | Mã lỗi / Body mong đợi | Ý nghĩa kiểm thử |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **TC-API-AUTH-01** | `/api/v1/auth/health` | `GET` | Health check (Success) | Không yêu cầu | **200 OK**<br>`{ "status": "UP" }` | Đảm bảo máy chủ và cơ sở dữ liệu hoạt động bình thường. |
| **TC-API-AUTH-02** | `/api/v1/auth/login` | `POST` | Login Success (Admin) | `{ "email": "admin@care.com", "password": "admin123" }` | **200 OK**<br>Trả về JWT token và vai trò `ADMIN` | Đăng nhập thành công với vai trò Quản trị viên tối cao. |
| **TC-API-AUTH-03** | `/api/v1/auth/login` | `POST` | Login Success (Patient) | `{ "email": "patient@gmail.com", "password": "DefaultPassword123" }` | **200 OK**<br>Trả về JWT token và vai trò `PATIENT` | Đăng nhập thành công với vai trò Bệnh nhân. |
| **TC-API-AUTH-04** | `/api/v1/auth/login` | `POST` | Invalid Request (Missing password) | `{ "email": "admin@care.com" }` | **400 Bad Request**<br>`"Mật khẩu không được để trống"` | Trả lỗi validation khi thiếu trường bắt buộc. |
| **TC-API-AUTH-05** | `/api/v1/auth/login` | `POST` | Unauthorized (Wrong password) | `{ "email": "admin@care.com", "password": "wrongpassword" }` | **401 Unauthorized**<br>`"Sai tài khoản hoặc mật khẩu"` | Từ chối truy cập khi mật khẩu không khớp. |
| **TC-API-AUTH-06** | `/api/v1/auth/login` | `POST` | Not Found (Non-existing email) | `{ "email": "unknown@gmail.com", "password": "anypassword" }` | **401 Unauthorized** hoặc **404 Not Found** | Từ chối truy cập khi tài khoản không tồn tại. |

---

## 2. PHÂN HỆ QUẢN TRỊ VIÊN - QUẢN LÝ NGƯỜI DÙNG (ADMIN - USERS GROUP)

### Bảng Thiết kế Ca kiểm thử API Admin Users

| Mã TC | API Endpoint | Phương thức | Phân loại kiểm thử | Dữ liệu đầu vào / Header | Mã lỗi / Body mong đợi | Ý nghĩa kiểm thử |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **TC-API-USER-01** | `/api/v1/admin/users` | `GET` | Success (Get list) | Authorization: `Bearer {{adminToken}}` | **200 OK**<br>Danh sách người dùng phân trang | Lấy danh sách toàn bộ người dùng hệ thống thành công. |
| **TC-API-USER-02** | `/api/v1/admin/users` | `GET` | Filter / Pagination | Authorization: `Bearer {{adminToken}}`<br>Params: `role=DOCTOR&page=0&size=10` | **200 OK**<br>Danh sách chứa tối đa 10 Bác sĩ | Lọc danh sách theo vai trò và phân trang thành công. |
| **TC-API-USER-03** | `/api/v1/admin/users` | `GET` | Unauthorized | Không truyền token hoặc token sai | **401 Unauthorized** | Từ chối yêu cầu do thiếu xác thực JWT. |
| **TC-API-USER-04** | `/api/v1/admin/users` | `GET` | Forbidden | Authorization: `Bearer {{patientToken}}` | **403 Forbidden** | Chặn người dùng có vai trò Bệnh nhân xem danh sách quản trị. |
| **TC-API-USER-05** | `/api/v1/admin/users/{id}` | `GET` | Success (Get detail) | Authorization: `Bearer {{adminToken}}`<br>Path Variable: `id = 1` | **200 OK**<br>Chi tiết thông tin User có ID = 1 | Lấy chi tiết thông tin người dùng có sẵn trong DB. |
| **TC-API-USER-06** | `/api/v1/admin/users/{id}` | `GET` | Not Found | Authorization: `Bearer {{adminToken}}`<br>Path Variable: `id = 99999` | **404 Not Found**<br>`"Không tìm thấy người dùng"` | Báo lỗi không tìm thấy khi ID không tồn tại. |
| **TC-API-USER-07** | `/api/v1/admin/users` | `POST` | Success (Create Doctor) | Authorization: `Bearer {{adminToken}}`<br>Body: DDTO Bác sĩ mới (email độc nhất) | **201 Created**<br>Đối tượng Bác sĩ mới đã lưu | Quản trị viên thêm mới một tài khoản Bác sĩ thành công. |
| **TC-API-USER-08** | `/api/v1/admin/users` | `POST` | Invalid Request (Duplicate email) | Authorization: `Bearer {{adminToken}}`<br>Body: `{ "email": "admin@care.com", ... }` | **400 Bad Request**<br>`"Email đã tồn tại"` | Ngăn chặn việc tạo trùng email của tài khoản khác. |
| **TC-API-USER-09** | `/api/v1/admin/users/{id}/toggle-status` | `PATCH` | Success (Toggle status) | Authorization: `Bearer {{adminToken}}`<br>Path: `id = 1` | **200 OK**<br>User status đổi từ ACTIVE sang INACTIVE | Bật/tắt trạng thái hoạt động của người dùng thành công. |
| **TC-API-USER-10** | `/api/v1/admin/users/{id}` | `DELETE` | Success (Delete user) | Authorization: `Bearer {{adminToken}}`<br>Path: `id = 2` | **200 OK** hoặc **204 No Content** | Xóa (hoặc soft delete) tài khoản người dùng thành công. |

---

## 3. PHÂN HỆ QUẢN TRỊ VIÊN - QUẢN LÝ PHÒNG KHÁM (ADMIN - CLINICS GROUP)

### Bảng Thiết kế Ca kiểm thử API Admin Clinics

| Mã TC | API Endpoint | Phương thức | Phân loại kiểm thử | Dữ liệu đầu vào / Header | Mã lỗi / Body mong đợi | Ý nghĩa kiểm thử |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **TC-API-CLINIC-01** | `/api/v1/admin/clinics` | `GET` | Success (Get list) | Authorization: `Bearer {{adminToken}}` | **200 OK**<br>Danh sách phòng khám phân trang | Lấy danh sách các phòng khám trong hệ thống thành công. |
| **TC-API-CLINIC-02** | `/api/v1/admin/clinics` | `GET` | Filter / Pagination | Authorization: `Bearer {{adminToken}}`<br>Params: `page=0&size=5` | **200 OK**<br>Danh sách chứa tối đa 5 phòng khám | Phân trang danh sách phòng khám thành công. |
| **TC-API-CLINIC-03** | `/api/v1/admin/clinics` | `GET` | Unauthorized | Không truyền token hoặc token sai | **401 Unauthorized** | Từ chối yêu cầu do thiếu xác thực JWT. |
| **TC-API-CLINIC-04** | `/api/v1/admin/clinics` | `GET` | Forbidden | Authorization: `Bearer {{doctorToken}}` | **403 Forbidden** | Chặn người dùng có vai trò Bác sĩ truy cập quản trị phòng khám. |
| **TC-API-CLINIC-05** | `/api/v1/admin/clinics/{id}` | `GET` | Success (Get detail) | Authorization: `Bearer {{adminToken}}`<br>Path Variable: `id = 1` | **200 OK**<br>Chi tiết thông tin phòng khám ID = 1 | Lấy chi tiết thông tin phòng khám có sẵn trong DB. |
| **TC-API-CLINIC-06** | `/api/v1/admin/clinics/{id}` | `GET` | Not Found | Authorization: `Bearer {{adminToken}}`<br>Path Variable: `id = 99999` | **404 Not Found**<br>`"Không tìm thấy phòng khám"` | Báo lỗi không tìm thấy khi ID không tồn tại. |
| **TC-API-CLINIC-07** | `/api/v1/admin/clinics` | `POST` | Success (Create Clinic) | Authorization: `Bearer {{adminToken}}`<br>Body: `{ "name": "PK Mới", "clinicCode": "PK999", ... }` | **201 Created** hoặc **200 OK**<br>Thông tin phòng khám đã tạo | Thêm mới phòng khám và tạo tài khoản Quản lý phòng khám. |
| **TC-API-CLINIC-08** | `/api/v1/admin/clinics` | `POST` | Invalid Request (Duplicate Code) | Authorization: `Bearer {{adminToken}}`<br>Body: `{ "clinicCode": "PK001", ... }` | **400 Bad Request**<br>`"Mã phòng khám đã tồn tại"` | Ngăn chặn tạo phòng khám trùng mã code. |
| **TC-API-CLINIC-09** | `/api/v1/admin/clinics/{id}` | `PUT` | Success (Update clinic) | Authorization: `Bearer {{adminToken}}`<br>Path: `id = 1`<br>Body: Thông tin cập nhật | **200 OK**<br>Trả về thông tin phòng khám đã sửa | Cập nhật thông tin phòng khám và quản lý phòng khám. |
| **TC-API-CLINIC-10** | `/api/v1/admin/clinics/{id}/toggle-status` | `PATCH` | Success (Toggle status) | Authorization: `Bearer {{adminToken}}`<br>Path: `id = 1` | **200 OK**<br>Clinic status đổi trạng thái | Bật/tắt trạng thái hoạt động của phòng khám thành công. |

---

## 4. KẾT LUẬN

*   Tài liệu đã thiết kế hoàn chỉnh **26 ca kiểm thử API** bao phủ đầy đủ 3 phân hệ cốt lõi: Auth, Admin Users, và Admin Clinics.
*   Bao phủ 100% các nhóm kiểm thử yêu cầu: Thành công (Success), Sai dữ liệu đầu vào (Invalid request), Chưa xác thực (Unauthorized), Bị cấm quyền truy cập (Forbidden), Không tìm thấy bản ghi (Not found), và Lọc/Phân trang (Filter/Pagination).
*   Các dữ liệu đại diện và mã trạng thái HTTP mong đợi (200, 201, 400, 401, 403, 404) được mô tả tường minh, làm cơ sở xây dựng kịch bản kiểm thử tự động Postman/Newman.
