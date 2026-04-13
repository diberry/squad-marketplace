import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { AgentPublisher } from '../../../src/registry/publisher';
import { AgentPackager } from '../../../src/package/packager';
import { SecurityScanner } from '../../../src/security/scanner';
import { GitHubRegistry } from '../../../src/registry/github-registry';
import { RegistryIndexManager } from '../../../src/registry/index-manager';

describe('AgentPublisher', () => {
  let tempDir: string;
  let agentDir: string;
  let indexPath: string;

  const validManifest = {
    name: 'pub-agent',
    version: '1.0.0',
    author: 'publisher',
    description: 'A publishable agent',
    skills: {},
  };

  function createMockFetch() {
    return async (url: string, init?: RequestInit) => {
      if (url.includes('/releases') && init?.method === 'POST') {
        return {
          ok: true, statusText: 'Created',
          json: async () => ({ id: 1, upload_url: 'https://uploads.example.com/{?name,label}' }),
        } as Response;
      }
      return {
        ok: true, statusText: 'Created',
        json: async () => ({ browser_download_url: 'https://example.com/dl' }),
      } as Response;
    };
  }

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'publisher-test-'));
    agentDir = join(tempDir, 'agent');
    mkdirSync(agentDir);
    indexPath = join(tempDir, 'index.json');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should execute full publish workflow', async () => {
    writeFileSync(join(agentDir, 'manifest.json'), JSON.stringify(validManifest));
    writeFileSync(join(agentDir, 'index.ts'), 'export const agent = {};');

    const indexManager = new RegistryIndexManager();
    await indexManager.initialize(indexPath);

    const packager = new AgentPackager();
    const scanner = new SecurityScanner();
    const registry = new GitHubRegistry('owner', 'repo', 'token', indexManager, createMockFetch(), indexPath);
    const publisher = new AgentPublisher(packager, scanner, registry);

    const entry = await publisher.publish(agentDir);
    expect(entry.name).toBe('pub-agent');
    expect(entry.version).toBe('1.0.0');
    expect(entry.checksum).toBeDefined();
  });

  it('should fail publish if security scan finds CRITICAL issues', async () => {
    writeFileSync(join(agentDir, 'manifest.json'), JSON.stringify(validManifest));
    writeFileSync(join(agentDir, 'secrets.ts'), 'const api_key = "SUPERSECRETAPIKEY12345";');

    const indexManager = new RegistryIndexManager();
    await indexManager.initialize(indexPath);

    const packager = new AgentPackager();
    const scanner = new SecurityScanner();
    const registry = new GitHubRegistry('owner', 'repo', 'token', indexManager, createMockFetch(), indexPath);
    const publisher = new AgentPublisher(packager, scanner, registry);

    await expect(publisher.publish(agentDir)).rejects.toThrow('Security scan failed');
  });
});
