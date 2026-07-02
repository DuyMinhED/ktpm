# ĐẶC TẢ CẤU HÌNH MÔI TRƯỜNG VÀ KỊCH BẢN LƯU JWT TRONG POSTMAN

**Mã Ticket Jira:** KCPM-770  
**Người thực hiện (Assignee):** Nguyễn Phạm Hùng (hungnp1272)  
**Email:** hungnp1272@ut.edu.vn  
**Mục tiêu:** Cấu hình tệp môi trường Postman (Environment) và cập nhật kịch bản kiểm thử sau khi đăng nhập (Tests Script) để lưu trữ động Token JWT vào môi trường, phục vụ cho các luồng gọi API tiếp theo.

---

## 1. TỆP MÔI TRƯỜNG POSTMAN (ENVIRONMENT JSON)

Tệp cấu hình môi trường được tạo tại: [postman/DamDiep_Healthcare_API.postman_environment.json](file:///d:/UTH/KTPM/ktpm/postman/DamDiep_Healthcare_API.postman_environment.json).

### Các biến môi trường được cấu hình:

| Khóa (Key) | Giá trị khởi tạo (Initial Value) | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- | :--- |
| `baseUrl` | `http://localhost:8080` | `default` | Địa chỉ gốc của máy chủ API Backend. |
| `token` | `""` (Rỗng) | `secret` | Token xác thực JWT hiện tại đang sử dụng. |
| `adminToken` | `""` (Rỗng) | `secret` | Token xác thực JWT của Quản trị viên (ADMIN). |
| `clinicManagerToken` | `""` (Rỗng) | `secret` | Token xác thực JWT của Quản lý phòng khám. |
| `doctorToken` | `""` (Rỗng) | `secret` | Token xác thực JWT của Bác sĩ. |
| `patientToken` | `""` (Rỗng) | `secret` | Token xác thực JWT của Bệnh nhân. |
| `clinicId` | `1` | `default` | ID phòng khám mặc định cho các nghiệp vụ kiểm thử. |

---

## 2. KỊCH BẢN LƯU TRỮ JWT SAU KHI ĐĂNG NHẬP (JWT-SAVING SCRIPT)

Trong Postman Collection ([postman/DamDiep_Healthcare_API.postman_collection.json](file:///d:/UTH/KTPM/ktpm/postman/DamDiep_Healthcare_API.postman_collection.json)), các kịch bản kiểm thử (Tests) trên các API Login đã được cập nhật từ việc lưu biến cục bộ (Collection Variables) sang lưu biến môi trường toàn cục (Environment Variables).

### 2.1. Kịch bản lưu Token của Admin (`Login - Admin`)
```javascript
pm.test("Admin login returns success or auth error", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 401, 403]);
});

pm.test("Admin login response time is less than 3000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(3000);
});

if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    var token = jsonData.token || jsonData.accessToken || (jsonData.data && (jsonData.data.token || jsonData.data.accessToken));
    pm.test("Admin login returns JWT token", function () {
        pm.expect(token).to.be.a("string").and.not.empty;
    });
    // Lưu Token vào biến môi trường (Environment)
    pm.environment.set("token", token);
    pm.environment.set("adminToken", token);
}
```

### 2.2. Kịch bản lưu Token của Bác sĩ (`Login - Doctor`)
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    var token = jsonData.token || jsonData.accessToken || (jsonData.data && (jsonData.data.token || jsonData.data.accessToken));
    pm.environment.set("token", token);
    pm.environment.set("doctorToken", token);
}
```

### 2.3. Kịch bản lưu Token của Bệnh nhân (`Login - Patient`)
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    var token = jsonData.token || jsonData.accessToken || (jsonData.data && (jsonData.data.token || jsonData.data.accessToken));
    pm.environment.set("token", token);
    pm.environment.set("patientToken", token);
}
```

---

## 3. KẾT LUẬN

*   Cấu hình môi trường này giúp việc tự động hóa chạy test bằng Newman (`newman run ... -e ...`) hoặc chạy thủ công trên giao diện Postman đạt hiệu suất cao, không bị ngắt quãng token.
*   Quy trình tự động hóa xác thực và lưu biến môi trường đảm bảo tính cô lập dữ liệu và không làm lộ thông tin nhạy cảm.
