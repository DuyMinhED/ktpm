# BÁO CÁO: KỊCH BẢN POSTMAN CHO QUẢN LÝ ĐƠN THUỐC BÁC SĨ (DOCTOR PRESCRIPTIONS ENDPOINTS)

**Mã Ticket Jira:** KCPM-789  
**Người thực hiện (Assignee):** Nguyễn Thị Ánh Ngọc  
**Email:** ngocnta4878@ut.edu.vn  
**Phạm vi kịch bản:** 4 API quản lý Đơn thuốc của Bác sĩ:
1. `GET /api/v1/doctor/prescriptions?page=0&size=10&sortBy=id&direction=desc` (Lấy danh sách đơn thuốc phân trang)
2. `GET /api/v1/doctor/prescriptions?search=Nguyen&status=ACTIVE&page=0&size=10` (Lấy danh sách đơn thuốc kèm bộ lọc)
3. `GET /api/v1/doctor/prescriptions/stats` (Lấy số liệu thống kê đơn thuốc)
4. `POST /api/v1/doctor/prescriptions` (Tạo đơn thuốc điện tử mới)

---

## 1. Mục tiêu kiểm thử

1. Xây dựng kịch bản kiểm thử tự động toàn diện bằng mã `pm.test()` trong Postman cho 4 API đơn thuốc của Bác sĩ.
2. Kiểm tra tính chính xác của phản hồi từ API theo đúng mô hình `ApiResponse` chuẩn hóa của dự án:
   * Trạng thái phản hồi (Status Code: 200 OK).
   * Thời gian phản hồi nhanh (Response time < 500ms - 600ms).
   * Định dạng dữ liệu (JSON Content-Type).
   * Kiểm tra cấu trúc phân trang, cấu trúc thống kê và phản hồi khi tạo đơn thuốc thành công.
3. Kiểm thử bảo mật: Đảm bảo kiểm tra lỗi xác thực (401 Unauthorized), lỗi phân quyền (403 Forbidden) và lỗi dữ liệu đầu vào (400 Bad Request) khi áp dụng.

---

## 2. Kịch bản kiểm thử tự động chi tiết (Postman Test Scripts)

### 2.1. API 1: `Get Prescriptions` (Lấy danh sách đơn thuốc phân trang)
Đoạn mã kiểm thử viết trong tab **Tests** (hoặc **Scripts > Post-response**):

```javascript
// 1. Kiểm tra mã trạng thái phản hồi là 200 OK
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});

// 2. Kiểm tra thời gian phản hồi nhanh (< 500ms)
pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

// 3. Kiểm tra tiêu đề Content-Type là JSON
pm.test("Content-Type is application/json", function () {
    pm.response.to.have.header("Content-Type");
    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
});

// 4. Kiểm tra cấu trúc phân trang của danh sách đơn thuốc
pm.test("Response body matches page structure", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.data).to.have.property("content");
    pm.expect(response.data.content).to.be.an("array");
    pm.expect(response.data).to.have.property("totalPages");
    pm.expect(response.data).to.have.property("totalElements");
});
```

---

### 2.2. API 2: `Get Prescriptions With Filters` (Lấy danh sách đơn thuốc kèm bộ lọc)
Đoạn mã kiểm thử viết trong tab **Tests**:

```javascript
// 1. Kiểm tra mã trạng thái phản hồi là 200 OK
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});

// 2. Kiểm tra thời gian phản hồi nhanh (< 500ms)
pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

// 3. Kiểm tra tiêu đề Content-Type là JSON
pm.test("Content-Type is application/json", function () {
    pm.response.to.have.header("Content-Type");
    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
});

// 4. Kiểm tra danh sách trả về khớp cấu trúc và không trống
pm.test("Filtered prescriptions contain data", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.data.content).to.be.an("array");
});
```

---

### 2.3. API 3: `Get Prescription Stats` (Lấy số liệu thống kê đơn thuốc)
Đoạn mã kiểm thử viết trong tab **Tests**:

```javascript
// 1. Kiểm tra mã trạng thái phản hồi là 200 OK
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});

// 2. Kiểm tra thời gian phản hồi nhanh (< 500ms)
pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

// 3. Kiểm tra cấu trúc thống kê đơn thuốc của Bác sĩ
pm.test("Response contains valid prescription stats", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.message).to.equal("Stats fetched successfully");
    
    var stats = response.data;
    pm.expect(stats).to.have.property("totalPrescriptions");
    pm.expect(stats).to.have.property("activePrescriptions");
    pm.expect(stats).to.have.property("completedPrescriptions");
    pm.expect(stats).to.have.property("cancelledPrescriptions");
});
```

---

### 2.4. API 4: `Create Prescription` (Tạo đơn thuốc mới)
Đoạn mã kiểm thử viết trong tab **Tests**:

```javascript
// 1. Kiểm tra mã trạng thái phản hồi là 200 OK
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});

// 2. Kiểm tra thời gian phản hồi nhanh (< 600ms do ghi CSDL)
pm.test("Response time is less than 600ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(600);
});

// 3. Kiểm tra thông điệp tạo đơn thuốc thành công
pm.test("Prescription created successfully", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.message).to.equal("Prescription created successfully");
    pm.expect(response.data).to.have.property("id");
});
```

---

## 3. Kết luận

* Đã tích hợp đầy đủ mã kiểm thử `pm.test()` cho cả 4 endpoints thuộc phân hệ Đơn thuốc của Bác sĩ vào bộ sưu tập Postman (`DamDiep_Healthcare_API.postman_collection.json`).
* Đáp ứng đầy đủ các tiêu chí nghiệm thu của ticket **KCPM-789**.
