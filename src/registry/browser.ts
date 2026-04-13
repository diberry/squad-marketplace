/**
 * Browser
 * Search and fetch agents from registry.
 */

import type { RegistryEntry } from './types';

export class RegistryBrowser {
  async search(query: string): Promise<RegistryEntry[]> {
    // TODO: Implement registry search
    throw new Error('Not implemented');
  }

  async getVersions(name: string): Promise<string[]> {
    // TODO: Implement version listing
    throw new Error('Not implemented');
  }
}
