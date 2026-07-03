Feature('Role navigation smoke');

Scenario('Admin account can reach core admin pages after login', ({ I }) => {
  I.clearAuth();
  I.login('admin@care.com', 'admin123');
  I.waitInUrl('/admin', 15);

  I.amOnPage('/admin/users');
  I.seeInCurrentUrl('/admin/users');

  I.amOnPage('/admin/clinics');
  I.seeInCurrentUrl('/admin/clinics');

  I.amOnPage('/admin/services');
  I.seeInCurrentUrl('/admin/services');
});

Scenario('Doctor account can reach core doctor pages after login', ({ I }) => {
  I.clearAuth();
  I.login('mai.le@care.com', 'admin123');
  I.waitInUrl('/doctor', 15);

  I.amOnPage('/doctor/appointments');
  I.seeInCurrentUrl('/doctor/appointments');

  I.amOnPage('/doctor/patients');
  I.seeInCurrentUrl('/doctor/patients');

  I.amOnPage('/doctor/prescriptions');
  I.seeInCurrentUrl('/doctor/prescriptions');
});

Scenario('Clinic manager account can reach core clinic pages after login', ({ I }) => {
  I.clearAuth();
  I.login('manager@care.com', 'admin123');
  I.waitInUrl('/clinic', 15);

  I.amOnPage('/clinic/patients');
  I.seeInCurrentUrl('/clinic/patients');

  I.amOnPage('/clinic/doctors');
  I.seeInCurrentUrl('/clinic/doctors');

  I.amOnPage('/clinic/appointments');
  I.seeInCurrentUrl('/clinic/appointments');
});

Scenario('Patient account can reach core patient pages after login', ({ I }) => {
  I.clearAuth();
  I.login('truongquocan@patient.com', 'admin123');
  I.waitInUrl('/patient', 15);

  I.amOnPage('/patient/metrics');
  I.seeInCurrentUrl('/patient/metrics');

  I.amOnPage('/patient/appointments');
  I.seeInCurrentUrl('/patient/appointments');

  I.amOnPage('/patient/profile');
  I.seeInCurrentUrl('/patient/profile');
});
