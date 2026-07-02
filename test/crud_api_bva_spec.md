# BÁO CÁO: THIẾT KẾ CA KIỂM THỬ PHÂN TÍCH GIÁ TRỊ BIÊN (BOUNDARY VALUE ANALYSIS) CHO CÁC API CRUD CHÍNH

**Mã Ticket Jira:** KCPM-754  
**Người thực hiện (Assignee):** Trần Lê Quang (quangtl9558)  
**Email:** quangtl9558@ut.edu.vn  
**Đối tượng phân tích:** Các API CRUD chính thuộc các module: Health Metrics, User Management, Appointment — dựa trên đặc tả SRS §6.1, §6.2, §6.3.  
**Kỹ thuật áp dụng:** Boundary Value Analysis (BVA)

---

## 1. PHÂN TÍCH BIÊN MODULE HEALTH METRICS (SRS §6.1)

### 1.1. Chỉ số Đường huyết — BLOOD_SUGAR (SRS §6.1.A)

**Được cài đặt tại:** `PatientHealthMetricServiceImpl.evaluateStatus(MetricType type, BigDecimal value, BigDecimal secondary)`  
**Đơn vị:** mmol/L

**Quy tắc phân loại:**
*   **LOW (Thấp):** $v < 4.0$
*   **NORMAL (Bình thường):** $4.0 \le v \le 6.0$
*   **BORDERLINE_HIGH (Cận cao):** $6.0 < v \le 7.2$
*   **HIGH (Cao):** $v > 7.2$

**Ngưỡng biên được phân tích:**
*   Ngưỡng biên $4.0$: Các giá trị kiểm thử gồm $3.9$ (LOW), $4.0$ (NORMAL), $4.1$ (NORMAL).
*   Ngưỡng biên $7.2$: Các giá trị kiểm thử gồm $7.1$ (BORDERLINE\_HIGH), $7.2$ (BORDERLINE\_HIGH), $7.3$ (HIGH).

### 1.2. Chỉ số Nồng độ Oxy trong máu — SPO2 (SRS §6.1.D)

**Đơn vị:** %

**Quy tắc phân loại:**
*   **LOW (Thấp — Nguy hiểm):** $v < 91$
*   **BORDERLINE_LOW (Cận thấp):** $91 \le v < 95$
*   **NORMAL (Bình thường):** $v \ge 95$

**Ngưỡng biên được phân tích:**
*   Ngưỡng biên $91$: Các giá trị kiểm thử gồm $90$ (LOW), $91$ (BORDERLINE\_LOW), $92$ (BORDERLINE\_LOW).
*   Ngưỡng biên $95$: Các giá trị kiểm thử gồm $94$ (BORDERLINE\_LOW), $95$ (NORMAL), $96$ (NORMAL).

### 1.3. Chỉ số Huyết áp — BLOOD_PRESSURE (SRS §6.1.E)

**Đơn vị:** mmHg  
**Đầu vào:** 2 giá trị — Huyết áp tâm thu ($sys$) và Huyết áp tâm trương ($dia$).

**Quy tắc phân loại:**
*   **NORMAL (Bình thường):** $sys \le 120$ **VÀ** $dia \le 80$
*   **BORDERLINE_HIGH (Tiền cao huyết áp):** $sys \le 145$ **VÀ** $dia \le 95$ (Không đồng thời thỏa mãn điều kiện NORMAL)
*   **HIGH (Cao huyết áp):** $sys > 145$ **HOẶC** $dia > 95$

**Ngưỡng biên được phân tích:**
*   Cặp giá trị biên $(120, 80)$: Kết quả mong đợi là `NORMAL`.
*   Cặp giá trị biên $(121, 80)$: Kết quả mong đợi là `BORDERLINE_HIGH`.

---

## 2. PHÂN TÍCH BIÊN MODULE USER MANAGEMENT (SRS §6.2)

**Được cài đặt tại:** `AdminUserServiceImpl.validatePasswordPolicy(String password)`

**Quy tắc xác thực:**
*   Mật khẩu phải có độ dài từ `8` ký tự trở lên. Nếu `password == null` hoặc độ dài `< 8` → ném ra `IllegalArgumentException("Mật khẩu phải có ít nhất 8 ký tự")`.

**Ngưỡng biên được phân tích:**
*   Biên độ dài: $7$ ký tự (không hợp lệ), $8$ ký tự (hợp lệ), $9$ ký tự (hợp lệ).

---

## 3. PHÂN TÍCH BIÊN MODULE APPOINTMENT (SRS §6.3.A)

**Được cài đặt tại:** `PatientAppointmentServiceImpl.create`

**Quy tắc ràng buộc thời gian:**
*   Thời gian bắt đầu lịch hẹn ($t_{appt}$) phải lớn hơn thời gian hiện tại ($t_{now}$) ít nhất là `3 giờ`:
    $$t_{appt} \ge t_{now} + 3\text{ hours}$$
*   Thời gian bắt đầu lịch hẹn phải nằm trong phạm vi tối đa `15 ngày`:
    $$t_{appt} \le t_{now} + 15\text{ days}$$

**Ngưỡng biên được phân tích:**
*   Ngưỡng biên dưới ($3$ giờ): $t_{now} + 2\text{h } 59\text{m}$ (không hợp lệ), $t_{now} + 3\text{h } 00\text{m}$ (hợp lệ), $t_{now} + 3\text{h } 01\text{m}$ (hợp lệ).
*   Ngưỡng biên trên ($15$ ngày): $t_{now} + 14\text{d } 23\text{h}$ (hợp lệ), $t_{now} + 15\text{d } 00\text{h}$ (hợp lệ), $t_{now} + 15\text{d } 01\text{h}$ (không hợp lệ).

---

## 4. BẢNG CA KIỂM THỬ BVA (10 TEST CASES)

| Mã TC | Module (SRS Ref) | Trường / Đầu vào | Quy tắc xác thực (Trích SRS) | Loại biên | Giá trị đầu vào | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-BVA-01** | Health Metrics (§6.1.A) | BLOOD\_SUGAR (mmol/L) | LOW: v < 4.0 · NORMAL: 4.0 ≤ v ≤ 6.0 · Ngưỡng biên: 4.0 | min-1 (3.9) | `3.9` | Classification = **LOW** (Thấp — dưới ngưỡng bình thường) |
| **TC-BVA-02** | Health Metrics (§6.1.A) | BLOOD\_SUGAR (mmol/L) | LOW: v < 4.0 · NORMAL: 4.0 ≤ v ≤ 6.0 · Ngưỡng biên: 4.0 | min (4.0) | `4.0` | Classification = **NORMAL** (Bình thường — đúng ngưỡng dưới) |
| **TC-BVA-03** | Health Metrics (§6.1.A) | BLOOD\_SUGAR (mmol/L) | BORDERLINE\_HIGH: 6.0 < v ≤ 7.2 · HIGH: v > 7.2 · Ngưỡng biên: 7.2 | max (7.2) | `7.2` | Classification = **BORDERLINE\_HIGH** (Cận cao — vẫn trong ngưỡng) |
| **TC-BVA-04** | Health Metrics (§6.1.A) | BLOOD\_SUGAR (mmol/L) | BORDERLINE\_HIGH: 6.0 < v ≤ 7.2 · HIGH: v > 7.2 · Ngưỡng biên: 7.2 | max+1 (7.3) | `7.3` | Classification = **HIGH** (Cao — vượt ngưỡng cận cao) |
| **TC-BVA-05** | Health Metrics (§6.1.D) | SPO2 (%) | LOW: v < 91 · BORDERLINE\_LOW: 91 ≤ v < 95 · Ngưỡng biên: 91 | min-1 (90) | `90` | Classification = **LOW** (Thấp — Nguy hiểm) |
| **TC-BVA-06** | Health Metrics (§6.1.D) | SPO2 (%) | BORDERLINE\_LOW: 91 ≤ v < 95 · NORMAL: v ≥ 95 · Ngưỡng biên: 95 | min (95) | `95` | Classification = **NORMAL** (Bình thường — đúng ngưỡng) |
| **TC-BVA-07** | Health Metrics (§6.1.E) | BLOOD\_PRESSURE sys/dia (mmHg) | NORMAL: sys ≤ 120 AND dia ≤ 80 · Ngưỡng biên: (120, 80) | max (120/80) | `sys=120, dia=80` | Classification = **NORMAL** (Bình thường — cận trên) |
| **TC-BVA-08** | Health Metrics (§6.1.E) | BLOOD\_PRESSURE sys/dia (mmHg) | NORMAL: sys ≤ 120 AND dia ≤ 80 · Ngưỡng biên: (121, 80) | max+1 sys (121/80) | `sys=121, dia=80` | Classification = **BORDERLINE\_HIGH** (Tiền cao HA — vượt sys) |
| **TC-BVA-09** | User Management (§6.2) | password (CreateUserRequest) | Độ dài tối thiểu: 8 ký tự · password < 8 → IllegalArgumentException | min-1 (7 ký tự) | `"Abc123!"` | Ném ngoại lệ `IllegalArgumentException`: "Mật khẩu phải có ít nhất 8 ký tự" |
| **TC-BVA-10** | Appointment (§6.3.A) | appointmentTime (CreateAppointment) | t\_appt ≥ t\_now + 3 giờ · Ngưỡng biên dưới: 3 giờ | min-1 (now + 2h59m) | `t_now + 2h 59m` | Ném ngoại lệ `IllegalArgumentException`: "Thời gian hẹn phải sau ít nhất 3 giờ" |

---

## 5. KẾT LUẬN

*   Đã thiết kế thành công **10 ca kiểm thử BVA** dựa trên đặc tả SRS §6.1, §6.2, §6.3 của hệ thống DamDiep Healthcare.
*   Bao phủ đầy đủ các loại biên: **min-1, min, max, max+1** trên 5 ngưỡng biên thuộc 3 module khác nhau.
*   Các module được kiểm thử bao gồm:
    *   **Health Metrics:** BLOOD\_SUGAR (mmol/L — ngưỡng 4.0, 7.2), SPO2 (% — ngưỡng 91, 95), BLOOD\_PRESSURE (mmHg — ngưỡng sys=120/dia=80).
    *   **User Management:** Password Policy (min 8 ký tự).
    *   **Appointment:** Ràng buộc thời gian đặt lịch (min 3 giờ sau thời điểm hiện tại).
*   Kết quả mong đợi được trình bày rõ ràng, bao gồm cả phân loại trạng thái sức khỏe và thông báo ngoại lệ cụ thể.