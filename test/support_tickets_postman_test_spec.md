# BÁO CÁO: KỊCH BẢN POSTMAN CHO PHÂN HỆ YÊU CẦU HỖ TRỢ (SUPPORT TICKETS ENDPOINTS)

**Mã Ticket Jira:** KCPM-804  
**Người thực hiện (Assignee):** Nguyễn Thị Ánh Ngọc  
**Email:** ngocnta4878@ut.edu.vn  
**Phạm vi kịch bản:** 5 API quản lý Yêu cầu Hỗ trợ tại `SupportTicketController.java`:
1. `GET /api/v1/support-tickets/{id}` (Lấy chi tiết yêu cầu hỗ trợ theo ID)
2. `GET /api/v1/support-tickets/code/{code}` (Lấy yêu cầu hỗ trợ theo mã code)
3. `PUT /api/v1/support-tickets/{id}/status` (Cập nhật trạng thái yêu cầu)
4. `GET /api/v1/support-tickets/stats` (Lấy số liệu thống kê yêu cầu hỗ trợ)
5. `DELETE /api/v1/support-tickets/{id}` (Xóa yêu cầu hỗ trợ)

---

## 1. Mục tiêu kiểm thử

1. Xây dựng kịch bản kiểm thử tự động toàn diện bằng mã `pm.test()` trong Postman cho 5 API quản trị yêu cầu hỗ trợ.
2. Kiểm tra tính chính xác của phản hồi từ API theo mô hình thực tế:
   * Trạng thái phản hồi (Status Code: 200 OK / 204 No Content).
   * Thời gian phản hồi nhanh (Response time < 3000ms).
   * Định dạng dữ liệu (JSON Content-Type).
   * Khớp cấu trúc dữ liệu thực tế (Schema/DTO Validation) của đối tượng `SupportTicket` trả về trực tiếp, cấu trúc thống kê `Map<String, Long>`, và phản hồi rỗng (`204 No Content`).
3. Kiểm thử liên hoàn (Chaining Requests): Tự động trích xuất các ID thực tế (`supportTicketId` và `supportTicketCode`) từ API tạo mới (`Create Ticket`) và truyền vào các API Xem, Sửa, Xóa tiếp theo.
4. Kiểm thử biên và bảo mật: Kiểm tra lỗi chưa xác thực (401), lỗi truy cập trái phép phân quyền (403), lỗi dữ liệu đầu vào (400 Bad Request) và lỗi không tìm thấy bản ghi (404 Not Found).

---

## 2. Kịch bản kiểm thử tự động chi tiết (Postman Test Scripts)

### 2.1. API 1: `GET /api/v1/support-tickets/{id}` (Get Ticket By ID)
Đoạn mã kiểm thử viết trong tab **Scripts** -> **Post-response** của Request:

```javascript
// 1. Kiểm tra mã trạng thái trả về là 200 OK hoặc mã lỗi 404
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

// 4. Kiểm tra cấu trúc SupportTicket trả về
pm.test("Get Ticket By ID response has valid schema", function () {
    if (pm.response.code === 200) {
        var response = pm.response.json();
        pm.expect(response).to.be.an("object");
        pm.expect(response).to.include.keys("id", "ticketCode", "subject", "category", "priority", "status");
        pm.expect(response.id).to.be.a("number");
        pm.expect(response.ticketCode).to.be.a("string").and.not.empty;
    }
});
```

---

### 2.2. API 2: `GET /api/v1/support-tickets/code/{code}` (Get Ticket By Code)
Đoạn mã kiểm thử viết trong tab **Scripts** -> **Post-response** của Request:

```javascript
// 1. Kiểm tra mã trạng thái trả về là 200 OK hoặc mã lỗi 404
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

// 4. Kiểm tra cấu trúc SupportTicket trả về
pm.test("Get Ticket By Code response has valid schema", function () {
    if (pm.response.code === 200) {
        var response = pm.response.json();
        pm.expect(response).to.be.an("object");
        pm.expect(response).to.include.keys("id", "ticketCode", "subject", "category", "priority", "status");
        pm.expect(response.ticketCode).to.be.a("string").and.not.empty;
    }
});
```

---

### 2.3. API 3: `PUT /api/v1/support-tickets/{id}/status` (Update Ticket Status)
Đoạn mã kiểm thử viết trong tab **Scripts** -> **Post-response** của Request:

```javascript
// 1. Kiểm tra mã trạng thái trả về là 200 OK hoặc các mã lỗi xử lý
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

// 4. Kiểm tra trạng thái yêu cầu cập nhật thành công
pm.test("Update Ticket Status response has valid schema", function () {
    if (pm.response.code === 200) {
        var response = pm.response.json();
        pm.expect(response).to.be.an("object");
        pm.expect(response).to.include.keys("id", "ticketCode", "status", "adminNote");
        pm.expect(response.status).to.equal("RESOLVED");
    }
});
```

---

### 2.4. API 4: `GET /api/v1/support-tickets/stats` (Get Ticket Stats)
Đoạn mã kiểm thử viết trong tab **Scripts** -> **Post-response** của Request:

```javascript
// 1. Kiểm tra mã trạng thái trả về là 200 OK hoặc các lỗi bảo mật
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

// 4. Kiểm tra dữ liệu Map thống kê trả về hợp lệ
pm.test("Get Ticket Stats response is a valid map", function () {
    if (pm.response.code === 200) {
        var response = pm.response.json();
        pm.expect(response).to.be.an("object");
        Object.keys(response).forEach(function (key) {
            pm.expect(response[key]).to.be.a("number");
        });
    }
});
```

---

### 2.5. API 5: `DELETE /api/v1/support-tickets/{id}` (Delete Ticket)
Đoạn mã kiểm thử viết trong tab **Scripts** -> **Post-response** của Request:

```javascript
// 1. Kiểm tra mã trạng thái trả về là 204 No Content hoặc lỗi phân quyền
pm.test("Status code is 204 No Content or error guard", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 204, 401, 403, 404]);
});

// 2. Kiểm tra thời gian phản hồi hợp lý
pm.test("Response time is less than 3000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(3000);
});
```

---

## 3. Các kịch bản lỗi & Bảo mật (Negative & Security Scenarios)

### 3.1. Lỗi chưa xác thực (401 Unauthorized)
Khi không truyền Token đăng nhập:
```javascript
pm.test("Status code is 401 Unauthorized", function () {
    pm.response.to.have.status(401);
});
```

### 3.2. Lỗi dữ liệu không tồn tại (404 Not Found)
Khi yêu cầu xem chi tiết hoặc xóa với ID không hợp lệ:
```javascript
pm.test("Status code is 404 Not Found", function () {
    pm.response.to.have.status(404);
});
```
