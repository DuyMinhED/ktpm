# Hướng Hẫn Deploy Dự Án Chronic Disease Management (Miễn Phí)

Tài liệu này hướng dẫn chi tiết cách triển khai (deploy) hệ thống Quản lý Bệnh lý Mãn tính (bao gồm **Frontend React**, **Backend Spring Boot**, và **PostgreSQL Database**) lên các nền tảng đám mây hoàn toàn miễn phí phục vụ mục đích học tập và làm đồ án.

---

## 🏗️ Tổng Quan Kiến Trúc Dự Án

Hệ thống được thiết kế theo mô hình Client-Server:
1. **Frontend**: React 19 + Vite 8 + TypeScript + Tailwind CSS (Deploy tĩnh trên **Vercel** hoặc **Netlify**).
2. **Backend**: Spring Boot 3.2.4 (Java 17) + Spring Security (Deploy trên **Koyeb** hoặc **Render** dưới dạng Docker container).
3. **Database**: PostgreSQL (Đã cài đặt sẵn cấu hình kết nối tới **Neon PostgreSQL** - một dịch vụ Cloud DB Serverless miễn phí).
4. **AI Assistant**: Tích hợp Google Gemini AI qua API Key.

---

## 🛠️ Quy Trình Triển Khai Chi Tiết

Để dự án hoạt động trơn tru trên môi trường production, chúng ta sẽ thực hiện theo 4 bước lớn dưới đây:

```mermaid
graph TD
    A[1. Đẩy mã nguồn lên GitHub] --> B[2. Tạo & Thiết lập Database Neon]
    B --> C[3. Deploy Spring Boot Backend lên Koyeb/Render]
    C --> D[4. Deploy React Frontend lên Vercel]
    D --> E[Hoàn thành hệ thống trực tuyến!]
```

---

### Bước 1: Chuẩn Bị Mã Nguồn Trên GitHub
Đầu tiên, bạn cần đưa toàn bộ dự án lên một kho lưu trữ (Repository) trên GitHub cá nhân.
1. Tạo một repository mới trên GitHub (để ở chế độ **Private** hoặc **Public** tùy ý).
2. Đẩy toàn bộ thư mục gốc chứa cả hai thư mục con `backend/` và `frontend/` lên repository đó.

---

### Bước 2: Khởi Tạo Database PostgreSQL Miễn Phí (Neon.tech)

Dự án của bạn đã sử dụng cấu hình mặc định kết nối với Neon PostgreSQL. Để quản lý độc lập và bảo mật, bạn nên tạo cơ sở dữ liệu riêng:

1. Truy cập [Neon.tech](https://neon.tech/) và đăng ký tài khoản miễn phí bằng GitHub.
2. Tạo một project mới (chọn Region gần Việt Nam nhất như **Singapore (ap-southeast-1)** để tối ưu tốc độ).
3. Sau khi tạo, Neon sẽ cung cấp cho bạn một **Connection String** dạng:
   `postgresql://neondb_owner:npg_xxx@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
4. Hãy tách đường dẫn này thành 3 biến môi trường cần thiết:
   * **`DB_URL`**: `jdbc:postgresql://ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&preparedThreshold=0` (nhớ đổi tiền tố thành `jdbc:postgresql://`).
   * **`DB_USERNAME`**: `neondb_owner` (hoặc username hiển thị trên trang Neon).
   * **`DB_PASSWORD`**: Mật khẩu tương ứng được Neon cấp.

> [!NOTE]
> Spring Boot của bạn đã được cấu hình thuộc tính `spring.sql.init.mode: always` và `hibernate.ddl-auto: update`, điều này giúp ứng dụng tự động khởi tạo cấu trúc bảng và chèn dữ liệu mẫu từ file `data.sql` ngay trong lần khởi chạy đầu tiên. Bạn không cần phải import database thủ công!

---

### Bước 3: Deploy Backend Spring Boot (Chọn 1 trong 2 nền tảng dưới)

Do Spring Boot chạy bằng Java 17, cần khoảng 300MB-512MB RAM để khởi chạy. Dưới đây là hai dịch vụ tốt nhất cung cấp RAM miễn phí hỗ trợ Java & Docker.

#### Phương án A: Triển khai lên Koyeb (Khuyên dùng 🌟)
Koyeb cung cấp một gói dịch vụ miễn phí rất mạnh mẽ với **512MB RAM**, chạy liên tục 24/7 mà không bị chế độ ngủ (auto-sleep) như Render.

1. Đăng ký tài khoản [Koyeb](https://www.koyeb.com/) bằng tài khoản GitHub của bạn.
2. Chọn **Create App** -> chọn **GitHub** làm mã nguồn và cấp quyền truy cập repository của bạn.
3. Cấu hình dịch vụ Backend:
   * **Repository**: Chọn repo của dự án của bạn.
   * **Branch**: `main` hoặc `master`.
   * **Builder**: Chọn **Docker** (Koyeb sẽ tự động tìm thấy file `Dockerfile` của bạn trong thư mục `backend/`).
   * **Docker Directory**: Nhập `backend` (vì file `Dockerfile` nằm trong thư mục con này).
4. Thiết lập **Environment Variables** (Biến môi trường) bằng cách nhấn *Add Variable*:
   | Tên Biến | Giá trị | Ghi chú |
   | :--- | :--- | :--- |
   | `DB_URL` | *Đường dẫn kết nối JDBC của bạn từ Bước 2* | |
   | `DB_USERNAME` | *Username Neon* | |
   | `DB_PASSWORD` | *Mật khẩu Neon* | |
   | `JWT_SECRET` | `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970` | Chuỗi ký tự bí mật bảo mật JWT (dài từ 32 ký tự) |
   | `GEMINI_API_KEY` | *API Key của bạn* | Lấy miễn phí từ [Google AI Studio](https://aistudio.google.com/) |
   | `SWAGGER_ENABLED`| `true` | Bật tài liệu API Swagger UI nếu cần test |
   | `PORT` | `8080` | |
5. Nhấn **Deploy**. Koyeb sẽ tự động build image Docker từ Dockerfile và chạy. Quá trình này mất khoảng 2-4 phút. Sau khi hoàn thành, bạn sẽ nhận được một public URL của backend (ví dụ: `https://your-app-xxxx.koyeb.app`).

---

#### Phương án B: Triển khai lên Render.com (Giải pháp thay thế)
Render cung cấp dịch vụ web miễn phí hỗ trợ Docker tốt nhưng giới hạn RAM ở mức 512MB và **sẽ đi vào trạng thái ngủ (sleep)** sau 15 phút không có lượt truy cập. Khi có người truy cập lại, sẽ mất khoảng 50 giây để khởi động lại.

1. Truy cập [Render.com](https://render.com/) và đăng nhập bằng GitHub.
2. Nhấn **New +** -> chọn **Web Service**.
3. Kết nối với kho mã nguồn chứa dự án trên GitHub của bạn.
4. Cấu hình cài đặt:
   * **Name**: Tên ứng dụng (ví dụ: `health-management-backend`).
   * **Root Directory**: `backend` (Rất quan trọng! Để chỉ định build từ thư mục backend).
   * **Language**: `Docker`.
   * **Region**: Chọn Singapore hoặc Oregon.
   * **Instance Type**: Chọn **Free**.
5. Nhấp vào mục **Advanced** để thêm các biến môi trường (Environment Variables) giống hệt bảng cấu hình của Koyeb ở trên.
6. Nhấp **Create Web Service**. Hệ thống sẽ tự động tìm Dockerfile ở thư mục `backend/` để build ứng dụng.

---

### Bước 4: Deploy Frontend React Lên Vercel (Miễn Phí 24/7)

Vercel là nền tảng tốt nhất hiện nay để triển khai các ứng dụng SPA (Single Page Application) như React + Vite + Tailwind. Nó hoàn toàn miễn phí, hỗ trợ CDN cực nhanh và cấu hình vô cùng đơn giản.

1. Truy cập [Vercel](https://vercel.com/) và chọn đăng nhập bằng GitHub.
2. Nhấp **Add New** -> **Project**.
3. Import repository dự án của bạn.
4. Cấu hình thiết lập dự án:
   * **Framework Preset**: Chọn **Vite**.
   * **Root Directory**: Nhấp vào *Edit* và chọn thư mục **`frontend`** (Rất quan trọng, không được chọn thư mục gốc).
   * **Build & Development Settings**: Giữ mặc định (Vercel tự hiểu `npm run build` và thư mục đầu ra là `dist`).
5. Thêm **Environment Variables**:
   * Nhấp chọn thêm biến môi trường mới:
     * **Name**: `VITE_API_BASE_URL`
     * **Value**: Địa chỉ URL backend bạn có được sau Bước 3 kèm hậu tố `/api` (ví dụ: `https://your-app-xxxx.koyeb.app/api` hoặc `https://health-management-backend.onrender.com/api`).
6. Nhấp **Deploy**. Vercel sẽ tự động cài đặt dependency, build project sang mã HTML/JS tĩnh chỉ trong khoảng 30 giây - 1 phút.
7. Vercel sẽ tạo cho bạn một đường dẫn chạy ứng dụng trực tuyến cực kì chuyên nghiệp!

---

## ⚙️ Các Lưu Ý Quan Trọng Cho Sinh Viên

1. **Cơ chế CORS**:
   Ứng dụng của bạn đã có cấu hình CORS mở (`setAllowedOriginPatterns(Arrays.asList("*"))` trong file `SecurityConfig.java`), nghĩa là Frontend chạy trên tên miền của Vercel hoàn toàn có quyền gửi request và nhận phản hồi từ Backend chạy trên tên miền của Koyeb/Render mà không gặp bất kỳ lỗi bảo mật CORS nào.
   
2. **Kích hoạt tài liệu API (Swagger UI)**:
   Để dễ dàng debug và kiểm thử các API trực tuyến, hãy bật biến `SWAGGER_ENABLED=true`. Khi đó, bạn có thể truy cập `https://<your-backend-url>/swagger-ui.html` để trực tiếp kiểm tra danh sách các API và gửi request test như trên Postman.

3. **Bảo mật JWT Secret**:
   Đảm bảo không đưa trực tiếp mã khóa bí mật (Secret Key) hoặc API Key lên GitHub bằng cách sử dụng các biến cấu hình `${JWT_SECRET}` hay `${GEMINI_API_KEY}` như hiện tại và định nghĩa chúng trong Dashboard quản lý của các trang hosting.

4. **Sử dụng API Trợ Lý Sức Khỏe AI**:
   Tính năng tư vấn sức khỏe trong dự án của bạn sử dụng Gemini API. Bạn có thể lấy key hoàn toàn miễn phí tại [Google AI Studio](https://aistudio.google.com/) bằng tài khoản Google cá nhân. Hãy gán key này vào biến `GEMINI_API_KEY` của Backend để người dùng có thể chat trực tiếp với AI trợ lý y tế.

Chúc bạn triển khai dự án thành công để phục vụ tốt nhất cho công việc học tập và nghiên cứu!
