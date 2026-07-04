# BÁO CÁO: KỊCH BẢN POSTMAN CHO PHÂN HỆ CẢNH BÁO NGUY CƠ PHÒNG KHÁM (CLINIC RISK ALERTS ENDPOINTS)

**Mã Ticket Jira:** KCPM-784  
**Người thực hiện (Assignee):** Nguyễn Thị Ánh Ngọc  
**Email:** ngocnta4878@ut.edu.vn  
**Phạm vi kịch bản:** 4 API quản lý Cảnh báo Nguy cơ tại `RiskAlertController.java`:
1. `GET /api/v1/clinics/{clinicId}/risk-alerts/dashboard` (Lấy dữ liệu bảng điều khiển cảnh báo nguy cơ)
2. `GET /api/v1/clinics/{clinicId}/risk-alerts/high-risk-patients` (Lấy danh sách bệnh nhân có nguy cơ cao phân trang)
3. `PATCH /api/v1/clinics/{clinicId}/risk-alerts/alerts/{alertId}/read` (Đánh dấu cảnh báo đã đọc)
4. `PATCH /api/v1/clinics/{clinicId}/risk-alerts/alerts/{alertId}/dismiss` (Bỏ qua cảnh báo)

---

## 1. Mục tiêu kiểm thử

1. Xây dựng kịch bản kiểm thử tự động toàn diện bằng mã `pm.test()` trong Postman cho 4 API quản lý Cảnh báo nguy cơ của bệnh nhân theo từng phòng khám.
2. Kiểm tra tính chính xác của phản hồi từ API theo mô hình `ApiResponse<T>` chuẩn hóa của dự án:
   * Trạng thái phản hồi (Status Code: 200 OK).
   * Thời gian phản hồi nhanh (Response time < 3000ms).
   * Định dạng dữ liệu (JSON Content-Type).
   * Khớp cấu trúc dữ liệu thực tế (Schema Validation) của các đối tượng `RiskAlertResponse`, cấu trúc phân trang của danh sách bệnh nhân nguy cơ cao, và định dạng phản hồi trống (`ApiResponse<Void>`).
3. Kiểm thử biên và bảo mật: Kiểm tra lỗi chưa xác thực (401), lỗi truy cập trái phép phân quyền chéo (403), lỗi dữ liệu đầu vào (400 Bad Request) và lỗi không tìm thấy bản ghi (404 Not Found).

---

## 2. Kịch bản kiểm thử tự động chi tiết (Postman Test Scripts)

### 2.1. API 1: `GET /api/v1/clinics/{clinicId}/risk-alerts/dashboard` (Get Risk Alert Dashboard)
Đoạn mã kiểm thử viết trong tab **Scripts** -> **Post-response** của Request:

```javascript
// 1. Kiểm tra mã trạng thái trả về là 200 OK hoặc mã lỗi bảo mật
pm.test("Status code is 200 OK or auth/forbidden guard", function () {
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

// 4. Kiểm tra cấu trúc dữ liệu trả về của Dashboard
pm.test("Response has valid risk alert dashboard structure", function () {
    if (pm.response.code === 200) {
        var response = pm.response.json();
        pm.expect(response.success).to.be.true;
        pm.expect(response.message).to.equal("Risk dashboard fetched");
        
        var data = response.data;
        pm.expect(data).to.be.an("object");
        pm.expect(data).to.include.keys("summary", "highRiskPatients", "recentAlerts");
        
        var summary = data.summary;
        pm.expect(summary).to.be.an("object");
        pm.expect(summary).to.include.keys("totalPatients", "highRiskCount", "mediumRiskCount", "stableCount");
        pm.expect(summary.totalPatients).to.be.a("number");
        pm.expect(summary.highRiskCount).to.be.a("number");
        
        pm.expect(data.highRiskPatients).to.be.an("array");
        pm.expect(data.recentAlerts).to.be.an("array");
    }
});
```

---

### 2.2. API 2: `GET /api/v1/clinics/{clinicId}/risk-alerts/high-risk-patients` (Get High Risk Patients)
Đoạn mã kiểm thử viết trong tab **Scripts** -> **Post-response** của Request:

```javascript
// 1. Kiểm tra mã trạng thái trả về là 200 OK hoặc mã lỗi bảo mật
pm.test("Status code is 200 OK or auth/forbidden guard", function () {
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

// 4. Kiểm tra cấu trúc phân trang của danh sách bệnh nhân nguy cơ cao
pm.test("Response has valid high-risk patients page structure", function () {
    if (pm.response.code === 200) {
        var response = pm.response.json();
        pm.expect(response.success).to.be.true;
        pm.expect(response.message).to.equal("High-risk patients fetched");
        
        var page = response.data;
        pm.expect(page).to.be.an("object");
        pm.expect(page.content).to.be.an("array");
        pm.expect(page.totalPages).to.be.a("number");
        pm.expect(page.totalElements).to.be.a("number");
        
        if (page.content.length > 0) {
            var item = page.content[0];
            pm.expect(item).to.be.an("object");
            pm.expect(item).to.include.keys("patientId", "fullName", "riskLevel");
            pm.expect(item.patientId).to.be.a("number");
            pm.expect(item.fullName).to.be.a("string");
            pm.expect(item.riskLevel).to.be.a("string");
        }
    }
});
```

---

### 2.3. API 3: `PATCH /api/v1/clinics/{clinicId}/risk-alerts/alerts/{alertId}/read` (Mark Alert As Read)
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
pm.test("Mark alert as read response has valid ApiResponse structure", function () {
    if (pm.response.code === 200) {
        var response = pm.response.json();
        pm.expect(response.success).to.be.true;
        pm.expect(response.message).to.equal("Alert marked as read");
        pm.expect(response.data).to.be.null; // Đối với ApiResponse<Void>
    }
});
```

---

### 2.4. API 4: `PATCH /api/v1/clinics/{clinicId}/risk-alerts/alerts/{alertId}/dismiss` (Dismiss Alert)
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
pm.test("Dismiss alert response has valid ApiResponse structure", function () {
    if (pm.response.code === 200) {
        var response = pm.response.json();
        pm.expect(response.success).to.be.true;
        pm.expect(response.message).to.equal("Alert dismissed");
        pm.expect(response.data).to.be.null; // Đối với ApiResponse<Void>
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
Ví dụ: Một Quản lý phòng khám (`CLINIC_MANAGER`) của phòng khám A cố tình truy cập cảnh báo của phòng khám B:
```javascript
pm.test("Status code is 403 Forbidden", function () {
    pm.response.to.have.status(403);
});
```

### 3.3. Lỗi dữ liệu không tồn tại (404 Not Found)
Khi truyền ID phòng khám hoặc ID cảnh báo không tồn tại:
```javascript
pm.test("Status code is 404 Not Found", function () {
    pm.response.to.have.status(404);
});
```
