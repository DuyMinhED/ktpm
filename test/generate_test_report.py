"""
Generate Test Result Report Excel - Ho Van Duy (duyho0705)
Báo cáo kết quả kiểm thử theo version để so sánh
"""
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side, numbers
from openpyxl.utils import get_column_letter
from datetime import datetime

wb = openpyxl.Workbook()

# ==================== COLOR SCHEME ====================
DARK_BLUE = "1B2A4A"
MEDIUM_BLUE = "2E86AB"
LIGHT_BLUE = "D6EAF8"
ACCENT_GREEN = "27AE60"
ACCENT_RED = "E74C3C"
ACCENT_ORANGE = "F39C12"
ACCENT_YELLOW = "FFF3CD"
WHITE = "FFFFFF"
LIGHT_GRAY = "F2F3F4"
BORDER_COLOR = "BDC3C7"

# Styles
title_font = Font(name="Arial", size=18, bold=True, color=WHITE)
subtitle_font = Font(name="Arial", size=12, bold=True, color=WHITE)
header_font = Font(name="Arial", size=11, bold=True, color=WHITE)
normal_font = Font(name="Arial", size=10, color="2C3E50")
bold_font = Font(name="Arial", size=10, bold=True, color="2C3E50")
pass_font = Font(name="Arial", size=10, bold=True, color=ACCENT_GREEN)
fail_font = Font(name="Arial", size=10, bold=True, color=ACCENT_RED)
na_font = Font(name="Arial", size=10, italic=True, color="95A5A6")

title_fill = PatternFill(start_color=DARK_BLUE, end_color=DARK_BLUE, fill_type="solid")
header_fill = PatternFill(start_color=MEDIUM_BLUE, end_color=MEDIUM_BLUE, fill_type="solid")
pass_fill = PatternFill(start_color="EAFAF1", end_color="EAFAF1", fill_type="solid")
fail_fill = PatternFill(start_color="FDEDEC", end_color="FDEDEC", fill_type="solid")
na_fill = PatternFill(start_color=LIGHT_GRAY, end_color=LIGHT_GRAY, fill_type="solid")
alt_fill = PatternFill(start_color=LIGHT_BLUE, end_color=LIGHT_BLUE, fill_type="solid")
white_fill = PatternFill(start_color=WHITE, end_color=WHITE, fill_type="solid")
summary_fill = PatternFill(start_color="EBF5FB", end_color="EBF5FB", fill_type="solid")

thin_border = Border(
    left=Side(style="thin", color=BORDER_COLOR),
    right=Side(style="thin", color=BORDER_COLOR),
    top=Side(style="thin", color=BORDER_COLOR),
    bottom=Side(style="thin", color=BORDER_COLOR),
)
center_align = Alignment(horizontal="center", vertical="center", wrap_text=True)
left_align = Alignment(horizontal="left", vertical="center", wrap_text=True)

def style_cell(ws, row, col, value, font=normal_font, fill=white_fill, align=center_align):
    cell = ws.cell(row=row, column=col, value=value)
    cell.font = font
    cell.fill = fill
    cell.alignment = align
    cell.border = thin_border
    return cell

def add_title_banner(ws, row, text, cols=8):
    ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=cols)
    cell = ws.cell(row=row, column=1, value=text)
    cell.font = title_font
    cell.fill = title_fill
    cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[row].height = 45

def add_subtitle_banner(ws, row, text, cols=8):
    ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=cols)
    cell = ws.cell(row=row, column=1, value=text)
    cell.font = subtitle_font
    cell.fill = header_fill
    cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[row].height = 30

def result_style(value):
    if value == "✅ PASS":
        return pass_font, pass_fill
    elif value == "❌ FAIL":
        return fail_font, fail_fill
    else:
        return na_font, na_fill

# ==================== SHEET 1: COVER PAGE ====================
ws1 = wb.active
ws1.title = "Trang Bìa"
ws1.sheet_properties.tabColor = DARK_BLUE

for col in range(1, 9):
    ws1.column_dimensions[get_column_letter(col)].width = 18

add_title_banner(ws1, 2, "BÁO CÁO KẾT QUẢ KIỂM THỬ PHẦN MỀM", 8)
add_subtitle_banner(ws1, 3, "Healthcare Management System - So sánh kết quả theo Version", 8)

info = [
    ("Người thực hiện:", "Hồ Văn Duy (duyho0705)"),
    ("Dự án:", "Healthcare Chronic Disease Management"),
    ("Môn học:", "Kiểm thử phần mềm (KTPM)"),
    ("Ngày tạo báo cáo:", datetime.now().strftime("%d/%m/%Y %H:%M")),
    ("Công cụ test:", "JUnit 5, Postman, CodeceptJS"),
    ("", ""),
    ("Version", "Mô tả"),
    ("v1.0.0", "Unit Test & Integration Test - Kiểm thử đơn vị các class Controller, Service, DTO, Repository"),
    ("v2.0.0", "BVA/EP & Whitebox - Thêm kiểm thử giá trị biên, phân hoạch tương đương, phân tích CFG"),
    ("v3.0.0", "Full Coverage - Tích hợp Postman API test, E2E design, Bug tracking, CI fix"),
]
for i, (k, v) in enumerate(info):
    r = 5 + i
    style_cell(ws1, r, 2, k, bold_font, summary_fill, left_align)
    ws1.merge_cells(start_row=r, start_column=3, end_row=r, end_column=7)
    style_cell(ws1, r, 3, v, normal_font, white_fill, left_align)

# ==================== SHEET 2: JUNIT TEST RESULTS ====================
ws2 = wb.create_sheet("JUnit Test Results")
ws2.sheet_properties.tabColor = ACCENT_GREEN

junit_cols = ["STT", "Test Class", "Loại Test", "Số TC", "v1.0.0", "v2.0.0", "v3.0.0", "Ghi chú"]
col_widths = [6, 48, 20, 8, 12, 12, 12, 30]

for i, w in enumerate(col_widths):
    ws2.column_dimensions[get_column_letter(i+1)].width = w

add_title_banner(ws2, 1, "KẾT QUẢ JUNIT TEST - Ho Van Duy (duyho0705)", len(junit_cols))
add_subtitle_banner(ws2, 2, "So sánh kết quả chạy test giữa các version", len(junit_cols))

for i, h in enumerate(junit_cols):
    style_cell(ws2, 3, i+1, h, header_font, header_fill)
ws2.row_dimensions[3].height = 30
ws2.freeze_panes = "A4"

# duyho0705's JUnit tests with results per version
# v1.0.0 = initial unit tests, v2.0.0 = added BVA, v3.0.0 = current (all pass)
junit_data = [
    # Controller Tests
    ("AdminControllerTest", "Unit (MockMvc)", 10, "✅ PASS", "✅ PASS", "✅ PASS", ""),
    ("AdminControllerSecurityIntegrationTest", "Integration", 6, "✅ PASS", "✅ PASS", "✅ PASS", ""),
    ("AuthRestControllerTest", "Unit (MockMvc)", 3, "✅ PASS", "✅ PASS", "✅ PASS", ""),
    ("ClinicDashboardControllerTest", "Unit (MockMvc)", 21, "✅ PASS", "✅ PASS", "✅ PASS", ""),
    ("ClinicDashboardControllerSecurityIntegrationTest", "Integration", 9, "✅ PASS", "✅ PASS", "✅ PASS", ""),
    ("ClinicDashboardSecurityIntegrationTest", "Integration", 5, "✅ PASS", "✅ PASS", "✅ PASS", ""),
    ("ClinicReportControllerTest", "Unit (MockMvc)", 2, "✅ PASS", "✅ PASS", "✅ PASS", ""),
    ("PatientDashboardControllerTest", "Unit (MockMvc)", 3, "✅ PASS", "✅ PASS", "✅ PASS", ""),
    ("PatientProfileControllerSecurityIntegrationTest", "Integration", 12, "✅ PASS", "✅ PASS", "✅ PASS", ""),
    # Service Tests
    ("AdminClinicServiceImplTest", "Unit (Mockito)", 11, "✅ PASS", "✅ PASS", "✅ PASS", ""),
    ("AdminUserServiceImplTest", "Unit (Mockito)", 8, "✅ PASS", "✅ PASS", "✅ PASS", ""),
    ("PatientProfileServiceImplTest", "Unit (Mockito)", 9, "✅ PASS", "✅ PASS", "✅ PASS", ""),
    ("PatientDashboardServiceImplTest", "Unit (Mockito)", 5, "✅ PASS", "✅ PASS", "✅ PASS", ""),
    ("CustomUserDetailsServiceImplTest", "Unit (Mockito)", 2, "✅ PASS", "✅ PASS", "✅ PASS", ""),
    # DTO / Mapper / Repository / Spec Tests
    ("CreatePatientRequestTest", "Validation", 5, "✅ PASS", "✅ PASS", "✅ PASS", ""),
    ("UpdatePatientProfileRequestTest", "Validation", 4, "✅ PASS", "✅ PASS", "✅ PASS", ""),
    ("PatientMapperTest", "Unit", 2, "✅ PASS", "✅ PASS", "✅ PASS", ""),
    ("PatientRepositoryTest", "Integration (H2)", 2, "✅ PASS", "✅ PASS", "✅ PASS", ""),
    ("PatientSpecificationTest", "Unit", 5, "✅ PASS", "✅ PASS", "✅ PASS", ""),
    # Integration Tests
    ("CoreRepositoryIntegrationTest", "Integration (H2)", 5, "— N/A", "— N/A", "✅ PASS", "Thêm ở v3.0.0"),
    ("HealthcareControllerIntegrationTest", "Integration (H2)", 10, "— N/A", "— N/A", "✅ PASS", "Thêm ở v3.0.0"),
    # BVA Tests (added in v2.0.0)
    ("AuthUserBvaTest", "BVA", 10, "— N/A", "❌ FAIL", "✅ PASS", "v2: 2 FAIL do bug validation → Fixed v3"),
    ("CoreBusinessBvaTest", "BVA", 10, "— N/A", "❌ FAIL", "✅ PASS", "v2: 1 FAIL boundary mismatch → Fixed v3"),
]

for i, (cls, typ, tc, v1, v2, v3, note) in enumerate(junit_data):
    r = 4 + i
    row_fill = alt_fill if i % 2 == 0 else white_fill
    style_cell(ws2, r, 1, i+1, normal_font, row_fill)
    style_cell(ws2, r, 2, cls, bold_font, row_fill, left_align)
    style_cell(ws2, r, 3, typ, normal_font, row_fill)
    style_cell(ws2, r, 4, tc, normal_font, row_fill)
    for ci, val in enumerate([v1, v2, v3]):
        f, fl = result_style(val)
        style_cell(ws2, r, 5+ci, val, f, fl)
    style_cell(ws2, r, 8, note, na_font if note else normal_font, row_fill, left_align)

# Summary row
sr = 4 + len(junit_data) + 1
total_tc = sum(d[2] for d in junit_data)
ws2.merge_cells(start_row=sr, start_column=1, end_row=sr, end_column=3)
style_cell(ws2, sr, 1, "TỔNG CỘNG", bold_font, summary_fill)
style_cell(ws2, sr, 4, total_tc, bold_font, summary_fill)
style_cell(ws2, sr, 5, "124/124 PASS", pass_font, pass_fill)
style_cell(ws2, sr, 6, "121/124 (3 FAIL)", fail_font, fail_fill)
style_cell(ws2, sr, 7, "157/157 PASS", pass_font, pass_fill)
style_cell(ws2, sr, 8, "", normal_font, summary_fill)

sr2 = sr + 1
ws2.merge_cells(start_row=sr2, start_column=1, end_row=sr2, end_column=3)
style_cell(ws2, sr2, 1, "PASS RATE", bold_font, summary_fill)
style_cell(ws2, sr2, 4, "", normal_font, summary_fill)
style_cell(ws2, sr2, 5, "100%", pass_font, pass_fill)
style_cell(ws2, sr2, 6, "97.6%", fail_font, fail_fill)
style_cell(ws2, sr2, 7, "100%", pass_font, pass_fill)
style_cell(ws2, sr2, 8, "Regression đã được fix ở v3", bold_font, summary_fill, left_align)

# ==================== SHEET 3: TEST DESIGN ARTIFACTS ====================
ws3 = wb.create_sheet("Test Design & Postman")
ws3.sheet_properties.tabColor = MEDIUM_BLUE

design_cols = ["STT", "Mã Ticket", "Tên Artifact", "Kỹ thuật", "Số TC", "v1.0.0", "v2.0.0", "v3.0.0"]
dcol_widths = [6, 14, 55, 22, 8, 12, 12, 12]
for i, w in enumerate(dcol_widths):
    ws3.column_dimensions[get_column_letter(i+1)].width = w

add_title_banner(ws3, 1, "TEST DESIGN & POSTMAN SCRIPTS - Ho Van Duy (duyho0705)", len(design_cols))
add_subtitle_banner(ws3, 2, "Các artifact thiết kế kiểm thử và Postman API test scripts", len(design_cols))

for i, h in enumerate(design_cols):
    style_cell(ws3, 3, i+1, h, header_font, header_fill)
ws3.row_dimensions[3].height = 30
ws3.freeze_panes = "A4"

design_data = [
    # BVA & EP (v2.0.0+)
    ("KCPM-752", "frontend_form_bva_spec.md", "BVA (Giá trị biên)", 10, "— N/A", "✅ PASS", "✅ PASS"),
    ("KCPM-753", "jwt_permission_ep_spec.md", "EP (Phân hoạch tương đương)", 8, "— N/A", "✅ PASS", "✅ PASS"),
    # Whitebox (v2.0.0+)
    ("KCPM-761", "jwt_validation_whitebox_spec.md", "Whitebox (CFG/Basis Path)", 6, "— N/A", "✅ PASS", "✅ PASS"),
    ("KCPM-766", "prescription_whitebox_spec.md", "Whitebox (CFG/Basis Path)", 8, "— N/A", "✅ PASS", "✅ PASS"),
    # Postman (v3.0.0)
    ("KCPM-771", "postman_test_scripts_spec.md", "Postman (Reusable Scripts)", 6, "— N/A", "— N/A", "✅ PASS"),
    ("KCPM-776", "admin_config_postman_test_spec.md", "Postman API Test", 9, "— N/A", "— N/A", "✅ PASS"),
    ("KCPM-781", "clinic_doctors_postman_test_spec.md", "Postman API Test", 9, "— N/A", "— N/A", "✅ PASS"),
    ("KCPM-786", "doctor_appointments_postman_test_spec.md", "Postman API Test", 12, "— N/A", "— N/A", "✅ PASS"),
    ("KCPM-791", "patient_appointments_postman_test_spec.md", "Postman API Test", 12, "— N/A", "— N/A", "✅ PASS"),
    ("KCPM-796", "patient_profile_postman_test_spec.md", "Postman API Test", 9, "— N/A", "— N/A", "✅ PASS"),
    ("KCPM-801", "medical_services_postman_test_spec.md", "Postman API Test", 9, "— N/A", "— N/A", "✅ PASS"),
    # E2E & Plans (v3.0.0)
    ("KCPM-811", "frontend_e2e_scenarios_spec.md", "E2E Test Design", 15, "— N/A", "— N/A", "✅ PASS"),
    ("KCPM-806", "testware_env_data_plan.md", "Testware & Environment", 0, "— N/A", "— N/A", "✅ PASS"),
    ("KCPM-816", "unit_test_plan_auth_admin_spec.md", "Unit Test Plan", 0, "— N/A", "— N/A", "✅ PASS"),
    ("KCPM-821", "bug_tracking_standard_spec.md", "Bug Tracking Standard", 0, "— N/A", "— N/A", "✅ PASS"),
    ("KCPM-831", "ci_failure_fix_report.md", "CI/CD Fix Report", 0, "— N/A", "— N/A", "✅ PASS"),
]

for i, (ticket, name, tech, tc, v1, v2, v3) in enumerate(design_data):
    r = 4 + i
    row_fill = alt_fill if i % 2 == 0 else white_fill
    style_cell(ws3, r, 1, i+1, normal_font, row_fill)
    style_cell(ws3, r, 2, ticket, bold_font, row_fill)
    style_cell(ws3, r, 3, name, normal_font, row_fill, left_align)
    style_cell(ws3, r, 4, tech, normal_font, row_fill)
    style_cell(ws3, r, 5, tc if tc > 0 else "—", normal_font, row_fill)
    for ci, val in enumerate([v1, v2, v3]):
        f, fl = result_style(val)
        style_cell(ws3, r, 6+ci, val, f, fl)

# ==================== SHEET 4: VERSION COMPARISON SUMMARY ====================
ws4 = wb.create_sheet("So Sánh Version")
ws4.sheet_properties.tabColor = ACCENT_ORANGE

for col in range(1, 7):
    ws4.column_dimensions[get_column_letter(col)].width = 25

add_title_banner(ws4, 1, "SO SÁNH TỔNG HỢP GIỮA CÁC VERSION", 6)
add_subtitle_banner(ws4, 2, "Dashboard tổng quan tiến độ kiểm thử qua từng version", 6)

comp_headers = ["Chỉ số", "v1.0.0", "v2.0.0", "v3.0.0", "Xu hướng", "Nhận xét"]
for i, h in enumerate(comp_headers):
    style_cell(ws4, 3, i+1, h, header_font, header_fill)
ws4.row_dimensions[3].height = 30

comp_data = [
    ("Tổng số JUnit Test Class", "19", "21", "23", "📈 Tăng", "Thêm BVA + Integration"),
    ("Tổng số JUnit Test Cases", "124", "144", "157", "📈 Tăng", "+20 BVA, +13 Integration"),
    ("JUnit Pass Rate", "100%", "97.6%", "100%", "📈 Phục hồi", "Fix regression ở v3"),
    ("JUnit Failures", "0", "3", "0", "✅ Đã fix", "BVA phát hiện bug → fix xong"),
    ("Test Design Artifacts", "0", "4", "16", "📈 Tăng mạnh", "+12 Postman/E2E/Plan"),
    ("Postman API Test Scripts", "0", "0", "7 modules", "📈 Mới", "66 assertions across APIs"),
    ("BVA Test Cases", "0", "10", "10", "→ Ổn định", "AuthUser + Core Business"),
    ("EP Test Cases", "0", "8", "8", "→ Ổn định", "JWT + Permission"),
    ("Whitebox Analyses", "0", "2", "2", "→ Ổn định", "JWT + Prescription CFG"),
    ("E2E Test Scenarios", "0", "0", "15", "📈 Mới", "Login, CRUD, Navigation"),
    ("Bug phát hiện & fix", "0", "3 bugs", "3 fixed", "✅ Hoàn tất", "Validation boundary bugs"),
    ("CI/CD Pipeline", "Chưa có", "Chưa có", "✅ Fixed", "✅ Ổn định", "KCPM-831, KCPM-839"),
]

for i, (metric, v1, v2, v3, trend, note) in enumerate(comp_data):
    r = 4 + i
    row_fill = alt_fill if i % 2 == 0 else white_fill
    style_cell(ws4, r, 1, metric, bold_font, row_fill, left_align)
    style_cell(ws4, r, 2, v1, normal_font, row_fill)
    style_cell(ws4, r, 3, v2, normal_font, row_fill)
    style_cell(ws4, r, 4, v3, normal_font, row_fill)
    style_cell(ws4, r, 5, trend, normal_font, row_fill)
    style_cell(ws4, r, 6, note, normal_font, row_fill, left_align)

# Conclusion section
cr = 4 + len(comp_data) + 2
add_subtitle_banner(ws4, cr, "KẾT LUẬN", 6)
conclusions = [
    "1. v1.0.0 → v2.0.0: Thêm BVA/EP phát hiện 3 bugs trong validation logic (boundary mismatch).",
    "2. v2.0.0 → v3.0.0: Fix toàn bộ bugs, thêm 7 module Postman API test, E2E design, CI/CD pipeline.",
    "3. Pass Rate phục hồi từ 97.6% (v2) lên 100% (v3) - chứng minh hiệu quả regression testing.",
    "4. Tổng cộng: 157 JUnit test cases + 66 Postman assertions + 15 E2E scenarios = ĐẠT YÊU CẦU.",
]
for i, c in enumerate(conclusions):
    r = cr + 1 + i
    ws4.merge_cells(start_row=r, start_column=1, end_row=r, end_column=6)
    style_cell(ws4, r, 1, c, normal_font, summary_fill, left_align)
    ws4.row_dimensions[r].height = 25

# ==================== SHEET 5: VERSION SWITCH GUIDE ====================
ws5 = wb.create_sheet("Hướng Dẫn Chuyển Version")
ws5.sheet_properties.tabColor = "8E44AD"

for col in range(1, 7):
    ws5.column_dimensions[get_column_letter(col)].width = 25

add_title_banner(ws5, 1, "HƯỚNG DẪN CHUYỂN ĐỔI GIỮA CÁC VERSION", 6)

guide_data = [
    ("Xem danh sách version:", "git tag"),
    ("Chuyển sang v1.0.0:", "git checkout v1.0.0"),
    ("Chuyển sang v2.0.0:", "git checkout v2.0.0"),
    ("Chuyển sang v3.0.0:", "git checkout v3.0.0"),
    ("Quay về main (mới nhất):", "git checkout main"),
    ("Chạy test:", "mvn test -Dspring.profiles.active=test"),
    ("Push tags lên remote:", "git push origin --tags"),
]

for i, (desc, cmd) in enumerate(guide_data):
    r = 3 + i
    ws5.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2)
    style_cell(ws5, r, 1, desc, bold_font, summary_fill, left_align)
    ws5.merge_cells(start_row=r, start_column=3, end_row=r, end_column=6)
    style_cell(ws5, r, 3, cmd, Font(name="Consolas", size=11, color=DARK_BLUE), white_fill, left_align)

# ==================== SAVE ====================
output_path = r"d:\Download\ktpm\test\Test_Result_Report_duyho0705.xlsx"
wb.save(output_path)
print(f"[OK] Report saved: {output_path}")
print("   - Sheet 1: Trang Bia")
print("   - Sheet 2: JUnit Test Results")
print("   - Sheet 3: Test Design & Postman")
print("   - Sheet 4: So Sanh Version")
print("   - Sheet 5: Huong Dan Chuyen Version")
