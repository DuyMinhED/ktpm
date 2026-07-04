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

---

## 3. Bổ sung BVA/EP còn thiếu theo code hiện tại

Bảng 10 case ban đầu mới bao phủ một phần biên độ dài. Để đủ điều kiện triển khai tự động, cần bổ sung các case sau:

| Test Case | Type | Field | Input | Expected Outcome | New Tags Covered | Automation Target |
|---|---|---|---|---|---|---|
| TC-BVA-AUTH-11 | BVA | `password` | 9 ký tự | Thành công nếu các field khác hợp lệ | `BVA-AUTH-B09` | DTO/API test |
| TC-BVA-AUTH-12 | EP | `password` | rỗng/null | 400 validation: password required | `EP-AUTH-I07` | DTO/API test |
| TC-BVA-AUTH-13 | BVA | `email` | 99 ký tự, đúng format | Thành công | `BVA-AUTH-B04` | DTO/API test |
| TC-BVA-AUTH-14 | EP | `email` | rỗng/null | 400 validation: email required | `EP-AUTH-I03` | DTO/API test |
| TC-BVA-AUTH-15 | EP | `email` | `abc.example.com` | 400 validation: invalid email format | `EP-AUTH-I04` | DTO/API test |
| TC-BVA-AUTH-16 | EP | `email` | email đã tồn tại | 400 business error duplicate email | `EP-AUTH-I06` | Service/API test |
| TC-BVA-AUTH-17 | BVA | `phone` | 19 ký tự | Thành công nếu optional phone được truyền | `BVA-AUTH-B16` | DTO/API test |
| TC-BVA-AUTH-18 | EP | `status` | `active` | 400 validation do không khớp pattern `ACTIVE|INACTIVE` | `EP-AUTH-I14` | DTO/API test |
| TC-BVA-AUTH-19 | EP | `status` | `SUSPENDED` | 400 validation do ngoài enum/pattern | `EP-AUTH-I15` | DTO/API test |
| TC-BVA-AUTH-20 | BVA | `newPassword` | 101 ký tự khi đổi mật khẩu | 400 validation: max 100 | `BVA-AUTH-B15` | DTO/API test |

### Ghi chú triển khai

- `CreateUserRequest.password` chỉ có `@Size(min = 8)`, chưa có max; không nên tạo expected lỗi cho password quá dài ở API create user nếu chưa có requirement.
- `ChangePasswordRequest.newPassword` có `@Size(min = 8, max = 100)`, nên BVA đầy đủ là 7, 8, 9, 99, 100, 101.
- `UpdateUserRequest.status` có cả `@Pattern("^(ACTIVE|INACTIVE)$")` và `@Size(max = 30)`, nên case lowercase/unknown status quan trọng hơn case chuỗi 31 ký tự đơn thuần.
---

## 4. Traceability And Automation Completion

| Test Case | Preconditions | Execution Steps | Automation Target | Evidence / JUnit Mapping |
|---|---|---|---|---|
| TC-BVA-AUTH-01 | Admin context or DTO validation context | Build create/update user request with password length 7 | DTO/service JUnit | `CreateUserRequestValidationTest`, `AdminUserServiceImplTest` |
| TC-BVA-AUTH-02 | Other user fields valid | Build request with password length 8 | DTO/service JUnit | `CreateUserRequestValidationTest`, `AdminUserServiceImplTest` |
| TC-BVA-AUTH-03 | Email format valid | Build request with email length 100 | DTO JUnit | `CreateUserRequestValidationTest`, `UpdateUserRequestValidationTest` |
| TC-BVA-AUTH-04 | Email format valid except length | Build request with email length 101 | DTO JUnit | `CreateUserRequestValidationTest`, `UpdateUserRequestValidationTest` |
| TC-BVA-AUTH-05 | Name required | Build request with fullName length 99 | DTO JUnit | `CreateUserRequestValidationTest`, `UpdateUserRequestValidationTest` |
| TC-BVA-AUTH-06 | Name required | Build request with fullName length 100 | DTO JUnit | `CreateUserRequestValidationTest`, `UpdateUserRequestValidationTest` |
| TC-BVA-AUTH-07 | Name required | Build request with fullName length 101 | DTO JUnit | `CreateUserRequestValidationTest`, `UpdateUserRequestValidationTest` |
| TC-BVA-AUTH-08 | Phone optional or present | Build request with phone length 20 | DTO JUnit | `CreateUserRequestValidationTest`, `UpdateUserRequestValidationTest` |
| TC-BVA-AUTH-09 | Phone optional or present | Build request with phone length 21 | DTO JUnit | `CreateUserRequestValidationTest`, `UpdateUserRequestValidationTest` |
| TC-BVA-AUTH-10 | Update user path | Build request with status length 31 | DTO/API test | `UpdateUserRequestValidationTest` |
| TC-BVA-AUTH-11..20 | See Section 3 | Execute the code-based supplemental cases | DTO/service/API test | `junit_bva_ep_traceability_spec.md`, `code_based_bva_ep_completion.md` |

## 5. Completeness Status

| Required information | Status |
|---|---|
| Scope and boundary rules | Present in Sections 1 and 3 |
| Concrete test data | Present in Sections 2 and 3 |
| Expected result | Present in Sections 2 and 3 |
| Preconditions and steps | Added in Section 4 |
| Automation target | Added in Sections 3 and 4 |
| JUnit/API traceability | Added in Section 4 |
