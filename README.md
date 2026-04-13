# Squad SDK Agent Marketplace

Build and manage private AI agent registries. Define agents with structured manifests, scan for security issues, package for distribution, and install from a centralized registry backed by GitHub.

## Using This Example

### Installation

```bash
git clone https://github.com/your-org/squad-sdk-example-marketplace.git
cd squad-sdk-example-marketplace
npm install
npm run build
```

### Creating an Agent Manifest

An agent manifest defines your agent's metadata, capabilities, and dependencies. Create `manifest.json`:

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

**Required fields:** `name` (valid npm package name), `version` (semver), `author`, `description`, `skills` (object), `config` (object).

### Packaging an Agent

Create a distributable `.tar.gz` bundle:

```bash
npm run build
node -e "
import { AgentPackager } from './dist/package/packager.js';
const packager = new AgentPackager();
await packager.package('./my-agent', './my-agent-1.0.0.tar.gz');
console.log('Packaged successfully');
"
```

**Expected output:** `Packaged successfully` + a `.tar.gz` file containing manifest, charter.md, skills/, and config/.

### Scanning for Security Issues

Detect hardcoded credentials, dangerous patterns, and risky code:

```bash
node -e "
import { SecurityScanner } from './dist/security/scanner.js';
import fs from 'fs';

const scanner = new SecurityScanner();
const charter = fs.readFileSync('./my-agent/charter.md', 'utf8');
const manifest = fs.readFileSync('./my-agent/manifest.json', 'utf8');

const result = scanner.scan({
  chartContent: charter,
  manifestContent: manifest,
  configContent: '',
  skillsContent: ''
});

console.log(result.passed ? 'PASS' : 'FAIL');
console.log('Issues:', result.issues.length);
"
```

**Expected output:** `PASS` if no issues, or list of detected issues with descriptions and remediation steps.

### Publishing to a Registry

Upload your agent to GitHub-backed registry:

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
export GITHUB_REGISTRY_OWNER=your-org
export GITHUB_REGISTRY_REPO=my-agent-registry

node -e "
import { AgentPublisher } from './dist/registry/publisher.js';
import { AgentPackager } from './dist/package/packager.js';
import { SecurityScanner } from './dist/security/scanner.js';
import { GitHubRegistry } from './dist/registry/github-registry.js';

const packager = new AgentPackager();
const scanner = new SecurityScanner();
const registry = new GitHubRegistry({
  githubToken: process.env.GITHUB_TOKEN,
  registryOwner: process.env.GITHUB_REGISTRY_OWNER,
  registryRepo: process.env.GITHUB_REGISTRY_REPO
});

const publisher = new AgentPublisher(packager, scanner, registry);
const result = await publisher.publish('./my-agent');
console.log('Published:', result.name, result.version);
console.log('Release URL:', result.releaseUrl);
"
```

**Expected output:** Agent name, version, and GitHub release URL where package is hosted.

### Installing from Registry

Pull an agent into your local squad directory:

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
export GITHUB_REGISTRY_OWNER=your-org
export GITHUB_REGISTRY_REPO=my-agent-registry

node -e "
import { AgentInstaller } from './dist/install/installer.js';

const installer = new AgentInstaller({
  squadDir: './.squad',
  registryOwner: process.env.GITHUB_REGISTRY_OWNER,
  registryRepo: process.env.GITHUB_REGISTRY_REPO,
  githubToken: process.env.GITHUB_TOKEN
});

const result = await installer.install({ agent: 'security-reviewer@1.0.0' });
console.log('Installed:', result.agent, result.version);
console.log('Path:', result.installPath);
"
```

**Expected output:** Agent name, version, and local installation path (`./.squad/agents/{name}/`).

## Extending This Example

### Adding Custom Security Rules

Define new pattern detection rules:

```typescript
import { ScanningRule } from '@bradygaster/squad-sdk-example-marketplace';

const customRule: ScanningRule = {
  name: 'detect-api-key-leak',
  description: 'Detects API key patterns',
  severity: 'critical',
  pattern: /api[_-]?key|apiKey|API_KEY/i,
  remediation: 'Remove hardcoded keys. Use environment variables.'
};
```

Pass custom rules to `SecurityScanner`:

```typescript
import { SecurityScanner } from '@bradygaster/squad-sdk-example-marketplace';

const scanner = new SecurityScanner();
const result = scanner.scan(agentFiles, [customRule]);
```

### Building a Custom Registry Backend

Replace GitHub with your own storage by implementing `RegistryBackend` interface:

```typescript
export interface RegistryBackend {
  publish(agent: AgentManifest, packageBytes: Buffer): Promise<void>;
  fetch(agentName: string, version: string): Promise<Buffer>;
  list(): Promise<AgentManifest[]>;
  search(query: string): Promise<AgentManifest[]>;
}
```

Then create your implementation and pass to `AgentPublisher` and `AgentInstaller`.

### Programmatic API

Use marketplace modules in your own Node.js code:

```typescript
import {
  ManifestValidator,
  AgentPackager,
  SecurityScanner,
  AgentInstaller,
  DependencyResolver
} from '@bradygaster/squad-sdk-example-marketplace';

const validator = new ManifestValidator();
const packager = new AgentPackager();
const scanner = new SecurityScanner();
const installer = new AgentInstaller({...});
const resolver = new DependencyResolver();
```

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│              User Tools / CLI                       │
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
├── manifest/              # Agent definitions and validation
│   ├── types.ts          # AgentManifest, SkillDependency interfaces
│   ├── validator.ts      # Schema validation
│   └── builder.ts        # Fluent builder API
├── package/              # Packaging and distribution
│   ├── packager.ts       # Create .tar.gz bundles
│   ├── extractor.ts      # Extract and validate
│   └── lockfile.ts       # Dependency lock files
├── security/             # Security scanning
│   ├── scanner.ts        # Pattern detection
│   ├── rules.ts          # Predefined rules
│   ├── allowlist.ts      # Safe pattern allowlist
│   └── report.ts         # Risk reporting
├── registry/             # Registry backend
│   ├── types.ts          # RegistryEntry, RegistryIndex
│   ├── github-registry.ts # GitHub integration
│   ├── publisher.ts      # Publish workflow
│   └── browser.ts        # Search & fetch
├── install/              # Installation
│   ├── installer.ts      # Main flow
│   ├── dependency-resolver.ts # Semver resolution
│   └── metadata.ts       # Metadata persistence
├── versioning/           # Version management
│   ├── semver.ts         # Semantic versioning
│   ├── upgrade.ts        # Upgrade checks
│   └── backup.ts         # Rollback
├── trust/                # Trust scoring
│   ├── score-calculator.ts # Trust ratings
│   ├── publisher-registry.ts # Verified publishers
│   └── trust-history.ts  # Score tracking
├── preview/              # Preview & sandbox
│   ├── sandbox.ts        # Temp environments
│   └── preview-runner.ts # Execution
├── composition/          # Multi-agent composition
│   └── template-builder.ts # Team templates
└── utils/                # Utilities
    ├── checksum.ts       # File integrity
    ├── tar-stream.ts     # Tar/gzip ops
    └── errors.ts         # Error types
```

## SDK Modules

| Module | Purpose |
|--------|---------|
| `ManifestValidator` | Schema validation for agent manifests |
| `ManifestBuilder` | Fluent builder for creating manifests |
| `AgentPackager` | Create `.tar.gz` bundles |
| `AgentExtractor` | Extract and validate packages |
| `SecurityScanner` | Detect security issues with rules |
| `SecurityAllowlist` | Known-safe pattern management |
| `GitHubRegistry` | GitHub-backed registry storage |
| `AgentPublisher` | Publish agents to registry |
| `RegistryBrowser` | Search and fetch agents |
| `AgentInstaller` | Install agents locally |
| `DependencyResolver` | Semver constraint resolution |
| `MetadataManager` | Installation metadata persistence |

## Testing

```bash
# Run all tests
npm run test

# Run in watch mode
npm run test:watch

# Generate coverage
npm run test:coverage
```

## Roadmap

- **Preview Sandbox** — Test agents in isolated environments before installation
- **Trust Scoring** — Reputation and usage-based trust ratings
- **Agent Composition** — Combine multiple agents into team templates
