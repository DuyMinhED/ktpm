# ĐẶC TẢ KỊCH BẢN KIỂM THỬ PHÂN HOẠCH TƯƠNG ĐƯƠNG (EQUIVALENCE PARTITIONING - EP) - PHÂN HỆ AUTH & USER
## TASK: KCPM-751 - Design 5-8 Equivalence Partitioning Test Cases for Email, Password, and Account Status

Tài liệu này đặc tả **đúng 8 ca kiểm thử phân hoạch tương đương (Equivalence Partitioning - EP)** cho các trường dữ liệu `email`, `password`, và `status` thuộc phân hệ Quản lý Tài khoản (Auth/User) dựa trên các ràng buộc nghiệp vụ trong tài liệu hệ thống và mã nguồn.

---

## 1. PHẠM VI PHÂN HOẠCH (PARTITIONING SCOPE)

### A. Trường Email
*   **Lớp tương đương hợp lệ (Valid Partition):** Địa chỉ email tuân thủ đúng định dạng RFC chuẩn (có cả phần tên người dùng, biểu tượng `@`, tên miền và đuôi tên miền, độ dài tối đa 100 ký tự).
*   **Lớp tương đương không hợp lệ 1 (Invalid Partition - Missing '@'):** Chuỗi không chứa ký tự `@`.
*   **Lớp tương đương không hợp lệ 2 (Invalid Partition - Missing Domain):** Chuỗi chứa `@` nhưng thiếu phần tên miền phía sau.

### B. Trường Password (Mật khẩu)
*   **Lớp tương đương hợp lệ (Valid Partition):** Mật khẩu có độ dài $\ge 8$ ký tự, chứa chữ hoa, chữ thường, chữ số và ký tự đặc biệt (nếu hệ thống bật đầy đủ chính sách bảo mật).
*   **Lớp tương đương không hợp lệ 1 (Invalid Partition - Too Short):** Mật khẩu có độ dài dưới 8 ký tự ($< 8$).
*   **Lớp tương đương không hợp lệ 2 (Invalid Partition - Missing Complexity):** Mật khẩu $\ge 8$ ký tự nhưng thiếu chữ in hoa hoặc chữ số khi cấu hình hệ thống yêu cầu độ phức tạp cao.

### C. Trường Account Status (Trạng thái)
*   **Lớp tương đương hợp lệ (Valid Partition):** Giá trị nằm trong tập hợp trạng thái được hỗ trợ: `"ACTIVE"`, `"INACTIVE"`.
*   **Lớp tương đương không hợp lệ (Invalid Partition):** Giá trị nằm ngoài tập hợp trạng thái được hỗ trợ (ví dụ: `"PENDING"`, `"SUSPENDED"`, hoặc bất kỳ chuỗi văn bản bất thường nào khác).

---

## 2. BẢNG THIẾT KẾ 8 CA KIỂM THỬ PHÂN HOẠCH TƯƠNG ĐƯƠNG (EP TEST CASES)

| STT | Mã TC | Trường kiểm thử | Loại phân hoạch (Partition Type) | Lớp tương đương (Equivalence Class) | Dữ liệu đại diện (Representative Data) | Kết quả mong đợi (Expected Result) |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **TC-EP-AUTH-01** | `email` | Hợp lệ (Valid) | Email đúng định dạng chuẩn RFC | `"patient@gmail.com"` | **Thành công:** Được xác thực thành công. |
| **2** | **TC-EP-AUTH-02** | `email` | Không hợp lệ (Invalid) | Email thiếu ký tự `@` | `"patientgmail.com"` | **Thất bại:** Báo lỗi xác thực Email không hợp lệ ở tầng DTO. |
| **3** | **TC-EP-AUTH-03** | `email` | Không hợp lệ (Invalid) | Email thiếu phần tên miền | `"patient@"` | **Thất bại:** Báo lỗi xác thực Email không hợp lệ ở tầng DTO. |
| **4** | **TC-EP-AUTH-04** | `password` | Hợp lệ (Valid) | Mật khẩu đủ độ dài ($\ge 8$) và đủ độ phức tạp | `"P@ssw123"` | **Thành công:** Mật khẩu hợp lệ và được lưu thành công. |
| **5** | **TC-EP-AUTH-05** | `password` | Không hợp lệ (Invalid) | Mật khẩu có độ dài quá ngắn ($< 8$) | `"P@ss1"` (5 ký tự) | **Thất bại:** Ném ngoại lệ `IllegalArgumentException` ("Mật khẩu phải có ít nhất 8 ký tự"). |
| **6** | **TC-EP-AUTH-06** | `password` | Không hợp lệ (Invalid) | Mật khẩu thiếu chữ in hoa hoặc chữ số khi chính sách yêu cầu | `"p@ssword"` (thiếu chữ hoa & chữ số) | **Thất bại:** Ném ngoại lệ `IllegalArgumentException` ("Mật khẩu phải chứa ít nhất một chữ hoa và một chữ số"). |
| **7** | **TC-EP-AUTH-07** | `status` | Hợp lệ (Valid) | Trạng thái tài khoản hợp lệ | `"ACTIVE"` | **Thành công:** Chấp nhận và cập nhật trạng thái. |
| **8** | **TC-EP-AUTH-08** | `status` | Không hợp lệ (Invalid) | Trạng thái tài khoản không được hỗ trợ | `"SUSPENDED"` | **Thất bại:** Báo lỗi validation hoặc ném ngoại lệ nghiệp vụ không hợp lệ. |
---

## 3. Traceability And Execution Completion

| Test Case | Valid/Invalid Partition | Preconditions | Execution Steps | Automation Target | Evidence / Traceability |
|---|---|---|---|---|---|
| TC-EP-AUTH-01 | Valid email | Login or DTO validation context | Submit valid email with otherwise valid payload | DTO/API test | `CreateUserRequestValidationTest`, login/API specs |
| TC-EP-AUTH-02 | Invalid email: missing `@` | DTO validation context | Submit `patientgmail.com` | DTO/API test | `CreateUserRequestValidationTest`, `UpdateUserRequestValidationTest` |
| TC-EP-AUTH-03 | Invalid email: missing domain | DTO validation context | Submit `patient@` | DTO/API test | `CreateUserRequestValidationTest`, `UpdateUserRequestValidationTest` |
| TC-EP-AUTH-04 | Valid password | Admin/service context | Submit password meeting length and policy | DTO/service test | `CreateUserRequestValidationTest`, `AdminUserServiceImplTest` |
| TC-EP-AUTH-05 | Invalid password: too short | Admin/service context | Submit password length `<8` | DTO/service test | `CreateUserRequestValidationTest`, `AdminUserServiceImplTest` |
| TC-EP-AUTH-06 | Invalid password: missing complexity | SystemConfig requires uppercase/number | Submit password missing uppercase or number | Service test | `AdminUserServiceImplTest` |
| TC-EP-AUTH-07 | Valid status | Update user context | Submit `ACTIVE` or `INACTIVE` | DTO/API test | `UpdateUserRequestValidationTest`, `AdminUserServiceImplTest` |
| TC-EP-AUTH-08 | Invalid status | Update user context | Submit `SUSPENDED`, lowercase, or unknown value | DTO/API test | `UpdateUserRequestValidationTest` |

## 4. Completeness Notes

| Required information | Status |
|---|---|
| Partition definition | Present in Section 1 |
| Representative data | Present in Section 2 |
| Expected result | Present in Section 2 |
| Preconditions, steps, automation target | Added in Section 3 |
| Evidence mapping | Added in Section 3 |

## 5. Standardized Boundary Value Addendum

This EP file must be read together with the following BVA set before implementation. The minimum BVA set below closes the gap where the original EP cases only used representative partitions.

| Field | Boundary rule | Minimum boundary values | Expected result | Minimum TC count |
|---|---|---|---|---:|
| `email` length | `1..100` characters and valid email format | valid length `99`, valid length `100`, valid format length `101` | `99/100` accepted, `101` rejected by DTO validation | 3 |
| `email` format | Must match email format | `patient@gmail.com`, `patientgmail.com`, `patient@` | valid email accepted, missing `@` and missing domain rejected | 3 |
| `password` create user | Backend minimum length is `8` | length `7`, `8`, `9` | `7` rejected, `8/9` accepted if other policy rules pass | 3 |
| `newPassword` change password | `8..100` characters | length `7`, `8`, `9`, `99`, `100`, `101` | lower/upper outside values rejected, inside values accepted | 6 |
| `status` | Allowed values are `ACTIVE`, `INACTIVE` | `ACTIVE`, `INACTIVE`, `active`, `SUSPENDED`, 31-character string | two valid values accepted; lowercase, unknown, and too-long value rejected | 5 |

Minimum BVA cases to add for this document: `20` rows if every value above is executed independently. A reduced smoke set can use `9` rows: email `100/101`, password `7/8/9`, newPassword `100/101`, status `ACTIVE/SUSPENDED`.

| New TC | Type | Input | Expected result | Automation target |
|---|---|---|---|---|
| TC-BVA-AUTH-EP-01 | BVA | email length `99`, valid format | Validation passes | `CreateUserRequestValidationTest` |
| TC-BVA-AUTH-EP-02 | BVA | email length `100`, valid format | Validation passes | `CreateUserRequestValidationTest` |
| TC-BVA-AUTH-EP-03 | BVA | email length `101`, valid format | Validation fails | `CreateUserRequestValidationTest` |
| TC-BVA-AUTH-EP-04 | BVA | password length `7` | Validation fails | `CreateUserRequestValidationTest` |
| TC-BVA-AUTH-EP-05 | BVA | password length `8` | Validation passes | `CreateUserRequestValidationTest` |
| TC-BVA-AUTH-EP-06 | BVA | password length `9` | Validation passes | `CreateUserRequestValidationTest` |
| TC-BVA-AUTH-EP-07 | BVA | newPassword length `100` | Validation passes | `ChangePasswordRequestTest` |
| TC-BVA-AUTH-EP-08 | BVA | newPassword length `101` | Validation fails | `ChangePasswordRequestTest` |
| TC-BVA-AUTH-EP-09 | BVA/EP | status `SUSPENDED` | Validation fails | `UpdateUserRequestValidationTest` |
