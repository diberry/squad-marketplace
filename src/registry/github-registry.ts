/**
 * GitHub Registry
 * Git-based private agent registry using GitHub Releases.
 */

import type { RegistryEntry, RegistryIndex } from './types.js';
import type { AgentManifest } from '../manifest/types.js';
import type { RegistryIndexManager } from './index-manager.js';
import { ChecksumCalculator } from '../utils/checksum.js';
import { RegistryError } from '../utils/errors.js';

export type FetchFunction = (url: string, init?: RequestInit) => Promise<Response>;

export class GitHubRegistry {
  private owner: string;
  private repo: string;
  private token: string;
  private indexManager: RegistryIndexManager;
  private fetchFn: FetchFunction;
  private indexPath: string;

  constructor(
    owner: string,
    repo: string,
    token: string,
    indexManager: RegistryIndexManager,
    fetchFn: FetchFunction,
    indexPath: string = 'registry-index.json',
  ) {
    this.owner = owner;
    this.repo = repo;
    this.token = token;
    this.indexManager = indexManager;
    this.fetchFn = fetchFn;
    this.indexPath = indexPath;
  }

  async publish(packageBuffer: Buffer, manifest: AgentManifest): Promise<RegistryEntry> {
    const tag = `agent-${manifest.name}-${manifest.version}`;
    const checksum = ChecksumCalculator.calculateSHA256(packageBuffer);

    // Create a release via GitHub API
    const createReleaseUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/releases`;
    const releaseResponse = await this.fetchFn(createReleaseUrl, {
      method: 'POST',
      headers: {
        Authorization: `token ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tag_name: tag,
        name: `${manifest.name} v${manifest.version}`,
        body: manifest.description,
      }),
    });

    if (!releaseResponse.ok) {
      throw new RegistryError(`Failed to create release: ${releaseResponse.statusText}`);
    }

    const releaseData = await releaseResponse.json() as { upload_url: string; id: number };

    // Upload asset
    const uploadUrl = releaseData.upload_url.replace('{?name,label}', `?name=${manifest.name}-${manifest.version}.tar.gz`);
    const uploadResponse = await this.fetchFn(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `token ${this.token}`,
        'Content-Type': 'application/gzip',
      },
      body: packageBuffer,
    });

    if (!uploadResponse.ok) {
      throw new RegistryError(`Failed to upload asset: ${uploadResponse.statusText}`);
    }

    const uploadData = await uploadResponse.json() as { browser_download_url: string };

    const entry: RegistryEntry = {
      name: manifest.name,
      version: manifest.version,
      author: manifest.author,
      published_at: new Date().toISOString(),
      checksum,
      download_url: uploadData.browser_download_url,
    };

    await this.indexManager.addEntry(this.indexPath, entry);

    return entry;
  }

  async search(query: string): Promise<RegistryEntry[]> {
    const index = await this.indexManager.read(this.indexPath);
    const lowerQuery = query.toLowerCase();
    return index.agents.filter(
      agent =>
        agent.name.toLowerCase().includes(lowerQuery) ||
        agent.author.toLowerCase().includes(lowerQuery),
    );
  }

  async fetch(name: string, version: string): Promise<Buffer> {
    const index = await this.indexManager.read(this.indexPath);
    const entry = index.agents.find(a => a.name === name && a.version === version);
    if (!entry) {
      throw new RegistryError(`Agent ${name}@${version} not found in registry`);
    }
    if (!entry.download_url) {
      throw new RegistryError(`No download URL for ${name}@${version}`);
    }

    const response = await this.fetchFn(entry.download_url, {
      headers: { Authorization: `token ${this.token}` },
    });

    if (!response.ok) {
      throw new RegistryError(`Failed to download ${name}@${version}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verify checksum
    const actualChecksum = ChecksumCalculator.calculateSHA256(buffer);
    if (actualChecksum !== entry.checksum) {
      throw new RegistryError(`Checksum mismatch for ${name}@${version}: expected ${entry.checksum}, got ${actualChecksum}`);
    }

    return buffer;
  }

  async getIndex(): Promise<RegistryIndex> {
    return this.indexManager.read(this.indexPath);
  }
}
