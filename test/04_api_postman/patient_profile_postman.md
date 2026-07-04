# BÁO CÁO: KỊCH BẢN POSTMAN CHO HỒ SƠ BỆNH NHÂN (PATIENT PROFILE ENDPOINTS)

**Mã Ticket Jira:** KCPM-796  
**Người thực hiện (Assignee):** Duy Hồ Văn  
**Mã số Sinh viên:** 054205001151  
**Phạm vi kịch bản:** 3 API quản lý hồ sơ và liên hệ khẩn cấp thuộc `PatientProfileController.java`:
1. `POST /api/v1/patient/profile/emergency-contacts` (Thêm liên hệ khẩn cấp)
2. `PUT /api/v1/patient/profile/emergency-contacts/{id}` (Cập nhật liên hệ khẩn cấp)
3. `GET /api/v1/patient/profile/download-report` (Tải báo cáo sức khỏe)

---

## 1. Mục tiêu kiểm thử

1. Xây dựng kịch bản kiểm thử tự động toàn diện bằng mã `pm.test()` trong Postman cho 3 API quản lý hồ sơ của Bệnh nhân.
2. Kiểm tra tính chính xác của phản hồi từ API theo mô hình `ApiResponse<EmergencyContactResponse>` chuẩn hóa của dự án và dữ liệu xuất báo cáo dạng tệp tin văn bản `text/plain`:
   * Trạng thái phản hồi (Status Code: 200 OK).
   * Thời gian phản hồi nhanh (Response time < 500ms).
   * Định dạng dữ liệu (JSON Content-Type hoặc `text/plain` cho API tải file).
   * Headers đặc trưng: `Content-Disposition` chỉ định chính xác tên file `attachment; filename=health_report.txt`.
   * Khớp cấu trúc lược đồ (Schema Validation) của `EmergencyContactResponse`.
3. Kiểm thử biên và bảo mật: Kiểm tra lỗi xác thực (401), lỗi không đủ quyền (403 - ví dụ tài khoản bác sĩ truy cập), và lỗi truyền dữ liệu không hợp lệ (400 Bad Request cho số điện thoại/quan hệ).

---

## 2. Kịch bản kiểm thử tự động chi tiết (Postman Test Scripts)

### 2.1. API 1: `POST /api/v1/patient/profile/emergency-contacts` (Add Emergency Contact)
Đoạn mã kiểm thử viết trong tab **Tests** của Request:

```javascript
// 1. Kiểm tra mã trạng thái phản hồi là 200 OK
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});

// 2. Kiểm tra thời gian phản hồi hợp lý
pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

// 3. Kiểm tra tiêu đề Content-Type là application/json
pm.test("Content-Type is application/json", function () {
    pm.response.to.have.header("Content-Type");
    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
});

// 4. Kiểm tra cấu trúc phản hồi khớp với thông tin đã gửi đi
pm.test("Response matches EmergencyContactResponse schema and payload", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.message).to.equal("Emergency contact added");
    
    var data = response.data;
    var requestBody = JSON.parse(pm.request.body.raw);
    
    pm.expect(data).to.be.an("object");
    pm.expect(data.id).to.be.a("number");
    pm.expect(data.contactName).to.equal(requestBody.contactName);
    pm.expect(data.relationship).to.equal(requestBody.relationship);
    pm.expect(data.phone).to.equal(requestBody.phone);
    pm.expect(data.isPrimary).to.equal(requestBody.isPrimary);
});
```

---

### 2.2. API 2: `PUT /api/v1/patient/profile/emergency-contacts/{id}` (Update Emergency Contact)
Đoạn mã kiểm thử viết trong tab **Tests** của Request:

```javascript
// 1. Kiểm tra mã trạng thái phản hồi là 200 OK
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});

// 2. Kiểm tra thời gian phản hồi hợp lý
pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

// 3. Kiểm tra tiêu đề Content-Type là application/json
pm.test("Content-Type is application/json", function () {
    pm.response.to.have.header("Content-Type");
    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
});

// 4. Kiểm tra cấu trúc phản hồi khớp với thông tin đã cập nhật
pm.test("Response matches EmergencyContactResponse schema and payload", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.message).to.equal("Emergency contact updated");
    
    var data = response.data;
    var requestBody = JSON.parse(pm.request.body.raw);
    
    pm.expect(data).to.be.an("object");
    pm.expect(data.id).to.be.a("number");
    pm.expect(data.contactName).to.equal(requestBody.contactName);
    pm.expect(data.relationship).to.equal(requestBody.relationship);
    pm.expect(data.phone).to.equal(requestBody.phone);
    pm.expect(data.isPrimary).to.equal(requestBody.isPrimary);
});
```

---

### 2.3. API 3: `GET /api/v1/patient/profile/download-report` (Download Health Report)
Đoạn mã kiểm thử viết trong tab **Tests** của Request:

```javascript
// 1. Kiểm tra mã trạng thái phản hồi là 200 OK
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});

// 2. Kiểm tra thời gian phản hồi hợp lý
pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

// 3. Kiểm tra tiêu đề Content-Type là text/plain (định dạng tệp văn bản)
pm.test("Content-Type is text/plain", function () {
    pm.response.to.have.header("Content-Type");
    pm.expect(pm.response.headers.get("Content-Type")).to.include("text/plain");
});

// 4. Kiểm tra tiêu đề Content-Disposition dùng để tải tệp đính kèm
pm.test("Content-Disposition header specifies health_report.txt attachment", function () {
    pm.response.to.have.header("Content-Disposition");
    pm.expect(pm.response.headers.get("Content-Disposition")).to.equal("attachment; filename=health_report.txt");
});

// 5. Kiểm tra dữ liệu phản hồi dạng chuỗi ký tự hợp lệ
pm.test("Response body contains plain text data", function () {
    var responseText = pm.response.text();
    pm.expect(responseText).to.be.a("string");
    pm.expect(responseText.length).to.be.above(0);
});
```

---

## 3. Các kịch bản kiểm thử lỗi & Bảo mật (Negative & Security Scenarios)

Do toàn bộ Controller này được bảo vệ bởi `@PreAuthorize("hasRole('PATIENT')")`, các kịch bản lỗi sau được thiết lập:

### 3.1. Lỗi chưa xác thực (401 Unauthorized)
* **Kịch bản:** Gửi request tới bất kỳ API nào trong 3 API trên mà không kèm Token JWT.
* **Đoạn mã test mong đợi:**
  ```javascript
  pm.test("Status code is 401 Unauthorized", function () {
      pm.response.to.have.status(401);
  });
  ```

### 3.2. Lỗi truy cập trái phép (403 Forbidden)
* **Kịch bản:** Gửi request sử dụng Token JWT hợp lệ của bác sĩ (`DOCTOR`) hoặc quản trị viên phòng khám (`CLINIC_MANAGER`).
* **Đoạn mã test mong đợi:**
  ```javascript
  pm.test("Status code is 403 Forbidden", function () {
      pm.response.to.have.status(403);
  });
  ```

### 3.3. Lỗi dữ liệu đầu vào (400 Bad Request) - Dành riêng cho API liên hệ khẩn cấp (POST và PUT)
* **Kịch bản:**
  1. Gửi request thiếu trường bắt buộc `@NotBlank` (`contactName`, `relationship`, `phone`).
  2. Số điện thoại sai biểu thức regex `^[+\d\s.-]{10,20}$`.
* **Đoạn mã test mong đợi:**
  ```javascript
  pm.test("Status code is 400 Bad Request", function () {
      pm.response.to.have.status(400);
  });
  ```

---

## 4. Kết luận
* Các kịch bản kiểm thử trên cung cấp sự bao phủ toàn diện cho chức năng quản lý Hồ sơ bệnh nhân và Liên hệ khẩn cấp.
* Đáp ứng đầy đủ các tiêu chí nghiệm thu của ticket **KCPM-796** về kiểm tra mã trạng thái, kiểm tra dữ liệu phản hồi, kiểm tra định dạng và các trường hợp lỗi bảo mật.
