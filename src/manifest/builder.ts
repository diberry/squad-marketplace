/**
 * Manifest Builder
 * Fluent API to construct agent manifests programmatically.
 */

import type { AgentManifest, SkillDependency } from './types.js';
import { ManifestValidator } from './validator.js';

export class ManifestBuilder {
  private manifest: Partial<AgentManifest> = {};

  name(name: string): this {
    this.manifest.name = name;
    return this;
  }

  version(version: string): this {
    this.manifest.version = version;
    return this;
  }

  author(author: string): this {
    this.manifest.author = author;
    return this;
  }

  description(description: string): this {
    this.manifest.description = description;
    return this;
  }

  skills(skills: SkillDependency): this {
    this.manifest.skills = skills;
    return this;
  }

  config(config: Record<string, unknown>): this {
    this.manifest.config = config;
    return this;
  }

  build(): AgentManifest {
    const validator = new ManifestValidator();
    return validator.validate(this.manifest);
  }
}
