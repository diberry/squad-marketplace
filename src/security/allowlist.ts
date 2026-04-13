/**
 * Security Allowlist
 * Manage known-safe patterns and exceptions.
 */

export class SecurityAllowlist {
  private allowlist: Set<string> = new Set();

  add(pattern: string): void {
    this.allowlist.add(pattern);
  }

  isAllowed(value: string): boolean {
    return this.allowlist.has(value);
  }
}
