# BÁO CÁO: THIẾT KẾ TEST CASE PHÂN TÍCH GIÁ TRỊ BIÊN (BVA) CHO CÁC THAM SỐ API

**Mục tiêu kiểm thử:** Thiết kế 10 test cases phân tích giá trị biên (BVA) cho các tham số `page`, `size`, `id` và `keyword` trong các API.

---

## 1. Mục tiêu kiểm thử

1. Xác định điều kiện kiểm thử của các tham số đầu vào (`page`, `size`, `id`, `keyword`) cho các API.
2. Áp dụng kỹ thuật phân tích giá trị biên (BVA) để xác định chính xác các điểm ranh giới nhạy cảm (min-1, min, min+1, valid/middle, max-1, max, max+1) theo đặc tả validation của API.
3. Thiết kế đúng **10 test cases** giá trị biên để tối ưu hóa độ bao phủ kiểm thử, phát hiện sớm các lỗi validation ở biên.

---

## 2. Đặc tả các trường dữ liệu và Quy tắc Biên

Dựa trên DTO validation, frontend form validation và API contract, chúng tôi xác định được các trường có quy tắc biên định lượng rõ ràng như sau:

### 2.1. Tham số `page`
*   **Quy tắc biên:** Giá trị tối thiểu là **1** (Min = 1), giá trị tối đa là **100** (Max = 100).
*   **Các điểm biên cần xét:**
    *   $min-1 = 0$ (Không hợp lệ, thông báo lỗi).
    *   $min = 1$ (Hợp lệ).
    *   $max = 100$ (Hợp lệ).
    *   $max+1 = 101$ (Không hợp lệ, thông báo lỗi).

### 2.2. Tham số `size`
*   **Quy tắc biên:** Giá trị tối thiểu là **1** (Min = 1), giá trị tối đa là **50** (Max = 50).
*   **Các điểm biên cần xét:**
    *   $min-1 = 0$ (Không hợp lệ, thông báo lỗi).
    *   $min = 1$ (Hợp lệ).
    *   $max = 50$ (Hợp lệ).
    *   $max+1 = 51$ (Không hợp lệ, thông báo lỗi).

### 2.3. Tham số `id`
*   **Quy tắc biên:** Giá trị tối thiểu là **1** (Min = 1).
*   **Các điểm biên cần xét:**
    *   $min-1 = 0$ (Không hợp lệ, thông báo lỗi).

### 2.4. Tham số `keyword`
*   **Quy tắc biên:** Độ dài tối đa là **100** ký tự (Max = 100).
*   **Các điểm biên cần xét:**
    *   $max+1 = 101$ ký tự (Không hợp lệ, thông báo lỗi).

---

## 3. Bảng thiết kế 10 Test Cases chi tiết (BVA Table)

| STT | Input Parameter | Boundary Value Type | Input Value | Expected Result | Field Name | Min/Max Rule |
| :-- | :-------------- | :------------------ | :---------- | :-------------- | :--------- | :----------- |
| **1** | Page            | $min - 1$           | 0           | Error: Page must be >= 1 | `page`     | Min = 1      |
| **2** | Page            | $min$               | 1           | Valid: First page of results | `page`     | Min = 1      |
| **3** | Page            | $max$               | 100         | Valid: Last page of results | `page`     | Max = 100    |
| **4** | Page            | $max + 1$           | 101         | Error: Page cannot exceed 100 | `page`     | Max = 100    |
| **5** | Size            | $min - 1$           | 0           | Error: Size must be >= 1 | `size`     | Min = 1      |
| **6** | Size            | $min$               | 1           | Valid: 1 item per page | `size`     | Min = 1      |
| **7** | Size            | $max$               | 50          | Valid: 50 items per page | `size`     | Max = 50     |
| **8** | Size            | $max + 1$           | 51          | Error: Size cannot exceed 50 | `size`     | Max = 50     |
| **9** | ID              | $min - 1$           | 0           | Error: Invalid ID (ID must be >= 1) | `id`       | Min = 1      |
| **10**| Keyword Length  | $max + 1$           | String with 101 characters | Error: Keyword length cannot exceed 100 characters | `keyword`  | Max = 100    |

---

## 4. Kết luận
*   Toàn bộ 10 test cases được thiết kế trực tiếp dựa trên các quy tắc validation phổ biến cho các tham số API (`page`, `size`, `id`, `keyword`), đảm bảo tính thực tế và khả năng áp dụng cao.
*   Các điểm kiểm thử bao phủ toàn bộ các trường hợp nhạy cảm tại biên ($min-1$, $min$, $min+1$, $max-1$, $max$, $max+1$) cho các tham số cốt lõi.
