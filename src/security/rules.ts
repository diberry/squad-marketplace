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
  // TODO: Define rules for credentials, dangerous calls, network access, etc.
];
