# BÁO CÁO: KỊCH BẢN KIỂM THỬ REUSABLE CHO POSTMAN (UNAUTHORIZED, FORBIDDEN & INVALID REQUESTS)

**Mã Ticket Jira:** KCPM-771  
**Người thực hiện (Assignee):** Duy Hồ Văn  
**Mã số Sinh viên:** 054205001151  
**Công cụ kiểm thử:** Postman Sandbox (JavaScript pm.test() API)  
**Phạm vi kịch bản:** Xác thực JWT (401), Phân quyền hạn chế (403), và Lỗi dữ liệu đầu vào (400/Validation).

---

## 1. Mục tiêu kịch bản

1. Chuẩn hóa và đóng gói các đoạn mã kiểm thử (`pm.test()`) có khả năng tái sử dụng (reusable snippets) trong Postman nhằm kiểm thử tự động các trường hợp phản hồi lỗi bảo mật và dữ liệu.
2. Kiểm tra tính toàn vẹn của API bao gồm: Mã trạng thái (Status Code), Thời gian phản hồi (Response Time), Định dạng tiêu đề (JSON Content-Type), và nội dung lỗi chi tiết trong Response Body.
3. Cung cấp tài liệu hướng dẫn cấu hình môi trường và tích hợp các kịch bản test này vào các Folder/Request cụ thể trong Postman.

---

## 2. Các đoạn mã kiểm thử tái sử dụng (Reusable Postman Scripts)

### 2.1. Lỗi chưa xác thực (401 Unauthorized - Thiếu hoặc sai Token JWT)
Sử dụng cho tất cả các endpoint được bảo vệ khi gửi request không kèm header Authorization hoặc token bị sai chữ ký/hết hạn.

```javascript
// 1. Kiểm tra mã trạng thái HTTP là 401
pm.test("Status code is 401 Unauthorized", function () {
    pm.response.to.have.status(401);
});

// 2. Kiểm tra thời gian phản hồi (phải nhanh do không xử lý nghiệp vụ sâu)
pm.test("Response time is less than 350ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(350);
});

// 3. Kiểm tra định dạng dữ liệu trả về là JSON
pm.test("Content-Type is application/json", function () {
    pm.response.to.have.header("Content-Type");
    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
});

// 4. Kiểm tra thông điệp lỗi trong body (ví dụ lỗi signature, expired, hoặc JWT empty)
pm.test("Response body contains auth error message", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("error");
    pm.expect(jsonData.error).to.be.oneOf([
        "Unauthorized",
        "Full authentication is required to access this resource",
        "Expired JWT token",
        "Invalid JWT token",
        "JWT claims string is empty"
    ]);
});
```

---

### 2.2. Lỗi không đủ quyền hạn (403 Forbidden - Insufficient Role)
Sử dụng khi gửi request với Token JWT hợp lệ nhưng Role của user không được phép truy cập endpoint đó (ví dụ: Patient cố tình truy cập các API thuộc `/api/v1/admin/**`).

```javascript
// 1. Kiểm tra mã trạng thái HTTP là 403
pm.test("Status code is 403 Forbidden", function () {
    pm.response.to.have.status(403);
});

// 2. Kiểm tra thời gian phản hồi (phải nhanh do bị từ chối ở tầng Filter)
pm.test("Response time is less than 350ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(350);
});

// 3. Kiểm tra định dạng dữ liệu trả về là JSON
pm.test("Content-Type is application/json", function () {
    pm.response.to.have.header("Content-Type");
    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
});

// 4. Kiểm tra thông điệp từ chối truy cập (Access Denied)
pm.test("Response body contains Access Denied message", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("message");
    pm.expect(jsonData.message).to.include("Access is denied");
});
```

---

### 2.3. Lỗi yêu cầu không hợp lệ (400 Bad Request - Sai định dạng Payload / Thiếu tham số)
Sử dụng khi kiểm thử biên dữ liệu (Validation errors), gửi thiếu các trường bắt buộc, hoặc truyền sai định dạng dữ liệu.

```javascript
// 1. Kiểm tra mã trạng thái HTTP là 400
pm.test("Status code is 400 Bad Request", function () {
    pm.response.to.have.status(400);
});

// 2. Kiểm tra thời gian phản hồi hợp lý
pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

// 3. Kiểm tra định dạng dữ liệu trả về là JSON
pm.test("Content-Type is application/json", function () {
    pm.response.to.have.header("Content-Type");
    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
});

// 4. Kiểm tra danh sách các trường lỗi (Validation Error Fields)
pm.test("Response body contains validation field errors", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an("object");
    // Kiểm tra có ít nhất một cặp key-value lỗi trả về từ Spring Validation
    pm.expect(Object.keys(jsonData).length).to.be.greaterThan(0);
});
```

---

## 3. Hướng dẫn đính kèm và triển khai trên Postman (Guidance)

### 3.1. Thiết lập biến môi trường (Environment Setup)
1. Tạo một Postman Environment mới (ví dụ: `DamDiep-Local`).
2. Định nghĩa các biến môi trường để dễ dàng chuyển đổi vai trò (Roles) trong các bộ test:
   * `base_url`: `http://localhost:8080/api/v1`
   * `admin_token`: Giá trị chuỗi JWT Token có Role ADMIN.
   * `doctor_token`: Giá trị chuỗi JWT Token có Role DOCTOR.
   * `patient_token`: Giá trị chuỗi JWT Token có Role PATIENT.

### 3.2. Triển khai kịch bản test ở cấp độ Thư mục (Folder Level Testing)
* **Folder "Admin Endpoints" (Đường dẫn bảo mật Admin):**
  1. Click chuột phải chọn **Edit** thư mục.
  2. Tại tab **Tests**, dán đoạn code **403 Forbidden** và gán biến `Authorization: Bearer {{patient_token}}` vào phần Authorization của thư mục.
  3. Khi chạy cả folder bằng Runner, tất cả các request con sẽ tự động thực thi kịch bản kiểm tra xem tài khoản bệnh nhân có bị chặn 403 đúng như thiết kế hay không.

* **Folder "Public Endpoints" (Không yêu cầu đăng nhập):**
  * Không dán các mã lỗi 401/403 vào tab Tests của folder này để tránh bị đánh fail oan.

### 3.3. Tích hợp trực tiếp trên từng Request cụ thể (Request Level)
* Với mỗi request tạo mới dữ liệu (POST/PUT), hãy tạo ra 1 Request nhân bản (Duplicate) chuyên kiểm thử dữ liệu lỗi (Invalid Payload).
* Tại tab **Tests** của request nhân bản đó, dán đoạn mã **400 Bad Request** vào để tự động chạy kiểm thử biên.

---

## 4. Kết luận
* Bộ mã kiểm thử tái sử dụng trên giúp kiểm thử tự động hóa độ chính xác và bảo mật của toàn bộ các API bảo mật trong dự án một cách nhanh chóng.
* Các kịch bản này đã bao phủ 100% yêu cầu về mã trạng thái, header, cấu trúc body và thời gian phản hồi của ticket **KCPM-771**.
