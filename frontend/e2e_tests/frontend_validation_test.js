Feature('Frontend validation');

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

Scenario('Support ticket required fields block create request', ({ I }) => {
  let createCalls = 0;

  I.usePlaywrightTo('mock support ticket list and create endpoint', async ({ page }) => {
    await mockPatientShell(page);
    await page.unroute('**/v1/support-tickets**').catch(() => {});
    await page.route('**/v1/support-tickets**', (route) => {
      if (route.request().method() === 'POST') {
        createCalls += 1;
        route.fulfill(jsonResponse({ message: 'Create should not be called for invalid input' }, 500));
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
  I.seeElement('textarea[name="message"]');

  I.clickModalPrimaryButton();

  I.waitForFieldErrors(2);
  I.seeElement('input[name="subject"]');
  I.seeElement('textarea[name="message"]');

  I.usePlaywrightTo('assert invalid support form did not call create API', async () => {
    if (createCalls !== 0) {
      throw new Error(`Expected no support create request, got ${createCalls}`);
    }
  });
});
