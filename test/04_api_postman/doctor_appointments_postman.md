# BÁO CÁO: KỊCH BẢN POSTMAN CHO LỊCH HẸN BÁC SĨ (DOCTOR APPOINTMENTS ENDPOINTS)

**Mã Ticket Jira:** KCPM-786  
**Người thực hiện (Assignee):** Duy Hồ Văn  
**Mã số Sinh viên:** 054205001151  
**Phạm vi kịch bản:** 4 API quản lý lịch hẹn khám thuộc `DoctorAppointmentController.java`:
1. `POST /api/v1/doctor/appointments` (Tạo lịch hẹn mới)
2. `PUT /api/v1/doctor/appointments/{id}/status` (Cập nhật trạng thái lịch hẹn)
3. `PUT /api/v1/doctor/appointments/{id}/reschedule` (Thay đổi ngày hẹn đơn lẻ)
4. `PUT /api/v1/doctor/appointments/batch-reschedule` (Thay đổi ngày hẹn hàng loạt)

---

## 1. Mục tiêu kiểm thử

1. Xây dựng kịch bản kiểm thử tự động toàn diện bằng mã `pm.test()` trong Postman cho 4 API quản lý lịch hẹn của Bác sĩ.
2. Kiểm tra tính chính xác của phản hồi từ API theo mô hình `ApiResponse<T>` chuẩn hóa của dự án:
   * Trạng thái phản hồi (Status Code: 200 OK).
   * Thời gian phản hồi nhanh (Response time < 500ms).
   * Định dạng dữ liệu (JSON Content-Type).
   * Khớp cấu trúc lược đồ (Schema Validation) của đối tượng `DoctorAppointmentResponse` và dữ liệu đếm số lượng dời hẹn thành công (`movedCount`).
3. Kiểm thử biên và bảo mật: Kiểm tra lỗi xác thực (401), lỗi không đủ quyền (403 - ví dụ tài khoản bệnh nhân truy cập), và lỗi truyền dữ liệu không hợp lệ (400 Bad Request).

---

## 2. Kịch bản kiểm thử tự động chi tiết (Postman Test Scripts)

### 2.1. API 1: `POST /api/v1/doctor/appointments` (Create Appointment)
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

// 4. Kiểm tra cấu trúc ApiResponse và tính chính xác của dữ liệu phản hồi
pm.test("Response matches DoctorAppointmentResponse schema and payload", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.message).to.equal("Appointment created successfully");
    
    var data = response.data;
    var requestBody = JSON.parse(pm.request.body.raw);
    
    pm.expect(data).to.be.an("object");
    pm.expect(data.id).to.be.a("number");
    pm.expect(data.patientId).to.equal(requestBody.patientId);
    pm.expect(data.appointmentType).to.equal(requestBody.type);
    pm.expect(data.status).to.be.a("string");
});
```

---

### 2.2. API 2: `PUT /api/v1/doctor/appointments/{id}/status` (Update Appointment Status)
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

// 4. Kiểm tra trạng thái và chẩn đoán đã cập nhật
pm.test("Response shows updated status and diagnosis", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.message).to.equal("Status updated");
    
    var data = response.data;
    pm.expect(data.status).to.equal("COMPLETED");
    pm.expect(data.diagnosisSummary).to.equal("Stable");
});
```

---

### 2.3. API 3: `PUT /api/v1/doctor/appointments/{id}/reschedule` (Reschedule Appointment)
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

// 4. Kiểm tra lịch hẹn dời thành công
pm.test("Response indicates reschedule success", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.message).to.equal("Lịch hẹn đã được dời thành công");
    
    var data = response.data;
    pm.expect(data).to.be.an("object");
    pm.expect(data.id).to.be.a("number");
});
```

---

### 2.4. API 4: `PUT /api/v1/doctor/appointments/batch-reschedule` (Batch Reschedule)
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

// 4. Kiểm tra số lượng lịch hẹn đã dời
pm.test("Response shows movedCount field in data", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.message).to.include("Đã dời");
    
    var data = response.data;
    pm.expect(data).to.be.an("object");
    pm.expect(data.movedCount).to.be.a("number");
});
```

---

## 3. Các kịch bản kiểm thử lỗi & Bảo mật (Negative & Security Scenarios)

Do toàn bộ Controller này được bảo vệ bởi `@PreAuthorize("hasRole('DOCTOR')")`, các kịch bản lỗi sau được thiết lập:

### 3.1. Lỗi chưa xác thực (401 Unauthorized)
* **Kịch bản:** Gửi request tới bất kỳ API nào trong 4 API trên mà không kèm Token JWT.
* **Đoạn mã test mong đợi:**
  ```javascript
  pm.test("Status code is 401 Unauthorized", function () {
      pm.response.to.have.status(401);
  });
  ```

### 3.2. Lỗi truy cập trái phép (403 Forbidden)
* **Kịch bản:** Gửi request sử dụng Token JWT hợp lệ của bệnh nhân (`PATIENT`) hoặc quản trị viên phòng khám (`CLINIC_MANAGER`).
* **Đoạn mã test mong đợi:**
  ```javascript
  pm.test("Status code is 403 Forbidden", function () {
      pm.response.to.have.status(403);
  });
  ```

### 3.3. Lỗi dữ liệu đầu vào (400 Bad Request) - Dành riêng cho API tạo mới (POST) và dời hẹn (PUT)
* **Kịch bản:** Gửi dữ liệu thiếu trường bắt buộc `@NotNull` hoặc `@NotBlank` như `patientId`, `appointmentDate` hoặc `appointmentTime`.
* **Đoạn mã test mong đợi:**
  ```javascript
  pm.test("Status code is 400 Bad Request", function () {
      pm.response.to.have.status(400);
  });
  ```

---

## 4. Kết luận
* Các kịch bản kiểm thử trên cung cấp sự bao phủ toàn diện cho chức năng quản lý lịch hẹn của Bác sĩ.
* Đáp ứng đầy đủ các tiêu chí nghiệm thu của ticket **KCPM-786** về kiểm tra mã trạng thái, kiểm tra dữ liệu phản hồi, kiểm tra định dạng và các trường hợp lỗi bảo mật.
