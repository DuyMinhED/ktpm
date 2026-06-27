export default function() {
  return actor({
    // Define custom steps here, use 'this' to access default methods of I.
    
    // Một hàm đăng nhập tuỳ chỉnh để tái sử dụng ở nhiều kịch bản test khác nhau
    login: function(email, password) {
      this.amOnPage('/');
      this.waitForElement('button', 5);
      this.click('Begin Journey');
      this.waitForElement('form', 5); // Chờ form đăng nhập xuất hiện trong tối đa 5s
      this.fillField('input[placeholder="Email hoặc Số điện thoại"]', email);
      this.fillField('input[placeholder="••••••••"]', password);
      this.click('Đăng Nhập');
    }
  });
}
