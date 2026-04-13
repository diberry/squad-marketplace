import { describe, it, expect } from 'vitest';
import { ManifestValidator } from '../../../src/manifest/validator';
import { ManifestValidationError } from '../../../src/utils/errors';

describe('ManifestValidator', () => {
  const validator = new ManifestValidator();

  const validManifest = {
    name: 'test-agent',
    version: '1.0.0',
    author: 'test-author',
    description: 'A test agent',
    skills: { 'code-review': '^1.0.0' },
  };

  it('should validate a valid agent manifest', () => {
    const result = validator.validate(validManifest);
    expect(result.name).toBe('test-agent');
    expect(result.version).toBe('1.0.0');
    expect(result.author).toBe('test-author');
    expect(result.description).toBe('A test agent');
    expect(result.skills).toEqual({ 'code-review': '^1.0.0' });
    expect(result.checksum).toBeDefined();
    expect(typeof result.checksum).toBe('string');
    expect(result.checksum!.length).toBe(64); // SHA256 hex
  });

  it('should reject manifest missing required fields', () => {
    expect(() => validator.validate({})).toThrow(ManifestValidationError);
    expect(() => validator.validate({ name: '' })).toThrow('non-empty string');
    expect(() => validator.validate({ name: 'x', version: 'not-semver' })).toThrow('valid semver');
    expect(() => validator.validate({ name: 'x', version: '1.0.0', author: '' })).toThrow('non-empty string');
    expect(() => validator.validate({ name: 'x', version: '1.0.0', author: 'a', description: '' })).toThrow('non-empty string');
    expect(() => validator.validate({ name: 'x', version: '1.0.0', author: 'a', description: 'd' })).toThrow('skills');
  });

  it('should reject null and non-object manifests', () => {
    expect(() => validator.validate(null)).toThrow(ManifestValidationError);
    expect(() => validator.validate(undefined)).toThrow(ManifestValidationError);
    expect(() => validator.validate('string')).toThrow(ManifestValidationError);
    expect(() => validator.validate(42)).toThrow(ManifestValidationError);
  });

  it('should validate skill dependencies', () => {
    const result = validator.validate({
      ...validManifest,
      skills: { 'skill-a': '^1.0.0', 'skill-b': '~2.0.0' },
    });
    expect(result.skills).toEqual({ 'skill-a': '^1.0.0', 'skill-b': '~2.0.0' });
  });

  it('should reject skills that is an array', () => {
    expect(() => validator.validate({ ...validManifest, skills: [] })).toThrow('skills');
  });

  it('should preserve optional config field', () => {
    const result = validator.validate({ ...validManifest, config: { key: 'value' } });
    expect(result.config).toEqual({ key: 'value' });
  });

  it('should compute consistent checksums', () => {
    const result1 = validator.validate(validManifest);
    const result2 = validator.validate(validManifest);
    expect(result1.checksum).toBe(result2.checksum);
  });
});
