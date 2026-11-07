import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import crypto from 'node:crypto';

// The site imports the level results JSON at build time, so every number on the page is generated, never typed.
// File hashes and test counts are computed here from the repo files and injected as constants.
const root = new URL('..', import.meta.url);
const read = (p) => fs.readFileSync(new URL(p, root));
const RESULT_FILES = ['level-1-learn/results_learn.json', 'level-2-build/results_build.json', 'level-3-deep/results_deep.json',
  'level-3-deep/results_seeds.json', 'level-3-deep/results_deep_curves.json'];
const TEST_FILES = ['tests/test_smoke.py', 'tests/test_learn_rl.py', 'tests/test_build_rl.py', 'tests/test_deep_rl.py',
  'tests/test_verifier_fuzz.py', 'tests/test_deep_extras.py'];
const hashes = Object.fromEntries(RESULT_FILES.map((p) => [p, crypto.createHash('sha256').update(read(p)).digest('hex')]));
// test_smoke.py is a plain script with one assertion block, so it counts as one test.
const tests = Object.fromEntries(TEST_FILES.map((p) => [p, Math.max(1, (read(p).toString().match(/^def test_/gm) || []).length)]));

export default defineConfig({
  base: '/rl-environments-and-verifiers/',
  plugins: [react()],
  define: { __HASHES__: JSON.stringify(hashes), __TESTS__: JSON.stringify(tests) },
  server: { fs: { allow: ['..'] } },
});
