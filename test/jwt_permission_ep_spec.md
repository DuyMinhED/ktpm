# BÁO CÁO: THIẾT KẾ TEST CASE PHÂN HOẠCH LỚP TƯƠNG ĐƯƠNG (EP) CHO JWT TOKEN VÀ QUYỀN TRUY CẬP

**Mã Ticket Jira:** KCPM-753  
**Người thực hiện (Assignee):** Duy Hồ Văn  
**Mã số Sinh viên:** 089205001272  
**Phương pháp áp dụng:** Phân hoạch lớp tương đương (Equivalence Partitioning - EP)  

---

## 1. Mục tiêu kiểm thử

1. Xác định các phân hoạch tương đương (hợp lệ và không hợp lệ) đối với dữ liệu đầu vào của Header Authorization, cấu trúc Token JWT và quyền hạn người dùng (Roles).
2. Thiết kế từ **5 đến 8 test cases** phân hoạch tương đương nhằm bao phủ toàn bộ các luồng bảo mật quan trọng của hệ thống bao gồm: Token hợp lệ, Token hết hạn, Token lỗi định dạng/sai chữ ký, thiếu Token và lỗi truy cập không đủ quyền hạn (Insufficient role).
3. Đảm bảo tính nhất quán của kết quả mong đợi với cấu hình bảo mật thực tế của ứng dụng (HTTP Status Codes: 200, 401, 403).

---

## 2. Đặc tả Logic Bảo mật & Phân hoạch Lớp tương đương

Dựa trên việc kiểm tra cấu trúc cấu hình bảo mật tại `SecurityConfig.java` và class kiểm tra token `JwtTokenProvider.java`:

### 2.1. Xác thực Token (Authentication)
* **API yêu cầu bảo mật:** Bất kỳ request nào ngoài `/api/v1/auth/**`, `/swagger-ui/**`, `/v3/api-docs/**`, `/h2-console/**` đều yêu cầu phải có Token hợp lệ.
* **Bộ lọc JWT (`JwtAuthenticationFilter`):** Trích xuất token từ header `Authorization` với tiền tố `Bearer `.
* **Xác thực chữ ký & hạn dùng (`JwtTokenProvider.validateToken()`):**
  * `MalformedJwtException`: Định dạng JWT không hợp lệ.
  * `ExpiredJwtException`: Token hết hạn (trường `exp` nhỏ hơn thời gian hiện tại).
  * `SecurityException` / `SignatureException`: Sai chữ ký bảo mật.

### 2.2. Phân quyền truy cập (Authorization)
* Đường dẫn `/api/v1/admin/**` yêu cầu role `ADMIN` (`hasRole("ADMIN")`).
* Đường dẫn `/api/v1/clinics/**` yêu cầu một trong các role `ADMIN`, `CLINIC_MANAGER`, hoặc `DOCTOR`.

Từ đó, miền dữ liệu đầu vào (Authorization Header + Target URL + User Role) được chia làm các lớp tương đương sau:

| Tên miền đầu vào | Phân hoạch hợp lệ (Valid EP) | Phân hoạch không hợp lệ (Invalid EP) |
| :--- | :--- | :--- |
| **Định dạng Header** | **EP-V1:** Bắt đầu bằng `"Bearer "` và có nội dung Token tiếp theo. | **EP-I1:** Header rỗng/thiếu.<br>**EP-I2:** Header có nội dung nhưng không bắt đầu bằng `"Bearer "` (ví dụ: `Basic ...`). |
| **Tính hợp lệ của Token** | **EP-V2:** Token có cấu trúc đúng, chữ ký khớp với Secret Key và còn hạn sử dụng. | **EP-I3:** Token hết hạn sử dụng.<br>**EP-I4:** Token có chữ ký sai hoặc cấu trúc bị thay đổi/hỏng (Malformed). |
| **Quyền truy cập (Role)** | **EP-V3:** User có Role khớp với Role yêu cầu của Endpoint cần truy cập. | **EP-I5:** User có Role hợp lệ nhưng không đủ quyền hạn truy cập Endpoint (ví dụ: `DOCTOR` truy cập `/api/v1/admin/**`). |

---

## 3. Bảng thiết kế Test Cases chi tiết (EP Table)

Dưới đây là danh sách **6 test cases tương đương** (nằm trong khoảng yêu cầu 5-8 cases) bao phủ toàn bộ các phân hoạch trên:

| STT | Mã TC | Phân hoạch phủ | Dữ liệu đầu vào (Representative Input) | Endpoint truy cập | Quyền của User (Role) | Kết quả mong đợi (Expected Result) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **TC-EP-01** | EP-V1, EP-V2, EP-V3 | Header `Authorization: Bearer <valid_admin_jwt>` | `/api/v1/admin/users` | `ADMIN` | **HTTP 200 OK**<br>Truy cập tài nguyên thành công. |
| **2** | **TC-EP-02** | EP-V1, EP-V2, EP-I5 | Header `Authorization: Bearer <valid_doctor_jwt>` | `/api/v1/admin/users` | `DOCTOR` | **HTTP 403 Forbidden**<br>Bị chặn truy cập do không đủ quyền hạn. |
| **3** | **TC-EP-03** | EP-V1, EP-I3 | Header `Authorization: Bearer <expired_jwt>` | `/api/v1/clinics` | `CLINIC_MANAGER` | **HTTP 401 Unauthorized**<br>Yêu cầu đăng nhập lại (Token hết hạn). |
| **4** | **TC-EP-04** | EP-V1, EP-I4 | Header `Authorization: Bearer <malformed_or_bad_sig_jwt>` | `/api/v1/clinics` | `ADMIN` | **HTTP 401 Unauthorized**<br>Từ chối truy cập do Token không hợp lệ. |
| **5** | **TC-EP-05** | EP-I1 | Không gửi Header `Authorization` | `/api/v1/clinics` | Không xác định | **HTTP 401 Unauthorized**<br>Từ chối truy cập do thiếu thông tin xác thực. |
| **6** | **TC-EP-06** | EP-I2 | Header `Authorization: Basic dXNlcjpwYXNz` (Sai định dạng Bearer) | `/api/v1/clinics` | Không xác định | **HTTP 401 Unauthorized**<br>Từ chối truy cập do sai định dạng header. |

---

## 4. Kết luận
* Báo cáo này thiết kế chính xác **6 test cases** phân hoạch tương đương cho hệ thống xác thực JWT và phân quyền, thỏa mãn đầy đủ các điều kiện hoàn thành của ticket **KCPM-753**.
* Các dữ liệu đại diện và kết quả mong đợi khớp với đặc tả xử lý của `SecurityConfig` và `JwtTokenProvider` trong mã nguồn backend Spring Boot.
