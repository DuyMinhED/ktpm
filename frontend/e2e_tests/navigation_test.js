Feature('Navigation');

Scenario('Kiểm tra trang Landing Page hoạt động tốt', ({ I }) => {
    I.amOnPage('/');
    
    // Kiểm tra các thành phần quan trọng trên trang chủ có load thành công không
    I.see('DamDiep Healthcare'); 
    I.seeElement('nav'); // Kiểm tra thanh điều hướng có tồn tại
    I.seeElement('footer'); // Kiểm tra chân trang có tồn tại
});
