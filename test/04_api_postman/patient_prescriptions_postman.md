# BÁO CÁO: KỊCH BẢN POSTMAN CHO PHÂN HỆ ĐƠN THUỐC CỦA BỆNH NHÂN (PATIENT PRESCRIPTIONS ENDPOINTS)

**Mã Ticket Jira:** KCPM-794  
**Người thực hiện (Assignee):** Nguyễn Thị Ánh Ngọc  
**Email:** ngocnta4878@ut.edu.vn  
**Phạm vi kịch bản:** 5 API quản lý Đơn thuốc cấp độ bệnh nhân tại `PatientPrescriptionController.java`:
1. `GET /api/v1/patient/prescriptions/active` (Lấy danh sách đơn thuốc đang hoạt động)
2. `GET /api/v1/patient/prescriptions/history` (Lấy lịch sử tất cả đơn thuốc)
3. `GET /api/v1/patient/prescriptions/today-schedule` (Lấy lịch uống thuốc trong ngày)
4. `POST /api/v1/patient/prescriptions/log-medication` (Ghi nhận đã uống thuốc)
5. `POST /api/v1/patient/prescriptions/{id}/request-refill` (Yêu cầu cấp thêm thuốc)

---

## 1. Mục tiêu kiểm thử

1. Xây dựng kịch bản kiểm thử tự động toàn diện bằng mã `pm.test()` trong Postman cho 5 API quản trị đơn thuốc và lịch trình của Bệnh nhân.
2. Kiểm tra tính chính xác của phản hồi từ API theo mô hình `ApiResponse<T>` chuẩn hóa của dự án:
   * Trạng thái phản hồi (Status Code: 200 OK).
   * Thời gian phản hồi nhanh (Response time < 3000ms).
   * Định dạng dữ liệu (JSON Content-Type).
   * Khớp cấu trúc dữ liệu thực tế (Schema Validation) của các đối tượng `PatientPrescriptionResponse`, danh sách lịch trình `MedicationScheduleResponse`, và định dạng phản hồi trống (`ApiResponse<Void>`).
3. Kiểm thử liên hoàn (Chaining Requests): Tự động trích xuất các ID thực tế (`refillPrescriptionId` và `medicationScheduleId`) từ API danh sách và truyền vào các API nghiệp vụ Log/Refill tiếp theo.
4. Kiểm thử biên và bảo mật: Kiểm tra lỗi chưa xác thực (401), lỗi truy cập trái phép phân quyền (403), lỗi dữ liệu đầu vào (400 Bad Request) và lỗi không tìm thấy bản ghi (404 Not Found).

---

## 2. Kịch bản kiểm thử tự động chi tiết (Postman Test Scripts)

### 2.1. API 1: `GET /api/v1/patient/prescriptions/active` (Get Active Prescriptions)
Đoạn mã kiểm thử viết trong tab **Scripts** -> **Post-response** của Request:

```javascript
// 1. Kiểm tra mã trạng thái trả về là 200 OK hoặc mã lỗi bảo mật
pm.test("Status code is 200 OK or auth guard", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 401, 403]);
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

// 4. Kiểm tra cấu trúc danh sách đơn thuốc đang hoạt động và trích xuất ID
pm.test("Response has valid active prescriptions list or error", function () {
    if (pm.response.code === 200) {
        var response = pm.response.json();
        pm.expect(response.success).to.be.true;
        pm.expect(response.message).to.equal("Active prescriptions retrieved");
        
        var list = response.data;
        pm.expect(list).to.be.an("array");
        if (list.length > 0) {
            var p = list[0];
            pm.expect(p).to.be.an("object");
            pm.expect(p).to.include.keys("id", "prescriptionCode", "doctorName", "diagnosis", "status");
            pm.expect(p.id).to.be.a("number");
            
            // Trích xuất ID đơn thuốc để yêu cầu cấp lại sau
            pm.collectionVariables.set("refillPrescriptionId", p.id);
        }
    }
});
```

---

### 2.2. API 2: `GET /api/v1/patient/prescriptions/history` (Get Prescription History)
Đoạn mã kiểm thử viết trong tab **Scripts** -> **Post-response** của Request:

```javascript
// 1. Kiểm tra mã trạng thái trả về là 200 OK hoặc mã lỗi bảo mật
pm.test("Status code is 200 OK or auth guard", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 401, 403]);
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

// 4. Kiểm tra cấu trúc lịch sử đơn thuốc
pm.test("Response has valid prescription history list or error", function () {
    if (pm.response.code === 200) {
        var response = pm.response.json();
        pm.expect(response.success).to.be.true;
        pm.expect(response.message).to.equal("Prescription history retrieved");
        
        var list = response.data;
        pm.expect(list).to.be.an("array");
        if (list.length > 0) {
            var p = list[0];
            pm.expect(p).to.be.an("object");
            pm.expect(p).to.include.keys("id", "prescriptionCode", "doctorName", "status");
            pm.expect(p.id).to.be.a("number");
        }
    }
});
```

---

### 2.3. API 3: `GET /api/v1/patient/prescriptions/today-schedule` (Get Today Schedule)
Đoạn mã kiểm thử viết trong tab **Scripts** -> **Post-response** của Request:

```javascript
// 1. Kiểm tra mã trạng thái trả về là 200 OK hoặc mã lỗi bảo mật
pm.test("Status code is 200 OK or auth guard", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 401, 403]);
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

// 4. Kiểm tra cấu trúc lịch uống thuốc và trích xuất schedule ID
pm.test("Response has valid today schedule list or error", function () {
    if (pm.response.code === 200) {
        var response = pm.response.json();
        pm.expect(response.success).to.be.true;
        pm.expect(response.message).to.equal("Today's schedule retrieved");
        
        var list = response.data;
        pm.expect(list).to.be.an("array");
        if (list.length > 0) {
            var s = list[0];
            pm.expect(s).to.be.an("object");
            pm.expect(s).to.include.keys("id", "medicationName", "dosage", "todayStatus");
            pm.expect(s.id).to.be.a("number");
            
            // Trích xuất ID lịch uống thuốc để Log Medication sau này
            pm.collectionVariables.set("medicationScheduleId", s.id);
        }
    }
});
```

---

### 2.4. API 4: `POST /api/v1/patient/prescriptions/log-medication` (Log Medication)
Đoạn mã kiểm thử viết trong tab **Scripts** -> **Post-response** của Request:

```javascript
// 1. Kiểm tra mã trạng thái trả về là 200 OK hoặc mã lỗi guard
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

// 4. Kiểm tra phản hồi ghi nhận uống thuốc thành công
pm.test("Log Medication response has valid ApiResponse structure", function () {
    if (pm.response.code === 200) {
        var response = pm.response.json();
        pm.expect(response.success).to.be.true;
        pm.expect(response.message).to.equal("Medication logged successfully");
        pm.expect(response.data).to.be.null; // Đối với ApiResponse<Void>
    }
});
```

---

### 2.5. API 5: `POST /api/v1/patient/prescriptions/{id}/request-refill` (Request Refill)
Đoạn mã kiểm thử viết trong tab **Scripts** -> **Post-response** của Request:

```javascript
// 1. Kiểm tra mã trạng thái trả về là 200 OK hoặc mã lỗi guard
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

// 4. Kiểm tra phản hồi yêu cầu cấp lại thành công
pm.test("Request Refill response has valid ApiResponse structure", function () {
    if (pm.response.code === 200) {
        var response = pm.response.json();
        pm.expect(response.success).to.be.true;
        pm.expect(response.message).to.equal("Refill requested successfully");
        pm.expect(response.data).to.be.null; // Đối với ApiResponse<Void>
    }
});
```

---

## 3. Các kịch bản lỗi & Bảo mật (Negative & Security Scenarios)

### 3.1. Lỗi chưa xác thực (401 Unauthorized)
Khi không truyền Token bệnh nhân hoặc Token hết hạn:
```javascript
pm.test("Status code is 401 Unauthorized", function () {
    pm.response.to.have.status(401);
});
```

### 3.2. Lỗi truy cập trái phép phân quyền (403 Forbidden)
Ví dụ: Khi tài khoản Bác sĩ (`DOCTOR`) cố tình truy cập vào API dành riêng cho bệnh nhân này:
```javascript
pm.test("Status code is 403 Forbidden", function () {
    pm.response.to.have.status(403);
});
```

### 3.3. Lỗi dữ liệu không tồn tại (404 Not Found)
Khi yêu cầu cấp lại đơn thuốc với ID không hợp lệ:
```javascript
pm.test("Status code is 404 Not Found", function () {
    pm.response.to.have.status(404);
});
```
