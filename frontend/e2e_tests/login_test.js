Feature('Landing and login modal');

Scenario('Landing page renders primary CTA and navigation', ({ I }) => {
  I.clearAuth();
  I.amOnPage('/');

  I.see('Velorah');
  I.see('Begin Journey');
  I.seeElement('nav');
});

Scenario('Login modal opens from action query', ({ I }) => {
  I.clearAuth();
  I.openLoginModal();

  I.seeElement('form input[type="text"]');
  I.seeElement('form input[type="password"]');
  I.seeElement('form button[type="submit"]');
});

Scenario('Login modal keeps user on form when required fields are empty', ({ I }) => {
  I.clearAuth();
  I.openLoginModal();

  I.click('form button[type="submit"]');
  I.seeElement('form');
  I.seeInCurrentUrl('action=login');
});
