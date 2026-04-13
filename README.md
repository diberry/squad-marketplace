# Squad SDK Agent Marketplace

Build and manage private AI agent registries. Define agents with structured manifests, scan for security issues, package for distribution, and install from a centralized registry backed by GitHub.

## Using This Example

### Installation

```bash
git clone https://github.com/your-org/squad-sdk-example-marketplace.git
cd squad-sdk-example-marketplace
npm install
npm run build
npm link          # makes `squad-marketplace` available globally
```

### Creating an Agent

An agent is a directory containing a `manifest.json` and a `charter.md`. See `examples/sample-agent/` for a ready-made starter.

**manifest.json** — required fields:

```json
{
  "name": "security-reviewer",
  "version": "1.0.0",
  "author": "security-team",
  "description": "Automated security code review agent",
  "skills": {
    "code-analyzer": "^1.5.0",
    "vulnerability-scanner": "^2.0.0"
  },
  "config": {
    "timeout": 60000,
    "maxTokens": 4000,
    "temperature": 0.2
  }
}
```

### Packaging an Agent

```bash
squad-marketplace package examples/sample-agent
# → sample-agent-1.0.0.tar.gz (874 bytes)
```

Returns a `.tar.gz` buffer internally; the CLI writes it to disk for you.

### Scanning for Security Issues

```bash
squad-marketplace scan examples/sample-agent
# Agent   : sample-agent
# Risk    : LOW
# Approved: true
# No issues found.
```

Exits with code 1 if the scan fails.

### Publishing to a Registry

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
export GITHUB_REGISTRY_OWNER=your-org
export GITHUB_REGISTRY_REPO=my-agent-registry

# First package, then publish
squad-marketplace package examples/sample-agent
squad-marketplace publish sample-agent-1.0.0.tar.gz
# Published sample-agent@1.0.0
```

### Installing from Registry

```bash
squad-marketplace install security-reviewer@1.0.0
# Installed security-reviewer@1.0.0 → .squad/agents/security-reviewer
```

### Listing Registry Contents

```bash
squad-marketplace list
# Registry (2 agent(s)):
#   security-reviewer@1.0.0  by security-team  (2024-01-15)
#   docs-writer@2.1.0        by docs-team      (2024-01-10)
```

## Extending This Example

### Adding Custom Security Rules

```typescript
import { ScanningRule, SecurityScanner, SecurityAllowlist } from './src/index.js';

const customRule: ScanningRule = {
  name: 'detect-api-key-leak',
  description: 'Detects API key patterns',
  severity: 'CRITICAL',
  pattern: /api[_-]?key|apiKey|API_KEY/i,
  remediation: 'Remove hardcoded keys. Use environment variables.'
};

// Pass custom rules and optional allowlist to the constructor
const scanner = new SecurityScanner([customRule], new SecurityAllowlist());
const result = await scanner.scan('./my-agent');   // scans a directory, returns SecurityScan
```

### Building a Custom Registry Backend

`GitHubRegistry` accepts explicit constructor arguments:

```typescript
import { GitHubRegistry, RegistryIndexManager } from './src/index.js';

const indexManager = new RegistryIndexManager();
const registry = new GitHubRegistry(
  'your-org',           // owner
  'my-agent-registry',  // repo
  process.env.GITHUB_TOKEN!,
  indexManager,
  globalThis.fetch      // any fetch-compatible function
);
```

### Programmatic API

Key classes and their signatures:

```typescript
import {
  ManifestValidator,
  AgentPackager,
  AgentExtractor,
  SecurityScanner,
  AgentInstaller,
  AgentPublisher,
  GitHubRegistry,
  RegistryIndexManager,
  RegistryBrowser,
  DependencyResolver,
  MetadataManager
} from './src/index.js';

// No-arg constructors
const validator  = new ManifestValidator();
const packager   = new AgentPackager();
const extractor  = new AgentExtractor();
const depResolver = new DependencyResolver();
const metadata   = new MetadataManager();

// Packager: one arg (dir path), returns Buffer
const buf: Buffer = await packager.package('./my-agent');

// Scanner: optional rules + allowlist in constructor; scan() takes dir path
const scanner = new SecurityScanner();
const scan    = await scanner.scan('./my-agent');

// Publisher: requires three dependencies
const publisher = new AgentPublisher(packager, scanner, registry);
const entry     = await publisher.publish('./my-agent');

// Installer: requires four dependencies
const installer = new AgentInstaller(registry, extractor, depResolver, metadata);
const meta      = await installer.install('agent-name', '1.0.0', './target');
```

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│              squad-marketplace CLI                   │
│  (handles all dependency wiring internally)         │
└──────────────────┬──────────────────────────────────┘
                   │
         ┌─────────┴──────────┐
         │                    │
    ┌────▼──────────┐    ┌───▼────────────┐
    │ Manifest      │    │ Packager       │
    │ Validator     │    │ & Extractor    │
    └────┬──────────┘    └────┬───────────┘
         │                    │
         └─────────┬──────────┘
                   │
         ┌─────────▼──────────────┐
         │ Security Scanner       │
         │ (Rules & Patterns)     │
         └─────────┬──────────────┘
                   │
         ┌─────────▼──────────────┐
         │ Registry Backend       │
         │ (GitHub / Custom)      │
         └─────────┬──────────────┘
                   │
         ┌─────────▼──────────────┐
         │ Agent Installer        │
         │ Dependency Resolver    │
         └─────────┬──────────────┘
                   │
         ┌─────────▼──────────────┐
         │ .squad/agents/         │
         │ (Local Installation)   │
         └────────────────────────┘
```

## Project Structure

```
src/
├── cli/                  # CLI entry point
│   └── main.ts          # squad-marketplace command
├── manifest/             # Agent definitions and validation
│   ├── types.ts         # AgentManifest, SkillDependency interfaces
│   ├── validator.ts     # Schema validation
│   └── builder.ts       # Fluent builder API
├── package/             # Packaging and distribution
│   ├── packager.ts      # Create .tar.gz bundles (returns Buffer)
│   ├── extractor.ts     # Extract and validate
│   └── lockfile.ts      # Dependency lock files
├── security/            # Security scanning
│   ├── scanner.ts       # Pattern detection (scan takes dir path)
│   ├── rules.ts         # Predefined rules
│   ├── allowlist.ts     # Safe pattern allowlist
│   └── report.ts        # Risk reporting
├── registry/            # Registry backend
│   ├── types.ts         # RegistryEntry, RegistryIndex
│   ├── github-registry.ts # GitHub integration
│   ├── publisher.ts     # Publish workflow
│   └── browser.ts       # Search & fetch
├── install/             # Installation
│   ├── installer.ts     # Takes (registry, extractor, depResolver, metadata)
│   ├── dependency-resolver.ts # Semver resolution
│   └── metadata.ts      # Metadata persistence
├── utils/               # Utilities
│   ├── checksum.ts      # File integrity
│   ├── tar-stream.ts    # Tar/gzip ops
│   └── errors.ts        # Error types
examples/
└── sample-agent/        # Ready-to-use starter agent
    ├── manifest.json
    └── charter.md
```

## Testing

```bash
npm run test             # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```
