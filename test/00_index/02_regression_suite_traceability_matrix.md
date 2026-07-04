# BÁO CÁO: THIẾT KẾ BỘ KIỂM THỬ HỒI QUY (REGRESSION SUITE) VÀ MA TRẬN TRUY VẾT (TRACEABILITY MATRIX)

**Mã Ticket Jira:** KCPM-812  
**Người thực hiện (Assignee):** Trần Lê Quang (quangtl9558)  
**Email:** quangtl9558@ut.edu.vn  
**Đối tượng phân tích:** Toàn bộ tài liệu Test Plan, API Matrix, E2E Scenarios, BVA/EP/White-box đã hoàn thành bởi các thành viên nhóm KCPM, tổng hợp từ thư mục `test/` của repository `DuyMinhED/ktpm`.  
**Kỹ thuật áp dụng:** Regression Testing, Traceability Matrix Design, Test Suite Prioritization.  
**Nguồn dữ liệu:** 50+ tài liệu kiểm thử có gắn `Mã Ticket Jira` và `Người thực hiện` chuẩn hóa trong thư mục `test/`.

---

## 1. NGUYÊN TẮC ƯU TIÊN (PRIORITIZATION)

Bộ kiểm thử hồi quy được phân theo 3 mức ưu tiên dựa trên mức độ ảnh hưởng nghiệp vụ:

| Priority | Tiêu chí | Ví dụ |
| :---: | :--- | :--- |
| **P0 — Critical** | Luồng xác thực, phân quyền, dữ liệu sức khỏe cốt lõi (Health Metrics), thanh toán/kê đơn thuốc | Login, JWT validation, Prescription, Health Metrics classification |
| **P1 — High** | CRUD chính của Admin/Clinic/Doctor/Patient, Appointment lifecycle | Appointment create/cancel/reschedule, User/Clinic management |
| **P2 — Medium** | Dashboard, Reports, Notifications, Support Tickets | Dashboard stats, Audit logs, Notification read status |

---

## 2. MA TRẬN BỘ KIỂM THỬ HỒI QUY (REGRESSION SUITE MATRIX)

### 2.1. Nhóm A — Backend API Testing (Postman / pm.test)

| Test ID | Module | Priority | Owner | Expected Evidence | Jira Mapping |
| :--- | :--- | :---: | :--- | :--- | :---: |
| TC-REG-API-01 | Auth & Admin Dashboard (5 endpoints) | P0 | Trần Lê Quang | Postman Run Result screenshot (32 assertions) | KCPM-772 |
| TC-REG-API-02 | Admin Config | P1 | Hồ Văn Duy | Postman Run Result | KCPM-776 |
| TC-REG-API-03 | Clinic Dashboard & Profile (4 endpoints) | P1 | Trần Lê Quang | Postman Run Result (19 assertions) | KCPM-777 |
| TC-REG-API-04 | Clinic Patients | P1 | Nguyễn Thị Ánh Ngọc | Postman Run Result | KCPM-779 |
| TC-REG-API-05 | Clinic Doctors | P1 | Hồ Văn Duy | Postman Run Result | KCPM-781 |
| TC-REG-API-06 | Clinic Appointments (3 endpoints) | P1 | Trần Lê Quang | Postman Run Result (13 assertions, 1 bug ghi nhận) | KCPM-782 |
| TC-REG-API-07 | Clinic Risk Alerts | P1 | Nguyễn Thị Ánh Ngọc | Postman Run Result | KCPM-784 |
| TC-REG-API-08 | Doctor Appointments | P1 | Hồ Văn Duy | Postman Run Result | KCPM-786 |
| TC-REG-API-09 | Doctor Patients (3 endpoints) | P1 | Trần Lê Quang | Postman Run Result (15 assertions) | KCPM-787 |
| TC-REG-API-10 | Doctor Prescriptions | P0 | Nguyễn Thị Ánh Ngọc | Postman Run Result | KCPM-789 |
| TC-REG-API-11 | Patient Appointments | P1 | Hồ Văn Duy | Postman Run Result | KCPM-791 |
| TC-REG-API-12 | Patient Health Metrics (5 endpoints) | P0 | Trần Lê Quang | Postman Run Result (24 assertions) | KCPM-792 |
| TC-REG-API-13 | Patient Prescriptions | P0 | Nguyễn Thị Ánh Ngọc | Postman Run Result | KCPM-794 |
| TC-REG-API-14 | Patient Profile | P1 | Hồ Văn Duy | Postman Run Result | KCPM-796 |
| TC-REG-API-15 | Notifications (3 endpoints) | P2 | Trần Lê Quang | Postman Run Result (14 assertions) | KCPM-797 |
| TC-REG-API-16 | Public Doctors CRUD | P1 | Nguyễn Phạm Hùng | Postman Run Result | KCPM-800 |
| TC-REG-API-17 | Medical Services (test design) | P1 | Hồ Văn Duy | Postman Run Result | KCPM-801 |
| TC-REG-API-18 | Medical Services (5 endpoints, thực thi) | P1 | Trần Lê Quang | Postman Run Result (21 assertions, 2 bug ghi nhận) | KCPM-802 |
| TC-REG-API-19 | Support Tickets | P2 | Nguyễn Thị Ánh Ngọc | Postman Run Result | KCPM-804 |
| TC-REG-API-20 | AI Chat & Public Doctors | P2 | Nguyễn Thị Ánh Ngọc | Postman Run Result | KCPM-799 |
| TC-REG-API-21 | Postman Environment Config | P0 (hạ tầng) | Nguyễn Phạm Hùng | Environment export file | KCPM-770 |
| TC-REG-API-22 | Postman Test Scripts (chuẩn hóa) | P0 (hạ tầng) | Hồ Văn Duy | Script template document | KCPM-771 |

**Tổng nhóm A:** 22 test suite, phủ toàn bộ 8 module API (Auth, Admin, Clinic, Doctor, Patient, Notifications, Medical Services, Support).

### 2.2. Nhóm B — Frontend E2E Testing (CodeceptJS)

| Test ID | Module | Priority | Owner | Expected Evidence | Jira Mapping |
| :--- | :--- | :---: | :--- | :--- | :---: |
| TC-REG-E2E-01 | Frontend Form BVA | P1 | Hồ Văn Duy | `codecept.conf.js` run log | KCPM-752 |
| TC-REG-E2E-02 | Frontend E2E Scenarios (role-based) | P1 | Hồ Văn Duy | CodeceptJS scenario run report | KCPM-811 |
| TC-REG-E2E-03 | Frontend E2E Checklist | P1 | Nguyễn Phạm Hùng | Checklist hoàn thành + screenshot | KCPM-820 |
| TC-REG-E2E-04 | Frontend Static Review | P2 | Nguyễn Phạm Hùng | Static review document | KCPM-815 |
| TC-REG-E2E-05 | Frontend CI Failure Fix | P0 (hạ tầng CI) | Nguyễn Thị Ánh Ngọc | CI pipeline pass log | KCPM-832 |

**Tổng nhóm B:** 5 test suite, phủ E2E theo vai trò (Admin/Clinic/Doctor/Patient) trên môi trường deploy Vercel.

### 2.3. Nhóm C — Security Testing

| Test ID | Module | Priority | Owner | Expected Evidence | Jira Mapping |
| :--- | :--- | :---: | :--- | :--- | :---: |
| TC-REG-SEC-01 | JWT Permission (EP) | P0 | Hồ Văn Duy | EP table + test case | KCPM-753 |
| TC-REG-SEC-02 | Auth Login (White-box) | P0 | Nguyễn Phạm Hùng | CFG + V(G) + JUnit result | KCPM-760 |
| TC-REG-SEC-03 | JWT Validation (White-box) | P0 | Hồ Văn Duy | CFG + V(G) + JUnit result | KCPM-761 |
| TC-REG-SEC-04 | JWT Security (tổng hợp) | P0 | Nguyễn Thị Ánh Ngọc | Test spec tổng hợp | KCPM-819 |
| TC-REG-SEC-05 | Security & Support White-box Graph | P1 | (Nhóm) | CFG + Basis Path | — (tài liệu tham chiếu) |

**Tổng nhóm C:** 5 test suite, phủ toàn bộ luồng xác thực JWT và phân quyền RBAC — mức ưu tiên P0 tuyệt đối vì ảnh hưởng bảo mật toàn hệ thống.

### 2.4. Nhóm D — Boundary Value Analysis (BVA)

| Test ID | Module | Priority | Owner | Expected Evidence | Jira Mapping |
| :--- | :--- | :---: | :--- | :--- | :---: |
| TC-REG-BVA-01 | CRUD APIs chính (Health Metrics, Password, Appointment Time) | P0 | Trần Lê Quang | BVA table (10 test cases) | KCPM-754 |
| TC-REG-BVA-02 | Core Business BVA (SRS §6 mở rộng) | P0 | Nguyễn Thị Ánh Ngọc | BVA table | KCPM-758 |
| TC-REG-BVA-03 | Frontend Form BVA | P1 | Hồ Văn Duy | BVA table (UI) | KCPM-752 (trùng E2E-01) |
| TC-REG-BVA-04 | Health Metric EP+BVA kết hợp | P0 | (Nhóm) | Bảng kết hợp | — (tài liệu tham chiếu) |
| TC-REG-BVA-05 | BVA/EP Test Cases Summary Report | — (tổng hợp) | Nguyễn Thị Ánh Ngọc | Báo cáo tổng hợp toàn bộ BVA/EP | KCPM-824 |

**Tổng nhóm D:** 5 test suite, đảm bảo phủ đầy đủ min-1/min/min+1/max-1/max/max+1 cho các ngưỡng nghiệp vụ quan trọng nhất (SRS §6).

### 2.5. Nhóm E — Equivalence Partitioning (EP)

| Test ID | Module | Priority | Owner | Expected Evidence | Jira Mapping |
| :--- | :--- | :---: | :--- | :--- | :---: |
| TC-REG-EP-01 | CRUD Data chính (Valid/Duplicate/Missing/WrongType/Relationship) | P0 | Trần Lê Quang | EP table (7 test cases) | KCPM-755 |
| TC-REG-EP-02 | ID/Status EP | P1 | Nguyễn Thị Ánh Ngọc | EP table | KCPM-759 |
| TC-REG-EP-03 | JWT Permission EP | P0 | Hồ Văn Duy | EP table | KCPM-753 (trùng SEC-01) |
| TC-REG-EP-04 | Auth/User EP | P0 | (Nhóm) | EP table | — (tài liệu tham chiếu) |
| TC-REG-EP-05 | Patient Appointment EP | P1 | (Nhóm) | EP table | — (tài liệu tham chiếu) |

**Tổng nhóm E:** 5 test suite, phủ đủ 5 lớp tương đương (Valid, Invalid Missing, Duplicate, Wrong Type, Invalid Relationship).

### 2.6. Nhóm F — White-box Testing (CFG + V(G) + Basis Path)

| Test ID | Module | Priority | Owner | Expected Evidence | Jira Mapping |
| :--- | :--- | :---: | :--- | :--- | :---: |
| TC-REG-WB-01 | Admin Clinic (toggle/update) | P1 | Nguyễn Phạm Hùng | CFG + V(G)=3,7 + 10 TC | KCPM-765 |
| TC-REG-WB-02 | Admin User (create/update/password) | P0 | Trần Lê Quang | CFG + V(G)=3,7,6 + 16 TC | KCPM-762 |
| TC-REG-WB-03 | Appointment (6 methods, KCPM-671) | P1 | Trần Lê Quang | CFG ×6 + V(G) + 33 TC | KCPM-671 |
| TC-REG-WB-04 | Risk Alert Dashboard | P2 | Trần Lê Quang | CFG + V(G)=4,5 + 9 TC | KCPM-767 |
| TC-REG-WB-05 | Prescription | P0 | Hồ Văn Duy | CFG + Basis Path | KCPM-766 |
| TC-REG-WB-06 | Notification | P2 | Nguyễn Thị Ánh Ngọc | CFG + Basis Path | KCPM-769 |
| TC-REG-WB-07 | Support Ticket | P2 | Nguyễn Thị Ánh Ngọc | CFG + Basis Path | KCPM-764 |
| TC-REG-WB-08 | Prescription API (Controller/Security/Coverage) | P0 | Trần Lê Quang | JaCoCo Coverage Report | KCPM-38 (KCPM-41/42/43) |
| TC-REG-WB-09 | Test The Classes Clinic (7 classes) | P1 | Trần Lê Quang | 35 JUnit test cases | KCPM-668 |
| TC-REG-WB-10 | Backend Service White-box Design (tổng hợp) | — (tổng hợp) | (Nhóm) | `mvn verify` — 627 tests pass | — (tài liệu tham chiếu) |

**Tổng nhóm F:** 10 test suite, đây là nhóm có khối lượng lớn nhất, phủ toàn bộ service logic phức tạp có nhánh điều kiện.

---

## 3. TỔNG HỢP MA TRẬN TRUY VẾT (TRACEABILITY SUMMARY)

| Nhóm kỹ thuật | Số Test Suite | Số Jira Ticket liên kết | Owner tham gia |
| :--- | :---: | :---: | :--- |
| A. Backend API (Postman) | 22 | 22 | Trần Lê Quang, Hồ Văn Duy, Nguyễn Thị Ánh Ngọc, Nguyễn Phạm Hùng |
| B. Frontend E2E | 5 | 5 | Hồ Văn Duy, Nguyễn Phạm Hùng, Nguyễn Thị Ánh Ngọc |
| C. Security | 5 | 4 | Hồ Văn Duy, Nguyễn Phạm Hùng, Nguyễn Thị Ánh Ngọc |
| D. BVA | 5 | 3 (2 trùng lặp có chủ đích) | Trần Lê Quang, Nguyễn Thị Ánh Ngọc, Hồ Văn Duy |
| E. EP | 5 | 3 (2 trùng lặp có chủ đích) | Trần Lê Quang, Nguyễn Thị Ánh Ngọc, Hồ Văn Duy |
| F. White-box | 10 | 9 | Trần Lê Quang, Hồ Văn Duy, Nguyễn Phạm Hùng, Nguyễn Thị Ánh Ngọc |
| **Tổng** | **52** | **~46 Jira Ticket duy nhất** | **5 thành viên** |

*Ghi chú về thành viên nhóm:* Nhóm KCPM gồm **5 thành viên**: Trần Lê Quang, Hồ Văn Duy, Nguyễn Thị Ánh Ngọc, Nguyễn Phạm Hùng, và **Nguyễn Duy Minh** (chủ repository `DuyMinhED/ktpm`, phụ trách quản trị repo, thiết lập CI/CD pipeline, Jira Automation, và review/merge Pull Request — không trực tiếp đứng tên tác giả tài liệu kiểm thử trong thư mục `test/` nhưng đóng vai trò hạ tầng then chốt cho toàn bộ quy trình kiểm thử của nhóm).

---

## 4. BUG ĐÃ PHÁT HIỆN QUA REGRESSION SUITE (LIÊN KẾT TỪ CÁC TASK TRƯỚC)

| Bug ID | Mô tả ngắn | Test Suite phát hiện | Mức độ | Trạng thái |
| :--- | :--- | :---: | :---: | :---: |
| BUG-01 | `IllegalStateException` bị map thành 500 thay vì 400 khi cập nhật Appointment đã COMPLETED/CANCELLED | TC-REG-API-06 (KCPM-782) | Trung bình | Đã ghi nhận, chờ fix |
| BUG-02 | Không đồng nhất định dạng role string (`"ADMIN"` vs `"ROLE_ADMIN"`) gây từ chối quyền Admin hợp lệ khi tạo Medical Service | TC-REG-API-18 (KCPM-802) | Cao | Đã ghi nhận, chờ fix |
| BUG-03 | `RuntimeException` chung cho lỗi "not found" bị map thành 500 thay vì 404 — pattern lặp lại nhiều service | TC-REG-API-18 (KCPM-802), phân tích mở rộng ở KCPM-807 | Trung bình (hệ thống) | Đã ghi nhận, cần rà soát toàn codebase |
| BUG-04 (rủi ro) | `SupportTicketController` không có `@PreAuthorize` — lỗ hổng phân quyền tiềm ẩn | KCPM-807 (Backend Test Conditions Analysis) | Cao (bảo mật) | Cần xác nhận thêm |

---

## 5. KẾT LUẬN

*   Đã thiết kế thành công **Bộ kiểm thử hồi quy (Regression Suite)** gồm **52 test suite**, tổ chức theo 6 nhóm kỹ thuật: Backend API (Postman), Frontend E2E, Security, BVA, EP, và White-box — đáp ứng đầy đủ yêu cầu completion criteria của đề bài.
*   **Ma trận truy vết (Traceability Matrix)** liên kết mỗi test suite với: Test ID duy nhất, Module, mức độ ưu tiên (P0/P1/P2), Owner phụ trách, loại bằng chứng mong đợi (Postman Run Result, JUnit/JaCoCo Coverage, CFG diagram, EP/BVA table), và mã Jira Ticket tương ứng.
*   Bộ kiểm thử bao phủ **4 lớp bảo mật/logic quan trọng nhất** (P0): Xác thực JWT & RBAC, Prescription, Health Metrics classification (SRS §6.1), và User/Admin password policy (SRS §6.2) — đây là các luồng cần chạy **mỗi lần regression** trước khi release.
*   Tổng hợp và liên kết **4 bug thực tế** đã phát hiện xuyên suốt các task trước (KCPM-782, KCPM-802, KCPM-807), cho thấy quy trình kiểm thử của nhóm không chỉ dừng ở việc viết test mà còn tạo ra giá trị phát hiện lỗi thực sự cho sản phẩm.
*   Ma trận này có thể dùng làm **checklist chạy regression** trước mỗi lần merge lên `main` hoặc trước khi release — ưu tiên chạy nhóm P0 (Security, BVA cốt lõi, Prescription) trước, sau đó đến P1 (CRUD chính), cuối cùng là P2 (Dashboard, Notifications).