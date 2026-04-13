import { describe, it, expect } from 'vitest';
import { SecurityAllowlist } from '../../../src/security/allowlist';
import type { SecurityIssue } from '../../../src/security/scanner';

describe('SecurityAllowlist', () => {
  it('should add patterns to allowlist', () => {
    const allowlist = new SecurityAllowlist();
    allowlist.add('https://example.com');
    expect(allowlist.isAllowed('https://example.com/api')).toBe(true);
  });

  it('should check if pattern is allowlisted', () => {
    const allowlist = new SecurityAllowlist();
    allowlist.add('trusted-pattern');
    expect(allowlist.isAllowed('this contains trusted-pattern inside')).toBe(true);
    expect(allowlist.isAllowed('something else')).toBe(false);
  });

  it('should skip scan issues for allowlisted patterns', () => {
    const allowlist = new SecurityAllowlist();
    allowlist.add('HTTP/HTTPS URL detected');

    const issues: SecurityIssue[] = [
      { severity: 'CRITICAL', category: 'credentials', description: 'Hardcoded API key detected' },
      { severity: 'MEDIUM', category: 'network-access', description: 'HTTP/HTTPS URL detected — agent may access external resources' },
    ];

    const filtered = allowlist.filterIssues(issues);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].category).toBe('credentials');
  });

  it('should remove patterns from allowlist', () => {
    const allowlist = new SecurityAllowlist();
    allowlist.add('test-pattern');
    expect(allowlist.isAllowed('test-pattern')).toBe(true);

    allowlist.remove('test-pattern');
    expect(allowlist.isAllowed('test-pattern')).toBe(false);
  });

  it('should return all issues when allowlist is empty', () => {
    const allowlist = new SecurityAllowlist();
    const issues: SecurityIssue[] = [
      { severity: 'HIGH', category: 'dangerous-calls', description: 'eval detected' },
      { severity: 'MEDIUM', category: 'network-access', description: 'fetch detected' },
    ];

    const filtered = allowlist.filterIssues(issues);
    expect(filtered).toHaveLength(2);
  });
});
