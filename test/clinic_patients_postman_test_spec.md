# BÁO CÁO: KỊCH BẢN POSTMAN CHO QUẢN LÝ BỆNH NHÂN PHÒNG KHÁM (CLINIC PATIENTS ENDPOINTS)

**Mã Ticket Jira:** KCPM-779  
**Người thực hiện (Assignee):** Nguyễn Thị Ánh Ngọc  
**Email:** ngocnta4878@ut.edu.vn  
**Phạm vi kịch bản:** 4 API quản lý Bệnh nhân thuộc phòng khám tại `ClinicDashboardController.java`:
1. `PUT /api/v1/clinics/{clinicId}/patients/{patientId}` (Cập nhật thông tin bệnh nhân)
2. `DELETE /api/v1/clinics/{clinicId}/patients/{patientId}` (Xóa bệnh nhân)
3. `POST /api/v1/clinics/{clinicId}/patients/{patientId}/notify` (Gửi thông báo tới bệnh nhân)
4. `POST /api/v1/clinics/{clinicId}/patients/{patientId}/health-metrics` (Ghi nhận chỉ số sức khỏe của bệnh nhân)

---

## 1. Mục tiêu kiểm thử

1. Xây dựng kịch bản kiểm thử tự động toàn diện bằng mã `pm.test()` trong Postman cho 4 API quản trị bệnh nhân theo từng phòng khám.
2. Kiểm tra tính chính xác của phản hồi từ API theo mô hình `ApiResponse<T>` chuẩn hóa của dự án:
   * Trạng thái phản hồi (Status Code: 200 OK / 201 Created).
   * Thời gian phản hồi nhanh (Response time < 3000ms).
   * Định dạng dữ liệu (JSON Content-Type).
   * Khớp thông điệp phản hồi thành công và kiểm định cấu trúc các đối tượng thực tế (`HealthMetricResponse` cho API chỉ số sức khỏe).
3. Kiểm thử biên và bảo mật: Kiểm tra lỗi chưa xác thực (401), lỗi truy cập trái phép phân quyền chéo (403), lỗi dữ liệu đầu vào (400 Bad Request) và lỗi không tìm thấy bản ghi (404 Not Found).

---

## 2. Kịch bản kiểm thử tự động chi tiết (Postman Test Scripts)

### 2.1. API 1: `PUT /api/v1/clinics/{clinicId}/patients/{patientId}` (Update Patient)
Đoạn mã kiểm thử viết trong tab **Scripts** -> **Post-response** của Request:

```javascript
// 1. Kiểm tra mã trạng thái trả về là 200 OK hoặc mã lỗi bảo mật
pm.test("Status code is 200 OK or error guard", function () {
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

// 4. Kiểm tra cấu trúc ApiResponse thành công
pm.test("Update Patient response has valid ApiResponse structure", function () {
    if (pm.response.code === 200) {
        var response = pm.response.json();
        pm.expect(response.success).to.be.true;
        pm.expect(response.message).to.equal("Patient updated successfully");
        pm.expect(response.data).to.be.null; // Đối với ApiResponse<Void>
    }
});
```

---

### 2.2. API 2: `DELETE /api/v1/clinics/{clinicId}/patients/{patientId}` (Delete Patient)
Đoạn mã kiểm thử viết trong tab **Scripts** -> **Post-response** của Request:

```javascript
// 1. Kiểm tra mã trạng thái trả về là 200 OK hoặc mã lỗi bảo mật
pm.test("Status code is 200 OK or error guard", function () {
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

// 4. Kiểm tra cấu trúc ApiResponse thành công
pm.test("Delete Patient response has valid ApiResponse structure", function () {
    if (pm.response.code === 200) {
        var response = pm.response.json();
        pm.expect(response.success).to.be.true;
        pm.expect(response.message).to.equal("Patient deleted successfully");
        pm.expect(response.data).to.be.null; // Đối với ApiResponse<Void>
    }
});
```

---

### 2.3. API 3: `POST /api/v1/clinics/{clinicId}/patients/{patientId}/notify` (Notify Patient)
Đoạn mã kiểm thử viết trong tab **Scripts** -> **Post-response** của Request:

```javascript
// 1. Kiểm tra mã trạng thái trả về là 200 OK hoặc mã lỗi bảo mật
pm.test("Status code is 200 OK or error guard", function () {
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

// 4. Kiểm tra cấu trúc ApiResponse thành công
pm.test("Notify Patient response has valid ApiResponse structure", function () {
    if (pm.response.code === 200) {
        var response = pm.response.json();
        pm.expect(response.success).to.be.true;
        pm.expect(response.message).to.equal("Notification sent");
        pm.expect(response.data).to.be.null; // Đối với ApiResponse<Void>
    }
});
```

---

### 2.4. API 4: `POST /api/v1/clinics/{clinicId}/patients/{patientId}/health-metrics` (Record Patient Health Metric)
Đoạn mã kiểm thử viết trong tab **Scripts** -> **Post-response** của Request:

```javascript
// 1. Kiểm tra mã trạng thái trả về là 200 OK hoặc mã lỗi bảo mật
pm.test("Status code is 200 OK or error guard", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201, 400, 401, 403, 404]);
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

// 4. Kiểm tra cấu trúc ApiResponse chứa DTO HealthMetricResponse chi tiết
pm.test("Record Patient Health Metric response has valid body", function () {
    if (pm.response.code === 200 || pm.response.code === 201) {
        var response = pm.response.json();
        pm.expect(response.success).to.be.true;
        pm.expect(response.message).to.equal("Health metric recorded successfully");
        
        var metric = response.data;
        pm.expect(metric).to.be.an("object");
        pm.expect(metric).to.include.keys("id", "metricType", "value", "unit", "measuredAt");
        pm.expect(metric.id).to.be.a("number");
        pm.expect(metric.metricType).to.be.a("string").and.not.empty;
        pm.expect(metric.value).to.be.a("number");
        pm.expect(metric.unit).to.be.a("string");
    }
});
```

---

## 3. Các kịch bản lỗi & Bảo mật (Negative & Security Scenarios)

### 3.1. Lỗi chưa xác thực (401 Unauthorized)
Khi không truyền Token hoặc Token hết hạn, API trả về 401:
```javascript
pm.test("Status code is 401 Unauthorized", function () {
    pm.response.to.have.status(401);
});
```

### 3.2. Lỗi truy cập trái phép phân quyền chéo (403 Forbidden)
Ví dụ: Một Quản lý phòng khám (`CLINIC_MANAGER`) của phòng khám A cố tình cập nhật/xóa bệnh nhân thuộc phòng khám B:
```javascript
pm.test("Status code is 403 Forbidden", function () {
    pm.response.to.have.status(403);
});
```

### 3.3. Lỗi dữ liệu không tồn tại (404 Not Found)
Khi truyền ID phòng khám hoặc ID bệnh nhân không tồn tại:
```javascript
pm.test("Status code is 404 Not Found", function () {
    pm.response.to.have.status(404);
});
```
