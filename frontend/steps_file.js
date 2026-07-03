export default function() {
  return actor({
    openLoginModal: function() {
      this.amOnPage('/?action=login');
      this.waitForElement('form', 10);
      this.seeElement('form input[type="text"]');
      this.seeElement('form input[type="password"]');
      this.seeElement('form button[type="submit"]');
    },

    login: function(email, password) {
      this.openLoginModal();
      this.fillField('form input[type="text"]', email);
      this.fillField('form input[type="password"]', password);
      this.click('form button[type="submit"]');
    },

    clearAuth: function() {
      this.amOnPage('/');
      this.executeScript(() => {
        [
          'token',
          'userRole',
          'role',
          'userId',
          'clinicId',
          'userName',
          'userAvatar',
          'cachedClinicName',
          'cachedClinicLogo',
        ].forEach((key) => localStorage.removeItem(key));
      });
    },

    seedAuth: function(role, options = {}) {
      this.amOnPage('/');
      this.executeScript(({ role, options }) => {
        const normalizedRole = role.startsWith('ROLE_') ? role : `ROLE_${role}`;
        const bareRole = normalizedRole.replace('ROLE_', '');

        localStorage.setItem('token', options.token || `e2e-token-${bareRole}`);
        localStorage.setItem('userRole', normalizedRole);
        localStorage.setItem('userId', String(options.userId || 1));
        localStorage.setItem('userName', options.userName || `E2E ${bareRole}`);

        if (options.clinicId !== undefined) {
          localStorage.setItem('clinicId', String(options.clinicId));
        } else if (bareRole === 'CLINIC_MANAGER' || bareRole === 'DOCTOR') {
          localStorage.setItem('clinicId', '1');
        }
      }, { role, options });
    },

    clientNavigate: function(path) {
      this.executeScript((path) => {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, path);
    },
  });
}
