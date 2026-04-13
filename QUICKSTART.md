# Squad SDK Agent Marketplace — Quick Start

Get an agent published and installed in 5 steps using the CLI.

## Prerequisites

- **Node.js** 18+ (`node --version`)
- **npm** 8+ (`npm --version`)
- **Git** (`git --version`)
- **GitHub account** with a Personal Access Token (PAT)
  - Generate at: https://github.com/settings/tokens?type=beta
  - Scopes: `repo`, `write:packages`

## Setup

### 1. Clone, Install, and Link the CLI

```bash
git clone https://github.com/your-org/squad-sdk-example-marketplace.git
cd squad-sdk-example-marketplace
npm install
npm run build
npm link
```

**Verify:**
```bash
npm run test
squad-marketplace --help
```

### 2. Create Your Registry (One-Time)

```bash
gh repo create my-agent-registry --private --description "Private Agent Marketplace"
```

### 3. Set Environment Variables

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
export GITHUB_REGISTRY_OWNER=your-org
export GITHUB_REGISTRY_REPO=my-agent-registry
```

Add to your shell profile (`.bashrc`, `.zshrc`, etc.) for persistence.

---

## Step 1: Create an Agent

A ready-made sample lives in `examples/sample-agent/`. To create your own:

```bash
mkdir my-agent && cd my-agent
```

Create `manifest.json`:

```json
{
  "name": "test-agent",
  "version": "1.0.0",
  "author": "your-name",
  "description": "A simple test agent",
  "skills": { "text-processor": "^1.0.0" },
  "config": { "timeout": 30000 }
}
```

Create `charter.md`:

```markdown
# Test Agent

A demonstration agent for testing the marketplace.

## Capabilities
- Text processing and simple transformations

## Permissions
- Read-only access
- No network calls
```

---

## Step 2: Package Your Agent

```bash
squad-marketplace package examples/sample-agent
```

**Expected output:**
```
Packaged → sample-agent-1.0.0.tar.gz (874 bytes)
```

---

## Step 3: Scan for Security Issues

```bash
squad-marketplace scan examples/sample-agent
```

**Expected output:**
```
Agent   : sample-agent
Risk    : LOW
Approved: true
No issues found.
```

---

## Step 4: Publish to Registry

```bash
squad-marketplace publish sample-agent-1.0.0.tar.gz
```

**Expected output:**
```
Published sample-agent@1.0.0
```

---

## Step 5: Install from Registry

```bash
squad-marketplace install sample-agent@1.0.0
```

**Expected output:**
```
Installed sample-agent@1.0.0 → .squad/agents/sample-agent
```

---

## ✅ Complete!

Your agent is now:
1. ✓ Packaged as a distributable bundle
2. ✓ Scanned for security issues
3. ✓ Published to your private registry
4. ✓ Installed and ready to use

---

## Common Tasks

### List Available Agents

```bash
squad-marketplace list
```

### Publish Version 2.0

Update `manifest.json` with `"version": "2.0.0"`, then:

```bash
squad-marketplace package ./my-agent
squad-marketplace scan ./my-agent
squad-marketplace publish my-agent-2.0.0.tar.gz
```

---

## Troubleshooting

### "GITHUB_TOKEN is required but not set"
```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### "Manifest validation failed"
Check required fields in `manifest.json`:
- `name` — valid npm package name (lowercase, no spaces)
- `version` — valid semver (e.g., `1.0.0`)
- `author`, `description` — strings
- `skills`, `config` — objects (can be empty `{}`)

### "Security scan failed"
Common issues: hardcoded API keys, `eval()` calls, unexpected network access.
Review scan output and fix before republishing.

---

## Resources

- **[README.md](./README.md)** — Full documentation and programmatic API reference
- **[examples/sample-agent/](./examples/sample-agent/)** — Starter agent template
- **[GitHub PAT](https://github.com/settings/tokens)** — Generate tokens

---

**Ready to publish? Start with Step 1!** 🚀
