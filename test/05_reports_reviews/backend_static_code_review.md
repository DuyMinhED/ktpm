# BÁO CÁO: ĐÁNH GIÁ MÃ NGUỒN TĨNH BACKEND (BACKEND STATIC CODE REVIEW REPORT)

**Mã Ticket Jira:** KCPM-814  
**Người thực hiện (Assignee):** Nguyễn Thị Ánh Ngọc  
**Email:** ngocnta4878@ut.edu.vn  
**Mục tiêu:** Thực hiện đánh giá mã nguồn tĩnh (Static Code Review) đối với các thành phần cốt lõi của Backend:
1.  Các DTO Request xác thực dữ liệu đầu vào.
2.  Bộ xử lý ngoại lệ toàn cục (`GlobalExceptionHandler.java`).
3.  Cấu hình bảo mật hệ thống (`SecurityConfig.java`).
4.  Bộ lọc xác thực JWT (`JwtAuthenticationFilter.java` & `JwtTokenProvider.java`).

---

## 1. KẾT QUẢ ĐÁNH GIÁ MÃ NGUỒN TĨNH (CODE REVIEW FINDINGS)

### 1.1. Bộ xử lý ngoại lệ toàn cục (`GlobalExceptionHandler.java`)

| File / Phương thức | Nguy cơ bảo mật & Logic (Risk) | Nhánh cần kiểm thử (Suggested Test Condition) |
| :--- | :--- | :--- |
| `handleRuntimeException` | **Nguy cơ lỗi phản hồi không chính xác (500 thay vì 404):** Mọi `RuntimeException` (như khi không tìm thấy bác sĩ/đơn thuốc) đều được trả về mã trạng thái `500 Internal Server Error` với thông điệp chung chung thay vì mã `404 Not Found`. | Kiểm thử gọi API với ID không tồn tại để xác minh hệ thống có ném ra lỗi 500 hay đã được chuyển hướng về lỗi 404 tùy chỉnh. |
| `handleValidationExceptions` | Trả về mã lỗi `400 Bad Request` chứa chi tiết các trường dữ liệu vi phạm. Điều này có thể để lộ thông tin cấu trúc cơ sở dữ liệu nếu thông báo lỗi không được kiểm soát. | Kiểm thử gửi payload rỗng hoặc vi phạm điều kiện ràng buộc DTO để kiểm tra cấu trúc JSON của Map lỗi trả về. |

### 1.2. Bộ lọc xác thực JWT (`JwtAuthenticationFilter.java` & `JwtTokenProvider.java`)

| File / Phương thức | Nguy cơ bảo mật & Logic (Risk) | Nhánh cần kiểm thử (Suggested Test Condition) |
| :--- | :--- | :--- |
| `validateToken` | **Nguy cơ nuốt biệt lệ (Exception Swallowing):** Mọi biệt lệ giải mã JWT lỗi (Signature, Expired, Malformed) đều chỉ được ghi lại ở dạng log lỗi và trả về `false`. Nếu có lỗi hệ thống nghiêm trọng hơn, nó có thể bị nuốt mất mà không báo cho client. | Kiểm thử gửi Token hết hạn, Token bị sửa chữ ký hoặc Token rỗng để xác nhận hệ thống trả về mã lỗi `401 Unauthorized` chứ không để lọt yêu cầu. |
| `doFilterInternal` | Cơ chế xử lý catch chung `try-catch(Exception ex)` có thể che giấu các lỗi cấu hình context bảo mật. | Kiểm thử gửi token bị hỏng định dạng hoặc không có thông tin user. |

### 1.3. Cấu hình bảo mật (`SecurityConfig.java`)

| File / Phương thức | Nguy cơ bảo mật & Logic (Risk) | Nhánh cần kiểm thử (Suggested Test Condition) |
| :--- | :--- | :--- |
| `filterChain` | **Nguy cơ phân quyền lỏng lẻo:** Cấu hình `.requestMatchers("/api/v1/clinics/**").hasAnyRole("CLINIC_MANAGER", "ADMIN", "DOCTOR")` cho phép cả Doctor và Clinic Manager truy cập tất cả các API phân hệ phòng khám mà không có kiểm tra riêng biệt ở tầng Controller. | Kiểm thử dùng tài khoản Bác sĩ gọi API quản lý thông tin chung của Phòng khám (như cập nhật thông tin phòng khám) xem có bị chặn `403 Forbidden` ở tầng Controller hay không. |
| `corsConfigurationSource` | Cấu hình `.setAllowedOriginPatterns(Arrays.asList("*"))` cho phép tất cả các nguồn gốc CORS kết nối. Đây là cấu hình phát triển, cần thắt chặt trên môi trường Production. | Xác minh cấu hình Origin của dự án trên môi trường thực tế. |

### 1.4. DTO Requests (Validation Annotations)

| Lớp DTO | Trường dữ liệu | Nguy cơ rủi ro (Risk) | Nhánh cần kiểm thử |
| :--- | :--- | :--- | :--- |
| `CreateUserRequest` | `password` | Độ dài mật khẩu ngắn hơn 8 ký tự có thể tạo tài khoản yếu. | Gửi mật khẩu từ 1-7 ký tự để kiểm tra lỗi validation. |
| `CreateUserRequest` | `email` | Độ dài email quá 100 ký tự có thể gây lỗi tràn cột DB. | Gửi email dài 101 ký tự để xác nhận bị chặn lỗi 400. |

---

## 2. MA TRẬN PHÂN QUYỀN TRUY CẬP ENDPOINT (ROLE ENDPOINT MATRIX)

Ma trận dưới đây xác định các quyền truy cập được phép đối với các nhóm Endpoint chính trong hệ thống:

| Endpoint Pattern | Vai trò ADMIN | Vai trò CLINIC_MANAGER | Vai trò DOCTOR | Vai trò PATIENT | Khách (Public - No Token) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `/api/v1/auth/**` | Cho phép | Cho phép | Cho phép | Cho phép | **Cho phép (PermitAll)** |
| `/api/v1/admin/**` | **Cho phép** | Bị cấm (403) | Bị cấm (403) | Bị cấm (403) | Bị cấm (401) |
| `/api/v1/clinics/**` | Cho phép | Cho phép | Cho phép | Bị cấm (403) | Bị cấm (401) |
| `/api/v1/patient/**` | Cho phép | Bị cấm (403) | Bị cấm (403) | **Cho phép** | Bị cấm (401) |
| `/swagger-ui/**` | Cho phép | Cho phép | Cho phép | Cho phép | **Cho phép (PermitAll)** |

---

## 3. KẾT LUẬN & KHUYẾN NGHỊ

1.  **Khắc phục lỗi ném ngoại lệ 500:** Các dịch vụ nên chuyển từ việc ném `RuntimeException` sang các ngoại lệ tùy chỉnh có kế thừa `ResponseStatusException` hoặc được định nghĩa rõ ràng trong `@ExceptionHandler` (ví dụ: `ResourceNotFoundException` trả về đúng mã trạng thái `404 Not Found`).
2.  **Cần thắt chặt bảo mật phân hệ Clinics:** Cần kết hợp sử dụng chú thích phân quyền ở tầng Controller như `@PreAuthorize("hasRole('CLINIC_MANAGER')")` thay vì chỉ cấu hình chung trong `SecurityConfig.java`.
3.  **Tối ưu hóa các test case tự động:** Bộ kiểm thử API Postman/Newman cần bổ sung đầy đủ các kịch bản kiểm tra mã lỗi `401 Unauthorized` khi thiếu header Authorization, và lỗi `403 Forbidden` khi sử dụng token sai vai trò.
