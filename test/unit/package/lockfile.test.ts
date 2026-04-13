import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { LockfileManager } from '../../../src/package/lockfile';
import type { AgentManifest } from '../../../src/manifest/types';

describe('LockfileManager', () => {
  let tempDir: string;
  const manager = new LockfileManager();

  const manifest: AgentManifest = {
    name: 'test-agent',
    version: '1.0.0',
    author: 'tester',
    description: 'Test agent',
    skills: {
      'code-review': '^1.0.0',
      'testing': '~2.0.0',
    },
  };

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'lockfile-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should generate .agent-lock.json with exact versions', async () => {
    const lockfile = await manager.generate(manifest);

    expect(lockfile.name).toBe('test-agent');
    expect(lockfile.version).toBe('1.0.0');
    expect(lockfile.lockedAt).toBeDefined();
    expect(new Date(lockfile.lockedAt).getTime()).not.toBeNaN();
  });

  it('should include skill download checksums', async () => {
    const lockfile = await manager.generate(manifest);

    expect(lockfile.skills['code-review']).toBeDefined();
    expect(lockfile.skills['code-review'].version).toBe('^1.0.0');
    expect(lockfile.skills['code-review'].checksum).toBeDefined();
    expect(lockfile.skills['code-review'].checksum.length).toBe(64);

    expect(lockfile.skills['testing']).toBeDefined();
    expect(lockfile.skills['testing'].version).toBe('~2.0.0');
    expect(lockfile.skills['testing'].checksum).toBeDefined();
  });

  it('should version-pin on install (write and read)', async () => {
    const lockfile = await manager.generate(manifest);
    const lockfilePath = join(tempDir, '.agent-lock.json');

    await manager.write(lockfilePath, lockfile);
    const read = await manager.read(lockfilePath);

    expect(read.name).toBe(lockfile.name);
    expect(read.version).toBe(lockfile.version);
    expect(read.skills).toEqual(lockfile.skills);
  });

  it('should handle manifest with no skills', async () => {
    const emptyManifest: AgentManifest = {
      ...manifest,
      skills: {},
    };
    const lockfile = await manager.generate(emptyManifest);

    expect(Object.keys(lockfile.skills)).toHaveLength(0);
  });
});
