import path from 'path';
import fs from 'fs';

/**
 * Resolves the frontend dist directory across dev (ts-node) and compiled layouts.
 */
export function resolveFrontendDistPath(): string {
  const candidates = [
    path.join(__dirname, '..', '..', '..', 'frontend', 'dist'),
    path.join(__dirname, '..', '..', '..', '..', '..', 'frontend', 'dist'),
    path.join(__dirname, '..', '..', 'frontend', 'dist'),
  ];

  const existing = candidates.find((candidate) => fs.existsSync(path.join(candidate, 'index.html')));
  return existing ?? candidates[0];
}
