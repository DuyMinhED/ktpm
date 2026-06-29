# BÁO CÁO: KỊCH BẢN POSTMAN CHO DỊCH VỤ Y TẾ (MEDICAL SERVICES ENDPOINTS)

**Mã Ticket Jira:** KCPM-801  
**Người thực hiện (Assignee):** Duy Hồ Văn  
**Mã số Sinh viên:** 054205001151  
**Phạm vi kịch bản:** 3 API tra cứu danh mục dịch vụ y tế thuộc `MedicalServiceController.java`:
1. `GET /api/v1/medical-services` (Lấy tất cả các dịch vụ)
2. `GET /api/v1/medical-services?clinicId=1` (Lấy các dịch vụ theo phòng khám)
3. `GET /api/v1/medical-services/{id}` (Lấy thông tin dịch vụ theo ID)

---

## 1. Mục tiêu kiểm thử

1. Xây dựng kịch bản kiểm thử tự động toàn diện bằng mã `pm.test()` trong Postman cho 3 API tra cứu danh sách và chi tiết Dịch vụ Y tế.
2. Kiểm tra tính chính xác của phản hồi từ API theo mô hình `ApiResponse<List<MedicalService>>` và `ApiResponse<MedicalService>` chuẩn hóa của dự án:
   * Trạng thái phản hồi (Status Code: 200 OK).
   * Thời gian phản hồi nhanh (Response time < 500ms).
   * Định dạng dữ liệu (JSON Content-Type).
   * Khớp cấu trúc lược đồ (Schema Validation) của danh sách và thực thể `MedicalService` gồm các trường: `id`, `name`, `category`, `price`, `duration`, `status`, `clinicId`, và `features`.
3. Kiểm thử biên và bảo mật: Kiểm tra lỗi xác thực (401) nếu cấu hình hệ thống yêu cầu token, và lỗi dịch vụ không tìm thấy (404/400) khi truyền sai ID.

---

## 2. Kịch bản kiểm thử tự động chi tiết (Postman Test Scripts)

### 2.1. API 1: `GET /api/v1/medical-services` (Get All Services)
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

// 4. Kiểm tra cấu trúc phản hồi danh sách dịch vụ y tế (Schema Validation)
pm.test("Response matches MedicalService array schema", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    
    var data = response.data;
    pm.expect(data).to.be.an("array");
    if (data.length > 0) {
        var service = data[0];
        pm.expect(service.id).to.be.a("number");
        pm.expect(service.name).to.be.a("string");
        pm.expect(service.category).to.be.a("string");
        pm.expect(service.price).to.be.a("number");
        pm.expect(service.status).to.be.a("string");
        pm.expect(service.features).to.be.an("array");
    }
});
```

---

### 2.2. API 2: `GET /api/v1/medical-services?clinicId=1` (Get Services By Clinic)
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

// 4. Kiểm tra dữ liệu được lọc theo clinicId hoặc là dịch vụ chung (clinicId = null)
pm.test("Response filters by clinicId and matches MedicalService schema", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    
    var data = response.data;
    pm.expect(data).to.be.an("array");
    
    data.forEach(function (service) {
        pm.expect(service.id).to.be.a("number");
        pm.expect(service.name).to.be.a("string");
        if (service.clinicId !== null) {
            pm.expect(service.clinicId).to.equal(1);
        }
    });
});
```

---

### 2.3. API 3: `GET /api/v1/medical-services/{id}` (Get Service By ID)
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

// 4. Kiểm tra cấu trúc phản hồi chi tiết dịch vụ (Schema Validation)
pm.test("Response matches MedicalService object schema", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    
    var data = response.data;
    pm.expect(data).to.be.an("object");
    pm.expect(data.id).to.be.a("number");
    pm.expect(data.name).to.be.a("string");
    pm.expect(data.category).to.be.a("string");
    pm.expect(data.price).to.be.a("number");
    pm.expect(data.status).to.be.a("string");
});
```

---

## 3. Các kịch bản kiểm thử lỗi & Bảo mật (Negative & Security Scenarios)

### 3.1. Lỗi chưa xác thực (401 Unauthorized)
* **Kịch bản:** Nếu cấu hình bảo mật Spring Security yêu cầu người dùng phải đăng nhập trước khi xem danh mục dịch vụ.
* **Đoạn mã test mong đợi:**
  ```javascript
  pm.test("Status code is 401 Unauthorized", function () {
      pm.response.to.have.status(401);
  });
  ```

### 3.2. Lỗi dịch vụ không tồn tại (404 Not Found hoặc 400 Bad Request)
* **Kịch bản:** Truy vấn dịch vụ với ID không tồn tại trên hệ thống (ví dụ: `GET /api/v1/medical-services/999999`).
* **Đoạn mã test mong đợi:**
  ```javascript
  pm.test("Status code is 404 or 400 when service not found", function () {
      pm.expect(pm.response.code).to.be.oneOf([400, 404]);
  });
  ```

---

## 4. Kết luận
* Các kịch bản kiểm thử trên cung cấp sự bao phủ kiểm thử tự động hoàn chỉnh cho nhóm API tra cứu Dịch vụ y tế.
* Đáp ứng đầy đủ các tiêu chí nghiệm thu của ticket **KCPM-801** về kiểm tra mã trạng thái, kiểm tra dữ liệu phản hồi, kiểm tra định dạng và các trường hợp lỗi biên.
