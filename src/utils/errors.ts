/**
 * Custom Error Types
 */

export class ManifestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ManifestValidationError';
  }
}

export class SecurityScanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityScanError';
  }
}

export class RegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RegistryError';
  }
}

export class InstallationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InstallationError';
  }
}
