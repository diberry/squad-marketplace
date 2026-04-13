import { describe, it, expect } from 'vitest';
import type { AgentManifest, SkillDependency } from '../../../src/manifest/types';

describe('AgentManifest types', () => {
  it('should have correct manifest interface structure', () => {
    const manifest: AgentManifest = {
      name: 'test-agent',
      version: '1.0.0',
      author: 'test-author',
      description: 'A test agent',
      skills: {},
    };

    expect(manifest.name).toBe('test-agent');
    expect(manifest.version).toBe('1.0.0');
    expect(manifest.author).toBe('test-author');
    expect(manifest.description).toBe('A test agent');
    expect(manifest.skills).toEqual({});
    expect(manifest.config).toBeUndefined();
    expect(manifest.checksum).toBeUndefined();
    expect(manifest.publishedAt).toBeUndefined();
  });

  it('should validate skill dependency format', () => {
    const skills: SkillDependency = {
      'code-review': '^1.0.0',
      'testing': '~2.1.0',
      'deployment': '>=3.0.0',
    };

    expect(Object.keys(skills)).toHaveLength(3);
    expect(skills['code-review']).toBe('^1.0.0');
    expect(skills['testing']).toBe('~2.1.0');
    expect(skills['deployment']).toBe('>=3.0.0');
  });

  it('should support optional config and checksum fields', () => {
    const manifest: AgentManifest = {
      name: 'full-agent',
      version: '2.0.0',
      author: 'author',
      description: 'Full agent',
      skills: { 'skill-a': '1.0.0' },
      config: { maxRetries: 3, timeout: 5000 },
      checksum: 'abc123',
      publishedAt: '2024-01-01T00:00:00.000Z',
    };

    expect(manifest.config).toEqual({ maxRetries: 3, timeout: 5000 });
    expect(manifest.checksum).toBe('abc123');
    expect(manifest.publishedAt).toBe('2024-01-01T00:00:00.000Z');
  });
});
