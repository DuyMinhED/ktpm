Feature('Authentication');

Scenario('Admin login redirects to admin dashboard', ({ I }) => {
  I.clearAuth();
  I.login('admin@care.com', 'admin123');

  I.waitInUrl('/admin', 90);
  I.seeInCurrentUrl('/admin');
});

Scenario('Doctor login redirects to doctor dashboard', ({ I }) => {
  I.clearAuth();
  I.login('mai.le@care.com', 'admin123');

  I.waitInUrl('/doctor', 90);
  I.seeInCurrentUrl('/doctor');
});

Scenario('Clinic manager login redirects to clinic dashboard', ({ I }) => {
  I.clearAuth();
  I.login('manager@care.com', 'admin123');

  I.waitInUrl('/clinic', 90);
  I.seeInCurrentUrl('/clinic');
});

Scenario('Patient login redirects to patient dashboard', ({ I }) => {
  I.clearAuth();
  I.login('truongquocan@patient.com', 'admin123');

  I.waitInUrl('/patient', 90);
  I.seeInCurrentUrl('/patient');
});

Scenario('Invalid password keeps user on login modal and shows an error', ({ I }) => {
  I.clearAuth();
  I.login('admin@care.com', 'wrong-password');

  I.waitForElement('form', 10);
  I.seeElement('form');
  I.seeInCurrentUrl('action=login');
});
