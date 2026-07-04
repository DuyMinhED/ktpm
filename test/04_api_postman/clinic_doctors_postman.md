# BÁO CÁO: KỊCH BẢN POSTMAN CHO QUẢN LÝ BÁC SĨ PHÒNG KHÁM (CLINIC DOCTORS ENDPOINTS)

**Mã Ticket Jira:** KCPM-781  
**Người thực hiện (Assignee):** Duy Hồ Văn  
**Mã số Sinh viên:** 054205001151  
**Phạm vi kịch bản:** 3 API quản lý Bác sĩ thuộc phòng khám tại `ClinicDashboardController.java`:
1. `POST /api/v1/clinics/{clinicId}/doctors` (Đăng ký bác sĩ mới)
2. `PUT /api/v1/clinics/{clinicId}/doctors/{doctorId}` (Cập nhật thông tin bác sĩ)
3. `DELETE /api/v1/clinics/{clinicId}/doctors/{doctorId}` (Xóa hồ sơ bác sĩ)

---

## 1. Mục tiêu kiểm thử

1. Xây dựng kịch bản kiểm thử tự động toàn diện bằng mã `pm.test()` trong Postman cho 3 API quản trị bác sĩ theo từng phòng khám.
2. Kiểm tra tính chính xác của phản hồi từ API theo mô hình `ApiResponse<Void>` chuẩn hóa của dự án:
   * Trạng thái phản hồi (Status Code: 200 OK).
   * Thời gian phản hồi nhanh (Response time < 500ms).
   * Định dạng dữ liệu (JSON Content-Type).
   * Khớp thông điệp phản hồi thành công và trường `data` trả về `null`.
3. Kiểm thử biên và bảo mật: Kiểm tra lỗi xác thực (401), lỗi phân quyền chéo (403) và lỗi dữ liệu đầu vào (400 Bad Request).

---

## 2. Kịch bản kiểm thử tự động chi tiết (Postman Test Scripts)

### 2.1. API 1: `POST /api/v1/clinics/{clinicId}/doctors` (Create Doctor)
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
pm.test("Response indicates doctor creation success", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.message).to.equal("Doctor registered successfully");
    pm.expect(response.data).to.be.null;
});
```

---

### 2.2. API 2: `PUT /api/v1/clinics/{clinicId}/doctors/{doctorId}` (Update Doctor)
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
pm.test("Response indicates doctor update success", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.message).to.equal("Doctor updated successfully");
    pm.expect(response.data).to.be.null;
});
```

---

### 2.3. API 3: `DELETE /api/v1/clinics/{clinicId}/doctors/{doctorId}` (Delete Doctor)
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
pm.test("Response indicates doctor deletion success", function () {
    var response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.expect(response.message).to.equal("Doctor deleted successfully");
    pm.expect(response.data).to.be.null;
});
```

---

## 3. Các kịch bản kiểm thử lỗi & Bảo mật (Negative & Security Scenarios)

Các endpoint này được bảo vệ bởi phân quyền: `@PreAuthorize("hasAnyRole('CLINIC_MANAGER', 'ADMIN') and @securityService.isClinicManagerOf(#clinicId)")`.

### 3.1. Lỗi chưa xác thực (401 Unauthorized)
* **Kịch bản:** Không gửi kèm JWT token khi gọi các API trên.
* **Đoạn mã test mong đợi:**
  ```javascript
  pm.test("Status code is 401 Unauthorized", function () {
      pm.response.to.have.status(401);
  });
  ```

### 3.2. Lỗi truy cập trái phép hoặc sai phòng khám (403 Forbidden)
* **Kịch bản:** 
  1. Gửi request bằng token của bệnh nhân (`PATIENT`).
  2. Gửi request bằng token của một Trưởng phòng khám (`CLINIC_MANAGER`) nhưng thuộc phòng khám khác (không có quyền quản lý `clinicId` được truyền trên đường dẫn).
* **Đoạn mã test mong đợi:**
  ```javascript
  pm.test("Status code is 403 Forbidden", function () {
      pm.response.to.have.status(403);
  });
  ```

### 3.3. Lỗi dữ liệu đầu vào (400 Bad Request) - Dành cho POST và PUT
* **Kịch bản:** Gửi request body thiếu các trường `@NotBlank` bắt buộc hoặc email sai định dạng (ví dụ: thiếu tên, email không hợp lệ, thiếu số điện thoại/số giấy phép).
* **Đoạn mã test mong đợi:**
  ```javascript
  pm.test("Status code is 400 Bad Request", function () {
      pm.response.to.have.status(400);
  });
  ```

---

## 4. Kết luận
* Toàn bộ các API quản lý bác sĩ theo phòng khám đã được cấu hình bộ kiểm thử tự động toàn diện.
* Đạt tiêu chí nghiệm thu của ticket **KCPM-781** đối với các API liên quan.
