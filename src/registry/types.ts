/**
 * Registry Types
 * Interfaces for registry operations.
 */

export interface RegistryEntry {
  name: string;
  version: string;
  author: string;
  published_at: string;
  checksum: string;
  download_url?: string;
}

export interface RegistryIndex {
  version: string;
  lastUpdated: string;
  agents: RegistryEntry[];
}
