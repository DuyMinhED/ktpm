# BÁO CÁO: ĐÁNH GIÁ MÃ NGUỒN TĨNH FRONTEND (FRONTEND STATIC CODE REVIEW REPORT)

**Mã Ticket Jira:** KCPM-815  
**Người thực hiện (Assignee):** hungnp1272  
**Mục tiêu:** Thực hiện đánh giá mã nguồn tĩnh (Static Code Review) đối với giao diện người dùng (Frontend), tập trung vào:
1. Xác thực biểu mẫu và đầu vào dữ liệu (Form & Field Validations).
2. Kiểm tra bộ bảo vệ đường dẫn (Route Guards / RBAC).
3. Đánh giá giao diện thông báo lỗi (Toast & Alert Notifications).
4. Phân tích các rủi ro UI/UX và logic bảo mật trên Client-side.

---

## 1. PHÂN TÍCH XÁC THỰC BIỂU MẪU & ĐẦU VÀO (FORM & FIELD VALIDATION ANALYSIS)

Dưới đây là bảng chi tiết các quy tắc kiểm tra dữ liệu đầu vào, thông báo lỗi tương ứng và trạng thái nút gửi của các biểu mẫu cốt lõi trong hệ thống:

| Biểu mẫu (Component / File) | Trường dữ liệu | Thuộc tính / Ràng buộc (Constraint) | Thông báo lỗi hiển thị (Error Message) | Trạng thái Nút Submit (Disabled State) |
| :--- | :--- | :--- | :--- | :--- |
| **LoginModal** (`LoginModal.tsx`) | `email` | Không được để trống. | `Vui lòng nhập đầy đủ email và mật khẩu` | `disabled` khi `isLoading` là `true`. |
| | `password` | Không được để trống. | `Vui lòng nhập đầy đủ email và mật khẩu` | |
| **AddAppointmentModal** (`AddAppointmentModal.tsx`) | `appointmentType` | Mặc định là `direct` (Khám trực tiếp) hoặc `online`. | Không có | `disabled` khi `isSaving` hoặc chưa chọn `specialty` (bác sĩ). |
| | `specialty` | Bắt buộc chọn (ID của bác sĩ). | Không có | |
| | `reason` | Không bắt buộc, không kiểm tra độ dài. | Không có | |
| **EditProfileModal** (`EditProfileModal.tsx`) | Tất cả các trường | Không có xác thực ở phía Client-side. Gửi thẳng `formData` lên API. | Không có | `disabled` khi `loading` là `true`. |
| **AddHealthMetricModal** (`AddHealthMetricModal.tsx`) | `metricType` | Mặc định `BLOOD_PRESSURE`. | Không có | `disabled` khi `isSaving` là `true`. |
| | `value` | Bắt buộc nhập (thuộc tính `required` của HTML5). Định dạng chuỗi bất kỳ. | Lỗi mặc định của trình duyệt cho trường `required`. | |
| | `time` | Chuỗi tự do, định dạng placeholder `HH:mm`. | Không có | |
| **CreatePatientModal** (`CreatePatientModal.tsx`) | `name` | Không được trống sau khi `trim()`. | `Vui lòng nhập họ và tên bệnh nhân` | Không khóa cứng nút bằng `disabled`, kiểm tra thông qua hàm `validateForm()` khi click. |
| | `age` | Bắt buộc nhập, phải là số tự nhiên, giới hạn `[0 - 150]`. | `Vui lòng nhập tuổi` hoặc `Tuổi không hợp lệ (0-150)` | |
| | `phone` | Bắt buộc nhập, regex: `/^(0\|\+84)(\d{9})$/`. | `Vui lòng nhập số điện thoại` hoặc `Số điện thoại không hợp lệ (10 số)` | |
| | `email` | Bắt buộc nhập, regex: `/\S+@\S+\.\S+/`. | `Vui lòng nhập email đăng nhập` hoặc `Email không hợp lệ` | |
| | `identityCard` | Không bắt buộc. Nếu có nhập, phải là 12 chữ số `/^\d{12}$/`. | `Số CCCD phải bao gồm 12 chữ số` | |
| | `password` | Bắt buộc nhập, độ dài tối thiểu 6 ký tự. | `Vui lòng thiết lập mật khẩu` hoặc `Mật khẩu phải có ít nhất 6 ký tự` | |
| | `confirmPassword` | Phải trùng khớp với `password`. | `Mật khẩu xác nhận không khớp` | |
| | `condition` | Bắt buộc chọn. | `Vui lòng chọn nhóm bệnh` | |
| | `assignedDoctor` | Bắt buộc chọn. | `Vui lòng phân công bác sĩ` | |
| **CreateDoctorModal** (`CreateDoctorModal.tsx`) | `name` | Bắt buộc nhập, không được trống sau khi `trim()`. | `Vui lòng nhập họ tên bác sĩ` | Kiểm tra qua hàm `validateForm()` khi click nút Lưu. |
| | `email` | Bắt buộc nhập, regex: `/^\S+@\S+\.\S+/`. | `Vui lòng nhập email đăng nhập` hoặc `Email không hợp lệ` | |
| | `phone` | Bắt buộc nhập, regex: `/^(0\|\+84)(\d{9})$/`. | `Vui lòng nhập số điện thoại` hoặc `Số điện thoại không hợp lệ (10 số)` | |
| | `password` | Bắt buộc nhập, độ dài tối thiểu 6 ký tự. | `Vui lòng thiết lập mật khẩu` hoặc `Mật khẩu phải từ 6 ký tự` | |
| | `confirmPassword` | Phải trùng khớp với `password`. | `Mật khẩu xác nhận không trùng khớp` | |
| | `licenseNumber` | Bắt buộc nhập. | `Vui lòng nhập số CCHN` | |
| | `licenseImageUrl` | Bắt buộc phải tải ảnh lên Cloudinary trước. | `Vui lòng tải ảnh bằng chứng CCHN` | |
| **ChangePasswordModal** (`ChangePasswordModal.tsx`) | `currentPassword` | Bắt buộc nhập (HTML5 `required`). | Không có | `disabled` khi `isLoading` hoặc thiếu một trong các trường. |
| | `newPassword` | Bắt buộc nhập, độ dài tối thiểu 6 ký tự và khác `currentPassword`. | `Mật khẩu mới phải có ít nhất 6 ký tự` hoặc `Mật khẩu mới phải khác mật khẩu hiện tại` | |
| | `confirmPassword` | Phải trùng khớp với `newPassword`. | `Mật khẩu xác nhận không khớp` | |
| **ForgotPasswordModal** (`ForgotPasswordModal.tsx`) | `email` | Bắt buộc nhập, có chứa ký tự `@`. | `Vui lòng nhập địa chỉ email hợp lệ` | `disabled` khi `isLoading` hoặc chưa điền email. |

---

## 2. BỘ BẢO VỆ ĐƯỜNG DẪN & ĐIỀU HƯỚNG (ROUTE GUARDS & REDIRECTS)

Thành phần `ProtectedRoute` (`ProtectedRoute.tsx`) quản lý việc bảo vệ quyền truy cập tài nguyên phía Client-side:

### 2.1. Cơ chế hoạt động của `ProtectedRoute`
- **Xác thực Token:** Kiểm tra sự tồn tại của `token` trong `localStorage.getItem('token')`.
  - Nếu **Không có token (Chưa đăng nhập):** Chuyển hướng người dùng về trang chủ (`/`) bằng `<Navigate to="/" state={{ from: location }} replace />`.
- **Phân quyền dựa trên Vai trò (RBAC):**
  - Trích xuất vai trò từ `localStorage.getItem('userRole') || localStorage.getItem('role')`.
  - Chuẩn hóa vai trò bằng cách loại bỏ tiền tố `ROLE_` (ví dụ: `ROLE_ADMIN` -> `ADMIN`).
  - Nếu vai trò đã chuẩn hóa **không nằm trong danh sách `allowedRoles`**: Hệ thống sẽ tự động chuyển hướng người dùng đến phân hệ tương ứng với vai trò thực tế của họ dựa trên bản đồ chuyển hướng (`redirectMap`):
    - `ADMIN` -> Chuyển hướng đến `/admin`
    - `CLINIC_MANAGER` -> Chuyển hướng đến `/clinic`
    - `DOCTOR` -> Chuyển hướng đến `/doctor`
    - `PATIENT` -> Chuyển hướng đến `/patient`
    - Nếu không khớp vai trò nào, mặc định quay về trang chủ `/`.

### 2.2. Đánh giá rủi ro
- **Lưu trữ nhạy cảm:** Thông tin `token` và `role` được lưu trữ ở `localStorage`. Điều này có nguy cơ bị tấn công XSS nếu kẻ tấn công có thể thực thi mã JavaScript độc hại trên trang web.
- **Rủi ro rò rỉ hoặc sửa đổi Client-side:** Trình duyệt có thể bị can thiệp sửa đổi giá trị `role` trong `localStorage` để vượt qua các bộ kiểm tra Route ở Client. Tuy nhiên, điều này không gây nguy hiểm cho hệ thống nếu Backend thực thi phân quyền JWT (Stateful/Stateless) nghiêm ngặt ở mỗi API Endpoint (đã được cấu hình trong `SecurityConfig.java`).

---

## 3. HỆ THỐNG THÔNG BÁO LỖI & CẢNH BÁO (TOAST & ALERTS SYSTEM)

Hệ thống thông báo toàn cục được xây dựng dựa trên Context API và React Portal:

### 3.1. Cấu trúc và hành vi
- **Component cốt lõi:** `ToastContext.tsx` quản lý danh sách các thông báo đang hoạt động. `Toast.tsx` là component cũ đã bị đánh dấu `@deprecated` và chuyển tiếp cuộc gọi sang hook `useToast()`.
- **Portal rendering:** Giao diện thông báo (`ToastContainer`) được dựng thông qua một Portal ở vị trí cố định: `fixed top-6 right-6 z-[3000]`.
- **Loại thông báo (Toast Types):**
  - `success`: Nền xanh lục nhạt, icon `check_circle`, chữ xanh lục.
  - `error`: Nền đỏ nhạt, icon `error`, chữ đỏ.
  - `warning`: Nền vàng nhạt, icon `warning`, chữ vàng hổ phách.
- **Thời gian tồn tại:** Tự động đóng sau `4000ms` (`4 giây`). Mỗi thông báo đi kèm với một thanh tiến trình chạy từ phải sang trái chỉ thị thời gian tự hủy (`animation: toast-progress 4s linear forwards`).
- **Chống Spam (Duplicate Prevention):** Hệ thống có cơ chế kiểm tra trùng lặp thông báo trong khoảng thời gian `300ms`. Nếu có 2 cuộc gọi hiển thị thông báo với nội dung giống nhau trong vòng `300ms`, cuộc gọi thứ hai sẽ bị bỏ qua để tránh làm phiền người dùng.

---

## 4. PHÂN TÍCH RỦI RO UI/UX VÀ LOGIC TRÊN FRONTEND (UI/UX & LOGIC RISKS)

Qua đánh giá mã nguồn tĩnh, phát hiện các điểm rủi ro lớn sau:

### 4.1. Thiếu hụt validations Client-side nghiêm trọng tại `EditProfileModal`
- **Mô tả:** Form chỉnh sửa hồ sơ bệnh nhân chứa tới hơn 15 trường thông tin (Họ tên, Số điện thoại, Email, Số CCCD, Thẻ BHYT, Chiều cao, Cân nặng, v.v.) nhưng hoàn toàn **không có bất kỳ bộ kiểm tra Client-side nào** trước khi gửi đi.
- **Hệ quả:** 
  - Người dùng có thể xóa sạch Họ và tên và gửi đi, dẫn đến lỗi 400 từ Backend hoặc gây mất dữ liệu tên nếu Backend không bắt buộc.
  - Định dạng Số điện thoại và Email không được kiểm duyệt, cho phép nhập các chuỗi ký tự bất kỳ.
  - Chiều cao/Cân nặng có thể nhận giá trị âm hoặc giá trị quá lớn không thực tế.

### 4.2. Rủi ro xử lý số liệu lỗi tại `AddHealthMetricModal`
- **Mô tả:** Trường nhập giá trị chỉ số sức khỏe (`value`) được cấu hình là input loại `text`, cho phép nhập chuỗi tự do. Khi submit, hệ thống sử dụng hàm `parseFloat(value)` để chuyển đổi.
- **Hệ quả:**
  - Nếu người dùng nhập ký tự không phải số (ví dụ: `abc`), `parseFloat("abc")` sẽ trả về giá trị `NaN` và gửi giá trị này lên máy chủ, dễ gây ra lỗi dữ liệu ở Backend (hoặc lỗi SQL/DTO validation).
  - Trường nhập giờ khám `time` là input text tự do với định dạng gợi ý `HH:mm`. Người dùng hoàn toàn có thể gõ sai định dạng (ví dụ: `99:99` hoặc `abc`), dẫn đến việc ghép chuỗi tạo ra một chuỗi thời gian không hợp lệ gửi lên backend (`date + "T" + time + ":00"`).

### 4.3. Thiếu xác thực độ dài dữ liệu đầu vào tương thích với cơ sở dữ liệu
- **Mô tả:** Một số trường nhập liệu dạng text tự do như `reason` (Lý do khám) trong `AddAppointmentModal`, `bio` trong `CreateDoctorModal` không được giới hạn số lượng ký tự tối đa ở Client (ví dụ qua thuộc tính `maxLength`).
- **Hệ quả:** Người dùng có thể sao chép văn bản siêu dài dán vào, gây vỡ giao diện hiển thị trên các bảng danh sách hoặc ném ra lỗi tràn cột dữ liệu (Data truncation error) từ phía cơ sở dữ liệu Backend.

---

## 5. KHUYẾN NGHỊ CẢI THIỆN (RECOMMENDATIONS)

1.  **Bổ sung validation cho `EditProfileModal`:** Áp dụng bộ lọc regex số điện thoại và email tương tự như `CreatePatientModal` để giảm thiểu các yêu cầu sai định dạng gửi lên Backend.
2.  **Ràng buộc input số liệu trong `AddHealthMetricModal`:**
    - Thay đổi thuộc tính input `type="text"` thành `type="number"` đối với các chỉ số không phải huyết áp.
    - Đối với huyết áp (`BLOOD_PRESSURE`), sử dụng regex `/^\d{2,3}\/\d{2,3}$/` để kiểm tra định dạng nhập (ví dụ: `120/80`) trước khi submit.
    - Đổi input giờ `time` thành điều khiển chọn giờ chuyên dụng (`type="time"`) để đảm bảo tính hợp lệ của thời gian.
3.  **Áp dụng `maxLength`:** Giới hạn số ký tự tối đa ở mức hiển thị trên các input tự do (ví dụ: `reason` tối đa 500 ký tự, `bio` tối đa 1000 ký tự).
