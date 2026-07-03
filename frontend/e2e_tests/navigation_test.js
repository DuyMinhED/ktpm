Feature('Public navigation');

Scenario('Landing page exposes public navigation shell', ({ I }) => {
  I.clearAuth();
  I.amOnPage('/');

  I.see('Velorah');
  I.see('Begin Journey');
  I.seeElement('nav');
});

Scenario('Unknown route renders not found page instead of crashing', ({ I }) => {
  I.clearAuth();
  I.amOnPage('/route-khong-ton-tai-e2e');

  I.seeInCurrentUrl('/route-khong-ton-tai-e2e');
  I.see('404');
});
