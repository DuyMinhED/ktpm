- Quyết định M1: `lastMetric != null` ? (Gán dữ liệu Metric Status hoặc "Chưa có dữ liệu").
- Quyết định M2: `doctorId != null` ? (Nếu có thì truy cập `userRepository` để lấy tên, nếu không thì hiển thị "Chưa phân công").
- Quyết định M3: `nextApp != null` ? (Lấy thời gian hẹn từ danh sách).
- Quyết định M4: `nextApp != null && nextApp.getAppointmentTime().isBefore(now)` ? (Đặt cờ quá hạn cuộc hẹn `appointmentOverdue`).

### 6.2. Control Flow Testing

#### A. Statement & Branch/Decision Testing
| Mã TC | Trạng thái cơ sở dữ liệu | Nhánh đi qua (Path) | Kết quả mong đợi |
| :--- | :--- | :--- | :--- |
| **TC-WB-RAD-01** | `total` = 0 (Phòng khám chưa có bệnh nhân nào) | `Dec1(No) -> 1b -> 2 -> 3 -> 4 -> 5 -> 6 -> 7` | Trả về Dashboard với tỉ lệ rủi ro cao là `0%` |
| **TC-WB-RAD-02** | `total` > 0 (Có bệnh nhân), bệnh nhân rủi ro cao có đầy đủ bác sĩ, đo chỉ số y tế, và cuộc hẹn chưa quá hạn | `Dec1(Yes) -> 1a -> 2 -> 3 -> 4 -> 5 -> 6 -> 7` | Trả về tỉ lệ phần trăm chính xác. Danh sách rủi ro cao đầy đủ bác sĩ và thông số, cờ quá hạn cuộc hẹn là `false` |
| **TC-WB-RAD-03** | `total` > 0, bệnh nhân không được gán bác sĩ (`doctorId` = `null`), chưa đo chỉ số y tế (`lastMetric` = `null`), cuộc hẹn kế tiếp đã quá hạn | `Dec1(Yes) -> 1a -> 2 -> 3 -> 4 -> 5 -> 6 -> 7` | Trả về tỉ lệ chính xác. Bác sĩ của bệnh nhân rủi ro cao là "Chưa phân công", thông số cuối là "Chưa có dữ liệu", cờ quá hạn cuộc hẹn là `true` |

### 6.3. Data Flow Testing
| Biến | Điểm định nghĩa (Def) | Điểm sử dụng (Use) | Loại sử dụng | DU-path kiểm tra | Mã TC kiểm tra |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `clinicId` | Tham số đầu vào | Điền vào các câu truy vấn repository | C-use | `Tham số -> Node 1`, `Tham số -> Node 3`, `Tham số -> Node 4` | TC-WB-RAD-01, TC-WB-RAD-02 |
| `total` | Đếm số lượng từ repo (Dòng 42) | So sánh `total > 0` và làm mẫu số chia | C-use & Điều kiện | `Node 1 -> Dec1`, `Node 1 -> Node 1a` | TC-WB-RAD-01, TC-WB-RAD-02 |
| `highRisk` | Đếm từ repo (Dòng 43) | Tính tỉ lệ phần trăm | C-use | `Node 1 -> Node 1a` | TC-WB-RAD-02 |