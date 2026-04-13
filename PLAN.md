# TDD Implementation Plan: Squad SDK Agent Marketplace (Private Enterprise Registry)

## Overview
Building a private enterprise agent registry on Squad SDK where teams can publish, discover, and install specialized AI agents with security scanning. This document outlines the TDD approach, organizing features by phase with test-first specifications.

---

## SDK Modules Reference (Verified)

| Module | Actually Provides | Gap | Status |
|--------|-------------------|-----|--------|
| `marketplace.MarketplaceBrowser` | Search repos, fetch package bytes | ⚠️ No meaningful unpack/dependency handling | Working but shallow |
| `marketplace.validateManifest()` | Manifest schema validation | ✅ Solid | Ready to use |
| `marketplace.packageForMarketplace()` | Write manifest.json + enumerate files | ⚠️ Not a full packaging pipeline | Partial impl |
| `marketplace.validateRemoteAgent()` | Regex-based scanning for suspicious patterns | ⚠️ Not sandboxing — regex only | Limited |
| `marketplace.quarantineAgent()` | Flag agent as quarantined | ✅ Solid | Ready to use |
| `marketplace.generateSecurityReport()` | Produce scan report | ✅ Solid | Ready to use |
| `sharing.export` / `sharing.import` | Export/import squad definitions | ✅ Solid | Ready to use |
| `skills.SkillRegistry` | Install skills as portable modules | ✅ Solid | Ready to use |

**Known Gaps (Must Build):**
- Package signing and provenance
- Private registry hosting (auth, storage, indexing)
- Dependency resolution for agent skills
- Update policy enforcement
- Trust revocation

---

## Phase 1: Core Agent Packaging & Validation (P0 - MVP)

### Feature 1: Agent Manifest Format & Validation

#### Test Specifications
1. **TEST: Create valid agent manifest**
   - Asserts: Manifest structure includes `name`, `version`, `author`, `description`, `skills[]`, `config`
   - Asserts: Validates against schema (via `marketplace.validateManifest()`)
   - Asserts: Returns manifest with computed checksum

2. **TEST: Reject invalid manifest (missing required fields)**
   - Asserts: Throws `ManifestValidationError` when `name` is missing
   - Asserts: Throws `ManifestValidationError` when `version` is not semver

3. **TEST: Manifest includes skill dependencies**
   - Asserts: Can reference dependencies as `{ skillName: "version-spec" }`
   - Asserts: Validates that referenced skills match available `SkillRegistry` entries

#### Implementation
- Create `src/manifest/types.ts`: `AgentManifest`, `SkillDependency` interfaces
- Create `src/manifest/validator.ts`: Wrap `marketplace.validateManifest()` + schema extensions
- Create `src/manifest/builder.ts`: Fluent API to construct manifests programmatically
- Create `src/utils/checksum.ts`: Compute manifest checksums for integrity

---

### Feature 2: Agent Packaging Pipeline

#### Test Specifications
1. **TEST: Package agent from directory**
   - Asserts: Given a squad agent directory with `charter.md`, `skills/`, config, produces a `.tar.gz` bundle
   - Asserts: Bundle includes manifest.json at root
   - Asserts: Bundle preserves directory structure (`skills/`, `config/`, `charter.md`)
   - Asserts: Rejects if manifest.json doesn't exist or is invalid

2. **TEST: Extract agent package**
   - Asserts: Given a `.tar.gz` agent bundle, extracts to temp directory
   - Asserts: Extracts manifest.json and validates it
   - Asserts: Returns path to extracted content and manifest metadata

3. **TEST: Package with version pinning metadata**
   - Asserts: Includes lock file (`.agent-lock.json`) with exact skill versions
   - Asserts: Lock file includes download checksums for verification

#### Implementation
- Create `src/package/packager.ts`: Core package() function using tar + gzip
- Create `src/package/extractor.ts`: Extract and validate bundles
- Create `src/package/lockfile.ts`: Generate and read `.agent-lock.json`
- Create `src/utils/tar-stream.ts`: Wrapper for tar operations

---

### Feature 3: Security Scanning on Publish

#### Test Specifications
1. **TEST: Scan agent for suspicious patterns**
   - Asserts: Detects hardcoded credentials in charter/config (regex: API keys, secrets)
   - Asserts: Detects dangerous system calls in manifest (`eval()`, `require('*')` wildcards)
   - Asserts: Detects network calls without allowlist
   - Asserts: Returns `SecurityScan` object with issues array

2. **TEST: Generate security report**
   - Asserts: Uses `marketplace.generateSecurityReport()` 
   - Asserts: Report includes risk level (LOW, MEDIUM, HIGH, CRITICAL)
   - Asserts: Report includes remediation guidance
   - Asserts: Quarantine agent if CRITICAL issues detected

3. **TEST: Whitelist known-safe patterns**
   - Asserts: Can register patterns as allowlisted (e.g., GitHub action URLs)
   - Asserts: Scanned agent with all issues allowlisted is marked as APPROVED

#### Implementation
- Create `src/security/scanner.ts`: Pattern detection and categorization
- Create `src/security/rules.ts`: Define scanning rules (credentials, dangerous calls, etc.)
- Create `src/security/allowlist.ts`: Manage allowlist of known-safe patterns
- Create `src/security/report.ts`: Wrap `generateSecurityReport()` with enhanced metadata

---

### Feature 4: Private Registry Interface (Git-Based)

#### Test Specifications
1. **TEST: Initialize private registry (GitHub repo)**
   - Asserts: Creates registry index (`.registry/agents.json`)
   - Asserts: Index includes `{ name, version, author, published_at, checksum }`
   - Asserts: Repo has GitHub authentication configured

2. **TEST: Publish agent to registry**
   - Asserts: Uploads agent package to GitHub Releases
   - Asserts: Updates registry index with new agent entry
   - Asserts: Commits and pushes index update
   - Asserts: Tags release with `agent-{name}-{version}`

3. **TEST: Search registry**
   - Asserts: Can search by agent name (substring match)
   - Asserts: Can filter by author
   - Asserts: Returns list of versions (newest first)

4. **TEST: Fetch agent from registry**
   - Asserts: Given `agent@version`, downloads from GitHub Release
   - Asserts: Verifies checksum matches registry index
   - Asserts: Throws if checksum mismatch (corruption or tampering)

#### Implementation
- Create `src/registry/types.ts`: `RegistryIndex`, `RegistryEntry` interfaces
- Create `src/registry/github-registry.ts`: Implement Git-based registry (uses octokit/GitHub API)
- Create `src/registry/index-manager.ts`: Read/write registry index files
- Create `src/registry/publisher.ts`: Publish flow (package → release → index)
- Create `src/registry/browser.ts`: Search and fetch operations (wraps `MarketplaceBrowser`)

---

### Feature 5: Agent Installation with Version Pinning

#### Test Specifications
1. **TEST: Install agent from registry**
   - Asserts: `squad marketplace install agent-name@1.0.0` downloads from registry
   - Asserts: Extracts to `.squad/agents/{name}/`
   - Asserts: Creates `.squad/agents/{name}/.agent-metadata.json` with installation info

2. **TEST: Version pinning**
   - Asserts: Installed agent is locked to exact version (in metadata)
   - Asserts: No auto-updates unless explicitly requested
   - Asserts: Lock prevents accidental downgrades

3. **TEST: Install with dependencies**
   - Asserts: If agent depends on skills, installs them first
   - Asserts: Creates dependency graph and respects semver constraints
   - Asserts: Fails if dependency conflicts

4. **TEST: Uninstall agent**
   - Asserts: Removes agent from `.squad/agents/{name}/`
   - Asserts: Removes unused skills (if no other agents depend on them)

#### Implementation
- Create `src/install/installer.ts`: Main install flow
- Create `src/install/dependency-resolver.ts`: Semver resolution and conflict detection
- Create `src/install/metadata.ts`: Installation metadata management
- Modify `src/package/extractor.ts`: Support extraction to `.squad/agents/` paths

---

## Phase 2: Version Management & Trust (P1)

### Feature 6: Semver Versioning & Upgrades

#### Test Specifications
1. **TEST: Version compatibility checking**
   - Asserts: Agent version `^1.5.0` allows installation of `1.5.2` but not `2.0.0`
   - Asserts: Rejects version specs that don't match installed version

2. **TEST: List available upgrades**
   - Asserts: Given installed agent `1.0.0`, shows newer versions in registry
   - Asserts: Filters by semver constraint (e.g., show only patch/minor, not major)

3. **TEST: Upgrade agent**
   - Asserts: `squad marketplace upgrade agent-name --to=1.2.0` downloads and installs
   - Asserts: Backs up previous version (in `.squad/agents/{name}/.backups/`)
   - Asserts: Updates metadata with new version

4. **TEST: Rollback agent**
   - Asserts: `squad marketplace rollback agent-name` restores previous version
   - Asserts: Lists available backups

#### Implementation
- Create `src/versioning/semver.ts`: Semver parsing and constraint checking
- Create `src/versioning/upgrade.ts`: Check and apply upgrades
- Create `src/versioning/backup.ts`: Backup and rollback management

---

### Feature 7: Trust Scores

#### Test Specifications
1. **TEST: Calculate trust score**
   - Asserts: Base score from security scan results (HIGH risk = low score)
   - Asserts: Boost score if author is verified publisher
   - Asserts: Incorporate usage metrics (download count, retention rate)
   - Asserts: Final score is 0-100

2. **TEST: Verified publisher badge**
   - Asserts: Authors can be marked as verified in registry
   - Asserts: Registry displays badge for verified publishers

3. **TEST: Store and retrieve trust history**
   - Asserts: Track trust score changes over time
   - Asserts: Alert if agent trust drops below threshold

#### Implementation
- Create `src/trust/score-calculator.ts`: Compute trust scores from multiple factors
- Create `src/trust/publisher-registry.ts`: Manage verified publishers
- Create `src/trust/trust-history.ts`: Persist and query score changes

---

## Phase 3: Advanced Features (P2)

### Feature 8: Preview Mode (Sandbox)

#### Test Specifications
1. **TEST: Preview agent in temporary environment**
   - Asserts: Creates ephemeral `.squad/` directory for preview
   - Asserts: Installs agent to temp directory without persisting
   - Asserts: Can invoke agent and capture output
   - Asserts: Cleans up temp directory after preview

2. **TEST: Generate preview report**
   - Asserts: Shows what the agent does (skills, config, permissions)
   - Asserts: Highlights any warnings (security scan issues, missing dependencies)

#### Implementation
- Create `src/preview/sandbox.ts`: Temporary environment setup and cleanup
- Create `src/preview/preview-runner.ts`: Execute agent in sandbox

---

### Feature 9: Agent Composition

#### Test Specifications
1. **TEST: Create agent template from multiple agents**
   - Asserts: Combine agents A, B, C into a team template
   - Asserts: Template includes all agents and shared config
   - Asserts: Can export template as shareable package

#### Implementation
- Create `src/composition/template-builder.ts`: Combine agents into templates

---

## Test Structure

```
test/
├── unit/
│   ├── manifest/
│   │   ├── validator.test.ts
│   │   ├── builder.test.ts
│   │   └── types.test.ts
│   ├── package/
│   │   ├── packager.test.ts
│   │   ├── extractor.test.ts
│   │   └── lockfile.test.ts
│   ├── security/
│   │   ├── scanner.test.ts
│   │   ├── rules.test.ts
│   │   ├── allowlist.test.ts
│   │   └── report.test.ts
│   ├── registry/
│   │   ├── github-registry.test.ts
│   │   ├── index-manager.test.ts
│   │   ├── publisher.test.ts
│   │   └── browser.test.ts
│   ├── install/
│   │   ├── installer.test.ts
│   │   ├── dependency-resolver.test.ts
│   │   └── metadata.test.ts
│   ├── versioning/
│   │   ├── semver.test.ts
│   │   ├── upgrade.test.ts
│   │   └── backup.test.ts
│   ├── trust/
│   │   ├── score-calculator.test.ts
│   │   ├── publisher-registry.test.ts
│   │   └── trust-history.test.ts
│   └── preview/
│       └── sandbox.test.ts
├── integration/
│   ├── publish-workflow.test.ts
│   ├── install-workflow.test.ts
│   └── upgrade-workflow.test.ts
└── fixtures/
    ├── valid-agent-manifest.json
    ├── invalid-agent-manifest.json
    ├── sample-agent/
    └── test-registry/
```

## Project Structure

```
src/
├── index.ts                    # Main export barrel
├── manifest/
│   ├── types.ts               # Manifest interfaces
│   ├── validator.ts           # Schema validation
│   └── builder.ts             # Fluent builder
├── package/
│   ├── packager.ts            # Create .tar.gz bundles
│   ├── extractor.ts           # Extract and validate
│   └── lockfile.ts            # Dependency locking
├── security/
│   ├── scanner.ts             # Pattern detection
│   ├── rules.ts               # Scanning rules
│   ├── allowlist.ts           # Known-safe patterns
│   └── report.ts              # Enhanced reporting
├── registry/
│   ├── types.ts               # Registry interfaces
│   ├── github-registry.ts     # Git-based registry implementation
│   ├── index-manager.ts       # Index I/O
│   ├── publisher.ts           # Publish flow
│   └── browser.ts             # Search/fetch
├── install/
│   ├── installer.ts           # Main install logic
│   ├── dependency-resolver.ts # Semver resolution
│   └── metadata.ts            # Installation metadata
├── versioning/
│   ├── semver.ts              # Version constraints
│   ├── upgrade.ts             # Upgrade flow
│   └── backup.ts              # Backup/rollback
├── trust/
│   ├── score-calculator.ts    # Trust scoring
│   ├── publisher-registry.ts  # Publisher mgmt
│   └── trust-history.ts       # Score tracking
├── preview/
│   ├── sandbox.ts             # Temp environments
│   └── preview-runner.ts      # Sandbox execution
├── composition/
│   └── template-builder.ts    # Multi-agent templates
└── utils/
    ├── checksum.ts            # File checksums
    ├── tar-stream.ts          # Tar operations
    └── errors.ts              # Custom error types
```

## Dependency Map

```
Phase 1 (MVP):
  1. Manifest → Validation (use marketplace.validateManifest)
  2. Packaging → depends on Manifest
  3. Security → depends on Packaging
  4. Registry → depends on Packaging + Security
  5. Install → depends on Registry + Packaging

Phase 2:
  6. Versioning → depends on Install
  7. Trust → depends on Security + Registry

Phase 3:
  8. Preview → depends on Install
  9. Composition → depends on Install
```

## Known Implementation Challenges

1. **GitHub Authentication**: Need to handle GitHub API auth tokens (OAuth or PAT)
2. **Dependency Conflicts**: Complex semver resolution when multiple agents depend on incompatible skill versions
3. **Checksum Verification**: Must handle artifact hash verification for integrity and tamper detection
4. **Security Scanning Accuracy**: Regex-based scanning has false positives — need allowlist strategy
5. **Backup Storage**: Storing old versions requires disk space management
6. **Preview Sandbox**: Temporary environments need proper cleanup (no leaks, permissions)

## Success Criteria (End of Implementation)

- [ ] All P0 features have passing tests
- [ ] Agent packaging creates valid, extractable bundles
- [ ] Security scanning catches common vulnerabilities and supports allowlisting
- [ ] Git-based private registry works with GitHub authentication
- [ ] Installation resolves dependencies and pins versions
- [ ] Build succeeds with `npm run build`
- [ ] Test suite passes with `npm run test`
- [ ] Test coverage > 80% for critical paths (manifest, package, security, install)
