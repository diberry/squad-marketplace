/**
 * Publisher
 * Manage agent publishing workflow.
 */

import type { AgentPackager } from '../package/packager.js';
import type { SecurityScanner } from '../security/scanner.js';
import type { GitHubRegistry } from './github-registry.js';
import type { RegistryEntry } from './types.js';
import { ManifestValidator } from '../manifest/validator.js';
import { RegistryError } from '../utils/errors.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export class AgentPublisher {
  private packager: AgentPackager;
  private scanner: SecurityScanner;
  private registry: GitHubRegistry;

  constructor(packager: AgentPackager, scanner: SecurityScanner, registry: GitHubRegistry) {
    this.packager = packager;
    this.scanner = scanner;
    this.registry = registry;
  }

  async publish(agentDir: string): Promise<RegistryEntry> {
    // 1. Package the agent
    const packageBuffer = await this.packager.package(agentDir);

    // 2. Security scan
    const scan = await this.scanner.scan(agentDir);
    if (!scan.approved) {
      throw new RegistryError(`Security scan failed for ${scan.agentName}: ${scan.riskLevel} risk level`);
    }

    // 3. Read and validate manifest
    const manifestRaw = readFileSync(join(agentDir, 'manifest.json'), 'utf-8');
    const validator = new ManifestValidator();
    const manifest = validator.validate(JSON.parse(manifestRaw));

    // 4. Publish to registry
    return this.registry.publish(packageBuffer, manifest);
  }
}
