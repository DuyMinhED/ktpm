# BÁO CÁO: KIỂM THỬ CHỨC NĂNG PHÂN LOẠI CHỈ SỐ SỨC KHỎE (HEALTH METRICS EVALUATION)

**Phương pháp áp dụng:** Phân hoạch lớp tương đương (Equivalence Partitioning), phân tích giá trị biên (Boundary Value Analysis), thiết kế test case và kiểm thử tự động (Unit Test).  
**Mã số Sinh viên:** 089205001272  

---

## 1. Mục tiêu kiểm thử

1. Xác định được điều kiện kiểm thử từ đặc tả hàm phân loại trạng thái chỉ số sức khỏe của dự án Chronic Disease Management.
2. Áp dụng kỹ thuật phân hoạch lớp tương đương để chia miền giá trị đầu vào của các loại chỉ số đo thành các vùng hợp lệ.
3. Áp dụng kỹ thuật phân tích giá trị biên để thiết kế các test case kiểm tra tính đúng đắn của logic phân loại tại ranh giới.
4. Triển khai kiểm thử tự động (Unit Test) bằng Java/JUnit 5 để chạy tự động và kiểm chứng các test case.

---

## 2. Mô tả bài toán kiểm thử

Trong hệ thống, chức năng phân loại trạng thái chỉ số sức khỏe của bệnh nhân được cài đặt tại phương thức:
* **Class:** `PatientHealthMetricServiceImpl`
* **Hàm:** `evaluateStatus(MetricType type, BigDecimal value, BigDecimal secondary)`

Hàm này phân loại các chỉ số đo sức khỏe (`BLOOD_SUGAR`, `HBA1C`, `HEART_RATE`, `SPO2`, `BLOOD_PRESSURE`) thành các nhãn trạng thái tương ứng (`LOW`, `NORMAL`, `BORDERLINE_HIGH`, `HIGH`, `BORDERLINE_LOW`) dựa trên các ngưỡng giá trị số thực.

---

## 3. Xác định các lớp tương đương (Equivalence Partitioning)

Dưới đây là bảng phân hoạch các lớp tương đương cho 5 chỉ số sức khỏe trong hệ thống:

| Chỉ số | Lớp tương đương hợp lệ | Tag | Trạng thái đầu ra mong đợi |
| :--- | :--- | :--- | :--- |
| **BLOOD_SUGAR** | $v < 4.0$ | BS_EP1 | `LOW` |
| | $4.0 \le v \le 6.0$ | BS_EP2 | `NORMAL` |
| | $6.0 < v \le 7.2$ | BS_EP3 | `BORDERLINE_HIGH` |
| | $v > 7.2$ | BS_EP4 | `HIGH` |
| **HBA1C** | $v < 5.7$ | HB_EP1 | `NORMAL` |
| | $5.7 \le v \le 6.4$ | HB_EP2 | `BORDERLINE_HIGH` |
| | $v > 6.4$ | HB_EP3 | `HIGH` |
| **HEART_RATE** | $v < 60$ | HR_EP1 | `LOW` |
| | $60 \le v \le 100$ | HR_EP2 | `NORMAL` |
| | $v > 100$ | HR_EP3 | `HIGH` |
| **SPO2** | $v \ge 94$ | SP_EP1 | `NORMAL` |
| | $90 \le v < 94$ | SP_EP2 | `BORDERLINE_LOW` |
| | $v < 90$ | SP_EP3 | `LOW` |
| **BLOOD_PRESSURE**| $sys < 120 \land dia < 80$ | BP_EP1 | `NORMAL` |
| | $sys \le 140 \land dia \le 90$ (Không đồng thời $<120$ và $<80$) | BP_EP2 | `BORDERLINE_HIGH` |
| | $sys > 140 \lor dia > 90$ | BP_EP3 | `HIGH` |

---

## 4. Phân tích giá trị biên (Boundary Value Analysis)

Áp dụng kỹ thuật **Standard Boundary Value Analysis** để xác định các điểm kiểm thử xung quanh ranh giới giữa các lớp tương đương:

| Chỉ số | Điểm biên | Giá trị biên dưới ($min$) | Giá trị lân cận biên dưới ($min+$) | Giá trị biên trên ($max$) | Giá trị lân cận biên trên ($max-$) | Tag bao phủ |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **BLOOD_SUGAR** | $4.0$ | $4.0$ (NORMAL) | $4.1$ (NORMAL) | | $3.9$ (LOW) | BS_B1, BS_B2, BS_B3 |
| | $6.0$ | | $6.1$ (BORDERLINE_HIGH)| $6.0$ (NORMAL) | $5.9$ (NORMAL) | BS_B4, BS_B5, BS_B6 |
| | $7.2$ | | $7.3$ (HIGH) | $7.2$ (BORDERLINE_HIGH)| $7.1$ (BORDERLINE_HIGH) | BS_B7, BS_B8, BS_B9 |
| **HBA1C** | $5.7$ | $5.7$ (BORDERLINE_HIGH) | $5.8$ (BORDERLINE_HIGH) | | $5.6$ (NORMAL) | HB_B1, HB_B2, HB_B3 |
| | $6.4$ | | $6.5$ (HIGH) | $6.4$ (BORDERLINE_HIGH)| $6.3$ (BORDERLINE_HIGH) | HB_B4, HB_B5, HB_B6 |
| **HEART_RATE** | $60$ | $60$ (NORMAL) | $61$ (NORMAL) | | $59$ (LOW) | HR_B1, HR_B2, HR_B3 |
| | $100$ | | $101$ (HIGH) | $100$ (NORMAL) | $99$ (NORMAL) | HR_B4, HR_B5, HR_B6 |
| **SPO2** | $90$ | $90$ (BORDERLINE_LOW) | $91$ (BORDERLINE_LOW) | | $89$ (LOW) | SP_B1, SP_B2, SP_B3 |
| | $94$ | $94$ (NORMAL) | $95$ (NORMAL) | | $93$ (BORDERLINE_LOW) | SP_B4, SP_B5, SP_B6 |
| **BLOOD_PRESSURE**| Huyết áp tâm thu | $120$ (BORDERLINE_HIGH) | $140$ (BORDERLINE_HIGH) | $141$ (HIGH) | $119$ (NORMAL) | BP_B1, BP_B2, BP_B3 |
| | Huyết áp tâm trương| $80$ (BORDERLINE_HIGH) | $90$ (BORDERLINE_HIGH) | $91$ (HIGH) | $79$ (NORMAL) | BP_B4, BP_B5, BP_B6 |

---

## 5. Thiết kế Test Cases chi tiết

Dưới đây là bảng thiết kế **23 test cases** phủ toàn bộ các khoảng phân hoạch tương đương và giá trị biên:

| STT | Mã TC | Chỉ số | Giá trị Sys / Value | Giá trị Dia / ValueSecondary | Kết quả mong đợi | Tag bao phủ |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| 1 | TC-BS-01 | BLOOD_SUGAR | 3.9 | | `LOW` | BS_EP1, BS_B1 |
| 2 | TC-BS-02 | BLOOD_SUGAR | 4.0 | | `NORMAL` | BS_EP2, BS_B2 |
| 3 | TC-BS-03 | BLOOD_SUGAR | 6.0 | | `NORMAL` | BS_EP2, BS_B5 |
| 4 | TC-BS-04 | BLOOD_SUGAR | 6.1 | | `BORDERLINE_HIGH` | BS_EP3, BS_B6 |
| 5 | TC-BS-05 | BLOOD_SUGAR | 7.2 | | `BORDERLINE_HIGH` | BS_EP3, BS_B8 |
| 6 | TC-BS-06 | BLOOD_SUGAR | 7.3 | | `HIGH` | BS_EP4, BS_B9 |
| 7 | TC-HB-01 | HBA1C | 5.6 | | `NORMAL` | HB_EP1, HB_B3 |
| 8 | TC-HB-02 | HBA1C | 5.7 | | `BORDERLINE_HIGH` | HB_EP2, HB_B1 |
| 9 | TC-HB-03 | HBA1C | 6.4 | | `BORDERLINE_HIGH` | HB_EP2, HB_B5 |
| 10 | TC-HB-04 | HBA1C | 6.5 | | `HIGH` | HB_EP3, HB_B4 |
| 11 | TC-HR-01 | HEART_RATE | 59 | | `LOW` | HR_EP1, HR_B3 |
| 12 | TC-HR-02 | HEART_RATE | 60 | | `NORMAL` | HR_EP2, HR_B1 |
| 13 | TC-HR-03 | HEART_RATE | 100 | | `NORMAL` | HR_EP2, HR_B5 |
| 14 | TC-HR-04 | HEART_RATE | 101 | | `HIGH` | HR_EP3, HR_B4 |
| 15 | TC-SP-01 | SPO2 | 89 | | `LOW` | SP_EP3, SP_B3 |
| 16 | TC-SP-02 | SPO2 | 90 | | `BORDERLINE_LOW` | SP_EP2, SP_B1 |
| 17 | TC-SP-03 | SPO2 | 93 | | `BORDERLINE_LOW` | SP_EP2, SP_B6 |
| 18 | TC-SP-04 | SPO2 | 94 | | `NORMAL` | SP_EP1, SP_B4 |
| 19 | TC-BP-01 | BLOOD_PRESSURE | 119 | 79 | `NORMAL` | BP_EP1, BP_B3, BP_B6 |
| 20 | TC-BP-02 | BLOOD_PRESSURE | 120 | 80 | `BORDERLINE_HIGH` | BP_EP2, BP_B1, BP_B4 |
| 21 | TC-BP-03 | BLOOD_PRESSURE | 140 | 90 | `BORDERLINE_HIGH` | BP_EP2, BP_B2, BP_B5 |
| 22 | TC-BP-04 | BLOOD_PRESSURE | 141 | 90 | `HIGH` | BP_EP3, BP_B2 |
| 23 | TC-BP-05 | BLOOD_PRESSURE | 140 | 91 | `HIGH` | BP_EP3, BP_B5 |

---

## 6. Triển khai kiểm thử tự động (JUnit 5)

Toàn bộ các test cases trên đã được viết dưới dạng mã nguồn kiểm thử tự động sử dụng Mockito để giả lập môi trường DB và JUnit 5 để so khớp kết quả:
* **Tệp mã nguồn:** [PatientHealthMetricServiceImplTest.java](file:///d:/UTH/KTPM/ktpm/backend/src/test/java/com/project/service/impl/PatientHealthMetricServiceImplTest.java)

Lệnh chạy kiểm thử:
```bash
mvn test -Dtest=PatientHealthMetricServiceImplTest
```

**Kết quả chạy thực tế:**
* **Tests run:** 23
* **Failures:** 0
* **Errors:** 0
* **Skipped:** 0
* **Kết quả:** **BUILD SUCCESS (PASS 100%)**
