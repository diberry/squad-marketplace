# Squad SDK Agent Marketplace — Quick Start Guide

Get up and running with agent publishing, discovery, and installation in 15 minutes.

## Prerequisites

Before you start, make sure you have:

- **Node.js** 18+ and **npm** 8+ installed
  ```bash
  node --version  # v18.0.0+
  npm --version   # 8.0.0+
  ```
- **Git** installed for registry operations
  ```bash
  git --version
  ```
- A **GitHub account** with access to create repositories
- A **GitHub Personal Access Token** (PAT) with `repo`, `write:packages` scope
  ```bash
  # Generate one at: https://github.com/settings/tokens?type=beta
  # Save it as: export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
  ```

## Initial Setup (One-Time)

### 1. Clone and Install

```bash
git clone https://github.com/your-org/squad-sdk-example-marketplace.git
cd squad-sdk-example-marketplace

npm install
npm run build
npm run test
```

**Expected output:**
```
> npm run test
 ✓ test/unit/manifest/validator.test.ts (5 tests)
 ✓ test/unit/package/packager.test.ts (3 tests)
 ✓ test/unit/security/scanner.test.ts (4 tests)
 ✓ test/unit/registry/index-manager.test.ts (2 tests)
 [... more tests ...]
 Test Files  28 passed (28)
 Tests      156 passed (156)
```

### 2. Set Up Your Private Registry

Create a GitHub repository to host your agent registry:

```bash
# Create the registry repository
gh repo create my-agent-registry --private --description "Private Agent Marketplace"

# Clone it locally
git clone https://github.com/your-org/my-agent-registry.git
cd my-agent-registry

# Initialize registry structure
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

# Commit and push
git add .registry/agents.json
git commit -m "Initialize agent registry"
git push origin main
```

### 3. Configure Your Environment

```bash
# Set your GitHub credentials (required for publish/install operations)
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
export GITHUB_REGISTRY_OWNER=your-org
export GITHUB_REGISTRY_REPO=my-agent-registry
```

For persistent configuration, add these to your `.bashrc`, `.zshrc`, or shell profile.

---

## Walkthrough 1: Publish Your First Agent

### Step 1: Create an Agent Directory

Create a new agent with manifest, charter, and skills:

```bash
mkdir my-first-agent
cd my-first-agent

# Create manifest
cat > manifest.json << 'EOF'
{
  "name": "hello-agent",
  "version": "1.0.0",
  "author": "your-name",
  "description": "Simple greeting agent for testing",
  "skills": {
    "text-formatter": "^1.0.0"
  },
  "config": {
    "timeout": 30000
  }
}
EOF

# Create charter (describe what your agent does)
cat > charter.md << 'EOF'
# Hello Agent Charter

## Purpose
A simple demonstration agent that greets users and formats messages.

## Capabilities
- **Greeting**: Personalized greetings
- **Formatting**: Text transformation and markup

## Permissions
- Read public data only
- No file system access
- No external API calls

## Version
1.0.0 - Initial release for testing
EOF

# Create skills directory structure
mkdir -p skills config
touch skills/.gitkeep config/.gitkeep
```

**Expected directory:**
```
my-first-agent/
├── manifest.json
├── charter.md
├── skills/
└── config/
```

### Step 2: Validate Your Manifest

From the marketplace project root, validate your agent:

```bash
# Build the validation tool (if not already done)
npm run build

# Create a test script to validate
cat > validate-agent.js << 'EOF'
import { ManifestValidator } from './dist/manifest/validator.js';
import * as fs from 'fs';

const manifest = JSON.parse(fs.readFileSync('./my-first-agent/manifest.json', 'utf8'));
const validator = new ManifestValidator();
const result = validator.validate(manifest);
console.log('Validation result:', result);
EOF

node validate-agent.js
```

**Expected output:**
```
Validation result: {
  valid: true,
  manifest: {
    name: 'hello-agent',
    version: '1.0.0',
    author: 'your-name',
    description: 'Simple greeting agent for testing',
    skills: { 'text-formatter': '^1.0.0' },
    config: { timeout: 30000 },
    checksum: 'abc123def456...'
  },
  errors: []
}
```

### Step 3: Scan for Security Issues

Before publishing, scan your agent for security vulnerabilities:

```bash
cat > scan-agent.js << 'EOF'
import { SecurityScanner } from './dist/security/scanner.js';
import * as fs from 'fs';
import * as path from 'path';

const agentPath = './my-first-agent';
const scanner = new SecurityScanner();

// Read all files
const charter = fs.readFileSync(path.join(agentPath, 'charter.md'), 'utf8');
const manifest = fs.readFileSync(path.join(agentPath, 'manifest.json'), 'utf8');

const scan = scanner.scan({
  chartContent: charter,
  manifestContent: manifest,
  configContent: '',
  skillsContent: ''
});

console.log('Security scan results:');
console.log(JSON.stringify(scan, null, 2));
EOF

node scan-agent.js
```

**Expected output:**
```
Security scan results:
{
  passed: true,
  issues: [],
  riskLevel: "LOW",
  timestamp: "2025-04-12T10:30:00Z",
  summary: "No security issues detected"
}
```

### Step 4: Package Your Agent

Create a distributable `.tar.gz` bundle:

```bash
cat > package-agent.js << 'EOF'
import { AgentPackager } from './dist/package/packager.js';
import * as path from 'path';

const packager = new AgentPackager();
const agentPath = path.resolve('./my-first-agent');
const outputPath = './hello-agent-1.0.0.tar.gz';

await packager.package(agentPath, outputPath);
console.log(`Agent packaged successfully: ${outputPath}`);
EOF

node package-agent.js
```

**Expected output:**
```
Agent packaged successfully: hello-agent-1.0.0.tar.gz
```

Verify the package:
```bash
ls -lh hello-agent-1.0.0.tar.gz
# -rw-r--r--  1 user  staff  2.5K Apr 12 10:35 hello-agent-1.0.0.tar.gz

tar -tzf hello-agent-1.0.0.tar.gz | head -10
# manifest.json
# charter.md
# skills/
# config/
```

### Step 5: Publish to Registry

Upload your agent package to the registry (backed by GitHub Releases):

```bash
cat > publish-agent.js << 'EOF'
import { AgentPublisher } from './dist/registry/publisher.js';

const publisher = new AgentPublisher({
  githubToken: process.env.GITHUB_TOKEN,
  registryOwner: process.env.GITHUB_REGISTRY_OWNER,
  registryRepo: process.env.GITHUB_REGISTRY_REPO
});

const result = await publisher.publish({
  packagePath: './hello-agent-1.0.0.tar.gz',
  manifestPath: './my-first-agent/manifest.json'
});

console.log('Published successfully:');
console.log(JSON.stringify(result, null, 2));
EOF

node publish-agent.js
```

**Expected output:**
```
Published successfully:
{
  name: 'hello-agent',
  version: '1.0.0',
  releaseUrl: 'https://github.com/your-org/my-agent-registry/releases/tag/agent-hello-agent-1.0.0',
  publishedAt: '2025-04-12T10:40:00Z',
  checksum: 'sha256:abc123...'
}
```

✅ **Your agent is now published!**

---

## Walkthrough 2: Install an Agent from Registry

### Step 1: Search the Registry

Find available agents:

```bash
cat > search-agents.js << 'EOF'
import { RegistryBrowser } from './dist/registry/browser.js';

const browser = new RegistryBrowser({
  githubToken: process.env.GITHUB_TOKEN,
  registryOwner: process.env.GITHUB_REGISTRY_OWNER,
  registryRepo: process.env.GITHUB_REGISTRY_REPO
});

const results = await browser.search('hello');
console.log('Search results:');
console.log(JSON.stringify(results, null, 2));
EOF

node search-agents.js
```

**Expected output:**
```
Search results:
{
  agents: [
    {
      name: 'hello-agent',
      author: 'your-name',
      description: 'Simple greeting agent for testing',
      versions: ['1.0.0'],
      latestVersion: '1.0.0'
    }
  ]
}
```

### Step 2: Install an Agent

Install an agent with version pinning:

```bash
cat > install-agent.js << 'EOF'
import { AgentInstaller } from './dist/install/installer.js';

const installer = new AgentInstaller({
  squadDir: './.squad',
  registryOwner: process.env.GITHUB_REGISTRY_OWNER,
  registryRepo: process.env.GITHUB_REGISTRY_REPO,
  githubToken: process.env.GITHUB_TOKEN
});

const result = await installer.install({
  agent: 'hello-agent@1.0.0'
});

console.log('Installation complete:');
console.log(JSON.stringify(result, null, 2));
EOF

node install-agent.js
```

**Expected output:**
```
Installation complete:
{
  agent: 'hello-agent',
  version: '1.0.0',
  installPath: './.squad/agents/hello-agent',
  pinned: true,
  installedAt: '2025-04-12T10:45:00Z',
  metadata: {
    author: 'your-name',
    description: 'Simple greeting agent for testing',
    skills: { 'text-formatter': '^1.0.0' }
  }
}
```

### Step 3: Verify Installation

Check that your agent is installed:

```bash
ls -la .squad/agents/hello-agent/
# -rw-r--r--  manifest.json
# -rw-r--r--  charter.md
# -rw-r--r--  .agent-metadata.json
# drwxr-xr-x  skills/
# drwxr-xr-x  config/

cat .squad/agents/hello-agent/.agent-metadata.json
# {
#   "agent": "hello-agent",
#   "version": "1.0.0",
#   "pinned": true,
#   "installedAt": "2025-04-12T10:45:00Z"
# }
```

✅ **Your agent is installed and ready to use!**

---

## Common Next Steps

### Publish Version 2.0

After making changes to your agent:

```bash
# Update version in manifest.json
cat > my-first-agent/manifest.json << 'EOF'
{
  "name": "hello-agent",
  "version": "2.0.0",
  "author": "your-name",
  "description": "Enhanced greeting agent with more features",
  "skills": {
    "text-formatter": "^1.0.0",
    "sentiment-analyzer": "^1.0.0"
  },
  "config": {
    "timeout": 30000
  }
}
EOF

# Scan, package, and publish as before
npm run build
node scan-agent.js
node package-agent.js
# (update package-agent.js to reference v2.0.0)
node publish-agent.js
```

### Check for Agent Updates

```bash
cat > check-updates.js << 'EOF'
import { AgentInstaller } from './dist/install/installer.js';

const installer = new AgentInstaller({
  squadDir: './.squad',
  registryOwner: process.env.GITHUB_REGISTRY_OWNER,
  registryRepo: process.env.GITHUB_REGISTRY_REPO,
  githubToken: process.env.GITHUB_TOKEN
});

const updates = await installer.checkUpdates('hello-agent');
console.log('Available updates:');
console.log(JSON.stringify(updates, null, 2));
EOF

node check-updates.js
```

### Uninstall an Agent

```bash
cat > uninstall-agent.js << 'EOF'
import { AgentInstaller } from './dist/install/installer.js';

const installer = new AgentInstaller({
  squadDir: './.squad'
});

await installer.uninstall('hello-agent');
console.log('Agent uninstalled successfully');
EOF

node uninstall-agent.js
```

---

## Troubleshooting

### "GITHUB_TOKEN not found"
```bash
# Set your token before running scripts
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
echo $GITHUB_TOKEN  # Verify it's set
```

### "Registry index not found"
Make sure your registry repository has `.registry/agents.json` initialized:
```bash
cd path/to/my-agent-registry
mkdir -p .registry
cat > .registry/agents.json << 'EOF'
{ "agents": [], "metadata": { "initialized": true, "version": "1.0.0" } }
EOF
git add .registry/agents.json
git commit -m "Initialize registry"
git push
```

### "Manifest validation failed"
Ensure your `manifest.json` has all required fields:
- `name` (string, must be valid npm package name)
- `version` (string, must be valid semver like `1.0.0`)
- `author` (string)
- `description` (string)
- `skills` (object with skill names and version constraints)

### "Security scan failed"
Check for common issues:
- No hardcoded API keys or secrets
- No `eval()` or dangerous `require()` patterns
- No unexpected network calls

If the issue is a false positive, add it to your allowlist before publishing.

---

## Full Example: Complete Publish → Install Workflow

Combine all steps into one script:

```bash
# 1. Create and validate
mkdir demo-agent
cat > demo-agent/manifest.json << 'EOF'
{"name":"demo","version":"1.0.0","author":"test","description":"Demo","skills":{},"config":{}}
EOF
touch demo-agent/charter.md demo-agent/config/.gitkeep demo-agent/skills/.gitkeep

# 2. Build marketplace
npm run build

# 3. Scan (assuming no issues)
# 4. Package
node -e "
import { AgentPackager } from './dist/package/packager.js';
const p = new AgentPackager();
await p.package('./demo-agent', './demo-1.0.0.tar.gz');
console.log('Packaged');
"

# 5. Publish
node -e "
import { AgentPublisher } from './dist/registry/publisher.js';
const pub = new AgentPublisher({
  githubToken: process.env.GITHUB_TOKEN,
  registryOwner: process.env.GITHUB_REGISTRY_OWNER,
  registryRepo: process.env.GITHUB_REGISTRY_REPO
});
const r = await pub.publish({
  packagePath: './demo-1.0.0.tar.gz',
  manifestPath: './demo-agent/manifest.json'
});
console.log('Published:', r.name, r.version);
"

# 6. Install
node -e "
import { AgentInstaller } from './dist/install/installer.js';
const i = new AgentInstaller({
  squadDir: './.squad',
  registryOwner: process.env.GITHUB_REGISTRY_OWNER,
  registryRepo: process.env.GITHUB_REGISTRY_REPO,
  githubToken: process.env.GITHUB_TOKEN
});
const r = await i.install({ agent: 'demo@1.0.0' });
console.log('Installed:', r.agent, r.version);
"

# 7. Verify
ls -la .squad/agents/demo/
```

---

## Resources

- **[README.md](./README.md)**: Full project documentation
- **[PLAN.md](./PLAN.md)**: Technical architecture and roadmap
- **[Squad SDK Documentation](https://github.com/bradygaster/squad-sdk)**: Core SDK reference
- **Test Examples**: Check `test/integration/` for complete workflow examples

---

Happy publishing! 🚀
