/**
 * Scanning Rules
 * Define patterns for security checks.
 */

export interface ScanningRule {
  name: string;
  patterns: RegExp[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  description: string;
}

export const DEFAULT_RULES: ScanningRule[] = [
  {
    name: 'hardcoded-api-key',
    patterns: [
      /(?:api[_-]?key|apikey)\s*[:=]\s*['"][A-Za-z0-9]{16,}['"]/i,
      /(?:secret|token)\s*[:=]\s*['"][A-Za-z0-9]{16,}['"]/i,
    ],
    severity: 'CRITICAL',
    category: 'credentials',
    description: 'Hardcoded API key or secret token detected',
  },
  {
    name: 'hardcoded-password',
    patterns: [
      /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]+['"]/i,
    ],
    severity: 'CRITICAL',
    category: 'credentials',
    description: 'Hardcoded password detected',
  },
  {
    name: 'private-key',
    patterns: [
      /-----BEGIN\s(?:RSA\s)?PRIVATE\sKEY-----/,
    ],
    severity: 'CRITICAL',
    category: 'credentials',
    description: 'Private key material detected',
  },
  {
    name: 'eval-usage',
    patterns: [
      /\beval\s*\(/,
    ],
    severity: 'HIGH',
    category: 'dangerous-calls',
    description: 'Use of eval() detected — potential code injection risk',
  },
  {
    name: 'child-process',
    patterns: [
      /require\s*\(\s*['"]child_process['"]\s*\)/,
      /from\s+['"]child_process['"]/,
      /from\s+['"]node:child_process['"]/,
    ],
    severity: 'HIGH',
    category: 'dangerous-calls',
    description: 'Use of child_process module — can execute arbitrary system commands',
  },
  {
    name: 'exec-spawn',
    patterns: [
      /\bexec\s*\(/,
      /\bexecSync\s*\(/,
      /\bspawn\s*\(/,
      /\bspawnSync\s*\(/,
    ],
    severity: 'HIGH',
    category: 'dangerous-calls',
    description: 'Use of exec/spawn detected — potential command injection risk',
  },
  {
    name: 'network-http',
    patterns: [
      /https?:\/\/[^\s'"]+/,
    ],
    severity: 'MEDIUM',
    category: 'network-access',
    description: 'HTTP/HTTPS URL detected — agent may access external resources',
  },
  {
    name: 'fetch-call',
    patterns: [
      /\bfetch\s*\(/,
    ],
    severity: 'MEDIUM',
    category: 'network-access',
    description: 'Use of fetch() detected — agent may make network requests',
  },
  {
    name: 'xmlhttprequest',
    patterns: [
      /XMLHttpRequest/,
    ],
    severity: 'MEDIUM',
    category: 'network-access',
    description: 'Use of XMLHttpRequest detected — agent may make network requests',
  },
];
