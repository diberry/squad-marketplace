/**
 * Installation Metadata
 * Manage agent installation records.
 */

import type { InstallationMetadata } from './installer';

export class MetadataManager {
  async write(agentDir: string, metadata: InstallationMetadata): Promise<void> {
    // TODO: Implement metadata persistence
    throw new Error('Not implemented');
  }

  async read(agentDir: string): Promise<InstallationMetadata> {
    // TODO: Implement metadata reading
    throw new Error('Not implemented');
  }
}
