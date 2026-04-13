#!/usr/bin/env node

/**
 * squad-marketplace CLI
 *
 * Wraps the marketplace SDK so users never touch dependency wiring.
 *
 * Commands:
 *   package <agent-dir>     — create a .tar.gz bundle
 *   scan    <agent-dir>     — run security scan
 *   publish <package-file>  — publish a package to the registry
 *   install <agent-name>    — install an agent from the registry
 *   list                    — list registry contents
 */

import { writeFileSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

import { AgentPackager } from '../package/packager.js';
import { AgentExtractor } from '../package/extractor.js';
import { SecurityScanner } from '../security/scanner.js';
import { AgentPublisher } from '../registry/publisher.js';
import { GitHubRegistry } from '../registry/github-registry.js';
import { RegistryIndexManager } from '../registry/index-manager.js';
import { RegistryBrowser } from '../registry/browser.js';
import { AgentInstaller } from '../install/installer.js';
import { DependencyResolver } from '../install/dependency-resolver.js';
import { MetadataManager } from '../install/metadata.js';
import { ManifestValidator } from '../manifest/validator.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Error: environment variable ${name} is required but not set.`);
    process.exit(1);
  }
  return value;
}

function usage(): never {
  console.log(`
squad-marketplace — private agent registry CLI

Usage:
  squad-marketplace package <agent-dir>       Package an agent into a .tar.gz bundle
  squad-marketplace scan    <agent-dir>       Run a security scan on an agent directory
  squad-marketplace publish <package-file>    Publish a .tar.gz package to the registry
  squad-marketplace install <agent-name>      Install an agent from the registry
  squad-marketplace list                      List agents in the registry

Environment variables (required for registry commands):
  GITHUB_TOKEN            GitHub Personal Access Token
  GITHUB_REGISTRY_OWNER   Owner of the registry repository
  GITHUB_REGISTRY_REPO    Name of the registry repository
`.trim());
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Registry helpers — build the dependency graph once
// ---------------------------------------------------------------------------

function buildRegistry(): GitHubRegistry {
  const owner = env('GITHUB_REGISTRY_OWNER');
  const repo = env('GITHUB_REGISTRY_REPO');
  const token = env('GITHUB_TOKEN');
  const indexManager = new RegistryIndexManager();
  return new GitHubRegistry(owner, repo, token, indexManager, globalThis.fetch);
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function cmdPackage(agentDir: string): Promise<void> {
  const packager = new AgentPackager();
  const buf = await packager.package(resolve(agentDir));

  // Derive output file name from manifest
  const manifest = JSON.parse(readFileSync(resolve(agentDir, 'manifest.json'), 'utf8'));
  const outFile = `${manifest.name}-${manifest.version}.tar.gz`;
  writeFileSync(outFile, buf);
  console.log(`Packaged → ${outFile} (${buf.length} bytes)`);
}

async function cmdScan(agentDir: string): Promise<void> {
  const scanner = new SecurityScanner();
  const result = await scanner.scan(resolve(agentDir));

  console.log(`Agent   : ${result.agentName}`);
  console.log(`Risk    : ${result.riskLevel}`);
  console.log(`Approved: ${result.approved}`);
  if (result.issues.length > 0) {
    console.log(`Issues  : ${result.issues.length}`);
    for (const issue of result.issues) {
      console.log(`  [${issue.severity}] ${issue.category} — ${issue.description}`);
      if (issue.remediation) console.log(`          Fix: ${issue.remediation}`);
    }
  } else {
    console.log('No issues found.');
  }
  process.exitCode = result.approved ? 0 : 1;
}

async function cmdPublish(packageFile: string): Promise<void> {
  const registry = buildRegistry();
  const validator = new ManifestValidator();

  const packageBuffer = readFileSync(resolve(packageFile));
  const extractor = new AgentExtractor();

  // Extract to a temp location to read the manifest
  const { mkdtempSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const tempDir = mkdtempSync(join(tmpdir(), 'sq-publish-'));
  try {
    const { manifest } = await extractor.extract(packageBuffer, tempDir);
    validator.validate(manifest);
    const entry = await registry.publish(packageBuffer, manifest);
    console.log(`Published ${entry.name}@${entry.version}`);
    if (entry.download_url) console.log(`URL: ${entry.download_url}`);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

async function cmdInstall(agentName: string): Promise<void> {
  const registry = buildRegistry();
  const extractor = new AgentExtractor();
  const depResolver = new DependencyResolver();
  const metadataManager = new MetadataManager();
  const installer = new AgentInstaller(registry, extractor, depResolver, metadataManager);

  // Accept name@version syntax
  const parts = agentName.split('@');
  const name = parts[0];
  const version = parts[1] ?? 'latest';
  const targetDir = resolve('.squad', 'agents', name);

  const meta = await installer.install(name, version, targetDir);
  console.log(`Installed ${meta.name}@${meta.version} → ${targetDir}`);
}

async function cmdList(): Promise<void> {
  const registry = buildRegistry();
  const index = await registry.getIndex();

  if (index.agents.length === 0) {
    console.log('Registry is empty.');
    return;
  }

  console.log(`Registry (${index.agents.length} agent(s)):\n`);
  for (const entry of index.agents) {
    console.log(`  ${entry.name}@${entry.version}  by ${entry.author}  (${entry.published_at})`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);

  if (!command) usage();

  switch (command) {
    case 'package':
      if (!args[0]) { console.error('Usage: squad-marketplace package <agent-dir>'); process.exit(1); }
      await cmdPackage(args[0]);
      break;
    case 'scan':
      if (!args[0]) { console.error('Usage: squad-marketplace scan <agent-dir>'); process.exit(1); }
      await cmdScan(args[0]);
      break;
    case 'publish':
      if (!args[0]) { console.error('Usage: squad-marketplace publish <package-file>'); process.exit(1); }
      await cmdPublish(args[0]);
      break;
    case 'install':
      if (!args[0]) { console.error('Usage: squad-marketplace install <agent-name>'); process.exit(1); }
      await cmdInstall(args[0]);
      break;
    case 'list':
      await cmdList();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      usage();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
