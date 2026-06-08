import { setHeadlessWhen, setCommonPlugins } from '@codeceptjs/configure';

// turn on headless mode when running with HEADLESS=true environment variable
setHeadlessWhen(process.env.HEADLESS);

// enable all common plugins https://github.com/codeceptjs/configure#setcommonplugins
setCommonPlugins();

export const config = {
  tests: './e2e_tests/*_test.js',
  output: './output',
  helpers: {
    Playwright: {
      // Nếu có biến môi trường TEST_URL thì dùng, không thì mặc định test bản deploy
      url: process.env.TEST_URL || 'https://ktpm-ruby.vercel.app/',
      show: true,
      browser: 'chromium'
    }
  },
  include: {
    I: './steps_file.js'
  },
  name: 'frontend'
}
