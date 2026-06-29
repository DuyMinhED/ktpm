# ĐẶC TẢ KỊCH BẢN KIỂM THỬ GIÁ TRỊ BIÊN (BVA TEST SPECIFICATION) - PHÂN HỆ AUTH & USER
## TASK: KCPM-750 - Design 10 Boundary Value Test Cases for Auth/User Module

Tài liệu này đặc tả **đúng 10 ca kiểm thử giá trị biên (Boundary Value Analysis - BVA)** cho phân hệ Quản lý Tài khoản / Người dùng (Auth/User) dựa trên các ràng buộc nghiệp vụ trong [SRS.md](file:///d:/UTH/KTPM/ktpm/docs/SRS.md) và mã nguồn hệ thống.

---

## 1. PHẠM VI RÀNG BUỘC BIÊN (BVA BOUNDARIES)
Dựa trên đặc tả yêu cầu hệ thống và cấu trúc dữ liệu, các biên được xác định cho các trường thông tin chính như sau:
*   **Password Length:** Giá trị tối thiểu ($Min$) là `8` ký tự.
*   **Email Length:** Giá trị tối đa ($Max$) là `100` ký tự.
*   **Full Name Length:** Giá trị tối đa ($Max$) là `100` ký tự.
*   **Phone Number Length:** Giá trị tối đa ($Max$) là `20` ký tự.
*   **Account Status Length:** Giá trị tối đa ($Max$) là `30` ký tự.

---

## 2. BẢNG THIẾT KẾ 10 CA KIỂM THỬ GIÁ TRỊ BIÊN (BVA TEST CASES)

Dưới đây là danh sách chi tiết đúng 10 ca kiểm thử bao phủ các vùng biên hợp lệ và không hợp lệ:

| STT | Mã TC | Tên trường (Field Name) | Quy tắc Biên (Min/Max Rule) | Giá trị biên (Boundary Value) | Dữ liệu đầu vào (Input) | Kết quả mong đợi (Expected Result) |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| **1** | **TC-BVA-AUTH-01** | `password` | Min = 8 ký tự | **Min - 1 (7)** | `"P@ssw12"` (7 ký tự) | **Thất bại:** Hệ thống ném lỗi `IllegalArgumentException` ("Mật khẩu phải có ít nhất 8 ký tự") hoặc Validation Error. |
| **2** | **TC-BVA-AUTH-02** | `password` | Min = 8 ký tự | **Min (8)** | `"P@ssw123"` (8 ký tự) | **Thành công:** Mật khẩu hợp lệ, người dùng được tạo/cập nhật thành công. |
| **3** | **TC-BVA-AUTH-03** | `email` | Max = 100 ký tự | **Max (100)** | `"a" * 90 + "@gmail.com"` (100 ký tự) | **Thành công:** Địa chỉ Email hợp lệ, hệ thống chấp nhận. |
| **4** | **TC-BVA-AUTH-04** | `email` | Max = 100 ký tự | **Max + 1 (101)** | `"a" * 91 + "@gmail.com"` (101 ký tự) | **Thất bại:** Lỗi Validation ở tầng DTO/Controller hoặc lỗi DB ("Email không được vượt quá 100 ký tự"). |
| **5** | **TC-BVA-AUTH-05** | `fullName` | Max = 100 ký tự | **Max - 1 (99)** | `"n" * 99` (99 ký tự) | **Thành công:** Tên người dùng hợp lệ, hệ thống chấp nhận. |
| **6** | **TC-BVA-AUTH-06** | `fullName` | Max = 100 ký tự | **Max (100)** | `"n" * 100` (100 ký tự) | **Thành công:** Tên người dùng hợp lệ, hệ thống chấp nhận. |
| **7** | **TC-BVA-AUTH-07** | `fullName` | Max = 100 ký tự | **Max + 1 (101)** | `"n" * 101` (101 ký tự) | **Thất bại:** Hệ thống báo lỗi Validation DTO ("Họ và tên không được quá 100 ký tự"). |
| **8** | **TC-BVA-AUTH-08** | `phone` | Max = 20 ký tự | **Max (20)** | `"01234567890123456789"` (20 số) | **Thành công:** Số điện thoại hợp lệ, hệ thống chấp nhận. |
| **9** | **TC-BVA-AUTH-09** | `phone` | Max = 20 ký tự | **Max + 1 (21)** | `"012345678901234567890"` (21 số) | **Thất bại:** Hệ thống báo lỗi Validation DTO ("Số điện thoại không được quá 20 ký tự"). |
| **10** | **TC-BVA-AUTH-10** | `status` | Max = 30 ký tự | **Max + 1 (31)** | `"A" * 31` (31 ký tự) | **Thất bại:** Lỗi kiểm tra độ dài trạng thái tài khoản hoặc lỗi tràn cơ sở dữ liệu (Database Column length violation). |
