/**
 * Security Report
 * Generates formatted security reports with remediation guidance.
 */

import type { SecurityScan } from './scanner.js';

export class SecurityReportGenerator {
  generate(scan: SecurityScan): string {
    const lines: string[] = [];
    lines.push('=== Security Scan Report ===');
    lines.push(`Agent: ${scan.agentName}`);
    lines.push(`Risk Level: ${scan.riskLevel}`);
    lines.push(`Approved: ${scan.approved ? 'YES' : 'NO'}`);
    lines.push(`Total Issues: ${scan.issues.length}`);
    lines.push('');

    if (scan.issues.length === 0) {
      lines.push('No security issues found.');
    } else {
      lines.push('--- Issues ---');
      for (const issue of scan.issues) {
        lines.push(`[${issue.severity}] ${issue.category}: ${issue.description}`);
        if (issue.location) {
          lines.push(`  Location: ${issue.location}`);
        }
        if (issue.remediation) {
          lines.push(`  Remediation: ${issue.remediation}`);
        }
        lines.push('');
      }
    }

    if (scan.riskLevel === 'CRITICAL') {
      lines.push('⚠️  CRITICAL issues found. Agent should be quarantined.');
    }

    return lines.join('\n');
  }

  shouldQuarantine(scan: SecurityScan): boolean {
    return scan.issues.some(issue => issue.severity === 'CRITICAL');
  }
}
