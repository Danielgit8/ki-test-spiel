import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests-e2e',
  use: { baseURL: 'http://localhost:4173', browserName: 'chromium' },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
  },
});
