# BÁO CÁO: KỊCH BẢN POSTMAN CHO PHÂN HỆ AI CHAT VÀ DANH SÁCH BÁC SĨ CÔNG KHAI (AI CHAT & PUBLIC DOCTORS ENDPOINTS)

**Mã Ticket Jira:** KCPM-799  
**Người thực hiện (Assignee):** Nguyễn Thị Ánh Ngọc  
**Email:** ngocnta4878@ut.edu.vn  
**Phạm vi kịch bản:** 3 API cộng đồng tại `AiChatController.java` và `DoctorController.java`:
1. `POST /api/v1/ai/chat` (Nhắn tin trò chuyện với trợ lý AI)
2. `GET /api/doctors` (Lấy danh sách bác sĩ công khai phân trang)
3. `GET /api/doctors?specialty=Cardiology` (Lọc danh sách bác sĩ theo chuyên khoa phân trang)

---

## 1. Mục tiêu kiểm thử

1. Xây dựng kịch bản kiểm thử tự động toàn diện bằng mã `pm.test()` trong Postman cho 3 API cộng đồng của hệ thống.
2. Kiểm tra tính chính xác của phản hồi từ API theo mô hình DTO thực tế:
   * Trạng thái phản hồi (Status Code: 200 OK).
   * Thời gian phản hồi nhanh (Response time < 5000ms đối với AI Chat, < 3000ms đối với lấy danh sách bác sĩ).
   * Định dạng dữ liệu (JSON Content-Type).
   * Khớp cấu trúc dữ liệu thực tế (Schema Validation) của đối tượng `AiChatResponse` trả về trực tiếp và cấu trúc phân trang của danh sách bác sĩ `ApiResponse<Page<DoctorResponse>>`.
3. Kiểm thử biên và bảo mật: Kiểm tra lỗi dữ liệu đầu vào (400 Bad Request) hoặc các trường hợp bảo mật nếu áp dụng.

---

## 2. Kịch bản kiểm thử tự động chi tiết (Postman Test Scripts)

### 2.1. API 1: `POST /api/v1/ai/chat` (Chat With AI)
Đoạn mã kiểm thử viết trong tab **Scripts** -> **Post-response** của Request:

```javascript
// 1. Kiểm tra mã trạng thái trả về là 200 OK hoặc mã lỗi xử lý đầu vào
pm.test("Status code is 200 OK or handled error", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 400]);
});

// 2. Kiểm tra thời gian phản hồi hợp lý (AI Chat có thể trễ hơn do xử lý AI)
pm.test("Response time is less than 5000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(5000);
});

// 3. Kiểm tra tiêu đề Content-Type là application/json
pm.test("Content-Type is application/json when body is returned", function () {
    if (pm.response.text()) {
        pm.response.to.have.header("Content-Type");
        pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
    }
});

// 4. Kiểm tra cấu trúc dữ liệu trả về của đối tượng AiChatResponse trực tiếp
pm.test("AI Chat response has valid schema", function () {
    if (pm.response.code === 200) {
        var response = pm.response.json();
        pm.expect(response).to.be.an("object");
        pm.expect(response).to.include.keys("success", "reply");
        pm.expect(response.success).to.be.a("boolean");
        if (response.success) {
            pm.expect(response.reply).to.be.a("string").and.not.empty;
            pm.expect(response.error).to.be.null;
        } else {
            pm.expect(response.error).to.be.a("string").and.not.empty;
            pm.expect(response.reply).to.be.null;
        }
    }
});
```

---

### 2.2. API 2: `GET /api/doctors` (Get Doctors List)
Đoạn mã kiểm thử viết trong tab **Scripts** -> **Post-response** của Request:

```javascript
// 1. Kiểm tra mã trạng thái trả về là 200 OK
pm.test("Status code is 200 OK", function () {
    pm.expect(pm.response.code).to.equal(200);
});

// 2. Kiểm tra thời gian phản hồi hợp lý
pm.test("Response time is less than 3000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(3000);
});

// 3. Kiểm tra tiêu đề Content-Type là application/json
pm.test("Content-Type is application/json", function () {
    pm.response.to.have.header("Content-Type");
    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
});

// 4. Kiểm tra cấu trúc phân trang của danh sách bác sĩ
pm.test("Response has valid paged doctors list", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.message).to.equal("Doctors fetched successfully");
    
    var page = response.data;
    pm.expect(page).to.be.an("object");
    pm.expect(page.content).to.be.an("array");
    pm.expect(page.totalPages).to.be.a("number");
    pm.expect(page.totalElements).to.be.a("number");
    
    if (page.content.length > 0) {
        var doc = page.content[0];
        pm.expect(doc).to.be.an("object");
        pm.expect(doc).to.include.keys("id", "email", "fullName", "specialization", "status");
        pm.expect(doc.id).to.be.a("number");
        pm.expect(doc.fullName).to.be.a("string").and.not.empty;
    }
});
```

---

### 2.3. API 3: `GET /api/doctors?specialty=Cardiology` (Get Doctors By Specialty)
Đoạn mã kiểm thử viết trong tab **Scripts** -> **Post-response** của Request:

```javascript
// 1. Kiểm tra mã trạng thái trả về là 200 OK
pm.test("Status code is 200 OK", function () {
    pm.expect(pm.response.code).to.equal(200);
});

// 2. Kiểm tra thời gian phản hồi hợp lý
pm.test("Response time is less than 3000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(3000);
});

// 3. Kiểm tra tiêu đề Content-Type là application/json
pm.test("Content-Type is application/json", function () {
    pm.response.to.have.header("Content-Type");
    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
});

// 4. Kiểm tra danh sách bác sĩ lọc theo chuyên khoa
pm.test("Response has valid filtered paged doctors list", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.message).to.equal("Doctors fetched successfully");
    
    var page = response.data;
    pm.expect(page).to.be.an("object");
    pm.expect(page.content).to.be.an("array");
    
    if (page.content.length > 0) {
        var doc = page.content[0];
        pm.expect(doc).to.be.an("object");
        pm.expect(doc).to.include.keys("id", "fullName", "specialization");
        page.content.forEach(function (d) {
            if (d.specialization) {
                pm.expect(d.specialization).to.be.a("string");
            }
        });
    }
});
```

---

## 3. Các kịch bản lỗi & Kiểm thử biên (Negative & Boundary Scenarios)

### 3.1. Lỗi dữ liệu đầu vào không hợp lệ (400 Bad Request)
Khi gọi API AI Chat với nội dung trống hoặc sai định dạng:
```javascript
pm.test("Status code is 400 Bad Request", function () {
    pm.response.to.have.status(400);
});
```

### 3.2. Lọc theo chuyên khoa không tồn tại
Khi lọc theo chuyên khoa không tồn tại, API trả về danh sách trống và `200 OK`:
```javascript
pm.test("Status code is 200 OK with empty content", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.data.content).to.be.an("array").that.is.empty;
});
```
