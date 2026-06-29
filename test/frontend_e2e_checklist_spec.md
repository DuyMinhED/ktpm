# DANH SÁCH KIỂM TRA CHẠY THỬ VÀ LƯU BẰNG CHỨNG E2E (E2E EXECUTION AND EVIDENCE CHECKLIST)

**Mã Ticket Jira:** KCPM-820  
**Người thực hiện (Assignee):** hungnp1272  
**Mã số Sinh viên:** 089205001272  
**Công nghệ áp dụng:** CodeceptJS, Playwright  
**Phạm vi áp dụng:** Bộ kiểm thử tự động E2E của Frontend (`frontend/e2e_tests/`)  

---

## 1. Danh sách kiểm tra môi trường (Environment Checklist)

Trước khi thực hiện chạy các bài kiểm thử E2E, người kiểm thử cần đảm bảo các điều kiện tiên quyết sau:

- [ ] **Node.js**: Phiên bản Node.js tối thiểu là `18.x` trở lên (Khuyến nghị sử dụng phiên bản `22.x` tương thích với môi trường CI/CD).
  * *Lệnh kiểm tra:* `node -v`
- [ ] **Thư mục làm việc**: Mở terminal tại đúng thư mục `frontend/` của dự án (`d:/UTH/KTPM/ktpm/frontend`).
- [ ] **Cài đặt thư viện**: Thực hiện cài đặt đầy đủ các gói phụ thuộc (dependencies) cần thiết.
  * *Lệnh cài đặt:* `npm install` hoặc `npm ci`
- [ ] **Cài đặt Playwright Browser**: Đảm bảo các trình duyệt giả lập của Playwright đã được tải xuống đầy đủ (mặc định là Chromium).
  * *Lệnh cài đặt:* `npx playwright install` hoặc `npx playwright install chromium`
- [ ] **Địa chỉ URL kiểm thử (TEST_URL)**: Xác định địa chỉ mà bộ E2E sẽ trỏ tới để chạy test.
  * *Môi trường mặc định (Deploy Vercel):* `https://ktpm-ruby.vercel.app/`
  * *Môi trường Local:* `http://localhost:5173` (Cần khởi chạy dev server frontend bằng lệnh `npm run dev` trước).

---

## 2. Chuẩn bị dữ liệu kiểm thử (Data Setup)

Đảm bảo cơ sở dữ liệu (Database) của môi trường test chứa thông tin đăng nhập mẫu dưới đây để các kịch bản đăng nhập E2E hoạt động chính xác:

| STT | Tài khoản (Email) | Mật khẩu (Password) | Vai trò (Role) | Chức năng kiểm thử liên quan |
| :---: | :--- | :--- | :--- | :--- |
| **1** | `admin@care.com` | `admin123` | **ADMIN** | Test login/logout, route guard, điều hướng quản trị, thêm/sửa/xóa hồ sơ bệnh nhân. |
| **2** | `doctor@care.com` | `doctor123` | **DOCTOR** | Test phân quyền bác sĩ, xem danh sách chỉ định. |
| **3** | `patient@care.com` | `patient123` | **PATIENT** | Test phân quyền bệnh nhân, cập nhật chỉ số sức khỏe. |

---

## 3. Các lệnh thực thi kiểm thử (Run Commands)

Di chuyển vào thư mục `frontend/` trước khi thực thi các lệnh sau:

### 3.1. Chạy hiển thị giao diện trình duyệt (UI Mode - Dành cho kiểm thử thủ công/Local)
Chạy kiểm thử và hiển thị trình duyệt Chromium để người kiểm thử quan sát trực quan các thao tác click chuột, nhập liệu:
```bash
npx codeceptjs run --steps
```

### 3.2. Chạy ẩn trình duyệt (Headless Mode - Dành cho CI/CD hoặc chạy ngầm)
Chạy kiểm thử không mở giao diện đồ họa của trình duyệt để tối ưu tài nguyên và tốc độ:
```bash
# Trên Windows PowerShell
$env:HEADLESS="true"; npx codeceptjs run --steps

# Trên Windows CMD
set HEADLESS=true && npx codeceptjs run --steps

# Trên Linux/macOS
HEADLESS=true npx codeceptjs run --steps
```

### 3.3. Thay đổi URL đích kiểm thử (TEST_URL)
Chạy bộ test trỏ vào môi trường local thay vì web deploy chính thức:
```bash
# Trên Windows PowerShell
$env:TEST_URL="http://localhost:5173"; npx codeceptjs run --steps

# Trên Windows CMD
set TEST_URL=http://localhost:5173 && npx codeceptjs run --steps
```

---

## 4. Thu thập và lưu trữ bằng chứng kiểm thử (Evidence Checklist)

Sau khi bộ kiểm thử chạy xong, người kiểm thử phải thu thập bằng chứng tại các đường dẫn quy định sau:

- [ ] **Báo cáo log ở Terminal (Log Evidence)**:
  * *Nội dung:* Copy toàn bộ output xuất hiện trên console từ lúc chạy lệnh cho đến khi kết thúc (hiển thị dòng `OK  | 3 passed` hoặc lỗi tương ứng).
- [ ] **Hình ảnh chụp màn hình khi xảy ra lỗi (Screenshots Evidence)**:
  * *Đường dẫn lưu:* `frontend/output/`
  * *Tên tệp tin:* CodeceptJS tự động chụp màn hình giao diện Web tại đúng thời điểm phát sinh lỗi và lưu lại thành các tệp tin dạng `failed_*.png`.
- [ ] **Nơi lưu trữ trên Repository (Git)**:
  * Các tài liệu đặc tả và biên bản kết quả kiểm thử được lưu trữ tại thư mục `/test/` ở gốc dự án.
  * Thư mục chứa bằng chứng tạm thời `frontend/output/` đã được loại trừ khỏi Git trong `.gitignore` để tránh gây nặng repository.

---

## 5. Hướng dẫn khắc phục sự cố (Troubleshooting Guide)

Dưới đây là các lỗi thường gặp khi chạy E2E và cách khắc phục:

| STT | Triệu chứng lỗi (Symptom) | Nguyên nhân (Possible Cause) | Cách khắc phục (Resolution) |
| :---: | :--- | :--- | :--- |
| **1** | Lỗi: `Playwright is not installed` hoặc không tìm thấy Chromium | Chưa cài đặt môi trường giả lập trình duyệt của Playwright. | Chạy lệnh `npx playwright install` hoặc `npx playwright install chromium` trong thư mục `frontend/`. |
| **2** | Lỗi: `Connection refused` hoặc dừng lâu ở màn hình trắng | URL đích của môi trường kiểm thử (`TEST_URL`) không hoạt động hoặc dev server chưa bật. | 1. Kiểm tra kết nối internet của máy tính.<br>2. Nếu test local, đảm bảo đã chạy lệnh `npm run dev` ở frontend.<br>3. Kiểm tra lại chính xác địa chỉ cấu hình trong `codecept.conf.js`. |
| **3** | Lỗi: `Đăng nhập thất bại` hoặc không vượt qua trang Auth | Dữ liệu tài khoản mẫu trên DB bị xóa hoặc thay đổi mật khẩu khác mật khẩu test. | 1. Kiểm tra lại DB xem email `admin@care.com` đã tồn tại chưa.<br>2. Cập nhật mật khẩu trong `steps_file.js` hoặc file test tương ứng trùng khớp với DB hiện tại. |
| **4** | Lỗi: `Timeout 5000ms exceeded` khi đợi phần tử hiển thị | Giao diện web phản hồi chậm hoặc Locator (CSS/XPath) của phần tử bị thay đổi do cập nhật code. | 1. Kiểm tra lại hiệu năng mạng/API.<br>2. Kiểm tra xem phần tử CSS Selector đó còn tồn tại trên giao diện thật không và cập nhật lại trong mã nguồn test. |
