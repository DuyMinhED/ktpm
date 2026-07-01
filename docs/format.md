Khi trình bày bất kỳ kỹ thuật kiểm thử nào, hãy trình bày theo format báo cáo dự án, không trình bày như bài tập lý thuyết.

Format bắt buộc:

1. Tên kỹ thuật
- Ghi rõ tên kỹ thuật.
- Xác định kỹ thuật thuộc nhóm nào:
  - Black-box testing
  - White-box testing
  - Experience-based testing

2. Mục đích áp dụng trong dự án
- Nêu kỹ thuật này dùng để kiểm tra vấn đề gì.
- Gắn trực tiếp với module/chức năng đang được kiểm thử.
- Không viết lý thuyết dài.

3. Cơ sở test
- Nêu kỹ thuật dựa trên nguồn nào:
  - Requirement
  - User Story
  - Acceptance Criteria
  - API Spec
  - UI Form
  - Business Rule
  - Source Code
  - Workflow nghiệp vụ

4. Điều kiện test
- Liệt kê các điều kiện có thể kiểm thử.
- Mỗi điều kiện phải rõ ràng, cụ thể, có thể tạo test case.

5. Cách áp dụng kỹ thuật
- Trình bày cách kỹ thuật được triển khai vào module.
- Nếu là kỹ thuật hộp đen thì phân tích theo input/output, rule nghiệp vụ, trạng thái hoặc biên dữ liệu.
- Nếu là kỹ thuật hộp trắng thì phân tích theo code, statement, branch, condition, path.
- Nếu là kỹ thuật dựa trên kinh nghiệm thì phân tích theo lỗi thường gặp, rủi ro và kinh nghiệm tester.

6. Bảng phân tích kỹ thuật
- Tạo bảng phù hợp với kỹ thuật:
  - Equivalence Partitioning: bảng lớp hợp lệ / không hợp lệ.
  - Boundary Value Analysis: bảng min, min+, nominal, max-, max, ngoài biên.
  - Decision Table: bảng điều kiện, hành động, rule.
  - State Transition: bảng trạng thái hiện tại, sự kiện, trạng thái tiếp theo.
  - White-box: bảng statement/branch/condition/path cần bao phủ.
  - Error Guessing: bảng lỗi dự đoán, nguyên nhân, test case đề xuất.

7. Test case
Trình bày test case theo bảng:

| Test Case ID | Test Summary | Pre-condition | Test Steps | Test Data | Expected Result | Technique Tag |
|---|---|---|---|---|---|---|

8. Độ bao phủ
- Nêu các điều kiện/rule/biên/nhánh/trạng thái đã được test case bao phủ.
- Chỉ ra phần còn thiếu nếu có.

9. Nhận xét
- Nêu ngắn gọn kỹ thuật này phù hợp ở điểm nào.
- Hạn chế khi áp dụng.
- Có cần kết hợp kỹ thuật khác không.

Yêu cầu chung:
- Viết như báo cáo kiểm thử cho dự án thực tế.
- Không trình bày như đang trả lời bài tập với giáo viên.
- Không lặp lại lý thuyết dài dòng.
- Ưu tiên bảng.
- Nội dung phải bám sát module/chức năng đang được kiểm thử.
- Nếu thiếu thông tin thì tự ghi rõ phần “Giả định”, không bịa như dữ kiện chắc chắn.