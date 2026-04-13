import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { MetadataManager } from '../../../src/install/metadata';
import type { InstallationMetadata } from '../../../src/install/installer';

describe('MetadataManager', () => {
  let tempDir: string;
  const manager = new MetadataManager();

  const sampleMetadata: InstallationMetadata = {
    name: 'test-agent',
    version: '1.0.0',
    installedAt: '2024-01-01T00:00:00.000Z',
    from: 'registry://test-agent@1.0.0',
    locked: true,
  };

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'metadata-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should write installation metadata', async () => {
    const agentDir = join(tempDir, 'agent');
    await manager.write(agentDir, sampleMetadata);

    expect(existsSync(join(agentDir, '.agent-metadata.json'))).toBe(true);
  });

  it('should read installation metadata', async () => {
    const agentDir = join(tempDir, 'agent');
    await manager.write(agentDir, sampleMetadata);
    const read = await manager.read(agentDir);

    expect(read.name).toBe('test-agent');
    expect(read.version).toBe('1.0.0');
    expect(read.from).toBe('registry://test-agent@1.0.0');
    expect(read.locked).toBe(true);
  });

  it('should preserve installation history', async () => {
    const agentDir = join(tempDir, 'agent');
    await manager.write(agentDir, sampleMetadata);

    const updated = { ...sampleMetadata, version: '2.0.0', installedAt: '2024-06-01T00:00:00.000Z' };
    await manager.write(agentDir, updated);

    const read = await manager.read(agentDir);
    expect(read.version).toBe('2.0.0');
    expect(read.installedAt).toBe('2024-06-01T00:00:00.000Z');
  });

  it('should check if metadata exists', async () => {
    const agentDir = join(tempDir, 'no-agent');
    expect(await manager.exists(agentDir)).toBe(false);

    const agentDir2 = join(tempDir, 'agent2');
    await manager.write(agentDir2, sampleMetadata);
    expect(await manager.exists(agentDir2)).toBe(true);
  });

  it('should create parent directories when writing', async () => {
    const deepDir = join(tempDir, 'deep', 'nested', 'agent');
    await manager.write(deepDir, sampleMetadata);
    expect(existsSync(join(deepDir, '.agent-metadata.json'))).toBe(true);
  });
});
