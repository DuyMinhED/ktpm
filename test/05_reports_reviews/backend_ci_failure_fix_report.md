# BÁO CÁO KHẮC PHỤC LỖI TÍCH HỢP CI (CI FAILURE FIX REPORT)

**Mã Ticket Jira:** KCPM-831, KCPM-839, KCPM-841, KCPM-842  
**Người thực hiện (Assignee):** Hồ Văn Duy  
**Mã số Sinh viên:** 054205001151  
**Công cụ kiểm tra:** Maven 3.9.9, JUnit 5, Mockito framework  

---

## 1. Tổng quan sự cố CI (CI Failure Diagnosis)
Job `backend-test` trong luồng GitHub Actions `Production CI` bị thất bại ở bước chạy unit/integration test do sự không nhất quán giữa thiết kế kiểm thử (spec/test cases) và mã nguồn triển khai thực tế. Cụ thể các lỗi sau đã được ghi nhận:
1. `AdminUserServiceImplTest.testStatusInvalid_TC_EP_AUTH_08` bị fail do trạng thái `"SUSPENDED"` được cho là hợp lệ trong khi mong đợi phải là không hợp lệ.
2. `AdminUserServiceImplTest.testPasswordTooShort_TC_EP_AUTH_05` bị fail do mong đợi thông báo lỗi mật khẩu tối thiểu 8 ký tự (`Mật khẩu phải có ít nhất 8 ký tự`) nhưng thực tế hệ thống lại kiểm tra 6 ký tự (`Mật khẩu phải có ít nhất 6 ký tự`).
3. Lỗi `UnnecessaryStubbingException` trong `AuthUserBvaTest.testPasswordLength7_TC_BVA_AUTH_01` do thiết lập stubbing cho các phương thức không được gọi đến khi kiểm tra lỗi mật khẩu ngắn.
4. Lỗi `testEmailLength101_TC_BVA_AUTH_04` do trường email thiếu giới hạn độ dài `max = 100` dẫn đến chuỗi 101 ký tự vẫn được xem là hợp lệ.
5. Lỗi `CoreBusinessBvaTest.testBloodSugar_MaxPlus1_TC_BVA_CORE_10` (và `testBloodSugar_MinMinus1_TC_BVA_CORE_07`) bị fail do các ngưỡng phân loại sức khỏe cho chỉ số Đường huyết (`BLOOD_SUGAR`) trong logic nghiệp vụ bị lệch biên so với đặc tả SRS (kỳ vọng `6.1` mmol/L là `BORDERLINE_HIGH` và `3.9` mmol/L là `LOW` nhưng hệ thống đều phân loại là `NORMAL`).

---

## 2. Chi tiết các lỗi và Giải pháp khắc phục

### Lỗi 1: Thiếu Ràng buộc Xác thực trạng thái `status` trong DTO
* **Nguyên nhân:** Trường `status` trong `UpdateUserRequest.java` không được chú thích bởi các ràng buộc kiểm tra giá trị của Jakarta Bean Validation. Do đó, các giá trị không hợp lệ như `"SUSPENDED"` vẫn vượt qua bộ lọc.
* **Giải pháp:** Thêm các chú thích `@Pattern(regexp = "^(ACTIVE|INACTIVE)$", message = "Trạng thái không hợp lệ")` và `@Size(max = 30, message = "Trạng thái không được quá 30 ký tự")` vào trường `status` của `UpdateUserRequest.java`.

### Lỗi 2: Không đồng bộ độ dài mật khẩu tối thiểu giữa SRS và Mã nguồn
* **Nguyên nhân:** SRS yêu cầu mật khẩu tối thiểu 8 ký tự, nhưng cả DTO (`CreateUserRequest.java`) và logic dịch vụ (`AdminUserServiceImpl.java`) vẫn đang kiểm tra độ dài tối thiểu là 6 ký tự.
* **Giải pháp:**
  * Nâng ràng buộc `@Size(min = 6)` thành `@Size(min = 8, message = "Mật khẩu phải có ít nhất 8 ký tự")` cho trường `password` trong DTO `CreateUserRequest.java`, `ChangePasswordRequest.java`.
  * Sửa logic kiểm tra thủ công trong `AdminUserServiceImpl.java` và `UserProfileController.java` thành độ dài `< 8` với thông báo lỗi `"Mật khẩu phải có ít nhất 8 ký tự"`.

### Lỗi 3: Lỗi Unnecessary Stubbing trong Mockito Test
* **Nguyên nhân:** Trong `AuthUserBvaTest.testPasswordLength7_TC_BVA_AUTH_01`, do mật khẩu có độ dài 7 (nhỏ hơn 8), tiến trình xử lý trong `createUser()` sẽ ném ra `IllegalArgumentException` ngay lập tức tại bước kiểm tra độ dài mật khẩu. Vì thế, các mock của `systemConfigRepository.findFirstByOrderByIdAsc()`, `passwordEncoder.encode()` và `userRepository.save()` không bao giờ được gọi tới, dẫn đến Mockito ném lỗi kiểm thử nghiêm ngặt (Strict Mockito).
* **Giải pháp:** Loại bỏ hoàn toàn các stubbing không sử dụng trong test case này.

### Lỗi 4: Thiếu kiểm tra độ dài email tối đa
* **Nguyên nhân:** Trường email thiếu ràng buộc `@Size(max = 100)` dẫn đến email có độ dài 101 ký tự không bị chặn bởi bộ xác thực DTO.
* **Giải pháp:** Bổ sung `@Size(max = 100, message = "Email không được quá 100 ký tự")` vào trường email của `CreateUserRequest.java` và `UpdateUserRequest.java`.

### Lỗi 5: Sai lệch các ngưỡng chẩn đoán chỉ số Đường huyết (BLOOD_SUGAR) (KCPM-841, KCPM-842)
* **Nguyên nhân:** Trong `PatientHealthMetricServiceImpl.java`, các khoảng biên chẩn đoán Đường huyết (`BLOOD_SUGAR`) được thiết lập là `v < 3.9` cho `LOW`, `v <= 6.1` cho `NORMAL` dẫn đến:
  * Điểm biên dưới của NORMAL (`3.9` mmol/L) bị phân loại thành `NORMAL` thay vì `LOW`.
  * Điểm biên trên của NORMAL (`6.1` mmol/L) bị phân loại thành `NORMAL` thay vì `BORDERLINE_HIGH`.
* **Giải pháp:** Cập nhật lại logic hàm `evaluateStatus` cho đúng với quy tắc phân hoạch biên trong SRS và tài liệu thiết kế:
  * `v < 4.0` $\rightarrow$ `LOW`
  * `v <= 6.0` $\rightarrow$ `NORMAL`
  * `v <= 7.2` $\rightarrow$ `BORDERLINE_HIGH`
  * Các giá trị lớn hơn $7.2$ $\rightarrow$ `HIGH`.

---

## 3. Kết quả Kiểm thử cục bộ sau khi sửa đổi

Các thay đổi đã được xác thực cục bộ bằng cách chạy toàn bộ suite kiểm thử backend thông qua Maven:

```bash
mvn test
```

### Kết quả chạy kiểm thử:
* **Số lượng Test Cases chạy:** 50
* **Thành công:** 50 / 50
* **Thất bại:** 0
* **Lỗi:** 0
* **Bỏ qua (Skipped):** 0
* **Trạng thái Build:** `BUILD SUCCESS`

---

## 4. Danh sách các tệp tin sửa đổi (Git Changes)
Các tệp đã sửa đổi và được đẩy lên nhánh `KCPM-841`:
1. `backend/src/main/java/com/project/dto/request/CreateUserRequest.java`
2. `backend/src/main/java/com/project/dto/request/UpdateUserRequest.java`
3. `backend/src/main/java/com/project/dto/request/ChangePasswordRequest.java`
4. `backend/src/main/java/com/project/controller/UserProfileController.java`
5. `backend/src/main/java/com/project/service/impl/AdminUserServiceImpl.java`
6. `backend/src/test/java/com/project/service/impl/AuthUserBvaTest.java`
7. `backend/src/main/java/com/project/service/impl/PatientHealthMetricServiceImpl.java`

Tất cả các thay đổi trên giúp cho toàn bộ các quy trình tích hợp liên tục (CI Pipeline) của Backend được thông qua một cách chính xác theo tiêu chuẩn kiểm thử của dự án.
