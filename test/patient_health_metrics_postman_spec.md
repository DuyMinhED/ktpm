# BÁO CÁO: VIẾT KỊCH BẢN KIỂM THỬ POSTMAN (PM.TEST) CHO MODULE PATIENT HEALTH METRICS

**Mã Ticket Jira:** KCPM-792  
**Người thực hiện (Assignee):** Trần Lê Quang (quangtl9558)  
**Email:** quangtl9558@ut.edu.vn  
**Đối tượng phân tích:** 5 endpoints thuộc module Patient Health Metrics (`PatientHealthMetricController.java`):
1.  `POST {{baseUrl}}/api/v1/patient/health-metrics` — Record Health Metric
2.  `GET {{baseUrl}}/api/v1/patient/health-metrics/summary?period=WEEK` — Get Metrics Summary
3.  `GET {{baseUrl}}/api/v1/patient/health-metrics/chart?metricType=BLOOD_SUGAR&period=WEEK` — Get Chart Data
4.  `GET {{baseUrl}}/api/v1/patient/health-metrics/history?page=0&size=10` — Get Metrics History
5.  `DELETE {{baseUrl}}/api/v1/patient/health-metrics/{{createdMetricId}}` — Delete Health Metric

**Kỹ thuật áp dụng:** Postman `pm.test()`, Environment Variables, JWT Token, API Functional Testing, API Contract Testing.  
**Vị trí Collection:** Folder **"19. Patient - Health Metrics"** trong Postman Collection "DamDiep Healthcare API" (đã có sẵn request, chỉ bổ sung script `pm.test()`).

---

## 1. DANH SÁCH ENDPOINT VÀ SCRIPT ĐÃ THÊM

| # | Endpoint | Method | Request có sẵn | Số pm.test() |
| :--- | :--- | :---: | :--- | :---: |
| 1 | `/api/v1/patient/health-metrics` | POST | Record Health Metric | 5 |
| 2 | `/api/v1/patient/health-metrics/summary?period=WEEK` | GET | Get Metrics Summary | 5 |
| 3 | `/api/v1/patient/health-metrics/chart?metricType=BLOOD_SUGAR&period=WEEK` | GET | Get Chart Data | 5 |
| 4 | `/api/v1/patient/health-metrics/history?page=0&size=10` | GET | Get Metrics History | 5 |
| 5 | `/api/v1/patient/health-metrics/{id}` | DELETE | Delete Health Metric | 4 |

**Tổng cộng:** 5 requests, 24 `pm.test()` assertions.

---

## 2. CHI TIẾT KỊCH BẢN KIỂM THỬ

### 2.1. POST /api/v1/patient/health-metrics (Record Health Metric)

**Request Body:**
```json
{
    "metricType": "BLOOD_SUGAR",
    "value": 110,
    "unit": "mg/dL",
    "notes": "Đo buổi sáng",
    "measuredAt": "2026-06-27T07:00:00"
}
```

**Script:**
```javascript
pm.test('Status code is 201 Created', function () {
    pm.response.to.have.status(201);
});

pm.test('Response time is less than 3000ms', function () {
    pm.expect(pm.response.responseTime).to.be.below(3000);
});

pm.test('Content-Type is application/json', function () {
    pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json');
});

pm.test('Response has success=true and message', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(true);
    pm.expect(jsonData.message).to.eql('Health metric saved successfully');
});

pm.test('Response data has required fields and correct classification', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('id');
    pm.expect(jsonData.data.metricType).to.eql('BLOOD_SUGAR');
    pm.expect(jsonData.data.value).to.eql(110);
    pm.expect(jsonData.data).to.have.property('status');

    // Lưu id để dùng cho request Delete phía sau (đảm bảo test độc lập, không xóa nhầm dữ liệu có sẵn)
    pm.environment.set('createdMetricId', jsonData.data.id);
});
```

### 2.2. GET /api/v1/patient/health-metrics/summary?period=WEEK (Get Metrics Summary)

```javascript
pm.test('Status code is 200', function () {
    pm.response.to.have.status(200);
});

pm.test('Response time is less than 3000ms', function () {
    pm.expect(pm.response.responseTime).to.be.below(3000);
});

pm.test('Content-Type is application/json', function () {
    pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json');
});

pm.test('Response has success=true and message', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(true);
    pm.expect(jsonData.message).to.eql('Summary retrieved successfully');
});

pm.test('Summary data is an array with valid item schema', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.be.an('array');
    if (jsonData.data.length > 0) {
        var item = jsonData.data[0];
        pm.expect(item).to.have.property('metricType');
        pm.expect(item).to.have.property('status');
        pm.expect(item).to.have.property('trend');
    }
});
```

### 2.3. GET /api/v1/patient/health-metrics/chart?metricType=BLOOD_SUGAR&period=WEEK (Get Chart Data)

```javascript
pm.test('Status code is 200', function () {
    pm.response.to.have.status(200);
});

pm.test('Response time is less than 3000ms', function () {
    pm.expect(pm.response.responseTime).to.be.below(3000);
});

pm.test('Content-Type is application/json', function () {
    pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json');
});

pm.test('Response has success=true and message', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(true);
    pm.expect(jsonData.message).to.eql('Chart data retrieved successfully');
});

pm.test('Chart data is an array of BLOOD_SUGAR metrics only', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.be.an('array');
    jsonData.data.forEach(function (item) {
        pm.expect(item.metricType).to.eql('BLOOD_SUGAR');
    });
});
```

### 2.4. GET /api/v1/patient/health-metrics/history?page=0&size=10 (Get Metrics History)

```javascript
pm.test('Status code is 200', function () {
    pm.response.to.have.status(200);
});

pm.test('Response time is less than 3000ms', function () {
    pm.expect(pm.response.responseTime).to.be.below(3000);
});

pm.test('Content-Type is application/json', function () {
    pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json');
});

pm.test('Response has success=true and message', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(true);
    pm.expect(jsonData.message).to.eql('History retrieved successfully');
});

pm.test('History data has Page schema (content, number, size)', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('content');
    pm.expect(jsonData.data.content).to.be.an('array');
    pm.expect(jsonData.data).to.have.property('number');
    pm.expect(jsonData.data.number).to.eql(0);
    pm.expect(jsonData.data).to.have.property('size');
    pm.expect(jsonData.data.size).to.eql(10);
});
```

### 2.5. DELETE /api/v1/patient/health-metrics/{id} (Delete Health Metric)

```javascript
pm.test('Status code is 200', function () {
    pm.response.to.have.status(200);
});

pm.test('Response time is less than 3000ms', function () {
    pm.expect(pm.response.responseTime).to.be.below(3000);
});

pm.test('Content-Type is application/json', function () {
    pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json');
});

pm.test('Response has success=true and message', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(true);
    pm.expect(jsonData.message).to.eql('Health metric deleted successfully');
    pm.expect(jsonData.data).to.be.null;
});
```

---

## 3. THỨ TỰ CHẠY KIỂM THỬ (TEST DEPENDENCY)

Do endpoint `DELETE` cần một `id` hợp lệ để xóa, request **"Record Health Metric"** phải chạy **trước tiên** để tạo bản ghi mới và lưu `id` vào biến môi trường `createdMetricId` (thông qua `pm.environment.set()`). Request **"Delete Health Metric"** sau đó dùng chính `id` này (`{{createdMetricId}}`) để xóa — đảm bảo tính độc lập của test, không xóa nhầm dữ liệu có sẵn trong hệ thống.

**Thứ tự chạy đúng:**
```
1. Record Health Metric   → tạo mới + lưu createdMetricId
2. Get Metrics Summary    → không phụ thuộc
3. Get Chart Data         → không phụ thuộc
4. Get Metrics History    → không phụ thuộc
5. Delete Health Metric   → dùng createdMetricId từ bước 1
```

---

## 4. MA TRẬN BAO PHỦ KIỂM THỬ (COMPLETION CRITERIA)

| Endpoint | Status Code Assertion | Response Time Assertion | Body/Field Assertion | Content-Type JSON | Schema/Field Assertion |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `POST /health-metrics` | ✅ (201) | ✅ (3000ms) | ✅ | ✅ | ✅ |
| `GET /summary` | ✅ | ✅ (3000ms) | ✅ | ✅ | ✅ |
| `GET /chart` | ✅ | ✅ (3000ms) | ✅ | ✅ | ✅ (lọc đúng metricType) |
| `GET /history` | ✅ | ✅ (3000ms) | ✅ | ✅ | ✅ (Page schema) |
| `DELETE /{id}` | ✅ | ✅ (3000ms) | ✅ | ✅ | ✅ |

---

## 5. KẾT QUẢ CHẠY THỰC TẾ (POSTMAN RUN RESULT)

| Request | Kết quả |
| :--- | :---: |
| Record Health Metric | ✅ PASSED |
| Get Metrics Summary | ✅ PASSED |
| Get Chart Data | ✅ PASSED |
| Get Metrics History | ✅ PASSED |
| Delete Health Metric | ✅ PASSED |

**Tổng kết:** 5/5 requests — 24/24 `pm.test()` assertions PASSED.

---

## 6. KẾT LUẬN

*   Đã viết thành công **24 kịch bản `pm.test()`** bao phủ đầy đủ **5 endpoint** thuộc module Patient Health Metrics.
*   Mỗi endpoint đều đáp ứng đầy đủ tiêu chí hoàn thành: kiểm tra mã trạng thái HTTP (bao gồm đúng `201 Created` cho thao tác tạo mới), thời gian phản hồi, cấu trúc JSON response, Content-Type, và schema/field cơ bản của dữ liệu trả về.
*   Áp dụng kỹ thuật **chaining requests** (liên kết request) bằng `pm.environment.set()` để truyền `id` từ response của `POST` sang request `DELETE`, đảm bảo kịch bản kiểm thử vòng đời dữ liệu (data lifecycle) hoàn chỉnh: **Tạo → Xem → Xóa**.
*   Endpoint `Get Chart Data` được kiểm thử riêng để xác nhận logic lọc theo `metricType` hoạt động chính xác — tất cả phần tử trả về đều có `metricType = "BLOOD_SUGAR"` khớp với query param.
*   Script đã được thêm trực tiếp vào 5 request có sẵn trong folder **"19. Patient - Health Metrics"** của Postman Collection "DamDiep Healthcare API".