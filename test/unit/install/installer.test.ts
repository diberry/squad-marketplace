import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { AgentInstaller } from '../../../src/install/installer';
import { AgentExtractor } from '../../../src/package/extractor';
import { AgentPackager } from '../../../src/package/packager';
import { DependencyResolver } from '../../../src/install/dependency-resolver';
import { MetadataManager } from '../../../src/install/metadata';
import { GitHubRegistry } from '../../../src/registry/github-registry';
import { RegistryIndexManager } from '../../../src/registry/index-manager';
import { ChecksumCalculator } from '../../../src/utils/checksum';

describe('AgentInstaller', () => {
  let tempDir: string;
  let targetDir: string;
  let indexPath: string;
  let agentSourceDir: string;
  let packageBuffer: Buffer;

  const manifest = {
    name: 'install-agent',
    version: '1.0.0',
    author: 'tester',
    description: 'Agent to install',
    skills: {},
  };

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'installer-test-'));
    targetDir = join(tempDir, 'target');
    mkdirSync(targetDir);
    indexPath = join(tempDir, 'index.json');
    agentSourceDir = join(tempDir, 'agent-src');
    mkdirSync(agentSourceDir);
    writeFileSync(join(agentSourceDir, 'manifest.json'), JSON.stringify(manifest));
    writeFileSync(join(agentSourceDir, 'index.ts'), 'export default {};');

    const packager = new AgentPackager();
    packageBuffer = await packager.package(agentSourceDir);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  function createInstallerWithMocks() {
    const indexManager = new RegistryIndexManager();
    const checksum = ChecksumCalculator.calculateSHA256(packageBuffer);

    const mockFetch = async (url: string, init?: RequestInit) => {
      return {
        ok: true,
        statusText: 'OK',
        arrayBuffer: async () => packageBuffer.buffer.slice(
          packageBuffer.byteOffset,
          packageBuffer.byteOffset + packageBuffer.byteLength,
        ),
      } as Response;
    };

    const registry = new GitHubRegistry('owner', 'repo', 'token', indexManager, mockFetch, indexPath);

    // Seed index with the agent entry
    indexManager.initialize(indexPath).then(() =>
      indexManager.addEntry(indexPath, {
        name: 'install-agent',
        version: '1.0.0',
        author: 'tester',
        published_at: new Date().toISOString(),
        checksum,
        download_url: 'https://example.com/dl',
      }),
    );

    return new AgentInstaller(
      registry,
      new AgentExtractor(),
      new DependencyResolver(),
      new MetadataManager(),
    );
  }

  it('should install agent from registry', async () => {
    const installer = createInstallerWithMocks();
    // Wait for index seeding
    await new Promise(r => setTimeout(r, 50));

    const metadata = await installer.install('install-agent', '1.0.0', targetDir);
    expect(metadata.name).toBe('install-agent');
    expect(metadata.version).toBe('1.0.0');
    expect(metadata.locked).toBe(true);
  });

  it('should extract to .squad/agents/{name}/', async () => {
    const installer = createInstallerWithMocks();
    await new Promise(r => setTimeout(r, 50));

    await installer.install('install-agent', '1.0.0', targetDir);
    const agentDir = join(targetDir, '.squad', 'agents', 'install-agent');
    expect(existsSync(agentDir)).toBe(true);
    expect(existsSync(join(agentDir, 'manifest.json'))).toBe(true);
  });

  it('should create .agent-metadata.json on install', async () => {
    const installer = createInstallerWithMocks();
    await new Promise(r => setTimeout(r, 50));

    await installer.install('install-agent', '1.0.0', targetDir);
    const metaPath = join(targetDir, '.squad', 'agents', 'install-agent', '.agent-metadata.json');
    expect(existsSync(metaPath)).toBe(true);
  });

  it('should lock agent to exact version', async () => {
    const installer = createInstallerWithMocks();
    await new Promise(r => setTimeout(r, 50));

    const metadata = await installer.install('install-agent', '1.0.0', targetDir);
    expect(metadata.locked).toBe(true);
    expect(metadata.version).toBe('1.0.0');
  });

  it('should uninstall agent and cleanup', async () => {
    const installer = createInstallerWithMocks();
    await new Promise(r => setTimeout(r, 50));

    await installer.install('install-agent', '1.0.0', targetDir);
    const agentDir = join(targetDir, '.squad', 'agents', 'install-agent');
    expect(existsSync(agentDir)).toBe(true);

    await installer.uninstall('install-agent', targetDir);
    expect(existsSync(agentDir)).toBe(false);
  });

  it('should throw when uninstalling non-existent agent', async () => {
    const installer = createInstallerWithMocks();
    await expect(installer.uninstall('nonexistent', targetDir)).rejects.toThrow('not installed');
  });
});
