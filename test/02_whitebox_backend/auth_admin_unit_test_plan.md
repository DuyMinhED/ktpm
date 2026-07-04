# TÀI LIỆU KẾ HOẠCH KIỂM THỬ ĐƠN VỊ (UNIT TEST PLAN) CHO AUTH, JWT VÀ ADMIN SERVICES

**Mã Ticket Jira:** KCPM-816  
**Người thực hiện (Assignee):** Duy Hồ Văn  
**Mã số Sinh viên:** 054205001151  
**Công cụ sử dụng:** JUnit 5, Mockito framework  
**Mục tiêu độ bao phủ (Coverage Target):**
* Độ bao phủ dòng (Line Coverage): $\ge 90\%$
* Độ bao phủ nhánh (Branch Coverage): $\ge 85\%$

---

## 1. Kế hoạch kiểm thử lớp `JwtTokenProvider` (Xác thực & Mã hóa JWT)

Lớp `JwtTokenProvider` chịu trách nhiệm tạo sinh, phân tích và xác thực mã JWT Token cho hệ thống.

* **Mocked Objects:** `Authentication`, `CustomUserDetails`, `Claims`, `Jwts`.
* **Danh sách kịch bản kiểm thử (Checklist):**

| Tên phương thức | Mã TestCase | Điều kiện kiểm thử | Kết quả mong đợi |
| :--- | :--- | :--- | :--- |
| `generateToken(Authentication)` | **TC-JWT-GEN-01** | `Authentication` hợp lệ, chứa thông tin người dùng và quyền truy cập | Trả về chuỗi JWT token hợp lệ, được ký số |
| | **TC-JWT-GEN-02** | `Authentication` chứa giá trị null hoặc không có principal | Ném ra ngoại lệ `NullPointerException` hoặc `IllegalArgumentException` |
| `getUserIdFromJWT(String)` | **TC-JWT-UID-01** | Chuỗi JWT token hợp lệ, chưa hết hạn | Trả về chính xác ID của người dùng (Long) |
| | **TC-JWT-UID-02** | Token bị sửa đổi chữ ký số | Ném ra ngoại lệ `SignatureException` |
| | **TC-JWT-UID-03** | Token đã hết hạn sử dụng | Ném ra ngoại lệ `ExpiredJwtException` |
| `validateToken(String)` | **TC-JWT-VAL-01** | Token hợp lệ, cấu trúc đúng và còn hạn | Trả về giá trị `true` |
| | **TC-JWT-VAL-02** | Token bị rỗng hoặc có giá trị `null` | Trả về giá trị `false` hoặc ném `IllegalArgumentException` |
| | **TC-JWT-VAL-03** | Token có định dạng không hợp chuẩn (Malformed) | Trả về giá trị `false` (ném `MalformedJwtException`) |
| | **TC-JWT-VAL-04** | Token đã hết hạn | Trả về giá trị `false` (ném `ExpiredJwtException`) |
| | **TC-JWT-VAL-05** | Thuật toán ký mã hóa không khớp | Trả về giá trị `false` (ném `UnsupportedJwtException`) |

---

## 2. Kế hoạch kiểm thử lớp `AdminUserServiceImpl` (Quản lý Người dùng)

Lớp dịch vụ này chịu trách nhiệm cho các tác vụ thêm, sửa, xóa, khóa/mở khóa tài khoản của người dùng hệ thống.

* **Mocked Objects:** `UserRepository`, `PatientRepository`, `PasswordEncoder`, `UserMapper`, `AuditService`, `SystemConfigRepository`.
* **Danh sách kịch bản kiểm thử (Checklist):**

| Tên phương thức | Mã TestCase | Điều kiện kiểm thử (Input / Mock) | Kết quả mong đợi |
| :--- | :--- | :--- | :--- |
| `createUser(CreateUserRequest)`| **TC-AUS-CRE-01** | Request hợp lệ, email chưa tồn tại, mật khẩu đạt chuẩn | Gọi `save()`, ghi nhật ký Audit, trả về `AdminUserResponse` |
| | **TC-AUS-CRE-02** | Email đã được đăng ký trong hệ thống | Ném ra `IllegalArgumentException("Email đã tồn tại")` |
| | **TC-AUS-CRE-03** | Mật khẩu quá ngắn (< 8 ký tự) | Ném ra `IllegalArgumentException("Mật khẩu phải có ít nhất 8 ký tự")` |
| | **TC-AUS-CRE-04** | Mật khẩu thiếu độ phức tạp (chữ hoa/chữ số) | Ném ra `IllegalArgumentException("Mật khẩu phải chứa ít nhất một chữ hoa...")` |
| `getUserById(Long)` | **TC-AUS-BYI-01** | ID người dùng tồn tại | Trả về đối tượng `AdminUserResponse` chính xác |
| | **TC-AUS-BYI-02** | ID người dùng không tồn tại trong hệ thống | Ném ra `ResourceNotFoundException` hoặc tương đương |
| `updateUser(Long, UpdateUserRequest)`| **TC-AUS-UPD-01** | ID tồn tại, thông tin cập nhật hợp lệ | Lưu thực thể đã sửa đổi, trả về response cập nhật |
| | **TC-AUS-UPD-02** | ID người dùng không tồn tại | Ném ra `ResourceNotFoundException` |
| | **TC-AUS-UPD-03** | Email cập nhật trùng lặp với người dùng khác | Ném ra `IllegalArgumentException("Email đã tồn tại")` |
| `toggleUserStatus(Long)` | **TC-AUS-TOG-01** | ID hợp lệ, trạng thái hiện tại là `ACTIVE` | Đổi trạng thái sang `INACTIVE`, gọi `save()`, ghi Audit log |
| | **TC-AUS-TOG-02** | ID hợp lệ, trạng thái hiện tại là `INACTIVE`| Đổi trạng thái sang `ACTIVE`, gọi `save()` |
| | **TC-AUS-TOG-03** | ID người dùng không tồn tại | Ném ra `ResourceNotFoundException` |
| `deleteUser(Long)` | **TC-AUS-DEL-01** | ID tồn tại, xóa thành công | Gọi `userRepository.deleteById()`, ghi Audit log |
| | **TC-AUS-DEL-02** | ID người dùng không tồn tại | Ném ra `ResourceNotFoundException` |

---

## 3. Kế hoạch kiểm thử lớp `AdminClinicServiceImpl` (Quản lý Phòng khám)

Lớp dịch vụ này xử lý các hoạt động đăng ký mới và điều chỉnh thông tin phòng khám trong hệ thống.

* **Mocked Objects:** `ClinicRepository`, `ClinicMapper`, `AuditService`.
* **Danh sách kịch bản kiểm thử (Checklist):**

| Tên phương thức | Mã TestCase | Điều kiện kiểm thử (Input / Mock) | Kết quả mong đợi |
| :--- | :--- | :--- | :--- |
| `createClinic(CreateClinicRequest)`| **TC-ACS-CRE-01** | Request hợp lệ, tên phòng khám chưa trùng lặp | Gọi `clinicRepository.save()`, trả về `AdminClinicResponse` |
| | **TC-ACS-CRE-02** | Tên phòng khám đã tồn tại | Ném ra `IllegalArgumentException("Phòng khám đã tồn tại")` |
| `getClinicById(Long)` | **TC-ACS-BYI-01** | ID phòng khám tồn tại | Trả về đối tượng `AdminClinicResponse` chi tiết |
| | **TC-ACS-BYI-02** | ID phòng khám không tồn tại | Ném ra `ResourceNotFoundException` |
| `updateClinic(Long, UpdateClinicRequest)`| **TC-ACS-UPD-01** | ID tồn tại, thông tin cập nhật hợp lệ | Lưu thông tin cập nhật, trả về response đã chỉnh sửa |
| | **TC-ACS-UPD-02** | ID phòng khám không tồn tại | Ném ra `ResourceNotFoundException` |
| `toggleClinicStatus(Long)`| **TC-ACS-TOG-01** | ID tồn tại, chuyển trạng thái kinh doanh | Gọi `save()` với trạng thái đảo ngược, ghi Audit log |
| | **TC-ACS-TOG-02** | ID phòng khám không tồn tại | Ném ra `ResourceNotFoundException` |

---

## 4. Báo cáo bằng chứng & Kịch bản chạy thử Mockito mẫu

Một ví dụ mã kiểm thử JUnit 5 tích hợp Mockito cho lớp `AdminUserServiceImpl` sườn thực hiện xác minh mã độc lập:

```java
@ExtendWith(MockitoExtension.class)
class AdminUserServiceImplTest {

    @Mock
    private UserRepository userRepository;
    
    @Mock
    private SystemConfigRepository systemConfigRepository;

    @InjectMocks
    private AdminUserServiceImpl adminUserService;

    @Test
    void createUser_DuplicateEmail_ThrowsException() {
        CreateUserRequest request = new CreateUserRequest();
        request.setEmail("duplicate@gmail.com");

        // Mock email đã tồn tại
        when(userRepository.findByEmail("duplicate@gmail.com")).thenReturn(Optional.of(new User()));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            adminUserService.createUser(request);
        });

        assertEquals("Email đã tồn tại", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }
}
```

---

## 5. Kết luận
* Tài liệu này đã vạch ra lộ trình kiểm thử đơn vị tối ưu cho các lớp dịch vụ cốt lõi Auth/JWT và Admin Services.
* Đạt tiêu chí bao phủ dòng và bao phủ nhánh cần thiết cho việc nghiệm thu ticket **KCPM-816**.
