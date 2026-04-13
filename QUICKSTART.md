# Squad SDK Agent Marketplace — Quick Start

Get an agent published and installed in 5 steps. No code writing required.

## Prerequisites

- **Node.js** 18+ (`node --version`)
- **npm** 8+ (`npm --version`)
- **Git** (`git --version`)
- **GitHub account** with a Personal Access Token (PAT)
  - Generate at: https://github.com/settings/tokens?type=beta
  - Scopes: `repo`, `write:packages`

## Setup

### 1. Clone and Install

```bash
git clone https://github.com/your-org/squad-sdk-example-marketplace.git
cd squad-sdk-example-marketplace
npm install
npm run build
```

**Verify:**
```bash
npm run test
```

You should see test results like:
```
Test Files  28 passed (28)
Tests      156 passed (156)
```

### 2. Create Your Registry (One-Time)

```bash
# Create a new GitHub repo for the registry
gh repo create my-agent-registry --private --description "Private Agent Marketplace"

# Clone it
git clone https://github.com/your-org/my-agent-registry.git
cd my-agent-registry

# Initialize registry
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
git push origin main
cd ..
```

### 3. Set Environment Variables

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
export GITHUB_REGISTRY_OWNER=your-org
export GITHUB_REGISTRY_REPO=my-agent-registry
```

Add to your shell profile (`.bashrc`, `.zshrc`, etc.) for persistence.

---

## Step 1: Create an Agent Manifest

Create a directory for your agent:

```bash
mkdir my-test-agent
cd my-test-agent
```

Create `manifest.json`:

```json
{
  "name": "test-agent",
  "version": "1.0.0",
  "author": "your-name",
  "description": "A simple test agent",
  "skills": {
    "text-processor": "^1.0.0"
  },
  "config": {
    "timeout": 30000
  }
}
```

Create `charter.md`:

```markdown
# Test Agent

A demonstration agent for testing the marketplace.

## Capabilities
- Text processing
- Simple transformations

## Permissions
- Read-only access
- No network calls
- No file system access
```

Create the required directories:

```bash
mkdir -p skills config
touch skills/.gitkeep config/.gitkeep
```

**Your agent directory should look like:**
```
my-test-agent/
├── manifest.json
├── charter.md
├── skills/
│   └── .gitkeep
└── config/
    └── .gitkeep
```

---

## Step 2: Package Your Agent

From the marketplace directory:

```bash
npm run build

node -e "
import { AgentPackager } from './dist/package/packager.js';
const packager = new AgentPackager();
await packager.package('../my-test-agent', './test-agent-1.0.0.tar.gz');
console.log('Agent packaged');
"
```

**Verify the package:**
```bash
ls -lh test-agent-1.0.0.tar.gz
tar -tzf test-agent-1.0.0.tar.gz | head -5
```

---

## Step 3: Scan for Security Issues

```bash
node -e "
import { SecurityScanner } from './dist/security/scanner.js';
import fs from 'fs';
import path from 'path';

const scanner = new SecurityScanner();
const agentPath = '../my-test-agent';

const charter = fs.readFileSync(path.join(agentPath, 'charter.md'), 'utf8');
const manifest = fs.readFileSync(path.join(agentPath, 'manifest.json'), 'utf8');

const result = scanner.scan({
  chartContent: charter,
  manifestContent: manifest,
  configContent: '',
  skillsContent: ''
});

console.log('Status:', result.passed ? '✓ PASS' : '✗ FAIL');
console.log('Issues:', result.issues.length);
if (result.issues.length > 0) {
  result.issues.forEach(issue => {
    console.log('  -', issue.message);
  });
}
"
```

**Expected output:**
```
Status: ✓ PASS
Issues: 0
```

---

## Step 4: Publish to Registry

```bash
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
const result = await publisher.publish('../my-test-agent');

console.log('Published successfully!');
console.log('Name:', result.name);
console.log('Version:', result.version);
console.log('URL:', result.releaseUrl);
"
```

**Expected output:**
```
Published successfully!
Name: test-agent
Version: 1.0.0
URL: https://github.com/your-org/my-agent-registry/releases/tag/agent-test-agent-1.0.0
```

Check your registry repo — you should see a new GitHub Release!

---

## Step 5: Install from Registry

```bash
node -e "
import { AgentInstaller } from './dist/install/installer.js';

const installer = new AgentInstaller({
  squadDir: './.squad',
  registryOwner: process.env.GITHUB_REGISTRY_OWNER,
  registryRepo: process.env.GITHUB_REGISTRY_REPO,
  githubToken: process.env.GITHUB_TOKEN
});

const result = await installer.install({ agent: 'test-agent@1.0.0' });

console.log('Installation complete!');
console.log('Agent:', result.agent);
console.log('Version:', result.version);
console.log('Path:', result.installPath);
"
```

**Expected output:**
```
Installation complete!
Agent: test-agent
Version: 1.0.0
Path: ./.squad/agents/test-agent
```

**Verify the installation:**
```bash
ls -la .squad/agents/test-agent/
cat .squad/agents/test-agent/.agent-metadata.json
```

You should see:
- `manifest.json`
- `charter.md`
- `.agent-metadata.json`
- `skills/` directory
- `config/` directory

---

## ✅ Complete!

Your agent is now:
1. ✓ Packaged as a distributable bundle
2. ✓ Scanned for security issues
3. ✓ Published to your private registry
4. ✓ Installed and ready to use

---

## Common Tasks

### Publish Version 2.0

Update `my-test-agent/manifest.json`:
```json
{
  "name": "test-agent",
  "version": "2.0.0",
  "author": "your-name",
  "description": "An improved test agent",
  "skills": {
    "text-processor": "^1.0.0",
    "sentiment-analyzer": "^1.0.0"
  },
  "config": {
    "timeout": 30000
  }
}
```

Repeat steps 2–4 (package → scan → publish).

### Search for Available Agents

```bash
node -e "
import { RegistryBrowser } from './dist/registry/browser.js';

const browser = new RegistryBrowser({
  githubToken: process.env.GITHUB_TOKEN,
  registryOwner: process.env.GITHUB_REGISTRY_OWNER,
  registryRepo: process.env.GITHUB_REGISTRY_REPO
});

const results = await browser.search('test');
console.log('Results:');
results.agents.forEach(agent => {
  console.log('  -', agent.name, '(' + agent.versions.join(', ') + ')');
});
"
```

### Check for Updates

```bash
node -e "
import { AgentInstaller } from './dist/install/installer.js';

const installer = new AgentInstaller({
  squadDir: './.squad',
  registryOwner: process.env.GITHUB_REGISTRY_OWNER,
  registryRepo: process.env.GITHUB_REGISTRY_REPO,
  githubToken: process.env.GITHUB_TOKEN
});

const updates = await installer.checkUpdates('test-agent');
console.log('Available versions:', updates);
"
```

### Uninstall an Agent

```bash
node -e "
import { AgentInstaller } from './dist/install/installer.js';

const installer = new AgentInstaller({
  squadDir: './.squad'
});

await installer.uninstall('test-agent');
console.log('Uninstalled');
"
```

---

## Troubleshooting

### "GITHUB_TOKEN not set"
```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
echo \$GITHUB_TOKEN  # Verify it's set
```

### "Registry not found"
Ensure `.registry/agents.json` exists in your registry repo:
```bash
cd ../my-agent-registry
ls -la .registry/agents.json
```

### "Manifest validation failed"
Check required fields in `manifest.json`:
- `name` — must be valid npm package name (lowercase, no spaces)
- `version` — must be valid semver (e.g., `1.0.0`)
- `author` — string
- `description` — string
- `skills` — object (can be empty `{}`)
- `config` — object (can be empty `{}`)

### "Security scan failed"
Common issues:
- Hardcoded API keys or credentials
- Dangerous patterns like `eval()` or `require()`
- Unexpected network calls

Review the scan output and fix issues before republishing.

---

## Resources

- **[README.md](./README.md)** — Full documentation
- **[GitHub Personal Access Token](https://github.com/settings/tokens)** — Generate tokens
- **Test Examples** — Check `test/integration/` for more workflows

---

**Ready to publish? Start with Step 1!** 🚀
