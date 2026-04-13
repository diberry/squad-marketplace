/**
 * Agent Installer
 * Main installation workflow.
 */

import { join } from 'node:path';
import { rmSync, existsSync } from 'node:fs';
import type { GitHubRegistry } from '../registry/github-registry.js';
import type { AgentExtractor } from '../package/extractor.js';
import type { DependencyResolver } from './dependency-resolver.js';
import type { MetadataManager } from './metadata.js';
import { InstallationError } from '../utils/errors.js';

export interface InstallationMetadata {
  name: string;
  version: string;
  installedAt: string;
  from: string; // registry URL
  locked: boolean;
}

export class AgentInstaller {
  private registry: GitHubRegistry;
  private extractor: AgentExtractor;
  private dependencyResolver: DependencyResolver;
  private metadataManager: MetadataManager;

  constructor(
    registry: GitHubRegistry,
    extractor: AgentExtractor,
    dependencyResolver: DependencyResolver,
    metadataManager: MetadataManager,
  ) {
    this.registry = registry;
    this.extractor = extractor;
    this.dependencyResolver = dependencyResolver;
    this.metadataManager = metadataManager;
  }

  async install(agentName: string, version: string, targetDir: string): Promise<InstallationMetadata> {
    // 1. Fetch package from registry
    const packageBuffer = await this.registry.fetch(agentName, version);

    // 2. Extract package
    const agentDir = join(targetDir, '.squad', 'agents', agentName);
    const { manifest } = await this.extractor.extract(packageBuffer, agentDir);

    // 3. Resolve dependencies if any
    if (manifest.skills && Object.keys(manifest.skills).length > 0) {
      const index = await this.registry.getIndex();
      const available: Record<string, string[]> = {};
      for (const entry of index.agents) {
        if (!available[entry.name]) {
          available[entry.name] = [];
        }
        available[entry.name].push(entry.version);
      }
      await this.dependencyResolver.resolve(manifest.skills, available);
    }

    // 4. Write metadata
    const metadata: InstallationMetadata = {
      name: agentName,
      version,
      installedAt: new Date().toISOString(),
      from: `registry://${agentName}@${version}`,
      locked: true,
    };

    await this.metadataManager.write(agentDir, metadata);

    return metadata;
  }

  async uninstall(agentName: string, squadDir: string): Promise<void> {
    const agentDir = join(squadDir, '.squad', 'agents', agentName);
    if (!existsSync(agentDir)) {
      throw new InstallationError(`Agent "${agentName}" is not installed`);
    }
    rmSync(agentDir, { recursive: true, force: true });
  }
}
