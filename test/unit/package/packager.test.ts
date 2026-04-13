import { describe, it, expect } from 'vitest';
import { AgentPackager } from '../../../src/package/packager';

describe('AgentPackager', () => {
  it('should create a tar.gz bundle from agent directory', () => {
    // TODO: Implement test
  });

  it('should include manifest.json at bundle root', () => {
    // TODO: Implement test
  });

  it('should preserve directory structure (skills/, config/)', () => {
    // TODO: Implement test
  });

  it('should reject if manifest.json is missing', () => {
    // TODO: Implement test
  });
});
