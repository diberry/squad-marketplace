import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { GitHubRegistry } from '../../../src/registry/github-registry';
import { RegistryIndexManager } from '../../../src/registry/index-manager';
import { ChecksumCalculator } from '../../../src/utils/checksum';
import type { AgentManifest } from '../../../src/manifest/types';

describe('GitHubRegistry', () => {
  let tempDir: string;
  let indexPath: string;
  let indexManager: RegistryIndexManager;

  const manifest: AgentManifest = {
    name: 'test-agent',
    version: '1.0.0',
    author: 'tester',
    description: 'Test agent',
    skills: {},
  };

  const packageBuffer = Buffer.from('fake-package-data');
  const packageChecksum = ChecksumCalculator.calculateSHA256(packageBuffer);

  function createMockFetch() {
    return async (url: string, init?: RequestInit) => {
      // Create release
      if (url.includes('api.github.com') && url.includes('/releases') && init?.method === 'POST') {
        return {
          ok: true,
          statusText: 'Created',
          json: async () => ({
            id: 123,
            upload_url: 'https://uploads.github.com/repos/owner/repo/releases/123/assets{?name,label}',
          }),
        } as Response;
      }
      // Upload asset
      if (url.includes('uploads.github.com') && init?.method === 'POST') {
        return {
          ok: true,
          statusText: 'Created',
          json: async () => ({
            browser_download_url: 'https://github.com/owner/repo/releases/download/v1/test-agent-1.0.0.tar.gz',
          }),
        } as Response;
      }
      // Download asset
      return {
        ok: true,
        statusText: 'OK',
        arrayBuffer: async () => {
          const copy = Buffer.from(packageBuffer);
          return copy.buffer.slice(copy.byteOffset, copy.byteOffset + copy.byteLength);
        },
      } as Response;
    };
  }

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'github-registry-test-'));
    indexPath = join(tempDir, 'index.json');
    indexManager = new RegistryIndexManager();
    await indexManager.initialize(indexPath);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should publish agent to GitHub Releases', async () => {
    const registry = new GitHubRegistry('owner', 'repo', 'token', indexManager, createMockFetch(), indexPath);
    const entry = await registry.publish(packageBuffer, manifest);

    expect(entry.name).toBe('test-agent');
    expect(entry.version).toBe('1.0.0');
    expect(entry.author).toBe('tester');
    expect(entry.checksum).toBe(packageChecksum);
    expect(entry.download_url).toBeDefined();
  });

  it('should update registry index on publish', async () => {
    const registry = new GitHubRegistry('owner', 'repo', 'token', indexManager, createMockFetch(), indexPath);
    await registry.publish(packageBuffer, manifest);

    const index = await registry.getIndex();
    expect(index.agents).toHaveLength(1);
    expect(index.agents[0].name).toBe('test-agent');
  });

  it('should tag release with agent-{name}-{version}', async () => {
    let capturedBody: string | undefined;
    const mockFetch = async (url: string, init?: RequestInit) => {
      if (url.includes('api.github.com') && url.includes('/releases') && init?.method === 'POST') {
        capturedBody = init?.body as string;
        return {
          ok: true,
          statusText: 'Created',
          json: async () => ({ id: 1, upload_url: 'https://uploads.github.com/repos/o/r/releases/1/assets{?name,label}' }),
        } as Response;
      }
      return {
        ok: true,
        statusText: 'Created',
        json: async () => ({ browser_download_url: 'https://example.com/dl' }),
      } as Response;
    };

    const registry = new GitHubRegistry('owner', 'repo', 'token', indexManager, mockFetch, indexPath);
    await registry.publish(packageBuffer, manifest);

    expect(capturedBody).toBeDefined();
    const parsed = JSON.parse(capturedBody!);
    expect(parsed.tag_name).toBe('agent-test-agent-1.0.0');
  });

  it('should search registry by agent name', async () => {
    const registry = new GitHubRegistry('owner', 'repo', 'token', indexManager, createMockFetch(), indexPath);
    await registry.publish(packageBuffer, manifest);

    const results = await registry.search('test');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('test-agent');

    const noResults = await registry.search('nonexistent');
    expect(noResults).toHaveLength(0);
  });

  it('should fetch agent from registry with checksum verification', async () => {
    const registry = new GitHubRegistry('owner', 'repo', 'token', indexManager, createMockFetch(), indexPath);
    await registry.publish(packageBuffer, manifest);

    const fetched = await registry.fetch('test-agent', '1.0.0');
    expect(Buffer.isBuffer(fetched)).toBe(true);
  });

  it('should throw on checksum mismatch', async () => {
    const badFetch = async (url: string, init?: RequestInit) => {
      if (url.includes('api.github.com') && url.includes('/releases') && init?.method === 'POST') {
        return {
          ok: true, statusText: 'Created',
          json: async () => ({ id: 1, upload_url: 'https://uploads.github.com/repos/o/r/releases/1/assets{?name,label}' }),
        } as Response;
      }
      if (url.includes('uploads.github.com') && init?.method === 'POST') {
        return {
          ok: true, statusText: 'Created',
          json: async () => ({ browser_download_url: 'https://example.com/dl' }),
        } as Response;
      }
      // Return different data to cause checksum mismatch
      const wrongData = Buffer.from('wrong-data');
      return {
        ok: true, statusText: 'OK',
        arrayBuffer: async () => wrongData.buffer.slice(
          wrongData.byteOffset,
          wrongData.byteOffset + wrongData.byteLength,
        ),
      } as Response;
    };

    const registry = new GitHubRegistry('owner', 'repo', 'token', indexManager, badFetch, indexPath);
    await registry.publish(packageBuffer, manifest);

    await expect(registry.fetch('test-agent', '1.0.0')).rejects.toThrow('Checksum mismatch');
  });

  it('should throw when agent not found', async () => {
    const registry = new GitHubRegistry('owner', 'repo', 'token', indexManager, createMockFetch(), indexPath);
    await expect(registry.fetch('nonexistent', '1.0.0')).rejects.toThrow('not found');
  });
});
