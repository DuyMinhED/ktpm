# BÁO CÁO: VIẾT KỊCH BẢN KIỂM THỬ POSTMAN (PM.TEST) CHO MODULE NOTIFICATIONS

**Mã Ticket Jira:** KCPM-797  
**Người thực hiện (Assignee):** Trần Lê Quang (quangtl9558)  
**Email:** quangtl9558@ut.edu.vn  
**Đối tượng phân tích:** 3 endpoints thuộc module Notifications (`NotificationController.java`):
1.  `GET {{baseUrl}}/api/v1/notifications` — Get My Notifications
2.  `GET {{baseUrl}}/api/v1/notifications/unread-count` — Get Unread Count
3.  `PUT {{baseUrl}}/api/v1/notifications/{{notificationId}}/read` — Mark As Read

**Kỹ thuật áp dụng:** Postman `pm.test()`, Environment Variables, JWT Token, API Functional Testing, API Contract Testing.  
**Vị trí Collection:** Folder **"23. Notifications"** trong Postman Collection "DamDiep Healthcare API" (đã có sẵn request, chỉ bổ sung script `pm.test()`).

---

## 1. DANH SÁCH ENDPOINT VÀ SCRIPT ĐÃ THÊM

| # | Endpoint | Method | Request có sẵn | Số pm.test() |
| :--- | :--- | :---: | :--- | :---: |
| 1 | `/api/v1/notifications` | GET | Get My Notifications | 5 |
| 2 | `/api/v1/notifications/unread-count` | GET | Get Unread Count | 5 |
| 3 | `/api/v1/notifications/{id}/read` | PUT | Mark As Read | 4 |

**Tổng cộng:** 3 requests, 14 `pm.test()` assertions.

**Lưu ý:** Folder có sẵn 2 request khác — **"Mark All As Read"** và **"Delete Notification"** — không nằm trong scope của KCPM-797 (đề bài chỉ yêu cầu đúng 3 endpoint liệt kê ở trên), do đó không chỉnh sửa.

**Về phân quyền:** Cả 3 endpoint đều **không giới hạn theo role cụ thể** (không có `@PreAuthorize`) — chỉ yêu cầu người dùng đã đăng nhập (JWT hợp lệ). Dữ liệu trả về được lọc theo `userId` của người dùng hiện tại (lấy từ `SecurityUtils.getCurrentUserId()`), do đó bất kỳ role nào (ADMIN, DOCTOR, CLINIC_MANAGER, PATIENT) đều truy cập được API của chính mình.

---

## 2. CHI TIẾT KỊCH BẢN KIỂM THỬ

### 2.1. GET /api/v1/notifications (Get My Notifications)

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
    pm.expect(jsonData.message).to.eql('Notifications retrieved successfully');
});

pm.test('Notifications data is an array with valid item schema', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.be.an('array');
    if (jsonData.data.length > 0) {
        var item = jsonData.data[0];
        pm.expect(item).to.have.property('id');
        pm.expect(item).to.have.property('title');
        pm.expect(item).to.have.property('message');
        pm.expect(item).to.have.property('read');
        pm.expect(item.read).to.be.a('boolean');

        // Lưu id để dùng cho request Mark As Read phía sau
        pm.environment.set('notificationId', item.id);
    }
});
```

### 2.2. GET /api/v1/notifications/unread-count (Get Unread Count)

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
    pm.expect(jsonData.message).to.eql('Unread count retrieved');
});

pm.test('Unread count is a non-negative number', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.be.a('number');
    pm.expect(jsonData.data).to.be.at.least(0);
});
```

### 2.3. PUT /api/v1/notifications/{id}/read (Mark As Read)

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
    pm.expect(jsonData.message).to.eql('Notification marked as read');
    pm.expect(jsonData.data).to.be.null;
});
```

---

## 3. THỨ TỰ CHẠY KIỂM THỬ (TEST DEPENDENCY)

Request **"Get My Notifications"** chạy trước để lấy `id` của một thông báo có thật trong hệ thống và lưu vào biến môi trường `notificationId` (thông qua `pm.environment.set()`). Request **"Mark As Read"** sau đó dùng chính `id` này (`{{notificationId}}`) thay vì hard-code `id = 1` như đề bài gốc — tránh trường hợp `id = 1` không tồn tại hoặc không thuộc về user hiện tại đang test.

**Thứ tự chạy đúng:**
```
1. Get My Notifications   → lấy danh sách + lưu notificationId
2. Get Unread Count       → không phụ thuộc
3. Mark As Read           → dùng notificationId từ bước 1
```

---

## 4. MA TRẬN BAO PHỦ KIỂM THỬ (COMPLETION CRITERIA)

| Endpoint | Status Code Assertion | Response Time Assertion | Body/Field Assertion | Content-Type JSON | Schema/Field Assertion |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `GET /notifications` | ✅ | ✅ (3000ms) | ✅ | ✅ | ✅ (item schema) |
| `GET /unread-count` | ✅ | ✅ (3000ms) | ✅ | ✅ | ✅ (kiểu số ≥ 0) |
| `PUT /{id}/read` | ✅ | ✅ (3000ms) | ✅ | ✅ | ✅ |

---

## 5. KẾT QUẢ CHẠY THỰC TẾ (POSTMAN RUN RESULT)

| Request | Kết quả |
| :--- | :---: |
| Get My Notifications | ✅ PASSED |
| Get Unread Count | ✅ PASSED |
| Mark As Read | ✅ PASSED |

**Tổng kết:** 3/3 requests — 14/14 `pm.test()` assertions PASSED.

---

## 6. KẾT LUẬN

*   Đã viết thành công **14 kịch bản `pm.test()`** bao phủ đầy đủ **3 endpoint** thuộc module Notifications.
*   Mỗi endpoint đều đáp ứng đầy đủ tiêu chí hoàn thành: kiểm tra mã trạng thái HTTP, thời gian phản hồi, cấu trúc JSON response, Content-Type, và schema/field cơ bản của dữ liệu trả về.
*   Áp dụng kỹ thuật **chaining requests** bằng `pm.environment.set()` để truyền `id` từ response của `GET /notifications` sang request `PUT /{id}/read`, đảm bảo test không phụ thuộc vào dữ liệu cứng (`id = 1`) có thể không tồn tại trong môi trường thực tế.
*   Cả 3 endpoint đều xác nhận cơ chế bảo mật theo **user hiện tại** (không phân biệt role cụ thể) — dữ liệu trả về luôn được lọc theo `userId` trích xuất từ JWT token.
*   Script đã được thêm trực tiếp vào 3 request có sẵn trong folder **"23. Notifications"** của Postman Collection "DamDiep Healthcare API".