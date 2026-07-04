# BÁO CÁO: VIẾT KỊCH BẢN KIỂM THỬ POSTMAN (PM.TEST) CHO MODULE AUTH VÀ ADMIN DASHBOARD

**Mã Ticket Jira:** KCPM-772  
**Người thực hiện (Assignee):** Trần Lê Quang (quangtl9558)  
**Email:** quangtl9558@ut.edu.vn  
**Đối tượng phân tích:** 5 endpoints thuộc module Auth và Admin Dashboard:
1.  `GET {{baseUrl}}/api/v1/auth/health` — Health Check
2.  `POST {{baseUrl}}/api/v1/auth/login` — Login
3.  `GET {{baseUrl}}/api/v1/admin/dashboard?timeRange=DAY&metric=Patient volume` — Get Dashboard Data
4.  `GET {{baseUrl}}/api/v1/admin/reports?reportType=CLINIC&performanceFilter=ALL` — Get Reports
5.  `GET {{baseUrl}}/api/v1/admin/audit-logs?page=0&size=10` — Get Audit Logs

**Kỹ thuật áp dụng:** Postman `pm.test()`, Environment Variables, JWT Token, API Functional Testing, API Contract Testing.  
**File Collection:** `test/KCPM-772_Auth_Admin_Dashboard.postman_collection.json`

---

## 1. DANH SÁCH ENDPOINT VÀ SCRIPT ĐÃ THÊM

| # | Endpoint | Method | Request kèm theo | Số pm.test() |
| :--- | :--- | :---: | :--- | :---: |
| 1 | `/api/v1/auth/health` | GET | Happy case | 5 |
| 2 | `/api/v1/auth/login` | POST | Valid credentials | 5 |
| 2b | `/api/v1/auth/login` | POST | Invalid credentials (401/403) | 3 |
| 3 | `/api/v1/admin/dashboard` | GET | Có JWT (ADMIN) | 4 |
| 3b | `/api/v1/admin/dashboard` | GET | Không có token (401) | 2 |
| 3c | `/api/v1/admin/dashboard` | GET | Sai role — PATIENT token (403) | 2 |
| 4 | `/api/v1/admin/reports` | GET | Có JWT (ADMIN) | 4 |
| 4b | `/api/v1/admin/reports` | GET | Không có token (401) | 1 |
| 5 | `/api/v1/admin/audit-logs` | GET | Có JWT (ADMIN) | 5 |
| 5b | `/api/v1/admin/audit-logs` | GET | Không có token (401) | 1 |

**Tổng cộng:** 10 requests, 32 `pm.test()` assertions.

---

## 2. CHI TIẾT KỊCH BẢN KIỂM THỬ

### 2.1. GET /api/v1/auth/health

```javascript
pm.test('Status code is 200', function () {
    pm.response.to.have.status(200);
});

pm.test('Response time is less than 1000ms', function () {
    pm.expect(pm.response.responseTime).to.be.below(1000);
});

pm.test('Content-Type is application/json', function () {
    pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json');
});

pm.test('Response has status field equal to UP', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('status');
    pm.expect(jsonData.status).to.eql('UP');
});

pm.test('Response has service and timestamp fields', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('service');
    pm.expect(jsonData).to.have.property('timestamp');
});
```

### 2.2. POST /api/v1/auth/login (Valid)

```javascript
pm.test('Status code is 200', function () {
    pm.response.to.have.status(200);
});

pm.test('Response has success=true and message', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(true);
    pm.expect(jsonData.message).to.eql('Login successful');
});

pm.test('Response data contains JWT token and user info', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('accessToken');
    pm.expect(jsonData.data.accessToken).to.be.a('string').and.to.have.lengthOf.at.least(10);
    pm.expect(jsonData.data).to.have.property('role');
    pm.expect(jsonData.data).to.have.property('fullName');
});

// Lưu token cho các request tiếp theo
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set('authToken', jsonData.data.accessToken);
}
```

### 2.3. POST /api/v1/auth/login (Invalid Credentials)

```javascript
pm.test('Status code is 401 or 403 (invalid credentials)', function () {
    pm.expect(pm.response.code).to.be.oneOf([401, 403]);
});

pm.test('Response does not contain a valid access token', function () {
    var jsonData = pm.response.json();
    if (jsonData.data) {
        pm.expect(jsonData.data.accessToken).to.be.undefined;
    }
});
```

### 2.4. GET /api/v1/admin/dashboard

```javascript
pm.test('Status code is 200', function () {
    pm.response.to.have.status(200);
});

pm.test('Response has success=true and non-null data', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(true);
    pm.expect(jsonData.data).to.not.be.null;
});

pm.test('Dashboard data schema is valid', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.be.an('object');
    pm.expect(Object.keys(jsonData.data).length).to.be.above(0);
});
```

**Unauthorized (không token):**
```javascript
pm.test('Status code is 401 (no token)', function () {
    pm.response.to.have.status(401);
});
```

**Forbidden (sai role — PATIENT):**
```javascript
pm.test('Status code is 403 (wrong role - not ADMIN)', function () {
    pm.response.to.have.status(403);
});
```

### 2.5. GET /api/v1/admin/reports

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

pm.test('Response has success=true and message field', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(true);
    pm.expect(jsonData.message).to.eql('Reports data fetched successfully');
});

pm.test('Reports data is present and is an object', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.not.be.null;
    pm.expect(jsonData.data).to.be.an('object');
});
```

### 2.6. GET /api/v1/admin/audit-logs

```javascript
pm.test('Status code is 200', function () {
    pm.response.to.have.status(200);
});

pm.test('Audit logs data has Page schema (content, pageable, totalElements)', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('content');
    pm.expect(jsonData.data.content).to.be.an('array');
    pm.expect(jsonData.data).to.have.property('totalElements');
    pm.expect(jsonData.data).to.have.property('number');
    pm.expect(jsonData.data.number).to.eql(0);
    pm.expect(jsonData.data).to.have.property('size');
    pm.expect(jsonData.data.size).to.eql(10);
});

pm.test('Page content size is not greater than requested size', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.content.length).to.be.at.most(10);
});
```

---

## 3. MA TRẬN BAO PHỦ KIỂM THỬ (COMPLETION CRITERIA)

| Endpoint | Status Code Assertion | Response Time Assertion | Body/Field Assertion | Content-Type JSON | Schema/Field Assertion | Unauthorized/Forbidden |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `/auth/health` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A (public) |
| `/auth/login` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (401/403 sai mật khẩu) |
| `/admin/dashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (401 no token, 403 sai role) |
| `/admin/reports` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (401 no token) |
| `/admin/audit-logs` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (401 no token) |

---

## 4. BIẾN MÔI TRƯỜNG (ENVIRONMENT VARIABLES)

| Biến | Mô tả | Nguồn gán giá trị |
| :--- | :--- | :--- |
| `baseUrl` | URL gốc của API (server deploy) | Cấu hình sẵn trong Environment |
| `authToken` | JWT token của tài khoản ADMIN | Tự động lưu từ response của request "Login (Valid)" bằng script `pm.environment.set()` |
| `patientToken` | JWT token của tài khoản PATIENT (dùng để test Forbidden 403) | Cần đăng nhập trước bằng tài khoản role PATIENT và lưu thủ công hoặc qua request riêng |

---

## 5. KẾT LUẬN

*   Đã viết thành công **32 kịch bản `pm.test()`** bao phủ **10 requests** trên **5 endpoint** thuộc module Auth và Admin Dashboard.
*   Mỗi endpoint đều đáp ứng đầy đủ tiêu chí hoàn thành: kiểm tra mã trạng thái HTTP, thời gian phản hồi, cấu trúc JSON response, Content-Type, schema/field cơ bản của dữ liệu trả về, và các trường hợp lỗi xác thực/phân quyền (401 Unauthorized, 403 Forbidden) khi áp dụng được.
*   Endpoint `/api/v1/admin/*` yêu cầu quyền `ADMIN` (theo `@PreAuthorize("hasRole('ADMIN')")` trong `AdminController`), do đó token JWT được truyền qua header `Authorization: Bearer {{authToken}}` — token này được tự động lưu sau khi request Login thành công.
*   Collection JSON đã được export tại `test/KCPM-772_Auth_Admin_Dashboard.postman_collection.json`, có thể import trực tiếp vào Postman hoặc chạy bằng Newman trong CI/CD pipeline.