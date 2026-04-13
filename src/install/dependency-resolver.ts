/**
 * Dependency Resolver
 * Resolve and validate skill dependencies.
 */

import semver from 'semver';
import { InstallationError } from '../utils/errors.js';

export class DependencyResolver {
  async resolve(
    dependencies: Record<string, string>,
    available: Record<string, string[]>,
  ): Promise<Record<string, string>> {
    const resolved: Record<string, string> = {};

    for (const [name, constraint] of Object.entries(dependencies)) {
      const versions = available[name];
      if (!versions || versions.length === 0) {
        throw new InstallationError(`Dependency "${name}" not found in available packages`);
      }

      const matched = semver.maxSatisfying(versions, constraint);
      if (!matched) {
        throw new InstallationError(
          `No version of "${name}" satisfies constraint "${constraint}". Available: ${versions.join(', ')}`,
        );
      }

      resolved[name] = matched;
    }

    return resolved;
  }
}
