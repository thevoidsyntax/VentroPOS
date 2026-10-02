import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['dotenv/config'],
    envFilePath: '.env.test',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.config.ts',
      ],
    },
    include: ['tests/**/*.test.ts'],
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('test'),
  },
});
