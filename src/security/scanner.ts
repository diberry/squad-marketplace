/**
 * Security Scanner
 * Detects suspicious patterns in agent code and manifests.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { DEFAULT_RULES, type ScanningRule } from './rules.js';
import { SecurityAllowlist } from './allowlist.js';

export interface SecurityIssue {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  description: string;
  location?: string;
  remediation?: string;
}

export interface SecurityScan {
  agentName: string;
  issues: SecurityIssue[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  approved: boolean;
}

const SEVERITY_ORDER: Record<string, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

function collectAllFiles(dir: string, baseDir: string): { relativePath: string; fullPath: string }[] {
  const results: { relativePath: string; fullPath: string }[] = [];
  const items = readdirSync(dir);
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...collectAllFiles(fullPath, baseDir));
    } else {
      results.push({
        relativePath: relative(baseDir, fullPath).replace(/\\/g, '/'),
        fullPath,
      });
    }
  }
  return results;
}

export class SecurityScanner {
  private rules: ScanningRule[];
  private allowlist: SecurityAllowlist;

  constructor(rules?: ScanningRule[], allowlist?: SecurityAllowlist) {
    this.rules = rules ?? DEFAULT_RULES;
    this.allowlist = allowlist ?? new SecurityAllowlist();
  }

  scanContent(content: string, filename: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    for (const rule of this.rules) {
      for (const pattern of rule.patterns) {
        if (pattern.test(content)) {
          issues.push({
            severity: rule.severity,
            category: rule.category,
            description: rule.description,
            location: filename,
            remediation: `Review and address ${rule.category} issue in ${filename}`,
          });
          break; // one match per rule per file is enough
        }
      }
    }
    return issues;
  }

  async scan(agentDir: string): Promise<SecurityScan> {
    const files = collectAllFiles(agentDir, agentDir);
    let allIssues: SecurityIssue[] = [];

    // Try to get agent name from manifest
    let agentName = 'unknown';
    try {
      const manifestPath = join(agentDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      agentName = manifest.name || 'unknown';
    } catch {
      // no manifest, use default name
    }

    for (const file of files) {
      const content = readFileSync(file.fullPath, 'utf-8');
      const issues = this.scanContent(content, file.relativePath);
      allIssues.push(...issues);
    }

    // Filter through allowlist
    allIssues = this.allowlist.filterIssues(allIssues);

    // Determine risk level
    let riskLevel: SecurityIssue['severity'] = 'LOW';
    for (const issue of allIssues) {
      if (SEVERITY_ORDER[issue.severity] > SEVERITY_ORDER[riskLevel]) {
        riskLevel = issue.severity;
      }
    }

    return {
      agentName,
      issues: allIssues,
      riskLevel,
      approved: riskLevel !== 'CRITICAL',
    };
  }
}
