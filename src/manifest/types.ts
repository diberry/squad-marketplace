/**
 * Agent Manifest Types
 * Defines the structure for agent metadata and configuration.
 */

export interface SkillDependency {
  [skillName: string]: string; // semver constraint
}

export interface AgentManifest {
  name: string;
  version: string; // semver
  author: string;
  description: string;
  skills: SkillDependency;
  config?: Record<string, unknown>;
  checksum?: string;
  publishedAt?: string;
}
