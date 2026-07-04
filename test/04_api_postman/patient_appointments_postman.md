# BÁO CÁO: KỊCH BẢN POSTMAN CHO LỊCH HẸN BỆNH NHÂN (PATIENT APPOINTMENTS ENDPOINTS)

**Mã Ticket Jira:** KCPM-791  
**Người thực hiện (Assignee):** Duy Hồ Văn  
**Mã số Sinh viên:** 054205001151  
**Phạm vi kịch bản:** 4 API đặt lịch và quản lý lịch hẹn khám thuộc `PatientAppointmentController.java`:
1. `GET /api/v1/patient/appointments/doctors` (Lấy danh sách bác sĩ rảnh)
2. `POST /api/v1/patient/appointments` (Đặt lịch hẹn mới)
3. `PUT /api/v1/patient/appointments/{id}/cancel` (Hủy lịch hẹn)
4. `PUT /api/v1/patient/appointments/{id}/reminder` (Bật/tắt nhắc nhở lịch hẹn)

---

## 1. Mục tiêu kiểm thử

1. Xây dựng kịch bản kiểm thử tự động toàn diện bằng mã `pm.test()` trong Postman cho 4 API quản lý lịch hẹn của Bệnh nhân.
2. Kiểm tra tính chính xác của phản hồi từ API theo mô hình `ApiResponse<T>` chuẩn hóa của dự án:
   * Trạng thái phản hồi (Status Code: 200 OK hoặc 201 Created).
   * Thời gian phản hồi nhanh (Response time < 500ms).
   * Định dạng dữ liệu (JSON Content-Type).
   * Khớp cấu trúc lược đồ (Schema Validation) của danh sách `DoctorSimpleResponse`, đối tượng `PatientAppointmentResponse` và trường hợp trả về `null`.
3. Kiểm thử biên và bảo mật: Kiểm tra lỗi xác thực (401), lỗi không đủ quyền (403 - ví dụ tài khoản bác sĩ truy cập), và lỗi truyền dữ liệu không hợp lệ (400 Bad Request).

---

## 2. Kịch bản kiểm thử tự động chi tiết (Postman Test Scripts)

### 2.1. API 1: `GET /api/v1/patient/appointments/doctors` (Get Available Doctors)
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

// 4. Kiểm tra danh sách bác sĩ phản hồi hợp lệ (Schema Validation)
pm.test("Response contains list of available doctors with valid schema", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.message).to.equal("Doctors retrieved");
    
    var data = response.data;
    pm.expect(data).to.be.an("array");
    if (data.length > 0) {
        var doctor = data[0];
        pm.expect(doctor.id).to.be.a("number");
        pm.expect(doctor.name).to.be.a("string");
        pm.expect(doctor.specialty).to.be.a("string");
    }
});
```

---

### 2.2. API 2: `POST /api/v1/patient/appointments` (Book Appointment)
Đoạn mã kiểm thử viết trong tab **Tests** của Request:

```javascript
// 1. Kiểm tra mã trạng thái phản hồi là 201 Created
pm.test("Status code is 201 Created", function () {
    pm.response.to.have.status(201);
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

// 4. Kiểm tra lịch hẹn được tạo thành công khớp thông tin yêu cầu
pm.test("Response matches PatientAppointmentResponse schema and payload", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.message).to.equal("Appointment created successfully");
    
    var data = response.data;
    var requestBody = JSON.parse(pm.request.body.raw);
    
    pm.expect(data).to.be.an("object");
    pm.expect(data.id).to.be.a("number");
    pm.expect(data.appointmentType).to.equal(requestBody.appointmentType);
    pm.expect(data.status).to.be.a("string");
});
```

---

### 2.3. API 3: `PUT /api/v1/patient/appointments/{id}/cancel` (Cancel Appointment)
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

// 4. Kiểm tra cấu trúc ApiResponse
pm.test("Response indicates appointment cancellation success", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.message).to.equal("Appointment cancelled successfully");
    pm.expect(response.data).to.be.null;
});
```

---

### 2.4. API 4: `PUT /api/v1/patient/appointments/{id}/reminder` (Toggle Reminder)
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

// 4. Kiểm tra cấu trúc ApiResponse
pm.test("Response indicates reminder toggle success", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.message).to.equal("Reminder status toggled successfully");
    pm.expect(response.data).to.be.null;
});
```

---

## 3. Các kịch bản kiểm thử lỗi & Bảo mật (Negative & Security Scenarios)

Do toàn bộ Controller này được bảo vệ bởi `@PreAuthorize("hasRole('PATIENT')")`, các kịch bản lỗi sau được thiết lập:

### 3.1. Lỗi chưa xác thực (401 Unauthorized)
* **Kịch bản:** Gửi request tới bất kỳ API nào trong 4 API trên mà không kèm Token JWT.
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

### 3.3. Lỗi dữ liệu đầu vào (400 Bad Request) - Dành riêng cho API tạo mới lịch hẹn (POST)
* **Kịch bản:** Gửi dữ liệu đặt lịch thiếu trường bắt buộc `@NotNull` hoặc `@NotBlank` như `doctorId`, `appointmentTime` hoặc `appointmentType`.
* **Đoạn mã test mong đợi:**
  ```javascript
  pm.test("Status code is 400 Bad Request", function () {
      pm.response.to.have.status(400);
  });
  ```

---

## 4. Kết luận
* Các kịch bản kiểm thử trên cung cấp sự bao phủ toàn diện cho chức năng quản lý lịch hẹn của Bệnh nhân.
* Đáp ứng đầy đủ các tiêu chí nghiệm thu của ticket **KCPM-791** về kiểm tra mã trạng thái, kiểm tra dữ liệu phản hồi, kiểm tra định dạng và các trường hợp lỗi bảo mật.
