import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/helpers/setup.ts'],
    include: ['src/test/**/*.test.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
