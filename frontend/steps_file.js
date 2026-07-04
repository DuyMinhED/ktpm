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

    clickButtonContaining: function(fragment) {
      this.executeScript((fragment) => {
        const buttons = Array.from(document.querySelectorAll('button'))
          .filter((button) => !button.disabled && button.offsetParent !== null);
        const target = buttons.find((button) => button.textContent.includes(fragment));

        if (!target) {
          throw new Error(`No visible enabled button contains: ${fragment}`);
        }

        target.click();
      }, fragment);
    },

    clickModalPrimaryButton: function() {
      this.executeScript(() => {
        const modals = Array.from(document.querySelectorAll('.fixed.inset-0'));
        const modal = modals[modals.length - 1];
        if (!modal) {
          throw new Error('No modal overlay is currently visible');
        }

        const buttons = Array.from(modal.querySelectorAll('button'))
          .filter((button) => !button.disabled && button.offsetParent !== null);
        const target = buttons.find((button) => {
          const className = String(button.className || '');
          const text = button.textContent || '';
          return className.includes('bg-primary') && !text.includes('Hủy') && !text.includes('Há»§y');
        }) || buttons[buttons.length - 1];

        if (!target) {
          throw new Error('No enabled button found in current modal');
        }

        target.click();
      });
    },

    waitForFieldErrors: function(minCount = 1) {
      this.waitForFunction((minCount) => {
        const errorNodes = document.querySelectorAll(
          'p[class*="text-red-500"], p[class*="text-red-600"], .text-red-500, .text-red-600'
        );
        return errorNodes.length >= minCount;
      }, [minCount], 5);
    },
  });
}
