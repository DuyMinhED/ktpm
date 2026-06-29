# BÁO CÁO: KỊCH BẢN POSTMAN CHO CẤU HÌNH HỆ THỐNG ADMIN (ADMIN CONFIG ENDPOINTS)

**Mã Ticket Jira:** KCPM-776  
**Người thực hiện (Assignee):** Duy Hồ Văn  
**Mã số Sinh viên:** 054205001151  
**Phạm vi kịch bản:** 3 API cấu hình hệ thống thuộc `AdminController.java`:
1. `GET /api/v1/admin/config` (Lấy thông tin cấu hình)
2. `PUT /api/v1/admin/config` (Cập nhật thông tin cấu hình)
3. `POST /api/v1/admin/config/regenerate-key` (Tái tạo API Key)

---

## 1. Mục tiêu kiểm thử

1. Xây dựng kịch bản kiểm thử tự động toàn diện bằng mã `pm.test()` trong Postman cho 3 API quản lý cấu hình hệ thống của quản trị viên.
2. Kiểm tra tính chính xác của phản hồi từ API theo mô hình `ApiResponse<T>` chuẩn hóa của dự án:
   * Trạng thái phản hồi (Status Code: 200 OK).
   * Thời gian phản hồi nhanh (Response time < 500ms).
   * Định dạng dữ liệu (JSON Content-Type).
   * Khớp cấu trúc lược đồ (Schema Validation) của các trường lồng nhau: `security`, `thresholds`, `notifications`.
3. Kiểm thử biên và bảo mật: Kiểm tra lỗi xác thực (401), lỗi không đủ quyền (403), và lỗi truyền dữ liệu không hợp lệ (400 Bad Request).

---

## 2. Kịch bản kiểm thử tự động chi tiết (Postman Test Scripts)

### 2.1. API 1: `GET /api/v1/admin/config` (Get System Config)
Đoạn mã kiểm thử viết trong tab **Tests** của Request:

```javascript
// 1. Kiểm tra mã trạng thái phản hồi là 200 OK
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});

// 2. Kiểm tra thời gian phản hồi hợp lý
pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

// 3. Kiểm tra tiêu đề Content-Type là application/json
pm.test("Content-Type is application/json", function () {
    pm.response.to.have.header("Content-Type");
    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
});

// 4. Kiểm tra cấu trúc dữ liệu và kiểu dữ liệu trả về (Schema Validation)
pm.test("Response matches SystemConfigResponse schema", function () {
    var response = pm.response.json();
    
    // Kiểm tra cấu trúc ApiResponse
    pm.expect(response.success).to.be.true;
    pm.expect(response.message).to.equal("System config fetched successfully");
    
    var data = response.data;
    pm.expect(data).to.be.an("object");
    pm.expect(data.language).to.be.a("string");
    pm.expect(data.timezone).to.be.a("string");
    pm.expect(data.maintenanceMode).to.be.a("boolean");
    
    // Kiểm tra đối tượng con security
    pm.expect(data.security).to.be.an("object");
    pm.expect(data.security.specialChar).to.be.a("boolean");
    pm.expect(data.security.upperNumber).to.be.a("boolean");
    
    // Kiểm tra đối tượng con thresholds
    pm.expect(data.thresholds).to.be.an("object");
    pm.expect(data.thresholds.bp_sys).to.be.a("string");
    pm.expect(data.thresholds.bp_dia).to.be.a("string");
    pm.expect(data.thresholds.hr).to.be.a("string");
    pm.expect(data.thresholds.spo2).to.be.a("string");
    
    // Kiểm tra đối tượng con notifications
    pm.expect(data.notifications).to.be.an("object");
    pm.expect(data.notifications.vital).to.be.a("boolean");
    pm.expect(data.notifications.support).to.be.a("boolean");
    pm.expect(data.notifications.revenue).to.be.a("boolean");
});
```

---

### 2.2. API 2: `PUT /api/v1/admin/config` (Update System Config)
Đoạn mã kiểm thử viết trong tab **Tests** của Request:

```javascript
// 1. Kiểm tra mã trạng thái phản hồi là 200 OK
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});

// 2. Kiểm tra thời gian phản hồi hợp lý
pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

// 3. Kiểm tra tiêu đề Content-Type là application/json
pm.test("Content-Type is application/json", function () {
    pm.response.to.have.header("Content-Type");
    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
});

// 4. Kiểm tra dữ liệu được lưu có khớp với dữ liệu đã gửi lên hay không
pm.test("Response matches updated values in request body", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.message).to.equal("System config updated successfully");
    
    var data = response.data;
    var requestBody = JSON.parse(pm.request.body.raw);
    
    pm.expect(data.language).to.equal(requestBody.language);
    pm.expect(data.timezone).to.equal(requestBody.timezone);
    pm.expect(data.maintenanceMode).to.equal(requestBody.maintenanceMode);
});
```

---

### 2.3. API 3: `POST /api/v1/admin/config/regenerate-key` (Regenerate API Key)
Đoạn mã kiểm thử viết trong tab **Tests** của Request:

```javascript
// 1. Kiểm tra mã trạng thái phản hồi là 200 OK
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});

// 2. Kiểm tra thời gian phản hồi hợp lý
pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

// 3. Kiểm tra tiêu đề Content-Type là application/json
pm.test("Content-Type is application/json", function () {
    pm.response.to.have.header("Content-Type");
    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
});

// 4. Kiểm tra xem API Key mới được tạo ra có hợp lệ dưới dạng chuỗi kí tự hay không
pm.test("Response contains newly regenerated API key string", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.message).to.equal("API key regenerated successfully");
    pm.expect(response.data).to.be.a("string");
    pm.expect(response.data.length).to.be.greaterThan(0);
});
```

---

## 3. Các kịch bản kiểm thử lỗi & Bảo mật (Negative & Security Scenarios)

Do toàn bộ Controller này được bảo vệ bởi `@PreAuthorize("hasRole('ADMIN')")`, các kịch bản lỗi sau được thiết lập:

### 3.1. Lỗi chưa xác thực (401 Unauthorized)
* **Kịch bản:** Gửi request tới bất kỳ API nào trong 3 API trên mà không kèm Token JWT.
* **Đoạn mã test mong đợi:**
  ```javascript
  pm.test("Status code is 401 Unauthorized", function () {
      pm.response.to.have.status(401);
  });
  ```

### 3.2. Lỗi truy cập trái phép (403 Forbidden)
* **Kịch bản:** Gửi request sử dụng Token JWT hợp lệ của bệnh nhân (`PATIENT`) hoặc bác sĩ (`DOCTOR`).
* **Đoạn mã test mong đợi:**
  ```javascript
  pm.test("Status code is 403 Forbidden", function () {
      pm.response.to.have.status(403);
  });
  ```

### 3.3. Lỗi dữ liệu đầu vào (400 Bad Request) - Dành riêng cho API cập nhật (PUT)
* **Kịch bản:** Gửi dữ liệu cập nhật thiếu trường bắt buộc `@NotNull` như `language` hoặc `timezone`.
* **Đoạn mã test mong đợi:**
  ```javascript
  pm.test("Status code is 400 Bad Request", function () {
      pm.response.to.have.status(400);
  });
  ```

---

## 4. Kết luận
* Các kịch bản kiểm thử trên cung cấp sự bao phủ toàn diện cho chức năng Cấu hình hệ thống của Admin.
* Đáp ứng đầy đủ các tiêu chí nghiệm thu của ticket **KCPM-776** về kiểm tra mã trạng thái, kiểm tra dữ liệu phản hồi, kiểm tra định dạng và các trường hợp lỗi bảo mật.
