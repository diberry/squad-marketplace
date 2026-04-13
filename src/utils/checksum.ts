/**
 * Checksum Utilities
 * File integrity verification.
 */

import { createHash } from 'node:crypto';

export class ChecksumCalculator {
  static calculateSHA256(data: Buffer | string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  static verify(data: Buffer | string, expectedChecksum: string): boolean {
    return ChecksumCalculator.calculateSHA256(data) === expectedChecksum;
  }
}
