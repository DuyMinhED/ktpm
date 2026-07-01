

## 2. Nội dung tham khảo

Bài tập này bám sát các nội dung chính trong phần kỹ thuật kiểm thử hộp đen:

- **Equivalence Partitioning**: phân chia miền dữ liệu đầu vào thành các lớp tương đương.
- **Boundary Value Analysis**: chọn giá trị tại biên và gần biên để kiểm thử.
- **Test case design**: thiết kế test case có input, expected outcome và tag bao phủ.
- **Test script / Unit test**: triển khai kiểm thử tự động bằng code.

Trong bài này, sinh viên cần đặc biệt chú ý đến cách trình bày theo mẫu:

| Conditions | Valid Partitions | Tag | Invalid Partitions | Tag | Valid Boundaries | Tag |
|---|---|---|---|---|---|---|

và bảng test case theo mẫu:

| Test Case | Input | Expected Outcome | New Tags Covered |
|---|---|---|---|

---

## 3. Mô tả bài toán

Hệ thống đăng ký học phần của Trường Đại học UTH cho phép sinh viên gửi yêu cầu đăng ký học phần.

Một yêu cầu đăng ký được xem là **hợp lệ** khi tất cả các điều kiện sau đồng thời thỏa mãn:

| Biến đầu vào | Ý nghĩa | Kiểu dữ liệu | Miền giá trị hợp lệ |
|---|---|---|---|
| `tinChi` | Số tín chỉ sinh viên muốn đăng ký | Số nguyên | Từ 10 đến 25 |
| `gpa` | Điểm trung bình tích lũy hiện tại | Số thực | Từ 2.0 đến 4.0 |
| `monNo` | Số môn sinh viên đang nợ | Số nguyên | Từ 0 đến 3 |
| `hocKy` | Học kỳ hiện tại của sinh viên | Số nguyên | Từ 1 đến 10 |

Hệ thống trả về:

- `True` hoặc thông báo **Hợp lệ** nếu tất cả điều kiện đều đúng.
- `False` hoặc thông báo **Không hợp lệ** nếu có ít nhất một điều kiện sai.

---

## 4. Giả định của bài toán

Để tránh hiểu nhầm, bài tập sử dụng các giả định sau:

1. Chỉ xét dữ liệu đầu vào là dữ liệu số.
2. Không xét dữ liệu `null`, rỗng, chuỗi ký tự hoặc định dạng sai.
3. `tinChi`, `monNo`, `hocKy` là số nguyên.
4. `gpa` là số thực, có thể có phần thập phân.
5. Một yêu cầu đăng ký hợp lệ khi và chỉ khi **tất cả** biến đầu vào nằm trong miền hợp lệ.

Công thức logic tổng quát:

$$
Valid =
(10 \leq tinChi \leq 25)
\land
(2.0 \leq gpa \leq 4.0)
\land
(0 \leq monNo \leq 3)
\land
(1 \leq hocKy \leq 10)
$$

---

# PHẦN A. ĐỀ BÀI GIAO CHO SINH VIÊN

---

## Câu 1. Xác định lớp tương đương

**Điểm:** 2 điểm

Hãy xác định các lớp tương đương hợp lệ và không hợp lệ cho từng biến đầu vào.

Sinh viên cần điền vào bảng sau:

| Biến đầu vào | Lớp hợp lệ | Tag | Lớp không hợp lệ | Tag |
|---|---|---|---|---|
| Số tín chỉ | 10 ≤ tinChi ≤ 25 | V1 | tinChi < 10 | X1 |
| Số tín chỉ |  |  | tinChi > 25 | X2 |
| GPA | 2.0 ≤ gpa ≤ 4.0 | V2 | gpa < 2.0 | X3 |
| GPA |  |  | gpa > 4.0 | X4 |
| Số môn nợ | 0 ≤ monNo ≤ 3 | V3 | monNo < 0 | X5 |
| Số môn nợ |  |  | monNo > 3 | X6 |
| Học kỳ | 1 ≤ hocKy ≤ 10 | V4 | hocKy < 1 | X7 |
| Học kỳ |  |  | hocKy > 10 | X8 |

### Yêu cầu

- Mỗi biến cần có ít nhất 1 lớp hợp lệ.
- Mỗi biến cần có ít nhất 2 lớp không hợp lệ:
  - Nhỏ hơn giá trị nhỏ nhất.
  - Lớn hơn giá trị lớn nhất.
- Mỗi lớp cần được đặt tag để phục vụ theo dõi độ bao phủ.
- Có thể đặt tag theo mẫu:
  - `V1`, `V2`, `V3`, ... cho lớp hợp lệ.
  - `X1`, `X2`, `X3`, ... cho lớp không hợp lệ.

---

## Câu 2. Phân tích giá trị biên

**Điểm:** 2 điểm

Áp dụng kỹ thuật **Standard Boundary Value Analysis** để xác định các giá trị cần kiểm thử cho từng biến.

Với mỗi biến có miền giá trị:

$$
[min, max]
$$

cần xác định 5 giá trị:

| Ký hiệu | Ý nghĩa |
|---|---|
| `min` | Giá trị nhỏ nhất hợp lệ |
| `min+` | Giá trị ngay trên giá trị nhỏ nhất |
| `nominal` | Giá trị đại diện nằm giữa miền hợp lệ |
| `max-` | Giá trị ngay dưới giá trị lớn nhất |
| `max` | Giá trị lớn nhất hợp lệ |

Sinh viên cần điền vào bảng sau:

| Biến đầu vào | min | min+ | nominal | max- | max | Tag biên |
|---|---:|---:|---:|---:|---:|---|
| Số tín chỉ | 10 | 11 | 18 | 24 | 25 | B1, B2, B3, B4, B5 |
| GPA | 2.0 | 2.1 | 3.0 | 3.9 | 4.0 | B6, B7, B8, B9, B10 |
| Số môn nợ | 0 | 1 | 2 | 2 | 3 | B11, B12, B13, B14, B15 |
| Học kỳ | 1 | 2 | 5 | 9 | 10 | B16, B17, B18, B19, B20 |

### Gợi ý chọn nominal

| Biến | Miền hợp lệ | Có thể chọn nominal |
|---|---:|---:|
| Số tín chỉ | 10 đến 25 | 18 |
| GPA | 2.0 đến 4.0 | 3.0 |
| Số môn nợ | 0 đến 3 | 2 |
| Học kỳ | 1 đến 10 | 5 |

> **Ghi chú:** Với biến "Số môn nợ", miền hợp lệ chỉ gồm 4 giá trị nguyên (0, 1, 2, 3) nên giá trị `max-` (= 2) trùng với `nominal` (= 2). Đây là điều bình thường khi miền giá trị quá nhỏ, không ảnh hưởng đến tính đúng đắn của phân tích biên.

### Lưu ý

Với biến GPA là số thực, sinh viên có thể chọn `min+` và `max-` theo độ chính xác giả định.

Ví dụ nếu giả định GPA lấy 1 chữ số thập phân:

| Biên | Giá trị |
|---|---:|
| min | 2.0 |
| min+ | 2.1 |
| nominal | 3.0 |
| max- | 3.9 |
| max | 4.0 |

Nếu muốn kiểm thử mạnh hơn, có thể bổ sung các giá trị ngoài biên như `1.9` và `4.1`, nhưng phần này thuộc hướng **Robustness BVA**.

---

## Câu 3. Thiết kế test case

**Điểm:** 3 điểm

Dựa trên kết quả Câu 1 và Câu 2, hãy thiết kế bảng test case để kiểm thử chức năng đăng ký học phần.

### Yêu cầu

- Thiết kế tối thiểu 8 test case.
- Phải có cả test case hợp lệ và không hợp lệ.
- Phải có test case kiểm tra tại giá trị biên.
- Mỗi test case cần ghi rõ tag được bao phủ.
- Kết quả mong đợi phải ghi rõ:
  - **Hợp lệ**, hoặc
  - **Không hợp lệ**, kèm lý do.

Sinh viên điền vào bảng sau:

| STT | Tên test case | Số tín chỉ | GPA | Số môn nợ | Học kỳ | Kết quả mong đợi | Tag được bao phủ |
|---:|---|---:|---:|---:|---:|---|---|
| 1 | Tất cả giá trị nominal | 18 | 3.0 | 2 | 5 | Hợp lệ | V1, V2, V3, V4, B3, B8, B13, B18 |
| 2 | Tất cả giá trị tại biên min | 10 | 2.0 | 0 | 1 | Hợp lệ | B1, B6, B11, B16 |
| 3 | Tất cả giá trị tại biên min+ | 11 | 2.1 | 1 | 2 | Hợp lệ | B2, B7, B12, B17 |
| 4 | Tất cả giá trị tại biên max- | 24 | 3.9 | 2 | 9 | Hợp lệ | B4, B9, B14, B19 |
| 5 | Tất cả giá trị tại biên max | 25 | 4.0 | 3 | 10 | Hợp lệ | B5, B10, B15, B20 |
| 6 | Số tín chỉ nhỏ hơn min | 9 | 3.0 | 2 | 5 | Không hợp lệ – do `tinChi < 10` (vi phạm điều kiện số tín chỉ) | X1 |
| 7 | Số tín chỉ lớn hơn max | 26 | 3.0 | 2 | 5 | Không hợp lệ – do `tinChi > 25` (vi phạm điều kiện số tín chỉ) | X2 |
| 8 | GPA nhỏ hơn min | 18 | 1.9 | 2 | 5 | Không hợp lệ – do `gpa < 2.0` (vi phạm điều kiện GPA) | X3 |
| 9 | GPA lớn hơn max | 18 | 4.1 | 2 | 5 | Không hợp lệ – do `gpa > 4.0` (vi phạm điều kiện GPA) | X4 |
| 10 | Số môn nợ nhỏ hơn min | 18 | 3.0 | -1 | 5 | Không hợp lệ – do `monNo < 0` (vi phạm điều kiện số môn nợ) | X5 |
| 11 | Số môn nợ lớn hơn max | 18 | 3.0 | 4 | 5 | Không hợp lệ – do `monNo > 3` (vi phạm điều kiện số môn nợ) | X6 |
| 12 | Học kỳ nhỏ hơn min | 18 | 3.0 | 2 | 0 | Không hợp lệ – do `hocKy < 1` (vi phạm điều kiện học kỳ) | X7 |
| 13 | Học kỳ lớn hơn max | 18 | 3.0 | 2 | 11 | Không hợp lệ – do `hocKy > 10` (vi phạm điều kiện học kỳ) | X8 |

---



# PHẦN C. NHẬN XÉT

## 1. Vì sao cần tag?

Tag giúp theo dõi test case nào đã bao phủ lớp nào hoặc biên nào.

Ví dụ:

| Tag | Ý nghĩa |
|---|---|
| V1 | Số tín chỉ hợp lệ |
| X1 | Số tín chỉ nhỏ hơn min |
| X2 | Số tín chỉ lớn hơn max |
| B1 | Số tín chỉ tại min |
| B5 | Số tín chỉ tại max |

Khi thiết kế test case, sinh viên có thể ghi:

| Test case | Tag bao phủ |
|---|---|
| TC01 | V1, V2, V3, V4 |
| TC02 | B1, B6, B11, B16 |
| TC04 | X1 |

---


