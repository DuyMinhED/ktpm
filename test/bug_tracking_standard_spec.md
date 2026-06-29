# TÀI LIỆU CHUẨN HÓA QUY TRÌNH QUẢN LÝ LỖI (DEFECT MANAGEMENT STANDARD)

**Mã Ticket Jira:** KCPM-821  
**Người thực hiện (Assignee):** Duy Hồ Văn  
**Mã số Sinh viên:** 054205001151  

---

## 1. Mẫu báo cáo lỗi chuẩn hóa (Bug Report Template)

Mọi báo cáo lỗi được tạo trên hệ thống tracking (Jira/GitHub Issues) đều bắt buộc tuân thủ cấu trúc dưới đây để đảm bảo đội ngũ phát triển và kiểm thử có đủ thông tin tái hiện và xử lý lỗi hiệu quả.

```markdown
# [BUG] <Tên ngắn gọn, mô tả súc tích lỗi xảy ra>

## 1. Thông tin chung (General Information)
* **Người phát hiện (Reporter):** Duy Hồ Văn (MSSV: 054205001151)
* **Người xử lý (Owner/Assignee):** <Tên lập trình viên chịu trách nhiệm xử lý>
* **Mức độ nghiêm trọng (Severity):** [Blocker / Critical / Major / Minor / Trivial]
* **Độ ưu tiên (Priority):** [Highest / High / Medium / Low / Lowest]
* **Mã chức năng (Module):** [Authentication / Doctor Dashboard / Patient Profile / Medical Services / Appointments]

## 2. Môi trường kiểm thử (Environment)
* **Hệ điều hành:** Windows 11 / macOS Sequoia / Ubuntu 22.04
* **Trình duyệt (nếu lỗi Frontend):** Chrome v120+, Firefox v121+, Edge v120
* **Phiên bản ứng dụng (Version):** v1.2.0-RC3
* **Cơ sở dữ liệu / API Endpoint:** `https://ktpm-ruby.vercel.app/` (Frontend) hoặc API cục bộ/staging

## 3. Các bước tái hiện lỗi (Steps to Reproduce)
1. Truy cập vào đường dẫn / Đăng nhập tài khoản với quyền `<Role>`
2. Di chuyển đến chức năng `<Tên chức năng>`
3. Nhập dữ liệu đầu vào: `<Mô tả dữ liệu test>`
4. Nhấn nút `<Tên hành động/Tên nút>`

## 4. Kết quả thực tế (Actual Result)
* Mô tả chi tiết hành vi xảy ra lỗi thực tế của hệ thống.
* Ví dụ: Hệ thống trả về lỗi `500 Internal Server Error` với thông báo ngăn xếp Java.

## 5. Kết quả mong đợi (Expected Result)
* Mô tả chi tiết hành vi đúng của hệ thống theo đặc tả yêu cầu (SRS).
* Ví dụ: Hệ thống phải trả về mã trạng thái `400 Bad Request` cùng thông điệp lỗi rõ ràng cho người dùng.

## 6. Minh chứng / Bằng chứng lỗi (Evidence)
* **Hình ảnh/Video ghi hình:** <Chèn link hình ảnh minh họa hoặc file đính kèm>
* **Log chi tiết (Console log / API Response):**
```json
<Đặt mã lỗi JSON hoặc log của server/client tại đây>
```
```

---

## 2. Quy định phân loại mức độ nghiêm trọng (Severity) và độ ưu tiên (Priority)

### 2.1. Định nghĩa Mức độ nghiêm trọng (Severity)
Độ nghiêm trọng phản ánh mức độ ảnh hưởng kỹ thuật của lỗi lên hệ thống phần mềm.

| Mức độ | Định nghĩa | Ví dụ thực tế |
| :--- | :--- | :--- |
| **Blocker** | Lỗi làm sập toàn bộ hệ thống hoặc chặn hoàn toàn luồng nghiệp vụ cốt lõi mà không có giải pháp tạm thời. | Lỗi sập Server Spring Boot khi khởi động; không thể thực hiện xác thực đăng nhập. |
| **Critical** | Lỗi ảnh hưởng nghiêm trọng đến luồng nghiệp vụ chính, hoặc gây rò rỉ dữ liệu, mất an toàn bảo mật nghiêm trọng. | Người dùng Bệnh nhân có thể xem/sửa hồ sơ của Bệnh nhân khác mà không cần quyền (ID-injection); rò rỉ JWT token. |
| **Major** | Lỗi làm hỏng hoặc sai lệch một chức năng quan trọng nhưng hệ thống vẫn hoạt động hoặc có giải pháp thay thế tạm thời. | API đặt lịch khám trả về trạng thái lỗi nhưng cơ sở dữ liệu vẫn ghi nhận lịch hẹn; chức năng tìm kiếm bác sĩ không hoạt động. |
| **Minor** | Lỗi ở các chức năng phụ, giao diện bị lệch nhẹ hoặc lỗi chính tả nhỏ không ảnh hưởng lớn đến trải nghiệm người dùng. | Nút "Hủy" bị lệch 5px; Lỗi chính tả tiếng Anh trong phần mô tả của dịch vụ y tế. |
| **Trivial** | Lỗi giao diện thuần túy, định dạng font chữ, màu sắc không đồng nhất tại các vị trí không quan trọng. | Màu sắc của icon cảnh báo sức khỏe nhạt hơn thiết kế Figma 10%. |

### 2.2. Định nghĩa Độ ưu tiên (Priority)
Độ ưu tiên phản ánh mức độ cấp thiết cần phải sửa lỗi của dự án dưới góc độ quản lý sản phẩm.
* **Highest:** Phải sửa ngay lập tức (thường đi kèm lỗi Blocker/Critical trên môi trường Production).
* **High:** Cần sửa trước khi phát hành phiên bản hiện tại (thường đi kèm lỗi Major/Critical).
* **Medium:** Có thể sửa trong các sprint tiếp theo hoặc sau khi các lỗi High đã được xử lý.
* **Low/Lowest:** Sửa khi có thời gian rảnh hoặc trong giai đoạn bảo trì dài hạn.

---

## 3. Danh sách kiểm tra tái hiện lỗi (Reproduction Checklist)

Trước khi gửi báo cáo lỗi lên hệ thống, kiểm thử viên bắt buộc phải thực hiện các bước kiểm tra sau để loại trừ sai sót do môi trường cá nhân:

- [ ] **Xác minh môi trường sạch:** Đã xóa toàn bộ cookie, bộ nhớ đệm (Clear Cache & Cookies) của trình duyệt hoặc sử dụng chế độ ẩn danh (Incognito Mode) để tránh dữ liệu cũ.
- [ ] **Kiểm tra phiên bản build:** Đã xác nhận phiên bản Backend/Frontend đang chạy trùng khớp với phiên bản phát hiện lỗi (không kiểm thử trên mã nguồn cũ chưa pull).
- [ ] **Kiểm tra tài khoản thử nghiệm:** Xác minh quyền hạn (Role) và thông tin đăng nhập của tài khoản test có đúng đặc tả hay không.
- [ ] **Tần suất tái hiện:** Lỗi xảy ra liên tục (100% tái hiện) hay ngẫu nhiên? Đã thực hiện kiểm tra tối thiểu 3 lần trên cùng một bộ dữ liệu.
- [ ] **Cách ly lỗi mạng:** Xác minh lỗi không phải do đường truyền Internet bị ngắt quãng hoặc do tường lửa/VPN cá nhân chặn.

---

## 4. Mẫu báo cáo lỗi thực tế (Sample Bug Report)
Dưới đây là một ví dụ báo cáo lỗi thực tế cho một API không kiểm định dữ liệu đầu vào.

```markdown
# [BUG] API tạo lịch hẹn không kiểm định giá trị âm cho ID bệnh nhân và ID bác sĩ

## 1. Thông tin chung (General Information)
* **Người phát hiện (Reporter):** Duy Hồ Văn (MSSV: 054205001151)
* **Người xử lý (Owner/Assignee):** Nguyễn Văn A (Backend Developer)
* **Mức độ nghiêm trọng (Severity):** Major
* **Độ ưu tiên (Priority):** High
* **Mã chức năng (Module):** Appointments

## 2. Môi trường kiểm thử (Environment)
* **Hệ điều hành:** Windows 11
* **Phiên bản ứng dụng (Version):** v1.2.0-RC3
* **Cơ sở dữ liệu / API Endpoint:** `POST /api/v1/patient/appointments`

## 3. Các bước tái hiện lỗi (Steps to Reproduce)
1. Đăng nhập hệ thống bằng tài khoản Bệnh nhân hợp lệ thu được JWT Token.
2. Mở công cụ Postman, cấu hình request gửi đến `POST /api/v1/patient/appointments`.
3. Gửi Request Body với giá trị âm cho trường `doctorId`:
   ```json
   {
       "doctorId": -5,
       "appointmentTime": "2026-07-15T10:00:00",
       "appointmentType": "ONLINE",
       "reason": "Kiểm tra sức khỏe định kỳ"
   }
   ```
4. Nhấn nút Send để thực hiện gửi yêu cầu.

## 4. Kết quả thực tế (Actual Result)
* Hệ thống phản hồi mã lỗi `500 Internal Server Error` và hiển thị chi tiết vết ngăn xếp lỗi ngoại lệ (SQL Exception/NullPointerException) trong log của ứng dụng Backend do không tìm thấy thực thể bác sĩ có ID âm trong cơ sở dữ liệu.

## 5. Kết quả mong đợi (Expected Result)
* Hệ thống phải validate dữ liệu đầu vào bằng `@Min(1)` đối với các trường ID và trả về mã lỗi `400 Bad Request` cùng thông điệp lỗi trực quan chỉ ra lỗi dữ liệu đầu vào không hợp lệ.

## 6. Minh chứng / Bằng chứng lỗi (Evidence)
* **API Response (JSON):**
```json
{
    "timestamp": "2026-06-29T21:55:00.123",
    "status": 500,
    "error": "Internal Server Error",
    "message": "EntityNotFoundException: Doctor with id -5 not found",
    "path": "/api/v1/patient/appointments"
}
```
```

---

## 5. Kết luận
* Tài liệu này đã thiết lập đầy đủ khung quy chuẩn quản lý và báo cáo lỗi cho toàn bộ thành viên dự án.
* Đáp ứng đầy đủ các tiêu chí nghiệm thu của ticket **KCPM-821**.
