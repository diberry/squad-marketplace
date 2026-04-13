/**
 * Tar Stream Utilities
 * JSON-based archive format with gzip compression.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';

interface ArchiveEntry {
  path: string;
  content: string; // base64
}

function collectFiles(dir: string, baseDir: string): ArchiveEntry[] {
  const entries: ArchiveEntry[] = [];
  const items = readdirSync(dir);
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      entries.push(...collectFiles(fullPath, baseDir));
    } else {
      entries.push({
        path: relative(baseDir, fullPath).replace(/\\/g, '/'),
        content: readFileSync(fullPath).toString('base64'),
      });
    }
  }
  return entries;
}

export class TarStream {
  static async compress(sourceDir: string): Promise<Buffer> {
    const entries = collectFiles(sourceDir, sourceDir);
    const json = JSON.stringify(entries);
    return gzipSync(Buffer.from(json, 'utf-8'));
  }

  static async extract(tarBuffer: Buffer, targetDir: string): Promise<void> {
    const json = gunzipSync(tarBuffer).toString('utf-8');
    const entries: ArchiveEntry[] = JSON.parse(json);
    for (const entry of entries) {
      const fullPath = join(targetDir, entry.path);
      mkdirSync(dirname(fullPath), { recursive: true });
      writeFileSync(fullPath, Buffer.from(entry.content, 'base64'));
    }
  }
}
