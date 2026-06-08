export default function() {
  return actor({
    // Define custom steps here, use 'this' to access default methods of I.
    
    // Một hàm đăng nhập tuỳ chỉnh để tái sử dụng ở nhiều kịch bản test khác nhau
    login: function(email, password) {
      this.amOnPage('/login');
      this.waitForElement('form', 5); // Chờ form đăng nhập xuất hiện trong tối đa 5s
      this.fillField('Email', email); // Hoặc điền id/name của field, vd: this.fillField('#email', email)
      this.fillField('Password', password);
      this.click('Login'); // Hoặc id của nút đăng nhập
    }
  });
}
