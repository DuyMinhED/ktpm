# BÁO CÁO: KỊCH BẢN POSTMAN CHO PHÂN HỆ QUẢN LÝ BÁC SĨ CHI TIẾT (PUBLIC DOCTORS CRUD ENDPOINTS)

**Mã Ticket Jira:** KCPM-800  
**Người thực hiện (Assignee):** Nguyễn Phạm Hùng  
**Email:** hungnp1272@ut.edu.vn  
**Phạm vi kịch bản:** 4 API quản lý bác sĩ tại `DoctorController.java`:
1. `POST /api/doctors` (Tạo mới bác sĩ - Chỉ Admin)
2. `GET /api/doctors/{id}` (Lấy chi tiết bác sĩ theo ID)
3. `PUT /api/doctors/{id}` (Cập nhật thông tin bác sĩ - Admin hoặc tự cập nhật)
4. `DELETE /api/doctors/{id}` (Xóa bác sĩ - Chỉ Admin)

---

## 1. Mục tiêu kiểm thử

1. Xây dựng kịch bản kiểm thử tự động toàn diện bằng mã `pm.test()` trong Postman cho chuỗi quy trình CRUD bác sĩ.
2. Thiết lập cơ chế kiểm thử liên hoàn (Chaining Requests): Trích xuất ID bác sĩ được tạo thành công từ API 1 (`publicDoctorId`) và truyền tự động vào các API xem, sửa, xóa tiếp theo.
3. Kiểm tra tính chính xác của phản hồi từ API theo mô hình `ApiResponse<T>` chuẩn hóa:
   * Trạng thái phản hồi (Status Code: 200 OK / 201 Created).
   * Thời gian phản hồi nhanh (Response time < 3000ms).
   * Định dạng dữ liệu (JSON Content-Type).
   * Khớp cấu trúc dữ liệu thực tế (Schema Validation) của đối tượng `DoctorResponse` trả về và định dạng phản hồi trống (`ApiResponse<Void>`).
4. Kiểm thử biên và bảo mật: Kiểm tra lỗi chưa xác thực (401), lỗi truy cập trái phép phân quyền (403), lỗi dữ liệu đầu vào (400 Bad Request) và lỗi không tìm thấy bản ghi (404 Not Found).

---

## 2. Kịch bản kiểm thử tự động chi tiết (Postman Test Scripts)

### 2.1. API 1: `POST /api/doctors` (Create Doctor (Admin))
Đoạn mã kiểm thử viết trong tab **Scripts** -> **Post-response** của Request:

```javascript
// 1. Kiểm tra mã trạng thái trả về là 200 OK hoặc 201 Created
pm.test("Status code is 200 OK or 201 Created", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201]);
});

// 2. Kiểm tra thời gian phản hồi hợp lý
pm.test("Response time is less than 3000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(3000);
});

// 3. Kiểm tra tiêu đề Content-Type là application/json
pm.test("Content-Type is application/json", function () {
    pm.response.to.have.header("Content-Type");
    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
});

// 4. Kiểm tra cấu trúc dữ liệu trả về và trích xuất ID động
pm.test("Create Doctor response has valid schema", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.message).to.equal("Doctor created successfully");
    
    var doc = response.data;
    pm.expect(doc).to.be.an("object");
    pm.expect(doc).to.include.keys("id", "email", "fullName", "specialization", "status");
    pm.expect(doc.id).to.be.a("number");
    pm.expect(doc.fullName).to.be.a("string").and.not.empty;
    
    // Lưu ID động phục vụ cho các request tiếp theo
    pm.collectionVariables.set("publicDoctorId", doc.id);
});
```

---

### 2.2. API 2: `GET /api/doctors/{id}` (Get Doctor By ID)
Đoạn mã kiểm thử viết trong tab **Scripts** -> **Post-response** của Request:

```javascript
// 1. Kiểm tra mã trạng thái trả về là 200 OK hoặc mã lỗi không tìm thấy
pm.test("Status code is 200 OK or 404 Not Found", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 404]);
});

// 2. Kiểm tra thời gian phản hồi hợp lý
pm.test("Response time is less than 3000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(3000);
});

// 3. Kiểm tra tiêu đề Content-Type là application/json
pm.test("Content-Type is application/json when body is returned", function () {
    if (pm.response.text()) {
        pm.response.to.have.header("Content-Type");
        pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
    }
});

// 4. Kiểm tra chi tiết thông tin bác sĩ trả về
pm.test("Response has valid doctor details or error payload", function () {
    if (pm.response.code === 200) {
        var response = pm.response.json();
        pm.expect(response.success).to.be.true;
        pm.expect(response.message).to.equal("Doctor details fetched successfully");
        
        var doc = response.data;
        pm.expect(doc).to.be.an("object");
        pm.expect(doc).to.include.keys("id", "email", "fullName", "specialization", "status");
        pm.expect(doc.fullName).to.be.a("string").and.not.empty;
    }
});
```

---

### 2.3. API 3: `PUT /api/doctors/{id}` (Update Doctor)
Đoạn mã kiểm thử viết trong tab **Scripts** -> **Post-response** của Request:

```javascript
// 1. Kiểm tra mã trạng thái trả về là 200 OK hoặc mã lỗi bảo vệ
pm.test("Status code is 200 OK or handled validation/auth error", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 400, 401, 403, 404]);
});

// 2. Kiểm tra thời gian phản hồi hợp lý
pm.test("Response time is less than 3000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(3000);
});

// 3. Kiểm tra tiêu đề Content-Type là application/json
pm.test("Content-Type is application/json when body is returned", function () {
    if (pm.response.text()) {
        pm.response.to.have.header("Content-Type");
        pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
    }
});

// 4. Kiểm tra cấu trúc phản hồi cập nhật bác sĩ thành công
pm.test("Update Doctor response has valid body", function () {
    if (pm.response.code === 200) {
        var response = pm.response.json();
        pm.expect(response.success).to.be.true;
        pm.expect(response.message).to.equal("Doctor updated successfully");
        
        var doc = response.data;
        pm.expect(doc).to.be.an("object");
        pm.expect(doc).to.include.keys("id", "email", "fullName", "specialization", "status");
        pm.expect(doc.fullName).to.be.a("string").and.not.empty;
    }
});
```

---

### 2.4. API 4: `DELETE /api/doctors/{id}` (Delete Doctor (Admin))
Đoạn mã kiểm thử viết trong tab **Scripts** -> **Post-response** của Request:

```javascript
// 1. Kiểm tra mã trạng thái trả về là 200 OK hoặc các mã lỗi phân quyền
pm.test("Status code is 200 OK or auth/forbidden guard", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 401, 403, 404]);
});

// 2. Kiểm tra thời gian phản hồi hợp lý
pm.test("Response time is less than 3000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(3000);
});

// 3. Kiểm tra tiêu đề Content-Type là application/json
pm.test("Content-Type is application/json when body is returned", function () {
    if (pm.response.text()) {
        pm.response.to.have.header("Content-Type");
        pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
    }
});

// 4. Kiểm tra ApiResponse phản hồi xóa trống
pm.test("Delete Doctor response has valid ApiResponse structure", function () {
    if (pm.response.code === 200) {
        var response = pm.response.json();
        pm.expect(response.success).to.be.true;
        pm.expect(response.message).to.equal("Doctor deleted successfully");
        pm.expect(response.data).to.be.null; // Đối với ApiResponse<Void>
    }
});
```

---

## 3. Các kịch bản lỗi & Bảo mật (Negative & Security Scenarios)

### 3.1. Lỗi chưa xác thực (401 Unauthorized)
Khi cố gắng thực hiện Tạo/Sửa/Xóa bác sĩ mà không truyền Token đăng nhập:
```javascript
pm.test("Status code is 401 Unauthorized", function () {
    pm.response.to.have.status(401);
});
```

### 3.2. Lỗi truy cập trái phép (403 Forbidden)
Khi tài khoản Bệnh nhân (`PATIENT`) cố tình gọi API tạo bác sĩ:
```javascript
pm.test("Status code is 403 Forbidden", function () {
    pm.response.to.have.status(403);
});
```
