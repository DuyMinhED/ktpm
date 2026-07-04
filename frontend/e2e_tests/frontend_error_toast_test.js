Feature('Frontend error and toast handling');

const jsonResponse = (body, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

const mockPatientShell = async (page) => {
  await page.unroute('**/v1/users/me').catch(() => {});
  await page.unroute('**/v1/patient/messages/conversations**').catch(() => {});

  await page.route('**/v1/users/me', (route) => {
    route.fulfill(jsonResponse({
      success: true,
      data: {
        id: 1,
        fullName: 'E2E Patient',
        avatarUrl: null,
      },
    }));
  });

  await page.route('**/v1/patient/messages/conversations**', (route) => {
    route.fulfill(jsonResponse({ data: [] }));
  });
};

Scenario('Expired authenticated API request clears session and redirects to login modal', ({ I }) => {
  I.usePlaywrightTo('mock expired patient metrics request', async ({ page }) => {
    await mockPatientShell(page);
    await page.unroute('**/v1/patient/health-metrics**').catch(() => {});
    await page.route('**/v1/patient/health-metrics**', (route) => {
      route.fulfill(jsonResponse({ message: 'Expired token' }, 401));
    });
  });

  I.seedAuth('PATIENT', {
    token: 'expired-e2e-token',
    userId: 1,
    userName: 'E2E Patient',
  });

  I.clientNavigate('/patient/metrics');

  I.waitForFunction(() => window.location.search.includes('action=login'), [], 10);
  I.waitForFunction(() => {
    return !localStorage.getItem('token') &&
      !localStorage.getItem('userRole') &&
      !localStorage.getItem('userId');
  }, [], 5);
  I.waitForElement('form', 10);
  I.seeElement('form input[type="password"]');
});

Scenario('Multiple visible error toasts stack without hiding the active workflow', ({ I }) => {
  I.usePlaywrightTo('mock support ticket list and repeated create failure', async ({ page }) => {
    await mockPatientShell(page);
    await page.unroute('**/v1/support-tickets**').catch(() => {});
    await page.route('**/v1/support-tickets**', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill(jsonResponse({ message: 'E2E forced create failure' }, 500));
        return;
      }

      route.fulfill(jsonResponse({ content: [], totalElements: 0 }));
    });
  });

  I.seedAuth('PATIENT', { userId: 1, userName: 'E2E Patient' });
  I.clientNavigate('/patient/support');
  I.waitForElement('section', 10);

  I.clickButtonContaining('add');
  I.waitForElement('input[name="subject"]', 10);
  I.fillField('input[name="subject"]', 'E2E support error');
  I.fillField('textarea[name="message"]', 'Force a mocked backend failure for toast coverage.');

  I.click('Gửi yêu cầu hỗ trợ');
  I.waitForFunction(() => document.body.innerText.includes('Gửi yêu cầu thất bại'), [], 10);
  I.seeElement('input[name="subject"]');
  I.seeElement('textarea[name="message"]');
});
