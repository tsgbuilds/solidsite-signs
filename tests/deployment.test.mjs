import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Dockerfile is compatible with Railway volume validation', async () => {
  const dockerfile = await readFile(new URL('../Dockerfile', import.meta.url), 'utf8');
  // Railway rejects the image before building if this instruction is present.
  // Runtime persistence must instead be provisioned in the hosting service.
  assert.doesNotMatch(dockerfile, /^\s*VOLUME\s/im, 'Use a Railway volume; Docker VOLUME is unsupported');
});
