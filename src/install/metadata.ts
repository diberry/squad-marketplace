/**
 * Installation Metadata
 * Manage agent installation records.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { InstallationMetadata } from './installer.js';

const METADATA_FILE = '.agent-metadata.json';

export class MetadataManager {
  async write(agentDir: string, metadata: InstallationMetadata): Promise<void> {
    mkdirSync(agentDir, { recursive: true });
    const metaPath = join(agentDir, METADATA_FILE);
    writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');
  }

  async read(agentDir: string): Promise<InstallationMetadata> {
    const metaPath = join(agentDir, METADATA_FILE);
    const raw = readFileSync(metaPath, 'utf-8');
    return JSON.parse(raw) as InstallationMetadata;
  }

  async exists(agentDir: string): Promise<boolean> {
    const metaPath = join(agentDir, METADATA_FILE);
    return existsSync(metaPath);
  }
}
