import { describe, it, expect } from 'vitest';
import { DEFAULT_RULES } from '../../../src/security/rules';

describe('ScanningRules', () => {
  it('should define rules for all vulnerability categories', () => {
    const categories = DEFAULT_RULES.map(r => r.category);
    expect(categories).toContain('credentials');
    expect(categories).toContain('dangerous-calls');
    expect(categories).toContain('network-access');
  });

  it('should categorize issues by severity', () => {
    const severities = new Set(DEFAULT_RULES.map(r => r.severity));
    expect(severities.has('CRITICAL')).toBe(true);
    expect(severities.has('HIGH')).toBe(true);
    expect(severities.has('MEDIUM')).toBe(true);
  });

  it('should have non-empty patterns for every rule', () => {
    for (const rule of DEFAULT_RULES) {
      expect(rule.patterns.length).toBeGreaterThan(0);
      expect(rule.name).toBeTruthy();
      expect(rule.description).toBeTruthy();
    }
  });

  it('should have credential rules with CRITICAL severity', () => {
    const credentialRules = DEFAULT_RULES.filter(r => r.category === 'credentials');
    expect(credentialRules.length).toBeGreaterThan(0);
    for (const rule of credentialRules) {
      expect(rule.severity).toBe('CRITICAL');
    }
  });

  it('should have dangerous-calls rules with HIGH severity', () => {
    const dangerousRules = DEFAULT_RULES.filter(r => r.category === 'dangerous-calls');
    expect(dangerousRules.length).toBeGreaterThan(0);
    for (const rule of dangerousRules) {
      expect(rule.severity).toBe('HIGH');
    }
  });

  it('should match known dangerous patterns', () => {
    const evalRule = DEFAULT_RULES.find(r => r.name === 'eval-usage');
    expect(evalRule).toBeDefined();
    expect(evalRule!.patterns.some(p => p.test('eval("code")'))).toBe(true);

    const apiKeyRule = DEFAULT_RULES.find(r => r.name === 'hardcoded-api-key');
    expect(apiKeyRule).toBeDefined();
    expect(apiKeyRule!.patterns.some(p => p.test('api_key = "ABCDEF1234567890ABCD"'))).toBe(true);
  });
});
