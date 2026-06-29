# KẾ HOẠCH BẢN: QUẢN LÝ DỤNG CỤ TEST (TESTWARE), MÔI TRƯỜNG VÀ DỮ LIỆU KIỂM THỬ

**Mã Ticket Jira:** KCPM-806  
**Người thực hiện (Assignee):** Duy Hồ Văn  
**Mã số Sinh viên:** 089205001272  
**Đối tượng quản lý:** Danh sách dụng cụ kiểm thử (Testware), thông tin cấu hình môi trường, ma trận dữ liệu test (Test Data Matrix), và nơi lưu trữ kết quả kiểm thử (Evidence Storage).

---

## 1. Mục tiêu lập kế hoạch

1. Tổng hợp và chuẩn hóa toàn bộ các công cụ, kịch bản, và cấu hình phục vụ hoạt động kiểm thử của dự án Chronic Disease Management.
2. Đảm bảo cung cấp đầy đủ thông tin chi tiết để bất kỳ thành viên nào trong nhóm hoặc người chấm điểm cũng có thể tự chạy lại toàn bộ các bộ test (Backend, Frontend, Postman, E2E) thành công.
3. Quản lý phân loại dữ liệu thử nghiệm và đường dẫn lưu trữ các bằng chứng kiểm thử (Screenshots, Logs, Reports) đồng bộ trên Git.

---

## 2. Danh sách dụng cụ kiểm thử (Testware List)

| Phân nhóm | Dụng cụ / Công nghệ | Vai trò / Nhiệm vụ | Vị trí lưu trữ trong dự án |
| :--- | :--- | :--- | :--- |
| **Backend Testing** | JUnit 5 & Spring Boot Test | Thực hiện unit test và integration test cho các Controller, Service và Repository. | `backend/src/test/java/` |
| | Mockito | Mock các thành phần phụ thuộc (Dependencies) khi viết unit test độc lập. | Tích hợp trong Maven dependencies |
| **Frontend Testing** | CodeceptJS & Playwright | Chạy các kịch bản kiểm thử tự động giao diện End-to-End (E2E). | `frontend/e2e_tests/` |
| **API Testing** | Postman Collection | Định nghĩa danh sách các request gọi API để kiểm thử thủ công và tự động. | `DamDiep_Healthcare_API.postman_collection.json` |
| | Newman CLI | Công cụ chạy tự động Postman collection qua terminal hoặc CI/CD pipeline. | NPM global package |

---

## 3. Tóm tắt cấu hình môi trường (Configuration Summary)

### 3.1. Cấu hình Backend (Spring Boot)
* **Cổng chạy (Port):** `8080` (Mặc định: `http://localhost:8080`)
* **Cơ sở dữ liệu Test:** H2 Database (In-Memory) để tránh ghi đè dữ liệu thật trong lúc kiểm thử.
* **Cơ sở dữ liệu Phát triển:** MySQL (Cấu hình trong `application.properties`).
* **Đường dẫn Swagger UI (Tài liệu API):** `http://localhost:8080/swagger-ui/index.html`

### 3.2. Cấu hình Frontend (React / Vite)
* **Cổng chạy Dev Server:** `5173` (Mặc định: `http://localhost:5173`)
* **Môi trường Deploy chạy E2E:** `https://ktpm-ruby.vercel.app/`
* **Cấu hình CodeceptJS (`codecept.conf.js`):**
  * `helpers.Playwright.url`: Sử dụng biến môi trường `TEST_URL` hoặc mặc định chạy kiểm thử trực tiếp trên môi trường deploy ở trên.

---

## 4. Ma trận dữ liệu kiểm thử (Test Data Matrix)

Dữ liệu kiểm thử mặc định được khởi tạo tự động thông qua file `data.sql` (hoặc Liquibase) khi khởi động cơ sở dữ liệu test:

| Vai trò (Role) | Email đăng nhập | Mật khẩu | Quyền hạn tương ứng (Permissions) | Mục đích kiểm thử |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@care.com` | `admin123` | Toàn quyền hệ thống, quản lý bác sĩ, bệnh nhân, phòng khám. | Test đăng nhập, phân quyền admin, tạo mới tài khoản bác sĩ/bệnh nhân. |
| **DOCTOR** | `doctor@care.com` | `doctor123` | Xem danh sách bệnh nhân được chỉ định, tạo đơn thuốc. | Test luồng tạo đơn thuốc (`createPrescription`), xem dashboard bác sĩ. |
| **PATIENT** | `patient@care.com` | `patient123` | Xem đơn thuốc cá nhân, gửi yêu cầu tái cấp thuốc, cập nhật chỉ số sức khỏe. | Test luồng gửi yêu cầu tái cấp thuốc (`requestRefill`), log chỉ số sức khỏe. |
| **CLINIC_MANAGER** | `manager@care.com` | `manager123` | Quản lý thông tin và thống kê phòng khám được chỉ định. | Test luồng phân quyền phòng khám. |

---

## 5. Nơi lưu trữ bằng chứng kiểm thử (Evidence Storage Location)

* **Báo cáo E2E test (CodeceptJS):** Lưu tại thư mục `frontend/output/` (Gồm file báo cáo HTML, hình ảnh chụp màn hình khi xảy ra lỗi `failed_*.png`, và Playwright trace logs). Thư mục này được đưa vào `.gitignore` để tránh đẩy các file rác lên Git.
* **Báo cáo Unit/Integration test (Backend):** Lưu tại `backend/target/surefire-reports/` dưới dạng các file XML kết quả và txt logs của Maven Surefire.
* **Tài liệu đặc tả kịch bản test:** Lưu tại thư mục `test/` ở gốc dự án dưới dạng các file Markdown `.md` (được theo dõi phiên bản trên Git).

---

## 6. Hướng dẫn chạy lại các bộ kiểm thử (How to Rerun Tests)

### 6.1. Khởi chạy toàn bộ Unit / Integration Test của Backend:
Di chuyển vào thư mục `backend/` và chạy lệnh:
```bash
mvn clean test
```

### 6.2. Khởi chạy E2E Test của Frontend (Sử dụng CodeceptJS & Playwright):
1. Đảm bảo ứng dụng frontend đã được khởi chạy hoặc kết nối Internet đến môi trường deploy.
2. Di chuyển vào thư mục `frontend/` và chạy lệnh:
```bash
# Chạy ở chế độ giao diện trình duyệt (UI mode) để quan sát các bước
npx codeceptjs run --steps

# Chạy ở chế độ headless (chạy ngầm phục vụ CI/CD)
HEADLESS=true npx codeceptjs run --steps
```

### 6.3. Khởi chạy API Test tự động bằng Newman:
Chạy lệnh Newman trỏ tới file collection của dự án ở thư mục gốc:
```bash
newman run DamDiep_Healthcare_API.postman_collection.json
```
