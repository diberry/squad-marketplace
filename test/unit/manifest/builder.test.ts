import { describe, it, expect } from 'vitest';
import { ManifestBuilder } from '../../../src/manifest/builder';
import { ManifestValidationError } from '../../../src/utils/errors';

describe('ManifestBuilder', () => {
  it('should build a valid manifest with fluent API', () => {
    const manifest = new ManifestBuilder()
      .name('my-agent')
      .version('1.2.3')
      .author('test-author')
      .description('My cool agent')
      .skills({ 'code-review': '^1.0.0' })
      .build();

    expect(manifest.name).toBe('my-agent');
    expect(manifest.version).toBe('1.2.3');
    expect(manifest.author).toBe('test-author');
    expect(manifest.description).toBe('My cool agent');
    expect(manifest.skills).toEqual({ 'code-review': '^1.0.0' });
  });

  it('should compute checksum on build', () => {
    const manifest = new ManifestBuilder()
      .name('my-agent')
      .version('1.0.0')
      .author('author')
      .description('desc')
      .skills({})
      .build();

    expect(manifest.checksum).toBeDefined();
    expect(typeof manifest.checksum).toBe('string');
    expect(manifest.checksum!.length).toBe(64);
  });

  it('should fail build if required fields missing', () => {
    expect(() => new ManifestBuilder().build()).toThrow(ManifestValidationError);

    expect(() =>
      new ManifestBuilder().name('agent').build(),
    ).toThrow(ManifestValidationError);

    expect(() =>
      new ManifestBuilder().name('agent').version('1.0.0').build(),
    ).toThrow(ManifestValidationError);
  });

  it('should support config in the fluent API', () => {
    const manifest = new ManifestBuilder()
      .name('my-agent')
      .version('1.0.0')
      .author('author')
      .description('desc')
      .skills({})
      .config({ maxRetries: 5 })
      .build();

    expect(manifest.config).toEqual({ maxRetries: 5 });
  });

  it('should return this for chaining', () => {
    const builder = new ManifestBuilder();
    const result = builder.name('x');
    expect(result).toBe(builder);
  });
});
