# BÁO CÁO TỔNG HỢP: 50 CA KIỂM THỬ GIÁ TRỊ BIÊN (BVA) VÀ 36 CA KIỂM THỬ PHÂN HOẠCH TƯƠNG ĐƯƠNG (EP)

**Mã Ticket Jira:** KCPM-824  
**Người thực hiện (Assignee):** Nguyễn Thị Ánh Ngọc  
**Email:** ngocnta4878@ut.edu.vn  
**Mục tiêu:** Tổng hợp toàn bộ các thiết kế kiểm thử hộp đen sử dụng kỹ thuật Phân tích Giá trị Biên (BVA) và Phân hoạch Lớp tương đương (EP) từ các phân hệ trong hệ thống (Auth, User, Patient Profile, Clinic Patients, Appointments, Health Metrics, Support Tickets, v.v.).

---

## 1. TỔNG QUAN HỒ SƠ ĐỘ BAO PHỦ (TEST COVERAGE SUMMARY)

Dự án đã thực hiện thiết kế và tổng hợp thành công:
*   **50 Ca kiểm thử BVA (Boundary Value Analysis):** Bao phủ các giá trị biên nhạy cảm ($min-1$, $min$, $min+1$, $max-1$, $max$, $max+1$) của các tham số API, độ dài chuỗi ký tự trên form, biên thời gian lịch hẹn, số lượng danh mục đơn thuốc, và các ngưỡng chẩn đoán chỉ số sức khỏe của bệnh nhân.
*   **36 Ca kiểm thử EP (Equivalence Partitioning):** Bao phủ các lớp tương đương hợp lệ (Valid) và không hợp lệ (Invalid) đối với các trường định danh ID, email định dạng RFC, độ phức tạp mật khẩu, trạng thái hệ thống, cấu trúc form đặt lịch khám, và phân vùng kết quả sức khỏe tự động.

---

## 2. BẢNG TỔNG HỢP 50 CA KIỂM THỬ GIÁ TRỊ BIÊN (50 BVA CASES TABLE)

| STT | Mã Test Case | Phân hệ / Chức năng | Trường kiểm thử | Loại Biên | Giá trị đầu vào (Input Value) | Kết quả mong đợi (Expected Result) |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **TC-BVA-01** | Đặt lịch khám | Thời gian hẹn (`appointmentTime`) | $min - 1$ | $t_{now} + 2\text{h } 59\text{m}$ | **Thất bại:** Trả lỗi thời gian tối thiểu 3 giờ. |
| **2** | **TC-BVA-02** | Đặt lịch khám | Thời gian hẹn (`appointmentTime`) | $min$ | $t_{now} + 3\text{ giờ}$ | **Thành công:** Lịch hẹn hợp lệ ở trạng thái `PENDING`. |
| **3** | **TC-BVA-03** | Đặt lịch khám | Thời gian hẹn (`appointmentTime`) | $max$ | $t_{now} + 15\text{ ngày}$ | **Thành công:** Lịch hẹn hợp lệ ở trạng thái `PENDING`. |
| **4** | **TC-BVA-04** | Đặt lịch khám | Thời gian hẹn (`appointmentTime`) | $max + 1$ | $t_{now} + 15\text{ ngày } 1\text{m}$ | **Thất bại:** Trả lỗi thời gian tối đa trước 15 ngày. |
| **5** | **TC-BVA-05** | Kê đơn thuốc | Danh sách thuốc (`items`) | $min - 1$ | 0 loại thuốc (Rỗng) | **Thất bại:** Trả lỗi đơn thuốc phải có ít nhất 1 loại. |
| **6** | **TC-BVA-06** | Kê đơn thuốc | Danh sách thuốc (`items`) | $min$ | 1 loại thuốc | **Thành công:** Tạo đơn thuốc hợp lệ. |
| **7** | **TC-BVA-07** | Phân trang API | Số trang (`page`) | $min - 1$ | `0` | **Thất bại:** API báo lỗi Page phải từ 1 trở lên. |
| **8** | **TC-BVA-08** | Phân trang API | Số trang (`page`) | $min$ | `1` | **Thành công:** Trả về trang kết quả số 1. |
| **9** | **TC-BVA-09** | Phân trang API | Số trang (`page`) | $max$ | `100` | **Thành công:** Trả về trang kết quả số 100. |
| **10**| **TC-BVA-10** | Phân trang API | Số trang (`page`) | $max + 1$ | `101` | **Thất bại:** API báo lỗi Số trang không vượt quá 100. |
| **11**| **TC-BVA-11** | Phân trang API | Kích thước trang (`size`) | $min - 1$ | `0` | **Thất bại:** API báo lỗi kích thước trang tối thiểu là 1. |
| **12**| **TC-BVA-12** | Phân trang API | Kích thước trang (`size`) | $min$ | `1` | **Thành công:** Trả về trang có đúng 1 bản ghi. |
| **13**| **TC-BVA-13** | Phân trang API | Kích thước trang (`size`) | $max$ | `50` | **Thành công:** Trả về trang có tối đa 50 bản ghi. |
| **14**| **TC-BVA-14** | Phân trang API | Kích thước trang (`size`) | $max + 1$ | `51` | **Thất bại:** API báo lỗi kích thước trang không vượt quá 50. |
| **15**| **TC-BVA-15** | Định danh API | Mã ID người dùng (`id`) | $min - 1$ | `0` | **Thất bại:** API báo lỗi định danh ID phải lớn hơn 0. |
| **16**| **TC-BVA-16** | Tìm kiếm API | Độ dài từ khóa (`keyword`) | $max + 1$ | Chuỗi 101 ký tự | **Thất bại:** API trả về lỗi độ dài từ khóa tối đa 100. |
| **17**| **TC-BVA-17** | Form Đăng ký | Mật khẩu (`password`) | $min - 1$ | Chuỗi 5 ký tự | **Thất bại:** Giao diện báo lỗi Mật khẩu từ 6 ký tự. |
| **18**| **TC-BVA-18** | Form Đăng ký | Mật khẩu (`password`) | $min$ | Chuỗi 6 ký tự | **Thành công:** Cho phép gửi thông tin mật khẩu hợp lệ. |
| **19**| **TC-BVA-19** | Form Đăng ký | Mật khẩu (`password`) | $min + 1$ | Chuỗi 7 ký tự | **Thành công:** Cho phép gửi thông tin mật khẩu hợp lệ. |
| **20**| **TC-BVA-20** | Form Bệnh nhân | Số tuổi (`age`) | $min - 1$ | `-1` | **Thất bại:** Giao diện báo lỗi Tuổi từ 0 đến 150. |
| **21**| **TC-BVA-21** | Form Bệnh nhân | Số tuổi (`age`) | $min$ | `0` (Trẻ sơ sinh) | **Thành công:** Cho phép lưu tuổi bệnh nhân hợp lệ. |
| **22**| **TC-BVA-22** | Form Bệnh nhân | Số tuổi (`age`) | $max$ | `150` | **Thành công:** Cho phép lưu tuổi bệnh nhân hợp lệ. |
| **23**| **TC-BVA-23** | Form Bệnh nhân | Số tuổi (`age`) | $max + 1$ | `151` | **Thất bại:** Giao diện báo lỗi Tuổi từ 0 đến 150. |
| **24**| **TC-BVA-24** | Form Bệnh nhân | Số điện thoại (`phone`) | $min - 1$ | Chuỗi 9 chữ số | **Thất bại:** Giao diện báo lỗi Điện thoại 10 chữ số. |
| **25**| **TC-BVA-25** | Form Bệnh nhân | Số điện thoại (`phone`) | $min / max$ | Chuỗi 10 chữ số | **Thành công:** Lưu số điện thoại hợp lệ. |
| **26**| **TC-BVA-26** | Form Bệnh nhân | Số điện thoại (`phone`) | $max + 1$ | Chuỗi 11 chữ số | **Thất bại:** Giao diện báo lỗi Điện thoại 10 chữ số. |
| **27**| **TC-BVA-27** | Đo Đường huyết | Chỉ số (`BLOOD_SUGAR`) | Biên NORMAL dưới - 1 | `3.9` mmol/L | **Thành công:** Phân loại kết quả trạng thái `LOW`. |
| **28**| **TC-BVA-28** | Đo Đường huyết | Chỉ số (`BLOOD_SUGAR`) | Biên NORMAL dưới | `4.0` mmol/L | **Thành công:** Phân loại kết quả trạng thái `NORMAL`. |
| **29**| **TC-BVA-29** | Đo Đường huyết | Chỉ số (`BLOOD_SUGAR`) | Biên NORMAL trên | `6.0` mmol/L | **Thành công:** Phân loại kết quả trạng thái `NORMAL`. |
| **30**| **TC-BVA-30** | Đo Đường huyết | Chỉ số (`BLOOD_SUGAR`) | Biên NORMAL trên + 1 | `6.1` mmol/L | **Thành công:** Phân loại kết quả `BORDERLINE_HIGH`. |
| **31**| **TC-BVA-31** | Đo Đường huyết | Chỉ số (`BLOOD_SUGAR`) | Biên HIGH dưới | `7.2` mmol/L | **Thành công:** Phân loại kết quả `BORDERLINE_HIGH`. |
| **32**| **TC-BVA-32** | Đo Đường huyết | Chỉ số (`BLOOD_SUGAR`) | Biên HIGH dưới + 1 | `7.3` mmol/L | **Thành công:** Phân loại kết quả trạng thái `HIGH`. |
| **33**| **TC-BVA-33** | Đo HbA1c | Chỉ số (`HBA1C`) | Biên NORMAL trên | `5.6` % | **Thành công:** Phân loại kết quả trạng thái `NORMAL`. |
| **34**| **TC-BVA-34** | Đo HbA1c | Chỉ số (`HBA1C`) | Biên BORDERLINE dưới | `5.7` % | **Thành công:** Phân loại kết quả `BORDERLINE_HIGH`. |
| **35**| **TC-BVA-35** | Đo HbA1c | Chỉ số (`HBA1C`) | Biên BORDERLINE trên | `6.4` % | **Thành công:** Phân loại kết quả `BORDERLINE_HIGH`. |
| **36**| **TC-BVA-36** | Đo HbA1c | Chỉ số (`HBA1C`) | Biên HIGH dưới | `6.5` % | **Thành công:** Phân loại kết quả trạng thái `HIGH`. |
| **37**| **TC-BVA-37** | Đo Nhịp tim | Chỉ số (`HEART_RATE`) | Biên LOW trên | `59` bpm | **Thành công:** Phân loại kết quả trạng thái `LOW`. |
| **38**| **TC-BVA-38** | Đo Nhịp tim | Chỉ số (`HEART_RATE`) | Biên NORMAL dưới | `60` bpm | **Thành công:** Phân loại kết quả trạng thái `NORMAL`. |
| **39**| **TC-BVA-39** | Đo Nhịp tim | Chỉ số (`HEART_RATE`) | Biên NORMAL trên | `100` bpm | **Thành công:** Phân loại kết quả trạng thái `NORMAL`. |
| **40**| **TC-BVA-40** | Đo Nhịp tim | Chỉ số (`HEART_RATE`) | Biên HIGH dưới | `101` bpm | **Thành công:** Phân loại kết quả trạng thái `HIGH`. |
| **41**| **TC-BVA-41** | Đo Chỉ số SpO2 | Chỉ số (`SPO2`) | Biên LOW trên | `89` % | **Thành công:** Phân loại kết quả trạng thái `LOW`. |
| **42**| **TC-BVA-42** | Đo Chỉ số SpO2 | Chỉ số (`SPO2`) | Biên BORDERLINE dưới | `90` % | **Thành công:** Phân loại kết quả `BORDERLINE_LOW`. |
| **43**| **TC-BVA-43** | Đo Chỉ số SpO2 | Chỉ số (`SPO2`) | Biên BORDERLINE trên | `93` % | **Thành công:** Phân loại kết quả `BORDERLINE_LOW`. |
| **44**| **TC-BVA-44** | Đo Chỉ số SpO2 | Chỉ số (`SPO2`) | Biên NORMAL dưới | `94` % | **Thành công:** Phân loại kết quả trạng thái `NORMAL`. |
| **45**| **TC-BVA-45** | Đo Huyết áp | Huyết áp Tâm thu (`sys`) | Biên NORMAL trên | `119` mmHg | **Thành công:** Phân loại kết quả trạng thái `NORMAL`. |
| **46**| **TC-BVA-46** | Đo Huyết áp | Huyết áp Tâm thu (`sys`) | Biên BORDERLINE dưới | `120` mmHg | **Thành công:** Phân loại kết quả `BORDERLINE_HIGH`. |
| **47**| **TC-BVA-47** | Đo Huyết áp | Huyết áp Tâm thu (`sys`) | Biên BORDERLINE trên | `140` mmHg | **Thành công:** Phân loại kết quả `BORDERLINE_HIGH`. |
| **48**| **TC-BVA-48** | Đo Huyết áp | Huyết áp Tâm thu (`sys`) | Biên HIGH dưới | `141` mmHg | **Thành công:** Phân loại kết quả trạng thái `HIGH`. |
| **49**| **TC-BVA-49** | Yêu cầu Hỗ trợ | Độ dài Tiêu đề (`subject`) | $min - 1$ | Chuỗi 4 ký tự | **Thất bại:** Báo lỗi Tiêu đề tối thiểu từ 5 ký tự. |
| **50**| **TC-BVA-50** | Yêu cầu Hỗ trợ | Độ dài Tiêu đề (`subject`) | $min$ | Chuỗi 5 ký tự | **Thành công:** Cho phép tạo yêu cầu hỗ trợ hợp lệ. |

---

## 3. BẢNG TỔNG HỢP 36 CA KIỂM THỬ PHÂN HOẠCH TƯƠNG ĐƯƠNG (36 EP CASES TABLE)

| STT | Mã Test Case | Phân hệ / Chức năng | Trường kiểm thử | Loại phân hoạch | Lớp tương đương (Equivalence Class) | Kết quả mong đợi (Expected Result) |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **TC-EP-01** | Xác thực tài khoản | Email (`email`) | Hợp lệ (Valid) | Email đúng định dạng chuẩn RFC | **Thành công:** Đăng nhập/Xác thực thành công. |
| **2** | **TC-EP-02** | Xác thực tài khoản | Email (`email`) | Không hợp lệ | Email thiếu ký tự `@` | **Thất bại:** Báo lỗi sai định dạng email. |
| **3** | **TC-EP-03** | Xác thực tài khoản | Email (`email`) | Không hợp lệ | Email thiếu phần tên miền | **Thất bại:** Báo lỗi sai định dạng email. |
| **4** | **TC-EP-04** | Cấu hình mật khẩu | Mật khẩu (`password`) | Hợp lệ (Valid) | Mật khẩu có độ dài $\ge 8$ ký tự | **Thành công:** Tạo mật khẩu hợp lệ. |
| **5** | **TC-EP-05** | Cấu hình mật khẩu | Mật khẩu (`password`) | Không hợp lệ | Mật khẩu độ dài quá ngắn ($< 8$) | **Thất bại:** Báo lỗi mật khẩu tối thiểu 8 ký tự. |
| **6** | **TC-EP-06** | Cấu hình mật khẩu | Mật khẩu (`password`) | Không hợp lệ | Mật khẩu thiếu chữ in hoa hoặc chữ số | **Thất bại:** Báo lỗi mật khẩu thiếu độ phức tạp. |
| **7** | **TC-EP-07** | Trạng thái người dùng | Trạng thái (`status`) | Hợp lệ (Valid) | Thuộc tập hợp: `ACTIVE`, `INACTIVE` | **Thành công:** Cập nhật trạng thái thành công. |
| **8** | **TC-EP-08** | Trạng thái người dùng | Trạng thái (`status`) | Không hợp lệ | Nằm ngoài vùng hỗ trợ (vd: `SUSPENDED`) | **Thất bại:** Báo lỗi vi phạm ràng buộc trạng thái. |
| **9** | **TC-EP-09** | Chi tiết thực thể | Mã định danh (`id`) | Hợp lệ (Valid) | ID có tồn tại trong hệ thống | **Thành công:** Trả về thông tin thực thể hợp lệ. |
| **10**| **TC-EP-10** | Chi tiết thực thể | Mã định danh (`id`) | Hợp lệ (Valid) | ID số nguyên nhưng không tồn tại trong DB | **Thất bại:** Báo lỗi 404 Resource Not Found. |
| **11**| **TC-EP-11** | Chi tiết thực thể | Mã định danh (`id`) | Không hợp lệ | ID có giá trị $\le 0$ (vd: `0`, `-5`) | **Thất bại:** Báo lỗi 400 Validation Error. |
| **12**| **TC-EP-12** | Chi tiết thực thể | Mã định danh (`id`) | Không hợp lệ | ID sai kiểu dữ liệu định dạng (vd: `"abc"`) | **Thất bại:** Báo lỗi đổi kiểu dữ liệu (Bad Request). |
| **13**| **TC-EP-13** | Đặt lịch hẹn | Form đặt lịch | Hợp lệ (Valid) | Form điền đầy đủ và đúng định dạng | **Thành công:** Tạo lịch hẹn mới (201 Created). |
| **14**| **TC-EP-14** | Đặt lịch hẹn | Bác sĩ khám (`doctorId`)| Không hợp lệ | Trường `doctorId` bị rỗng | **Thất bại:** Báo lỗi ID bác sĩ là bắt buộc. |
| **15**| **TC-EP-15** | Đặt lịch hẹn | Hình thức khám | Không hợp lệ | Trường `appointmentType` rỗng | **Thất bại:** Báo lỗi hình thức khám là bắt buộc. |
| **16**| **TC-EP-16** | Đặt lịch hẹn | Định dạng ngày giờ | Không hợp lệ | Ngày giờ sai format (vd: `2026/07/01 08:30`) | **Thất bại:** Báo lỗi parse LocalDateTime. |
| **17**| **TC-EP-17** | Đặt lịch hẹn | Quy tắc thời gian | Không hợp lệ | Ngày giờ khám nằm ngoài biên `now + 3h` | **Thất bại:** Báo lỗi nghiệp vụ vi phạm thời gian tối thiểu. |
| **18**| **TC-EP-18** | Giao diện đặt lịch | Trạng thái hiển thị | Hợp lệ (Disabled)| Dropdown bác sĩ rỗng, nút xác nhận khóa | **Thành công kiểm soát:** Nút submit ở trạng thái disabled. |
| **19**| **TC-EP-19** | Hủy lịch hẹn | Trạng thái hủy | Không hợp lệ | Hủy lịch khám đã được xác nhận (`SCHEDULED`)| **Thất bại:** Báo lỗi nghiệp vụ, trạng thái không đổi. |
| **20**| **TC-EP-20** | Phân loại sức khỏe | Đường huyết (`BLOOD_SUGAR`) | Hợp lệ (LOW) | Giá trị nhỏ hơn 4.0 mmol/L | **Thành công:** Phân loại kết quả trạng thái `LOW`. |
| **21**| **TC-EP-21** | Phân loại sức khỏe | Đường huyết (`BLOOD_SUGAR`) | Hợp lệ (NORMAL)| Giá trị từ 4.0 đến 6.0 mmol/L | **Thành công:** Phân loại kết quả trạng thái `NORMAL`. |
| **22**| **TC-EP-22** | Phân loại sức khỏe | Đường huyết (`BLOOD_SUGAR`) | Hợp lệ (BORDER) | Giá trị lớn hơn 6.0 đến 7.2 mmol/L | **Thành công:** Phân loại kết quả `BORDERLINE_HIGH`. |
| **23**| **TC-EP-23** | Phân loại sức khỏe | Đường huyết (`BLOOD_SUGAR`) | Hợp lệ (HIGH) | Giá trị lớn hơn 7.2 mmol/L | **Thành công:** Phân loại kết quả trạng thái `HIGH`. |
| **24**| **TC-EP-24** | Phân loại sức khỏe | HbA1c (`HBA1C`) | Hợp lệ (NORMAL)| Giá trị nhỏ hơn 5.7 % | **Thành công:** Phân loại kết quả trạng thái `NORMAL`. |
| **25**| **TC-EP-25** | Phân loại sức khỏe | HbA1c (`HBA1C`) | Hợp lệ (BORDER) | Giá trị từ 5.7 đến 6.4 % | **Thành công:** Phân loại kết quả `BORDERLINE_HIGH`. |
| **26**| **TC-EP-26** | Phân loại sức khỏe | HbA1c (`HBA1C`) | Hợp lệ (HIGH) | Giá trị lớn hơn 6.4 % | **Thành công:** Phân loại kết quả trạng thái `HIGH`. |
| **27**| **TC-EP-27** | Phân loại sức khỏe | Nhịp tim (`HEART_RATE`) | Hợp lệ (LOW) | Giá trị nhỏ hơn 60 bpm | **Thành công:** Phân loại nhịp tim chậm `LOW`. |
| **28**| **TC-EP-28** | Phân loại sức khỏe | Nhịp tim (`HEART_RATE`) | Hợp lệ (NORMAL)| Giá trị từ 60 đến 100 bpm | **Thành công:** Phân loại nhịp tim bình thường `NORMAL`. |
| **29**| **TC-EP-29** | Phân loại sức khỏe | Nhịp tim (`HEART_RATE`) | Hợp lệ (HIGH) | Giá trị lớn hơn 100 bpm | **Thành công:** Phân loại nhịp tim nhanh `HIGH`. |
| **30**| **TC-EP-30** | Phân loại sức khỏe | Chỉ số Oxy SpO2 (`SPO2`)| Hợp lệ (NORMAL)| Giá trị từ 94 % trở lên | **Thành công:** Phân loại nồng độ oxy bình thường `NORMAL`. |
| **31**| **TC-EP-31** | Phân loại sức khỏe | Chỉ số Oxy SpO2 (`SPO2`)| Hợp lệ (BORDER) | Giá trị từ 90 % đến dưới 94 % | **Thành công:** Phân loại nồng độ oxy `BORDERLINE_LOW`. |
| **32**| **TC-EP-32** | Phân loại sức khỏe | Chỉ số Oxy SpO2 (`SPO2`)| Hợp lệ (LOW) | Giá trị nhỏ hơn 90 % | **Thành công:** Phân loại nồng độ oxy nguy hiểm `LOW`. |
| **33**| **TC-EP-33** | Phân loại sức khỏe | Huyết áp (`BLOOD_PRESSURE`)| Hợp lệ (NORMAL)| Tâm thu < 120 VÀ Tâm trương < 80 mmHg | **Thành công:** Phân loại huyết áp bình thường `NORMAL`. |
| **34**| **TC-EP-34** | Phân loại sức khỏe | Huyết áp (`BLOOD_PRESSURE`)| Hợp lệ (BORDER) | Tâm thu <= 140 VÀ Tâm trương <= 90 mmHg | **Thành công:** Phân loại huyết áp `BORDERLINE_HIGH`. |
| **35**| **TC-EP-35** | Phân loại sức khỏe | Huyết áp (`BLOOD_PRESSURE`)| Hợp lệ (HIGH) | Tâm thu > 140 HOẶC Tâm trương > 90 mmHg | **Thành công:** Phân loại huyết áp cao nguy cơ `HIGH`. |
| **36**| **TC-EP-36** | Yêu cầu Hỗ trợ | Phân loại lỗi | Hợp lệ (Valid) | Thuộc: `Kỹ thuật`, `Hỗ trợ nghiệp vụ`, `Hạ tầng` | **Thành công:** Lưu đúng phân loại yêu cầu. |

---

## 4. KẾT LUẬN

*   Đã hoàn tất biên soạn báo cáo tổng hợp đầy đủ **50 ca kiểm thử giá trị biên (BVA)** và **36 ca kiểm thử phân hoạch tương đương (EP)** (đạt chỉ tiêu tối thiểu 50 BVA cases và 25 EP cases theo tài liệu mô tả yêu cầu kiểm thử của ticket **KCPM-824**).
*   Độ bao phủ của các ca kiểm thử hộp đen đã phủ rộng từ tầng Giao diện Form Frontend (validation độ dài ký tự, giới hạn khoảng tuổi, định dạng điện thoại), tầng API Gateway (phân trang page/size, định danh ID) cho tới tầng Logic Nghiệp vụ cốt lõi ở Backend (biên đặt lịch hẹn, ngưỡng chỉ số sức khỏe).
