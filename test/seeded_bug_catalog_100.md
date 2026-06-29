# Danh sach 100 loi gia lap cho kiem thu phan mem

File nay la bo loi gia lap duoc tao rieng cho muc dich hoc tap va thuc hanh kiem thu tren du an quan ly phong kham. Cac loi duoc mo ta theo module, vai tro, muc uu tien va cach tai hien de ban co the viet test case, lap bug report, kiem thu hop den, hop trang, API, UI va hoi quy.

## Quy uoc muc uu tien

| Priority | Y nghia | Huong xu ly |
|---|---|---|
| P0 | Loi nghiem trong, anh huong bao mat, du lieu y te, dang nhap, phan quyen hoac lam he thong khong dung duoc | Sua ngay |
| P1 | Loi chuc nang chinh, gay sai nghiep vu lon hoac chan workflow quan trong | Sua trong sprint hien tai |
| P2 | Loi trung binh, co cach di vong nhung anh huong trai nghiem hoac do tin cay | Sua khi sap xep duoc |
| P3 | Loi nho, hien thi, thong bao, sap xep, kha dung hoac toi uu hoa | Sua sau |

## Bang loi

| ID | Priority | Module | Vai tro | Mo ta loi | Cach tai hien ngan gon | Ket qua mong doi |
|---|---|---|---|---|---|---|
| BUG-001 | P0 | Auth | Tat ca | Dang nhap chap nhan mat khau co khoang trang thua o cuoi nhu mat khau dung. | Nhap email hop le, them space vao cuoi password va bam Dang nhap. | Mat khau phai duoc doi chieu chinh xac, khong tu dong bo qua ky tu nhay cam. |
| BUG-002 | P0 | Auth | Tat ca | Token cu van dung duoc sau khi nguoi dung doi mat khau. | Dang nhap o 2 trinh duyet, doi mat khau o trinh duyet 1, tiep tuc goi API bang token o trinh duyet 2. | Tat ca token cu phai bi vo hieu hoa sau khi doi mat khau. |
| BUG-003 | P0 | Authorization | Patient | Benh nhan co the truy cap URL cua bac si bang cach sua duong dan truc tiep. | Dang nhap patient, mo `/doctor/patients` tren thanh dia chi. | He thong phai chan va chuyen ve trang khong co quyen. |
| BUG-004 | P0 | Authorization | Doctor | Bac si co the xem ho so benh nhan khong thuoc minh bang cach doi `patientId` trong API. | Dang nhap doctor A, goi API chi tiet patient cua doctor B. | API phai tra 403 hoac 404. |
| BUG-005 | P0 | Authorization | Clinic Manager | Quan ly phong kham A co the xem danh sach benh nhan cua phong kham B. | Doi `clinicId` tren endpoint `/api/v1/clinics/{clinicId}/patients`. | Chi duoc xem du lieu cua phong kham minh quan ly. |
| BUG-006 | P0 | Admin Users | Admin | Tai khoan admin co the tu xoa chinh minh lam mat quyen quan tri cuoi cung. | Dang nhap admin duy nhat, vao Quan ly nguoi dung va xoa tai khoan hien tai. | He thong phai chan xoa admin cuoi cung hoac tai khoan dang dang nhap. |
| BUG-007 | P0 | Patient Profile | Patient | API cap nhat ho so chap nhan ngay sinh trong tuong lai. | Cap nhat birthday thanh ngay lon hon ngay hien tai. | Ngay sinh trong tuong lai phai bi tu choi. |
| BUG-008 | P0 | Prescriptions | Doctor | Bac si co the tao don thuoc khong co thuoc nao. | Mo tao don thuoc, de danh sach thuoc rong va submit. | Don thuoc phai co it nhat mot muc thuoc hop le. |
| BUG-009 | P0 | Prescriptions | Patient | Benh nhan co the yeu cau refill don thuoc da het hieu luc hoac da huy. | Mo lich su don thuoc het hieu luc, bam Yeu cau cap lai. | Chi don con hieu luc moi duoc yeu cau refill. |
| BUG-010 | P0 | Appointments | Patient | Benh nhan co the dat lich vao thoi diem trong qua khu. | Chon ngay gio da qua va submit dat lich. | He thong phai chan lich hen trong qua khu. |
| BUG-011 | P1 | Appointments | Patient | Dat lich trung gio voi mot lich hen dang hoat dong van thanh cong. | Dat 2 lich cung ngay gio, cung bac si. | He thong phai phat hien xung dot lich. |
| BUG-012 | P1 | Appointments | Doctor | Bac si cap nhat trang thai lich hen thanh `COMPLETED` ma khong can ket qua kham. | Chon lich hen chua co ghi chu/ket qua, doi sang Completed. | Can yeu cau thong tin toi thieu truoc khi hoan tat. |
| BUG-013 | P1 | Appointments | Clinic Manager | Batch reschedule bo qua lich hen da bi huy va van doi gio cho chung. | Chon batch gom lich cancelled va lich scheduled, doi gio hang loat. | Lich da huy khong duoc doi gio. |
| BUG-014 | P1 | Appointments | Patient | Nut huy lich hien thi cho lich hen da hoan thanh. | Vao lich su lich hen completed. | Lich da hoan thanh khong duoc hien thao tac huy. |
| BUG-015 | P1 | Appointments | Doctor | API tao lich hen bac si khong kiem tra benh nhan co thuoc phong kham hien tai. | Doctor tao appointment voi patientId ngoai phong kham. | Phai tu choi neu patient khong thuoc pham vi hop le. |
| BUG-016 | P1 | Health Metrics | Patient | Chi so huyet ap chap nhan gia tri am. | Them metric blood pressure voi systolic = -120. | Gia tri y te phai nam trong mien hop le. |
| BUG-017 | P1 | Health Metrics | Patient | Chi so duong huyet chap nhan chuoi text thay vi so. | Nhap `abc` vao truong glucose va submit. | Frontend va backend phai validate numeric. |
| BUG-018 | P1 | Health Metrics | Clinic Manager | Ghi nhan metric cho benh nhan khong thuoc clinic van thanh cong. | Goi API `/patients/{patientId}/health-metrics` voi patient ngoai clinic. | Phai tra 403 hoac 404. |
| BUG-019 | P1 | Dashboard | Patient | Canh bao suc khoe da dismiss van xuat hien lai sau reload. | Dismiss alert, refresh trang dashboard. | Alert da dismiss khong hien lai. |
| BUG-020 | P1 | Dashboard | Doctor | Thong ke benh nhan nguy co cao tinh ca benh nhan da inactive. | Chuyen patient sang inactive, xem dashboard bac si. | Thong ke chi tinh patient active. |
| BUG-021 | P1 | Dashboard | Clinic Manager | Doanh thu bao cao cong ca dich vu da bi xoa. | Xoa service co lich su, mo bao cao doanh thu. | Bao cao can co quy tac ro rang, khong tinh sai tong hien tai. |
| BUG-022 | P1 | Notifications | Tat ca | So thong bao chua doc khong giam sau khi bam danh dau da doc. | Mo notification dropdown, mark as read, quan sat badge. | Badge phai cap nhat ngay. |
| BUG-023 | P1 | Notifications | Tat ca | `read-all` danh dau ca thong bao cua user khac. | Dang nhap user A, goi read-all, kiem tra user B. | Chi thong bao cua user hien tai bi tac dong. |
| BUG-024 | P1 | Messages | Patient | Benh nhan gui tin nhan cho doctor khong phu trach. | Sua receiverId trong request send message. | Phai chan nguoi nhan khong thuoc quan he cham soc. |
| BUG-025 | P1 | Messages | Doctor | Bac si xem duoc conversation cua doctor khac bang cach doi id. | Goi `/conversations/{id}/messages` voi conversation khong thuoc minh. | Phai tra 403 hoac 404. |
| BUG-026 | P1 | Medical Services | Admin | Tao dich vu y te voi gia bang 0 van thanh cong. | Vao Admin Services, tao service price = 0. | Gia phai lon hon 0 neu la dich vu co phi. |
| BUG-027 | P1 | Medical Services | Admin | Xoa service dang duoc su dung trong lich hen khong co canh bao. | Xoa service da gan vao appointments. | Phai chan xoa hoac yeu cau xac nhan tac dong. |
| BUG-028 | P1 | Clinics | Admin | Tao phong kham voi email sai dinh dang van thanh cong. | Nhap clinic email `clinic@` va submit. | Email phai dung format. |
| BUG-029 | P1 | Clinics | Admin | Cap nhat clinic lam mat danh sach doctors do request khong gui field nay. | Sua ten clinic, luu, xem lai doctors cua clinic. | Cap nhat thong tin clinic khong duoc xoa quan he lien quan. |
| BUG-030 | P1 | Users | Admin | Tao user cho phep trung email voi user da ton tai neu khac chu hoa/thuong. | Tao `Test@a.com`, sau do tao `test@a.com`. | Email phai unique khong phan biet hoa thuong. |
| BUG-031 | P1 | Users | Admin | Chuyen role user tu Doctor sang Patient nhung du lieu doctor profile van ton tai va duoc hien thi. | Doi role doctor thanh patient, truy cap danh sach doctors. | Can dong bo/xu ly profile lien quan khi doi role. |
| BUG-032 | P1 | Audit Logs | Admin | Xem audit log khong ghi nhan hanh dong xoa user. | Xoa user, mo Audit Logs. | Hanh dong nhay cam phai co log. |
| BUG-033 | P1 | Security | Tat ca | API tra ve thong bao loi chua stack trace hoac ten class noi bo. | Gui request sai kieu du lieu vao endpoint bat ky. | Loi phai duoc chuan hoa, khong lo thong tin noi bo. |
| BUG-034 | P1 | Rate Limit | Tat ca | Dang nhap sai lien tuc khong bi gioi han tan suat. | Gui 30 request login sai trong 1 phut. | Can rate limit hoac khoa tam thoi. |
| BUG-035 | P1 | AI Chat | Tat ca | Chat AI chap nhan prompt rong va van goi external service. | Gui message rong hoac chi gom space. | Phai validate noi dung truoc khi goi service. |
| BUG-036 | P2 | Login UI | Tat ca | Sau khi login sai, thong bao loi khong bien mat khi nguoi dung sua input. | Nhap sai password, sau do sua password. | Loi cu nen duoc clear khi input thay doi. |
| BUG-037 | P2 | Login UI | Tat ca | Nut dang nhap co the bam nhieu lan gay gui nhieu request. | Bam lien tuc nut Dang nhap khi network cham. | Nut phai disable trong luc dang submit. |
| BUG-038 | P2 | Patient Dashboard | Patient | Skeleton loading bien mat qua som lam hien bang rong truoc khi data ve. | Mo dashboard tren network Slow 3G. | Skeleton giu den khi request hoan tat. |
| BUG-039 | P2 | Patient Dashboard | Patient | Lich hen sap toi sap xep sai khi hai lich khac ngay nhung cung gio. | Tao lich ngay mai 09:00 va hom nay 10:00. | Sap xep theo ngay gio day du. |
| BUG-040 | P2 | Patient Appointments | Patient | Bo loc lich su khong reset page khi doi trang thai. | O page 3, doi filter status. | Page nen ve 1 de tranh hien rong gia. |
| BUG-041 | P2 | Patient Appointments | Patient | Reminder toggle hien thanh cong nhung reload lai mat trang thai. | Bat reminder, refresh trang. | Trang thai reminder phai duoc luu backend. |
| BUG-042 | P2 | Patient Prescriptions | Patient | Don thuoc sap het han khong hien nhan canh bao. | Tao prescription con 1 ngay het han. | UI phai canh bao sap het han. |
| BUG-043 | P2 | Patient Prescriptions | Patient | Modal chi tiet don thuoc khong hien don vi lieu dung. | Mo prescription co dosage unit. | Phai hien day du lieu dung va don vi. |
| BUG-044 | P2 | Patient Health Metrics | Patient | Bieu do metric noi cac diem khac don vi do tren cung mot duong. | Ghi metric glucose mg/dL va mmol/L. | Phai tach hoac chuan hoa don vi. |
| BUG-045 | P2 | Patient Health Metrics | Patient | Xoa metric khong yeu cau xac nhan. | Bam delete metric trong history. | Can modal xac nhan truoc thao tac xoa. |
| BUG-046 | P2 | Patient Profile | Patient | So dien thoai chap nhan ky tu chu. | Cap nhat phone thanh `abc123`. | Phone phai validate dinh dang. |
| BUG-047 | P2 | Patient Profile | Patient | Emergency contact cho phep trung so dien thoai va trung ten nhieu lan. | Them 2 contact giong nhau. | Nen canh bao hoac chan duplicate. |
| BUG-048 | P2 | Patient Profile | Patient | Download report tra file rong khi patient chua co metric. | Tai report voi tai khoan moi. | File can co noi dung co ban hoac thong bao khong co du lieu. |
| BUG-049 | P2 | Doctor Dashboard | Doctor | Widget lich hen hom nay tinh theo UTC lam lech ngay o Viet Nam. | Tao lich 00:30 Asia/Saigon, xem dashboard. | Phai tinh theo timezone ung dung. |
| BUG-050 | P2 | Doctor Appointments | Doctor | Filter theo ngay ket thuc loai mat lich o 23:59. | Loc den ngay D co lich 23:30. | Khoang ngay phai bao gom het ngay ket thuc. |
| BUG-051 | P2 | Doctor Appointments | Doctor | Reschedule cho phep chon gio ngoai gio lam viec. | Doi lich sang 02:00 sang. | Phai validate working hours. |
| BUG-052 | P2 | Doctor Patients | Doctor | Tim kiem benh nhan khong bo dau tieng Viet. | Search `Nguyen` khong ra `Nguyễn`. | Tim kiem nen ho tro bo dau. |
| BUG-053 | P2 | Doctor Patients | Doctor | Patient detail modal hien metric moi nhat sai khi co 2 metric cung ngay. | Tao 2 metric cung ngay khac gio. | Phai lay ban ghi moi nhat theo timestamp. |
| BUG-054 | P2 | Doctor Prescriptions | Doctor | Them thuoc voi ten chi gom khoang trang van duoc chap nhan. | Tao item medicationName = spaces. | Ten thuoc phai trim va khong rong. |
| BUG-055 | P2 | Doctor Prescriptions | Doctor | Tong so ngay dung thuoc chap nhan duration = 0. | Nhap duration 0 ngay. | Duration phai lon hon 0. |
| BUG-056 | P2 | Doctor Messages | Doctor | Tin nhan dai hon gioi han khong bi chan o frontend. | Dan 10000 ky tu vao message. | UI nen gioi han va thong bao. |
| BUG-057 | P2 | Clinic Dashboard | Clinic Manager | Tong so benh nhan hien ca patient da xoa mem. | Xoa mem patient, xem dashboard. | Chi tinh patient dang hoat dong. |
| BUG-058 | P2 | Clinic Patients | Clinic Manager | Export/bao cao patient khong ton trong filter dang chon. | Loc theo condition, xuat danh sach. | Export phai dung filter hien tai. |
| BUG-059 | P2 | Clinic Patients | Clinic Manager | Sua patient khong validate email nguoi lien he khan cap. | Nhap emergency email sai format. | Can validate truoc khi luu. |
| BUG-060 | P2 | Clinic Doctors | Clinic Manager | Tao doctor khong bat buoc chuyen khoa. | De specialty rong va submit. | Chuyen khoa la truong bat buoc. |
| BUG-061 | P2 | Clinic Doctors | Clinic Manager | Xoa doctor dang co lich hen sap toi van thanh cong. | Tao appointment tuong lai, xoa doctor. | Phai chan hoac yeu cau chuyen lich truoc. |
| BUG-062 | P2 | Clinic Assignment | Clinic Manager | Gan doctor cho patient nhieu lan tao ban ghi trung. | Gan cung doctor-patient lap lai. | Quan he gan phai unique. |
| BUG-063 | P2 | Clinic Risk Alerts | Clinic Manager | Alert nguy co cao khong cap nhat sau khi metric moi duoc ghi. | Ghi metric bat thuong, xem risk alerts ngay. | Alert phai duoc tinh lai hoac thong bao dang cho xu ly. |
| BUG-064 | P2 | Clinic Reports | Clinic Manager | Bao cao theo thang bo qua ngay cuoi thang. | Chon 01/06 den 30/06, tao lich 30/06. | Du lieu ngay cuoi phai duoc tinh. |
| BUG-065 | P2 | Clinic Services | Clinic Manager | Trang dich vu hien dich vu inactive nhu dang active. | Set service inactive, reload list. | UI phai hien dung trang thai. |
| BUG-066 | P2 | Clinic Settings | Clinic Manager | Luu dia chi clinic voi chuoi qua dai lam vo layout trang profile. | Nhap dia chi 500 ky tu. | Can gioi han do dai va xu ly wrap. |
| BUG-067 | P2 | Admin Dashboard | Admin | Doanh thu hom nay tinh ca lich hen cancelled. | Tao appointment cancelled co service price, xem revenue. | Cancelled khong duoc tinh doanh thu. |
| BUG-068 | P2 | Admin Clinics | Admin | Bo loc trang thai phong kham khong ap dung khi search text dang co gia tri. | Nhap search, sau do chon status inactive. | Filter phai ket hop dung. |
| BUG-069 | P2 | Admin Users | Admin | Reset form tao user khong xoa role da chon truoc do. | Tao user role Doctor, mo lai modal. | Form moi phai reset role ve mac dinh ro rang. |
| BUG-070 | P2 | Admin Reports | Admin | Bieu do bao cao bi loi khi data point co gia tri null. | Tao dataset thieu revenue, mo report. | UI phai xu ly null an toan. |
| BUG-071 | P2 | Admin Audit Logs | Admin | Loc audit theo ngay khong tinh timezone nguoi dung. | Tao log luc gan nua dem, loc theo ngay local. | Loc theo ngay local dung. |
| BUG-072 | P2 | Admin Settings | Admin | Cap nhat cau hinh he thong khong reload cache nen UI van dung gia tri cu. | Doi config, mo lai trang lien quan. | Gia tri moi phai co hieu luc hoac co thong bao can reload. |
| BUG-073 | P2 | Support Tickets | Tat ca | Tao ticket voi tieu de rong sau khi trim van thanh cong. | Nhap title la spaces. | Title phai khong rong sau trim. |
| BUG-074 | P2 | Support Tickets | Admin | Cap nhat status ticket khong kiem tra luong trang thai hop le. | Doi Closed ve New. | Chi cho phep transition hop le. |
| BUG-075 | P2 | Support Tickets | Clinic Manager | Clinic manager xem duoc ticket cua clinic khac qua ticket id. | Doi id ticket tren API detail. | Phai gioi han theo clinic. |
| BUG-076 | P3 | Navigation | Tat ca | Sidebar khong highlight dung menu khi duong dan co query string. | Mo `/patient/appointments?tab=history`. | Menu Appointments van phai active. |
| BUG-077 | P3 | Navigation | Tat ca | Bam logo khong dua ve dashboard theo role hien tai. | Dang nhap doctor, bam logo. | Doctor nen ve doctor dashboard. |
| BUG-078 | P3 | Not Found | Tat ca | Trang 404 khong co nut quay lai trang truoc. | Truy cap URL sai. | Nen co hanh dong quay lai hoac ve dashboard. |
| BUG-079 | P3 | Toast | Tat ca | Nhieu toast xuat hien chong len nhau tren mobile. | Tao lien tiep 5 thao tac thanh cong. | Toast phai xep hang khong che UI. |
| BUG-080 | P3 | Toast | Tat ca | Toast loi tu dong bien mat qua nhanh khien khong doc kip. | Gay loi API, quan sat toast. | Toast loi nen hien lau hon toast thanh cong. |
| BUG-081 | P3 | Modal | Tat ca | Bam Escape khong dong modal xac nhan. | Mo modal xac nhan xoa, bam Escape. | Modal nen dong neu thao tac chua nguy hiem hoac co quy tac nhat quan. |
| BUG-082 | P3 | Modal | Tat ca | Focus khong duoc dua vao truong dau tien khi mo modal. | Mo modal tao patient/doctor. | Focus nen dat vao input dau tien. |
| BUG-083 | P3 | Accessibility | Tat ca | Nut icon khong co aria-label. | Kiem tra bang screen reader hoac devtools. | Tat ca icon button phai co accessible name. |
| BUG-084 | P3 | Accessibility | Tat ca | Mau text phu qua nhat tren nen trang khong dat contrast. | Dung Lighthouse/axe tren dashboard. | Contrast dat toi thieu WCAG AA. |
| BUG-085 | P3 | Forms | Tat ca | Loi validate chi hien mau do khong co text mo ta. | Submit form thieu truong. | Can co thong bao loi ro rang. |
| BUG-086 | P3 | Forms | Tat ca | Enter trong input search lai submit form cha ngoai y muon. | Dat focus search trong modal, bam Enter. | Enter chi nen thuc hien hanh dong mong doi. |
| BUG-087 | P3 | Tables | Admin | Cot hanh dong bi che tren man hinh nho. | Mo Admin Users tren mobile/tablet. | Bang can scroll ngang hoac layout responsive. |
| BUG-088 | P3 | Tables | Clinic Manager | Sap xep theo ten khong on dinh voi chu tieng Viet co dau. | Sap xep danh sach patient co ten Viet. | Sap xep nen dung locale `vi-VN`. |
| BUG-089 | P3 | Pagination | Tat ca | Chuyen page khong cuon len dau danh sach. | O cuoi page 1, bam page 2. | Nen scroll ve dau danh sach. |
| BUG-090 | P3 | Empty State | Tat ca | Trang rong hien text tieng Anh lan tieng Viet. | Mo danh sach khong co du lieu. | Ngon ngu hien thi phai nhat quan. |
| BUG-091 | P3 | Loading State | Tat ca | Nut submit hien spinner nhung van giu label cu gay chen chu. | Submit form tren mobile. | Spinner va label can can doi, khong vo layout. |
| BUG-092 | P3 | Error Boundary | Tat ca | Loi runtime chi hien trang trang, khong co fallback. | Gia lap component throw error. | Can hien fallback loi than thien. |
| BUG-093 | P3 | Date Format | Tat ca | Ngay hien theo format US o mot so trang. | Mo report hoac appointment history. | Toan bo app nen thong nhat `dd/MM/yyyy`. |
| BUG-094 | P3 | Currency Format | Admin | Gia dich vu hien khong co don vi VND. | Mo Admin Services. | Gia tien nen format co don vi tien te. |
| BUG-095 | P3 | Search | Tat ca | Search khong trim keyword dau/cuoi. | Tim `"  Nguyen  "`. | Keyword nen duoc trim truoc khi tim. |
| BUG-096 | P3 | Search | Tat ca | Khong co thong bao khi search khong co ket qua. | Search chuoi khong ton tai. | Can empty state cho ket qua tim kiem. |
| BUG-097 | P3 | Session Timeout | Tat ca | Canh bao het phien hien khi user dang thao tac go form. | De gan het phien, tiep tuc go input. | Hoat dong nguoi dung nen gia han phien hoac reset timer. |
| BUG-098 | P3 | Header | Tat ca | Ten nguoi dung dai lam tran header. | Doi full name thanh chuoi 80 ky tu. | Header phai cat ngan hoac wrap hop ly. |
| BUG-099 | P3 | File/Image | Patient | Upload anh dai dien khong thong bao gioi han dung luong. | Chon anh rat lon. | UI phai hien gioi han va loi ro rang. |
| BUG-100 | P3 | Documentation/UI Text | Tat ca | Mot so thong bao thanh cong khong noi ro doi tuong vua thao tac. | Tao/xoa/sua nhieu ban ghi lien tiep. | Thong bao nen neu ten hoac ma doi tuong lien quan. |

## Goi y su dung cho bai kiem thu

1. Chon 10 loi P0/P1 de viet test case uu tien cao va kiem thu hoi quy.
2. Chon moi module it nhat 2 loi de dam bao phu chuc nang frontend, backend va phan quyen.
3. Voi moi loi, tao bug report gom: ID, tieu de, moi truong, du lieu test, buoc tai hien, ket qua thuc te, ket qua mong doi, muc do uu tien, anh man hinh/log neu co.
4. Co the dung danh sach nay de lap ma tran traceability: module -> requirement -> test case -> bug ID.
