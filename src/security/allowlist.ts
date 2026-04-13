/**
 * Security Allowlist
 * Manage known-safe patterns and exceptions.
 */

import type { SecurityIssue } from './scanner.js';

export class SecurityAllowlist {
  private allowlist: Set<string> = new Set();

  add(pattern: string): void {
    this.allowlist.add(pattern);
  }

  remove(pattern: string): void {
    this.allowlist.delete(pattern);
  }

  isAllowed(value: string): boolean {
    for (const pattern of this.allowlist) {
      if (value.includes(pattern)) {
        return true;
      }
    }
    return false;
  }

  filterIssues(issues: SecurityIssue[]): SecurityIssue[] {
    return issues.filter(issue => !this.isAllowed(issue.description));
  }
}
