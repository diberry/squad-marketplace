/**
 * Dependency Lockfile
 * Manages .agent-lock.json for version pinning.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { ChecksumCalculator } from '../utils/checksum.js';
import type { AgentManifest } from '../manifest/types.js';

export interface AgentLockfile {
  name: string;
  version: string;
  lockedAt: string;
  skills: Record<string, { version: string; checksum: string }>;
}

export class LockfileManager {
  async generate(manifest: AgentManifest): Promise<AgentLockfile> {
    const skills: Record<string, { version: string; checksum: string }> = {};
    for (const [skillName, versionConstraint] of Object.entries(manifest.skills)) {
      skills[skillName] = {
        version: versionConstraint,
        checksum: ChecksumCalculator.calculateSHA256(`${skillName}@${versionConstraint}`),
      };
    }

    return {
      name: manifest.name,
      version: manifest.version,
      lockedAt: new Date().toISOString(),
      skills,
    };
  }

  async read(lockfilePath: string): Promise<AgentLockfile> {
    const raw = readFileSync(lockfilePath, 'utf-8');
    return JSON.parse(raw) as AgentLockfile;
  }

  async write(lockfilePath: string, lockfile: AgentLockfile): Promise<void> {
    writeFileSync(lockfilePath, JSON.stringify(lockfile, null, 2), 'utf-8');
  }
}
