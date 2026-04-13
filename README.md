# Squad SDK Agent Marketplace

A private enterprise agent registry built on Squad SDK that enables teams to discover, publish, and install specialized AI agents with integrated security scanning and version management.

## Features

- **Agent Manifest & Validation**: Define agents with structured metadata including name, version, author, description, and skill dependencies. Manifests are validated against a strict schema to ensure integrity.
- **Agent Packaging Pipeline**: Create distributable `.tar.gz` bundles from agent directories, preserving directory structure (skills, config, charter.md) with automatic manifest inclusion and version lock files.
- **Security Scanning on Publish**: Pattern-based security analysis detects hardcoded credentials, dangerous system calls, and suspicious network operations. Generate detailed risk reports and automatically quarantine agents with critical issues.
- **Private Git-Based Registry**: Store and index agents using GitHub as a backend, with support for authenticated access, release management, and centralized agent discovery.
- **Agent Installation with Version Pinning**: Install agents from the registry with exact version pinning and dependency resolution. Prevents unexpected downgrades and ensures reproducible environments.
- **Semver Versioning & Upgrades**: Manage agent versions using semantic versioning. Check compatibility, list available upgrades, and safely upgrade or rollback to previous versions.
- **Trust Scores**: Calculate trust ratings based on security scan results, author reputation, and usage metrics. Verify publisher identity and track trust history.
- **Agent Composition**: Combine multiple agents into team templates for cohesive multi-agent workflows.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              Squad CLI / User Tools                 │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
   ┌────▼─────────────┐  ┌────▼──────────┐
   │ Manifest Builder │  │ Packager      │
   │ & Validator      │  │ & Extractor   │
   └────┬─────────────┘  └────┬──────────┘
        │                     │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────────┐
        │ Security Scanner       │
        │ (Patterns & Rules)     │
        │ Allowlist & Reports    │
        └──────────┬──────────────┘
                   │
        ┌──────────▼──────────────┐
        │ Private Registry       │
        │ (GitHub-based)         │
        │ Index & Browser        │
        │ Publisher              │
        └──────────┬──────────────┘
                   │
        ┌──────────▼──────────────┐
        │ Agent Installer        │
        │ Dependency Resolver    │
        │ Metadata Manager       │
        └──────────┬──────────────┘
                   │
   ┌───────────────┼───────────────┐
   │               │               │
┌──▼──────┐  ┌─────▼─────┐  ┌──────▼─────┐
│ Upgrade │  │ Trust     │  │ Preview    │
│ Manager │  │ Scoring   │  │ Sandbox    │
└─────────┘  └───────────┘  └────────────┘
```

> **Note:** This is a standalone implementation that demonstrates marketplace patterns (packaging, registry, security scanning, trust scoring) which could integrate with Squad SDK's marketplace module. It does not import or depend on the Squad SDK at runtime — all functionality is self-contained to serve as a reference architecture.

## Roadmap

- **Preview Sandbox**: Test agents in temporary environments before installation. Generate preview reports showing capabilities, permissions, and potential warnings. *(Not yet implemented)*

## SDK Modules Reference

| Module | Purpose | Status |
|--------|---------|--------|
| `marketplace.MarketplaceBrowser` | Search repos, fetch package bytes | Working but shallow |
| `marketplace.validateManifest()` | Manifest schema validation | Ready to use |
| `marketplace.packageForMarketplace()` | Write manifest.json + enumerate files | Partial implementation |
| `marketplace.validateRemoteAgent()` | Regex-based pattern scanning | Limited (regex only) |
| `marketplace.quarantineAgent()` | Flag agents as quarantined | Ready to use |
| `marketplace.generateSecurityReport()` | Produce scan report | Ready to use |
| `sharing.export` / `sharing.import` | Export/import squad definitions | Ready to use |
| `skills.SkillRegistry` | Install skills as portable modules | Ready to use |

## Project Structure

```
squad-sdk-example-marketplace/
├── src/
│   ├── manifest/               # Agent definitions and validation
│   │   ├── types.ts           # AgentManifest, SkillDependency interfaces
│   │   ├── validator.ts       # Schema validation wrapper
│   │   └── builder.ts         # Fluent builder API
│   ├── package/               # Packaging and distribution
│   │   ├── packager.ts        # Create .tar.gz bundles
│   │   ├── extractor.ts       # Extract and validate packages
│   │   └── lockfile.ts        # Dependency lock files
│   ├── security/              # Security scanning and compliance
│   │   ├── scanner.ts         # Pattern detection engine
│   │   ├── rules.ts           # Predefined scanning rules
│   │   ├── allowlist.ts       # Known-safe pattern allowlist
│   │   └── report.ts          # Risk reporting and remediation
│   ├── registry/              # Git-based private registry
│   │   ├── types.ts           # RegistryEntry, RegistryIndex interfaces
│   │   ├── github-registry.ts # GitHub API integration
│   │   ├── index-manager.ts   # Registry index I/O
│   │   ├── publisher.ts       # Publish workflow
│   │   └── browser.ts         # Search and fetch operations
│   ├── install/               # Installation and dependency resolution
│   │   ├── installer.ts       # Main installation flow
│   │   ├── dependency-resolver.ts # Semver resolution
│   │   └── metadata.ts        # Installation metadata persistence
│   ├── versioning/            # Version management and upgrades
│   │   ├── semver.ts          # Semantic version parsing and constraints
│   │   ├── upgrade.ts         # Check and apply upgrades
│   │   └── backup.ts          # Backup and rollback management
│   ├── trust/                 # Trust scoring system
│   │   ├── score-calculator.ts # Trust rating calculation
│   │   ├── publisher-registry.ts # Verified publisher management
│   │   └── trust-history.ts   # Score tracking and alerting
│   ├── preview/               # Agent preview and sandboxing
│   │   ├── sandbox.ts         # Temporary environment setup
│   │   └── preview-runner.ts  # Sandbox execution
│   ├── composition/           # Multi-agent composition
│   │   └── template-builder.ts # Combine agents into team templates
│   ├── utils/                 # Shared utilities
│   │   ├── checksum.ts        # File integrity checksums
│   │   ├── tar-stream.ts      # Tar/gzip operations
│   │   └── errors.ts          # Custom error types
│   └── index.ts               # Main export barrel
├── test/
│   ├── unit/                  # Unit tests for each module
│   ├── integration/           # End-to-end workflow tests
│   └── fixtures/              # Test data and sample agents
├── package.json               # Project dependencies
├── tsconfig.json              # TypeScript configuration
├── vitest.config.ts           # Test runner configuration
└── README.md                  # This file
```

## Installation

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher
- **Git** (for registry operations)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/your-org/squad-sdk-example-marketplace.git
cd squad-sdk-example-marketplace

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm run test
```

## Configuration

### Registry Setup

The marketplace uses a GitHub repository as the backing store for agent packages. To set up your private registry:

1. **Create a GitHub repository** for your registry:
   ```bash
   gh repo create my-agent-registry --private --description "Private Agent Marketplace"
   ```

2. **Initialize registry structure**:
   ```bash
   # In your registry repo root
   mkdir -p .registry
   cat > .registry/agents.json << 'EOF'
   {
     "agents": [],
     "metadata": {
       "initialized": true,
       "version": "1.0.0"
     }
   }
   EOF
   git add .registry/agents.json
   git commit -m "Initialize agent registry"
   git push
   ```

3. **Configure authentication** (set in your environment or config file):
   ```bash
   export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   export GITHUB_REGISTRY_OWNER=my-org
   export GITHUB_REGISTRY_REPO=my-agent-registry
   ```

### Agent Manifest Example

Create a `manifest.json` in your agent directory:

```json
{
  "name": "security-reviewer",
  "version": "1.0.0",
  "author": "security-team",
  "description": "AI agent for automated security code reviews",
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

## Build & Test

```bash
# Build TypeScript to JavaScript
npm run build

# Run full test suite
npm run test

# Run tests in watch mode (for development)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Quick Links

- **[QUICKSTART.md](./QUICKSTART.md)**: Step-by-step guide to publish and install your first agent
- **[PLAN.md](./PLAN.md)**: Detailed technical plan with feature specifications and roadmap

## Project Phases

### Phase 1: Core Agent Packaging & Validation (MVP - In Progress)
- ✅ Agent Manifest Format & Validation
- ✅ Agent Packaging Pipeline
- ✅ Security Scanning on Publish
- ✅ Private Registry Interface (Git-Based)
- ✅ Agent Installation with Version Pinning

### Phase 2: Version Management & Trust (P1)
- 📋 Semver Versioning & Upgrades
- 📋 Trust Scores

### Phase 3: Advanced Features (P2)
- 📋 Preview Mode (Sandbox) — *see Roadmap*
- 📋 Agent Composition

## Support

For issues, questions, or contributions, please open an issue in the [GitHub repository](https://github.com/your-org/squad-sdk-example-marketplace/issues).
