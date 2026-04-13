import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    maxConcurrency: 5,
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 4,
        minForks: 1,
      },
    },
  },
});
