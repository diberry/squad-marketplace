import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { RegistryBrowser } from '../../../src/registry/browser';
import { RegistryIndexManager } from '../../../src/registry/index-manager';

describe('RegistryBrowser', () => {
  let tempDir: string;
  let indexPath: string;
  let indexManager: RegistryIndexManager;
  let browser: RegistryBrowser;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'browser-test-'));
    indexPath = join(tempDir, 'index.json');
    indexManager = new RegistryIndexManager();
    await indexManager.initialize(indexPath);
    browser = new RegistryBrowser(indexManager, indexPath);

    // Seed entries
    await indexManager.addEntry(indexPath, {
      name: 'code-reviewer', version: '1.0.0', author: 'alice', published_at: '', checksum: 'c1',
    });
    await indexManager.addEntry(indexPath, {
      name: 'code-reviewer', version: '2.0.0', author: 'alice', published_at: '', checksum: 'c2',
    });
    await indexManager.addEntry(indexPath, {
      name: 'code-reviewer', version: '1.5.0', author: 'alice', published_at: '', checksum: 'c3',
    });
    await indexManager.addEntry(indexPath, {
      name: 'test-runner', version: '1.0.0', author: 'bob', published_at: '', checksum: 'c4',
    });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should search registry by agent name', async () => {
    const results = await browser.search('code');
    expect(results).toHaveLength(3);
    expect(results.every(r => r.name === 'code-reviewer')).toBe(true);

    const results2 = await browser.search('test');
    expect(results2).toHaveLength(1);
    expect(results2[0].name).toBe('test-runner');
  });

  it('should filter by author', async () => {
    const aliceResults = await browser.searchByAuthor('alice');
    expect(aliceResults).toHaveLength(3);

    const bobResults = await browser.searchByAuthor('bob');
    expect(bobResults).toHaveLength(1);
    expect(bobResults[0].name).toBe('test-runner');

    const noResults = await browser.searchByAuthor('charlie');
    expect(noResults).toHaveLength(0);
  });

  it('should list all versions for agent (newest first)', async () => {
    const versions = await browser.getVersions('code-reviewer');
    expect(versions).toEqual(['2.0.0', '1.5.0', '1.0.0']);
  });

  it('should return empty array for unknown agent versions', async () => {
    const versions = await browser.getVersions('nonexistent');
    expect(versions).toEqual([]);
  });

  it('should handle case-insensitive search', async () => {
    const results = await browser.search('CODE');
    expect(results).toHaveLength(3);
  });
});
