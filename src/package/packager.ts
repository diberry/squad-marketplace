/**
 * Agent Packager
 * Creates .tar.gz bundles from agent directories.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { TarStream } from '../utils/tar-stream.js';
import { ManifestValidator } from '../manifest/validator.js';
import { ManifestValidationError } from '../utils/errors.js';

export class AgentPackager {
  async package(agentDir: string): Promise<Buffer> {
    const manifestPath = join(agentDir, 'manifest.json');
    if (!existsSync(manifestPath)) {
      throw new ManifestValidationError('manifest.json not found in agent directory');
    }

    const manifestRaw = readFileSync(manifestPath, 'utf-8');
    let manifestData: unknown;
    try {
      manifestData = JSON.parse(manifestRaw);
    } catch {
      throw new ManifestValidationError('manifest.json contains invalid JSON');
    }

    const validator = new ManifestValidator();
    validator.validate(manifestData);

    return TarStream.compress(agentDir);
  }
}
