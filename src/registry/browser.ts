/**
 * Browser
 * Search and fetch agents from registry.
 */

import semver from 'semver';
import type { RegistryEntry } from './types.js';
import type { RegistryIndexManager } from './index-manager.js';

export class RegistryBrowser {
  private indexManager: RegistryIndexManager;
  private indexPath: string;

  constructor(indexManager: RegistryIndexManager, indexPath: string) {
    this.indexManager = indexManager;
    this.indexPath = indexPath;
  }

  async search(query: string): Promise<RegistryEntry[]> {
    const index = await this.indexManager.read(this.indexPath);
    const lowerQuery = query.toLowerCase();
    return index.agents.filter(
      agent => agent.name.toLowerCase().includes(lowerQuery),
    );
  }

  async searchByAuthor(author: string): Promise<RegistryEntry[]> {
    const index = await this.indexManager.read(this.indexPath);
    const lowerAuthor = author.toLowerCase();
    return index.agents.filter(
      agent => agent.author.toLowerCase().includes(lowerAuthor),
    );
  }

  async getVersions(name: string): Promise<string[]> {
    const index = await this.indexManager.read(this.indexPath);
    const versions = index.agents
      .filter(agent => agent.name === name)
      .map(agent => agent.version);
    return versions.sort((a, b) => semver.rcompare(a, b));
  }
}
