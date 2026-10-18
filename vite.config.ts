import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  build: {
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        leaderboard: resolve(import.meta.dirname, 'leaderboard.html'),
      },
    },
  },
  test: { include: ['tests/**/*.test.ts'] },
});
