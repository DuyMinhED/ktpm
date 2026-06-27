Feature('Authentication');

Scenario('Đăng nhập thành công', ({ I }) => {
    // Sử dụng hàm login tuỳ chỉnh vừa định nghĩa trong steps_file.js
    I.login('admin@care.com', 'admin123'); // Thay mật khẩu nếu admin123 không đúng
    
    // Kiểm tra xem sau khi đăng nhập có được chuyển hướng đúng không
    I.waitInUrl('/admin', 5);
    I.see('Dashboard'); // Hoặc bất kỳ chữ nào xuất hiện khi đăng nhập thành công
});

Scenario('Đăng nhập thất bại do sai mật khẩu', ({ I }) => {
    I.login('admin@care.com', 'sai_mat_khau');
    
    // Kiểm tra xem có hiển thị thông báo lỗi không
    I.see('Đăng nhập thất bại'); // Thay bằng câu thông báo lỗi thực tế của web bạn
});
