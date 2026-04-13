import { describe, it, expect } from 'vitest';
import { SecurityReportGenerator } from '../../../src/security/report';
import type { SecurityScan } from '../../../src/security/scanner';

describe('SecurityReportGenerator', () => {
  const generator = new SecurityReportGenerator();

  it('should generate scan report with remediation guidance', () => {
    const scan: SecurityScan = {
      agentName: 'test-agent',
      issues: [
        {
          severity: 'HIGH',
          category: 'dangerous-calls',
          description: 'Use of eval() detected',
          location: 'index.ts',
          remediation: 'Remove eval() usage',
        },
      ],
      riskLevel: 'HIGH',
      approved: true,
    };

    const report = generator.generate(scan);
    expect(report).toContain('test-agent');
    expect(report).toContain('HIGH');
    expect(report).toContain('eval()');
    expect(report).toContain('index.ts');
    expect(report).toContain('Remediation');
  });

  it('should quarantine agent if CRITICAL issues found', () => {
    const criticalScan: SecurityScan = {
      agentName: 'bad-agent',
      issues: [
        { severity: 'CRITICAL', category: 'credentials', description: 'Hardcoded API key' },
      ],
      riskLevel: 'CRITICAL',
      approved: false,
    };

    expect(generator.shouldQuarantine(criticalScan)).toBe(true);

    const safeScan: SecurityScan = {
      agentName: 'good-agent',
      issues: [],
      riskLevel: 'LOW',
      approved: true,
    };

    expect(generator.shouldQuarantine(safeScan)).toBe(false);
  });

  it('should include quarantine warning for CRITICAL scans', () => {
    const scan: SecurityScan = {
      agentName: 'critical-agent',
      issues: [
        { severity: 'CRITICAL', category: 'credentials', description: 'Private key found' },
      ],
      riskLevel: 'CRITICAL',
      approved: false,
    };

    const report = generator.generate(scan);
    expect(report).toContain('quarantined');
    expect(report).toContain('CRITICAL');
  });

  it('should report no issues for clean scans', () => {
    const scan: SecurityScan = {
      agentName: 'clean-agent',
      issues: [],
      riskLevel: 'LOW',
      approved: true,
    };

    const report = generator.generate(scan);
    expect(report).toContain('No security issues found');
    expect(report).toContain('Approved: YES');
  });
});
