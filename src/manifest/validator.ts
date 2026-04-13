/**
 * Manifest Validator
 * Validates agent manifest structure and schema.
 */

import semver from 'semver';
import type { AgentManifest } from './types.js';
import { ChecksumCalculator } from '../utils/checksum.js';
import { ManifestValidationError } from '../utils/errors.js';

export class ManifestValidator {
  validate(manifest: unknown): AgentManifest {
    if (!manifest || typeof manifest !== 'object') {
      throw new ManifestValidationError('Manifest must be a non-null object');
    }

    const m = manifest as Record<string, unknown>;

    if (typeof m.name !== 'string' || m.name.trim() === '') {
      throw new ManifestValidationError('Manifest "name" is required and must be a non-empty string');
    }

    if (typeof m.version !== 'string' || !semver.valid(m.version)) {
      throw new ManifestValidationError('Manifest "version" must be a valid semver string');
    }

    if (typeof m.author !== 'string' || m.author.trim() === '') {
      throw new ManifestValidationError('Manifest "author" is required and must be a non-empty string');
    }

    if (typeof m.description !== 'string' || m.description.trim() === '') {
      throw new ManifestValidationError('Manifest "description" is required and must be a non-empty string');
    }

    if (!m.skills || typeof m.skills !== 'object' || Array.isArray(m.skills)) {
      throw new ManifestValidationError('Manifest "skills" is required and must be an object');
    }

    const validated: AgentManifest = {
      name: m.name as string,
      version: m.version as string,
      author: m.author as string,
      description: m.description as string,
      skills: m.skills as Record<string, string>,
    };

    if (m.config !== undefined) {
      validated.config = m.config as Record<string, unknown>;
    }

    if (m.publishedAt !== undefined) {
      validated.publishedAt = m.publishedAt as string;
    }

    // Compute checksum from core fields
    const checksumData = JSON.stringify({
      name: validated.name,
      version: validated.version,
      author: validated.author,
      description: validated.description,
      skills: validated.skills,
    });
    validated.checksum = ChecksumCalculator.calculateSHA256(checksumData);

    return validated;
  }
}
