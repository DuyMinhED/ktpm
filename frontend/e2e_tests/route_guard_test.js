Feature('Route guard');

Scenario('Unauthenticated admin route redirects to landing page', ({ I }) => {
  I.clearAuth();
  I.clientNavigate('/admin/users');

  I.wait(1);
  I.dontSeeInCurrentUrl('/admin/users');
  I.see('Begin Journey');
});

Scenario('Unauthenticated doctor route redirects to landing page', ({ I }) => {
  I.clearAuth();
  I.clientNavigate('/doctor/appointments');

  I.wait(1);
  I.dontSeeInCurrentUrl('/doctor/appointments');
  I.see('Begin Journey');
});

Scenario('Unauthenticated patient route redirects to landing page', ({ I }) => {
  I.clearAuth();
  I.clientNavigate('/patient/metrics');

  I.wait(1);
  I.dontSeeInCurrentUrl('/patient/metrics');
  I.see('Begin Journey');
});

Scenario('Patient role cannot open admin routes', ({ I }) => {
  I.clearAuth();
  I.login('truongquocan@patient.com', 'admin123');
  I.waitInUrl('/patient', 45);
  I.clientNavigate('/admin/users');

  I.waitInUrl('/patient', 5);
  I.dontSeeInCurrentUrl('/admin/users');
});

Scenario('Doctor role cannot open patient routes', ({ I }) => {
  I.clearAuth();
  I.login('mai.le@care.com', 'admin123');
  I.waitInUrl('/doctor', 45);
  I.clientNavigate('/patient/profile');

  I.waitInUrl('/doctor', 5);
  I.dontSeeInCurrentUrl('/patient/profile');
});

Scenario('Admin role can open clinic manager routes', ({ I }) => {
  I.seedAuth('ADMIN', { userId: 1, userName: 'E2E Admin', clinicId: 1 });
  I.clientNavigate('/clinic/patients');

  I.seeInCurrentUrl('/clinic/patients');
});
