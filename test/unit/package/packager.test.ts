import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { AgentPackager } from '../../../src/package/packager';
import { TarStream } from '../../../src/utils/tar-stream';

describe('AgentPackager', () => {
  let tempDir: string;
  const packager = new AgentPackager();

  const validManifest = {
    name: 'test-agent',
    version: '1.0.0',
    author: 'tester',
    description: 'Test agent',
    skills: {},
  };

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'packager-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should create a tar.gz bundle from agent directory', async () => {
    writeFileSync(join(tempDir, 'manifest.json'), JSON.stringify(validManifest));
    writeFileSync(join(tempDir, 'index.ts'), 'export default {}');

    const buffer = await packager.package(tempDir);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should include manifest.json at bundle root', async () => {
    writeFileSync(join(tempDir, 'manifest.json'), JSON.stringify(validManifest));

    const buffer = await packager.package(tempDir);

    // Extract and verify manifest exists
    const extractDir = mkdtempSync(join(tmpdir(), 'packager-extract-'));
    try {
      await TarStream.extract(buffer, extractDir);
      const { readFileSync } = await import('node:fs');
      const manifest = JSON.parse(readFileSync(join(extractDir, 'manifest.json'), 'utf-8'));
      expect(manifest.name).toBe('test-agent');
    } finally {
      rmSync(extractDir, { recursive: true, force: true });
    }
  });

  it('should preserve directory structure (skills/, config/)', async () => {
    writeFileSync(join(tempDir, 'manifest.json'), JSON.stringify(validManifest));
    mkdirSync(join(tempDir, 'skills'));
    writeFileSync(join(tempDir, 'skills', 'review.ts'), 'export const review = true;');
    mkdirSync(join(tempDir, 'config'));
    writeFileSync(join(tempDir, 'config', 'settings.json'), '{"key":"value"}');

    const buffer = await packager.package(tempDir);

    const extractDir = mkdtempSync(join(tmpdir(), 'packager-struct-'));
    try {
      await TarStream.extract(buffer, extractDir);
      const { readFileSync, existsSync } = await import('node:fs');
      expect(existsSync(join(extractDir, 'skills', 'review.ts'))).toBe(true);
      expect(existsSync(join(extractDir, 'config', 'settings.json'))).toBe(true);
      expect(readFileSync(join(extractDir, 'skills', 'review.ts'), 'utf-8')).toBe('export const review = true;');
    } finally {
      rmSync(extractDir, { recursive: true, force: true });
    }
  });

  it('should reject if manifest.json is missing', async () => {
    writeFileSync(join(tempDir, 'index.ts'), 'export default {}');

    await expect(packager.package(tempDir)).rejects.toThrow('manifest.json not found');
  });

  it('should reject if manifest.json has invalid content', async () => {
    writeFileSync(join(tempDir, 'manifest.json'), JSON.stringify({ name: '' }));

    await expect(packager.package(tempDir)).rejects.toThrow();
  });
});
