/**
 * Agent Extractor
 * Extracts and validates agent packages.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { TarStream } from '../utils/tar-stream.js';
import { ManifestValidator } from '../manifest/validator.js';
import { ManifestValidationError } from '../utils/errors.js';
import type { AgentManifest } from '../manifest/types.js';

export class AgentExtractor {
  async extract(packageBuffer: Buffer, targetDir: string): Promise<{ extractedPath: string; manifest: AgentManifest }> {
    await TarStream.extract(packageBuffer, targetDir);

    const manifestPath = join(targetDir, 'manifest.json');
    if (!existsSync(manifestPath)) {
      throw new ManifestValidationError('Extracted package does not contain manifest.json');
    }

    const manifestRaw = readFileSync(manifestPath, 'utf-8');
    let manifestData: unknown;
    try {
      manifestData = JSON.parse(manifestRaw);
    } catch {
      throw new ManifestValidationError('Extracted manifest.json contains invalid JSON');
    }

    const validator = new ManifestValidator();
    const manifest = validator.validate(manifestData);

    return { extractedPath: targetDir, manifest };
  }
}
