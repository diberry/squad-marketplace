/**
 * Index Manager
 * Read and write registry index files.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import type { RegistryIndex, RegistryEntry } from './types.js';

export class RegistryIndexManager {
  async initialize(indexPath: string): Promise<RegistryIndex> {
    const index: RegistryIndex = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      agents: [],
    };
    writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');
    return index;
  }

  async read(indexPath: string): Promise<RegistryIndex> {
    if (!existsSync(indexPath)) {
      return this.initialize(indexPath);
    }
    const raw = readFileSync(indexPath, 'utf-8');
    return JSON.parse(raw) as RegistryIndex;
  }

  async write(indexPath: string, index: RegistryIndex): Promise<void> {
    index.lastUpdated = new Date().toISOString();
    writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');
  }

  async addEntry(indexPath: string, entry: RegistryEntry): Promise<RegistryIndex> {
    const index = await this.read(indexPath);
    index.agents.push(entry);
    await this.write(indexPath, index);
    return index;
  }
}
