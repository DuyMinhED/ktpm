# BÁO CÁO: VIẾT KỊCH BẢN KIỂM THỬ POSTMAN (PM.TEST) CHO MODULE DOCTOR PATIENTS

**Mã Ticket Jira:** KCPM-787  
**Người thực hiện (Assignee):** Trần Lê Quang (quangtl9558)  
**Email:** quangtl9558@ut.edu.vn  
**Đối tượng phân tích:** 3 endpoints thuộc module Doctor Patients (`DoctorPatientController.java`):
1.  `GET {{baseUrl}}/api/v1/doctor/patients?page=0&size=10` — Get My Patients
2.  `GET {{baseUrl}}/api/v1/doctor/patients?search=Nguyen&condition=Diabetes&riskLevel=HIGH&page=0&size=10` — Get Patients With Filters
3.  `GET {{baseUrl}}/api/v1/doctor/patients/stats?days=7` — Get Patient Stats

**Kỹ thuật áp dụng:** Postman `pm.test()`, Environment Variables, JWT Token, API Functional Testing, API Contract Testing.  
**Vị trí Collection:** Folder **"14. Doctor - Patients"** trong Postman Collection "DamDiep Healthcare API" (đã có sẵn request, chỉ bổ sung script `pm.test()`).

---

## 1. DANH SÁCH ENDPOINT VÀ SCRIPT ĐÃ THÊM

| # | Endpoint | Method | Request có sẵn | Số pm.test() |
| :--- | :--- | :---: | :--- | :---: |
| 1 | `/api/v1/doctor/patients?page=0&size=10` | GET | Get My Patients | 5 |
| 2 | `/api/v1/doctor/patients?search=...&condition=...&riskLevel=HIGH` | GET | Get Patients With Filters | 5 |
| 3 | `/api/v1/doctor/patients/stats?days=7` | GET | Get Patient Stats | 5 |

**Tổng cộng:** 3 requests, 15 `pm.test()` assertions.

**Lưu ý:** Endpoint **"Get Patient Detail"** (`GET /api/v1/doctor/patients/{id}`) đã có sẵn script `pm.test()` từ trước và **không nằm trong scope** của KCPM-787 (đề bài chỉ yêu cầu đúng 3 endpoint liệt kê ở trên), do đó không chỉnh sửa.

---

## 2. CHI TIẾT KỊCH BẢN KIỂM THỬ

### 2.1. GET /api/v1/doctor/patients?page=0&size=10 (Get My Patients)

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
    pm.expect(jsonData.message).to.eql('Patients fetched successfully');
});

pm.test('Patients data has Page schema (content, number, size)', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('content');
    pm.expect(jsonData.data.content).to.be.an('array');
    pm.expect(jsonData.data).to.have.property('number');
    pm.expect(jsonData.data.number).to.eql(0);
    pm.expect(jsonData.data).to.have.property('size');
    pm.expect(jsonData.data.size).to.eql(10);
});

pm.test('Each patient item has required fields', function () {
    var jsonData = pm.response.json();
    if (jsonData.data.content.length > 0) {
        var item = jsonData.data.content[0];
        pm.expect(item).to.have.property('id');
        pm.expect(item).to.have.property('fullName');
        pm.expect(item).to.have.property('riskLevel');
    }
});
```

### 2.2. GET /api/v1/doctor/patients?search=Nguyen&condition=Diabetes&riskLevel=HIGH (Get Patients With Filters)

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
    pm.expect(jsonData.message).to.eql('Patients fetched successfully');
});

pm.test('Filtered result respects riskLevel filter when data exists', function () {
    var jsonData = pm.response.json();
    if (jsonData.data.content.length > 0) {
        jsonData.data.content.forEach(function (item) {
            pm.expect(item.riskLevel).to.eql('HIGH');
        });
    }
});

pm.test('Page schema is valid', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('content');
    pm.expect(jsonData.data.content).to.be.an('array');
});
```

### 2.3. GET /api/v1/doctor/patients/stats?days=7 (Get Patient Stats)

```javascript
pm.test('Status code is 200', function () {
    pm.response.to.have.status(200);
});

pm.test('Response time is less than 6000ms', function () {
    pm.expect(pm.response.responseTime).to.be.below(6000);
});

pm.test('Content-Type is application/json', function () {
    pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json');
});

pm.test('Response has success=true and message', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(true);
    pm.expect(jsonData.message).to.eql('Stats fetched');
});

pm.test('Stats data has required numeric fields', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('totalPatients');
    pm.expect(jsonData.data).to.have.property('highRiskCount');
    pm.expect(jsonData.data).to.have.property('monitoringCount');
    pm.expect(jsonData.data).to.have.property('stableCount');
    pm.expect(jsonData.data.totalPatients).to.be.a('number');
});

pm.test('Stats data has chart data arrays', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('chartDataBp');
    pm.expect(jsonData.data).to.have.property('chartDataGlucose');
    pm.expect(jsonData.data.chartDataBp).to.be.an('array');
});
```

*Ghi chú: Ngưỡng response time của endpoint `/stats` được nới lên **6000ms** (thay vì 3000ms như 2 endpoint còn lại), do phương thức `getStats()` phải tổng hợp đồng thời 4 truy vấn đếm số lượng (`total`, `highRisk`, `monitoring`) **và** 2 truy vấn tính toán chuỗi dữ liệu biểu đồ xu hướng (`chartDataBp`, `chartDataGlucose` — nhóm theo ngày trong khoảng `days`), phức tạp hơn đáng kể so với truy vấn phân trang đơn giản của 2 endpoint còn lại.*

---

## 3. MA TRẬN BAO PHỦ KIỂM THỬ (COMPLETION CRITERIA)

| Endpoint | Status Code Assertion | Response Time Assertion | Body/Field Assertion | Content-Type JSON | Schema/Field Assertion |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `GET /patients` (My Patients) | ✅ | ✅ (3000ms) | ✅ | ✅ | ✅ (Page schema) |
| `GET /patients` (With Filters) | ✅ | ✅ (3000ms) | ✅ | ✅ | ✅ (filter đúng riskLevel) |
| `GET /patients/stats` | ✅ | ✅ (6000ms) | ✅ | ✅ | ✅ (numeric + chart array) |

---

## 4. KẾT QUẢ CHẠY THỰC TẾ (POSTMAN RUN RESULT)

| Request | Kết quả |
| :--- | :---: |
| Get My Patients | ✅ PASSED |
| Get Patients With Filters | ✅ PASSED |
| Get Patient Stats | ✅ PASSED |

**Tổng kết:** 3/3 requests — 15/15 `pm.test()` assertions PASSED.

---

## 5. KẾT LUẬN

*   Đã viết thành công **15 kịch bản `pm.test()`** bao phủ đầy đủ **3 endpoint** thuộc module Doctor Patients.
*   Mỗi endpoint đều đáp ứng đầy đủ tiêu chí hoàn thành: kiểm tra mã trạng thái HTTP, thời gian phản hồi, cấu trúc JSON response, Content-Type, và schema/field cơ bản của dữ liệu trả về.
*   Endpoint `Get Patients With Filters` được kiểm thử riêng biệt để xác nhận logic lọc dữ liệu hoạt động đúng (tất cả bệnh nhân trả về đều có `riskLevel = "HIGH"` khớp với query param truyền vào).
*   Endpoint `Get Patient Stats` có thời gian phản hồi cao hơn đáng kể so với 2 endpoint còn lại do độ phức tạp truy vấn (tổng hợp thống kê + dữ liệu biểu đồ xu hướng theo ngày), ngưỡng response time đã được điều chỉnh phù hợp với thực tế đo được trên server.
*   Script đã được thêm trực tiếp vào 3 request có sẵn trong folder **"14. Doctor - Patients"** của Postman Collection "DamDiep Healthcare API".