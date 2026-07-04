# BÁO CÁO: THIẾT KẾ KỊCH BẢN KIỂM THỬ E2E CHO FRONTEND (E2E SCENARIOS DESIGN)

**Mã Ticket Jira:** KCPM-811  
**Người thực hiện (Assignee):** Duy Hồ Văn  
**Mã số Sinh viên:** 054205001151  
**Công cụ kiểm thử áp dụng:** CodeceptJS, Playwright  
**Phạm vi thiết kế:** Login, Đăng xuất, Route Guard, Navigation, các chức năng CRUD (Create, Read, Update, Delete, Search, Filter) và thông báo lỗi trên giao diện.

---

## 1. Mục tiêu thiết kế

1. Định nghĩa chi tiết các kịch bản kiểm thử E2E (End-to-End) mô phỏng trải nghiệm người dùng thực tế trên hệ thống Chronic Disease Management.
2. Thiết kế chi tiết cho từng kịch bản bao gồm: Tiền điều kiện (Preconditions), Các bước thực hiện (Steps), Kết quả mong đợi (Expected UI Results), và Dữ liệu kiểm thử (Test Data).
3. Đảm bảo bao phủ toàn bộ các luồng nghiệp vụ cốt lõi: Xác thực, Phân quyền tuyến đường, Điều hướng trang và các tác vụ CRUD trên danh sách quản trị.

---

## 2. Bảng kịch bản kiểm thử E2E chi tiết (E2E Scenario Table)

| STT | Tên Kịch bản (Scenario) | Tiền điều kiện (Precondition) | Các bước thực hiện (Steps) | Kết quả mong đợi trên giao diện (Expected UI Result) | Dữ liệu kiểm thử (Test Data) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Login Success**<br>(Đăng nhập thành công) | Trình duyệt đang ở trang chủ, người dùng chưa đăng nhập. | 1. Nhấn nút "Đăng nhập" trên thanh điều hướng.<br>2. Nhập Email hợp lệ.<br>3. Nhập Mật khẩu hợp lệ.<br>4. Nhấn nút "Đăng nhập" trong modal. | 1. Modal đăng nhập đóng lại.<br>2. Giao diện chuyển hướng sang URL `/admin` hoặc `/doctor` tùy theo quyền.<br>3. Hiển thị thông tin chào mừng người dùng (ví dụ: "Chào mừng, Admin!"). | **Email:** `admin@care.com`<br>**Password:** `admin123` |
| **2** | **Login Failed**<br>(Đăng nhập thất bại - Sai thông tin) | Trình duyệt đang hiển thị Modal Đăng nhập. | 1. Nhập Email chưa đăng ký hoặc sai mật khẩu.<br>2. Nhấn nút "Đăng nhập". | 1. Modal đăng nhập vẫn hiển thị.<br>2. Xuất hiện thông báo lỗi màu đỏ: `"Đăng nhập thất bại"`, `"Tài khoản hoặc mật khẩu không chính xác"`. | **Email:** `admin@care.com`<br>**Password:** `sai_mat_khau` |
| **3** | **Logout**<br>(Đăng xuất hệ thống) | Người dùng đã đăng nhập thành công và đang ở trang quản trị `/admin`. | 1. Click vào avatar/profile ở góc trên bên phải.<br>2. Chọn nút "Đăng xuất" (Logout). | 1. Xóa JWT Token khỏi LocalStorage/SessionStorage.<br>2. Trình duyệt tự động chuyển hướng về trang chủ `/`.<br>3. Thanh điều hướng hiển thị lại nút "Đăng nhập" thay vì thông tin profile. | N/A |
| **4** | **Route Guard Protection**<br>(Bảo vệ tuyến đường bảo mật) | Người dùng chưa đăng nhập hệ thống (chưa có token). | 1. Nhập trực tiếp URL trang bảo mật `/admin` lên thanh địa chỉ trình duyệt.<br>2. Nhấn Enter để truy cập. | 1. Hệ thống không hiển thị nội dung trang Dashboard.<br>2. Trình duyệt tự động chuyển hướng (Redirect) về trang đăng nhập `/login` hoặc hiển thị modal yêu cầu đăng nhập. | **URL:** `https://ktpm-ruby.vercel.app/admin` |
| **5** | **Navigation**<br>(Điều hướng trang quản trị) | Người dùng đăng nhập với quyền `ADMIN` và đang ở trang `/admin`. | 1. Nhấp chọn "Quản lý Bác sĩ" trên Sidebar.<br>2. Nhấp chọn "Quản lý Bệnh nhân".<br>3. Nhấp chọn "Quản lý Phòng khám". | 1. Giao diện thay đổi nội dung tương ứng theo từng trang đã chọn mà không bị tải lại toàn bộ trang.<br>2. Thanh địa chỉ URL thay đổi tương ứng: `/admin/doctors`, `/admin/patients`, `/admin/clinics`. | N/A |
| **6** | **CRUD - Create Patient**<br>(Tạo mới hồ sơ bệnh nhân) | Người dùng đăng nhập với quyền quản trị viên, đang ở trang `/admin/patients`. | 1. Nhấn nút "Thêm bệnh nhân".<br>2. Nhập đầy đủ thông tin: Họ tên, Tuổi, Điện thoại, Email, Mật khẩu, Chỉ định bác sĩ.<br>3. Nhấn "Xác nhận tạo". | 1. Modal tạo bệnh nhân đóng lại.<br>2. Hiển thị thông báo Toast: `"Tạo bệnh nhân thành công"`.<br>3. Bệnh nhân mới xuất hiện ở vị trí đầu tiên trong danh sách. | **Name:** `Nguyễn Văn A`<br>**Age:** `45`<br>**Phone:** `0912345678`<br>**Email:** `bnhanhA@care.com`<br>**Password:** `123456` |
| **7** | **CRUD - Search & Filter**<br>(Tìm kiếm & Lọc danh sách) | Đang ở danh sách bệnh nhân `/admin/patients`, có sẵn dữ liệu mẫu. | 1. Nhập từ khóa tìm kiếm vào ô input.<br>2. Click chọn Bộ lọc bệnh lý (ví dụ: "Tiểu đường"). | 1. Danh sách tự động tải lại chỉ hiển thị các bệnh nhân thỏa mãn đồng thời cả từ khóa tìm kiếm và bộ lọc bệnh lý.<br>2. Trạng thái số lượng kết quả hiển thị được cập nhật chính xác. | **Search Term:** `Nguyễn Văn`<br>**Disease Filter:** `Tiểu đường` |
| **8** | **CRUD - Update Patient**<br>(Cập nhật thông tin bệnh nhân) | Đang ở danh sách bệnh nhân `/admin/patients`. | 1. Click vào biểu tượng "Sửa" ở dòng bệnh nhân cần cập nhật.<br>2. Thay đổi số điện thoại và địa chỉ.<br>3. Nhấn "Lưu thay đổi". | 1. Modal đóng lại.<br>2. Hiển thị thông báo: `"Cập nhật thông tin thành công"`.<br>3. Thông tin hiển thị của bệnh nhân đó trên danh sách thay đổi sang giá trị mới. | **New Phone:** `0988776655`<br>**New Diagnosis:** `Cao huyết áp` |
| **9** | **CRUD - Delete / Cancel**<br>(Xóa hồ sơ bệnh nhân) | Đang ở danh sách bệnh nhân `/admin/patients`. | 1. Click vào biểu tượng "Xóa" ở dòng bệnh nhân muốn xóa.<br>2. Click nút "Xác nhận xóa" trên hộp thoại cảnh báo. | 1. Hộp thoại cảnh báo biến mất.<br>2. Bản ghi bệnh nhân bị ẩn/xóa khỏi bảng danh sách hiển thị.<br>3. Hiển thị thông báo Toast báo xóa thành công. | **Target Patient:** `Nguyễn Văn A` |

---

## 3. Kết luận
* Toàn bộ 9 kịch bản E2E đã bao phủ đầy đủ các chức năng yêu cầu của ticket **KCPM-811**.
* Thiết kế này định hình rõ ràng các bước tương tác giao diện và dữ liệu mẫu cần thiết, làm tiền đề để hiện thực hóa các kịch bản test tự động bằng Playwright/CodeceptJS trong tương lai.
