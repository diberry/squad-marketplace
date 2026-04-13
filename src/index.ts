// Main export barrel for Squad SDK Agent Marketplace

// Manifest
export type { AgentManifest, SkillDependency } from './manifest/types.js';
export { ManifestValidator } from './manifest/validator.js';
export { ManifestBuilder } from './manifest/builder.js';

// Utils
export { ChecksumCalculator } from './utils/checksum.js';
export { TarStream } from './utils/tar-stream.js';
export { ManifestValidationError, SecurityScanError, RegistryError, InstallationError } from './utils/errors.js';

// Package
export { AgentPackager } from './package/packager.js';
export { AgentExtractor } from './package/extractor.js';
export { LockfileManager } from './package/lockfile.js';
export type { AgentLockfile } from './package/lockfile.js';

// Security
export { SecurityScanner } from './security/scanner.js';
export type { SecurityIssue, SecurityScan } from './security/scanner.js';
export { SecurityAllowlist } from './security/allowlist.js';
export { SecurityReportGenerator } from './security/report.js';
export { DEFAULT_RULES } from './security/rules.js';
export type { ScanningRule } from './security/rules.js';

// Registry
export type { RegistryEntry, RegistryIndex } from './registry/types.js';
export { RegistryIndexManager } from './registry/index-manager.js';
export { GitHubRegistry } from './registry/github-registry.js';
export { AgentPublisher } from './registry/publisher.js';
export { RegistryBrowser } from './registry/browser.js';

// Install
export { AgentInstaller } from './install/installer.js';
export type { InstallationMetadata } from './install/installer.js';
export { DependencyResolver } from './install/dependency-resolver.js';
export { MetadataManager } from './install/metadata.js';
