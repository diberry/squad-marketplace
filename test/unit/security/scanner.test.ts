import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SecurityScanner } from '../../../src/security/scanner';

describe('SecurityScanner', () => {
  let tempDir: string;
  const scanner = new SecurityScanner();

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'scanner-test-'));
    writeFileSync(join(tempDir, 'manifest.json'), JSON.stringify({
      name: 'test-agent',
      version: '1.0.0',
      author: 'tester',
      description: 'Test',
      skills: {},
    }));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should detect hardcoded credentials', async () => {
    writeFileSync(join(tempDir, 'config.ts'), 'const api_key = "ABCDEF1234567890ABCD";');
    const scan = await scanner.scan(tempDir);

    expect(scan.issues.length).toBeGreaterThan(0);
    expect(scan.issues.some(i => i.category === 'credentials')).toBe(true);
    expect(scan.riskLevel).toBe('CRITICAL');
  });

  it('should detect dangerous system calls', async () => {
    writeFileSync(join(tempDir, 'dangerous.ts'), 'const result = eval("1+1");');
    const scan = await scanner.scan(tempDir);

    expect(scan.issues.some(i => i.category === 'dangerous-calls')).toBe(true);
    expect(scan.riskLevel).toBe('HIGH');
  });

  it('should detect unallowlisted network calls', async () => {
    writeFileSync(join(tempDir, 'network.ts'), 'fetch("https://example.com/api")');
    const scan = await scanner.scan(tempDir);

    expect(scan.issues.some(i => i.category === 'network-access')).toBe(true);
  });

  it('should generate SecurityScan report with issues', async () => {
    writeFileSync(join(tempDir, 'bad.ts'), 'const password = "secret123";');
    const scan = await scanner.scan(tempDir);

    expect(scan.agentName).toBe('test-agent');
    expect(scan.issues.length).toBeGreaterThan(0);
    expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(scan.riskLevel);
    expect(typeof scan.approved).toBe('boolean');
  });

  it('should return LOW risk when no issues found', async () => {
    writeFileSync(join(tempDir, 'safe.ts'), 'export const greeting = "hello";');
    const scan = await scanner.scan(tempDir);

    expect(scan.issues).toHaveLength(0);
    expect(scan.riskLevel).toBe('LOW');
    expect(scan.approved).toBe(true);
  });

  it('should scanContent for a single file', () => {
    const issues = scanner.scanContent('const secret = "ABCDEF1234567890ABCD";', 'test.ts');
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].location).toBe('test.ts');
  });

  it('should detect child_process require', async () => {
    writeFileSync(join(tempDir, 'cp.ts'), "const cp = require('child_process');");
    const scan = await scanner.scan(tempDir);

    expect(scan.issues.some(i => i.category === 'dangerous-calls')).toBe(true);
  });
});
