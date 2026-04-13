import { describe, it, expect } from 'vitest';
import { DependencyResolver } from '../../../src/install/dependency-resolver';
import { InstallationError } from '../../../src/utils/errors';

describe('DependencyResolver', () => {
  const resolver = new DependencyResolver();

  it('should resolve semver constraints', async () => {
    const deps = {
      'code-review': '^1.0.0',
      'testing': '~2.1.0',
    };
    const available = {
      'code-review': ['1.0.0', '1.2.0', '1.5.0', '2.0.0'],
      'testing': ['2.1.0', '2.1.5', '2.2.0', '3.0.0'],
    };

    const resolved = await resolver.resolve(deps, available);
    expect(resolved['code-review']).toBe('1.5.0'); // highest ^1.x
    expect(resolved['testing']).toBe('2.1.5'); // highest ~2.1.x
  });

  it('should detect version conflicts (no matching version)', async () => {
    const deps = { 'agent-x': '^3.0.0' };
    const available = { 'agent-x': ['1.0.0', '2.0.0'] };

    await expect(resolver.resolve(deps, available)).rejects.toThrow(InstallationError);
    await expect(resolver.resolve(deps, available)).rejects.toThrow('No version');
  });

  it('should fail if dependencies are unresolvable (not available)', async () => {
    const deps = { 'nonexistent': '^1.0.0' };
    const available = {};

    await expect(resolver.resolve(deps, available)).rejects.toThrow(InstallationError);
    await expect(resolver.resolve(deps, available)).rejects.toThrow('not found');
  });

  it('should resolve exact versions', async () => {
    const deps = { 'exact-pkg': '1.2.3' };
    const available = { 'exact-pkg': ['1.2.3', '1.2.4'] };

    const resolved = await resolver.resolve(deps, available);
    expect(resolved['exact-pkg']).toBe('1.2.3');
  });

  it('should handle empty dependencies', async () => {
    const resolved = await resolver.resolve({}, {});
    expect(Object.keys(resolved)).toHaveLength(0);
  });

  it('should resolve >= constraints', async () => {
    const deps = { 'pkg': '>=2.0.0' };
    const available = { 'pkg': ['1.0.0', '2.0.0', '3.0.0'] };

    const resolved = await resolver.resolve(deps, available);
    expect(resolved['pkg']).toBe('3.0.0');
  });
});
