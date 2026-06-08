Feature('login');

Scenario('Test Trang chu',  ({ I }) => {
    I.amOnPage('/');
    // Check if the page has loaded successfully
    I.see('DamDiep Healthcare'); 
});
