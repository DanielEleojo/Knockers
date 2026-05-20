import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['{src,server}/**/*.test.js'],
    // Installs an in-memory localStorage stub (see test/setup.js).
    setupFiles: ['./test/setup.js'],
  },
});
