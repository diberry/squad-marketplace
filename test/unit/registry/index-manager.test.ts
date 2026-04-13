import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { RegistryIndexManager } from '../../../src/registry/index-manager';

describe('RegistryIndexManager', () => {
  let tempDir: string;
  let indexPath: string;
  const manager = new RegistryIndexManager();

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'index-manager-test-'));
    indexPath = join(tempDir, 'index.json');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should initialize an empty index', async () => {
    const index = await manager.initialize(indexPath);
    expect(index.version).toBe('1.0.0');
    expect(index.agents).toHaveLength(0);
    expect(index.lastUpdated).toBeDefined();
  });

  it('should read registry index from file', async () => {
    await manager.initialize(indexPath);
    const index = await manager.read(indexPath);

    expect(index.version).toBe('1.0.0');
    expect(index.agents).toEqual([]);
  });

  it('should write registry index to file', async () => {
    const index = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      agents: [
        { name: 'agent-a', version: '1.0.0', author: 'author', published_at: new Date().toISOString(), checksum: 'abc' },
      ],
    };

    await manager.write(indexPath, index);
    const raw = readFileSync(indexPath, 'utf-8');
    const written = JSON.parse(raw);
    expect(written.agents).toHaveLength(1);
    expect(written.agents[0].name).toBe('agent-a');
  });

  it('should parse registry entry metadata', async () => {
    await manager.initialize(indexPath);
    const entry = {
      name: 'test-agent',
      version: '2.0.0',
      author: 'tester',
      published_at: '2024-01-01T00:00:00.000Z',
      checksum: 'sha256hash',
    };

    const index = await manager.addEntry(indexPath, entry);
    expect(index.agents).toHaveLength(1);
    expect(index.agents[0].name).toBe('test-agent');
    expect(index.agents[0].version).toBe('2.0.0');
    expect(index.agents[0].checksum).toBe('sha256hash');
  });

  it('should add multiple entries', async () => {
    await manager.initialize(indexPath);

    await manager.addEntry(indexPath, {
      name: 'agent-a', version: '1.0.0', author: 'a', published_at: '', checksum: 'c1',
    });
    const index = await manager.addEntry(indexPath, {
      name: 'agent-b', version: '2.0.0', author: 'b', published_at: '', checksum: 'c2',
    });

    expect(index.agents).toHaveLength(2);
  });

  it('should create index on read if file does not exist', async () => {
    const newPath = join(tempDir, 'new-index.json');
    const index = await manager.read(newPath);
    expect(index.version).toBe('1.0.0');
    expect(index.agents).toEqual([]);
  });
});
