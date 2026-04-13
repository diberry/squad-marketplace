import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { AgentExtractor } from '../../../src/package/extractor';
import { AgentPackager } from '../../../src/package/packager';

describe('AgentExtractor', () => {
  let tempDir: string;
  let extractDir: string;
  const extractor = new AgentExtractor();
  const packager = new AgentPackager();

  const validManifest = {
    name: 'test-agent',
    version: '1.0.0',
    author: 'tester',
    description: 'Test agent',
    skills: { 'code-review': '^1.0.0' },
  };

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'extractor-src-'));
    extractDir = mkdtempSync(join(tmpdir(), 'extractor-dest-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    rmSync(extractDir, { recursive: true, force: true });
  });

  it('should extract tar.gz bundle to temp directory', async () => {
    writeFileSync(join(tempDir, 'manifest.json'), JSON.stringify(validManifest));
    writeFileSync(join(tempDir, 'index.ts'), 'export default {}');

    const buffer = await packager.package(tempDir);
    const result = await extractor.extract(buffer, extractDir);

    expect(result.extractedPath).toBe(extractDir);
    expect(result.manifest.name).toBe('test-agent');
  });

  it('should validate manifest.json after extraction', async () => {
    writeFileSync(join(tempDir, 'manifest.json'), JSON.stringify(validManifest));
    const buffer = await packager.package(tempDir);
    const result = await extractor.extract(buffer, extractDir);

    expect(result.manifest.name).toBe('test-agent');
    expect(result.manifest.version).toBe('1.0.0');
    expect(result.manifest.checksum).toBeDefined();
  });

  it('should verify checksum on extraction', async () => {
    writeFileSync(join(tempDir, 'manifest.json'), JSON.stringify(validManifest));
    const buffer = await packager.package(tempDir);
    const { manifest } = await extractor.extract(buffer, extractDir);

    // Checksum should be a valid SHA256 hex string
    expect(manifest.checksum).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should reject corrupted packages', async () => {
    const corruptedBuffer = Buffer.from('not a valid gzip archive');
    await expect(extractor.extract(corruptedBuffer, extractDir)).rejects.toThrow();
  });

  it('should extract nested directory structures', async () => {
    writeFileSync(join(tempDir, 'manifest.json'), JSON.stringify(validManifest));
    mkdirSync(join(tempDir, 'skills'));
    writeFileSync(join(tempDir, 'skills', 'review.ts'), 'review code');

    const buffer = await packager.package(tempDir);
    await extractor.extract(buffer, extractDir);

    const { readFileSync } = await import('node:fs');
    expect(readFileSync(join(extractDir, 'skills', 'review.ts'), 'utf-8')).toBe('review code');
  });
});
