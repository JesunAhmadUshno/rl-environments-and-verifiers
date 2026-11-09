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
  'tests/test_verifier_fuzz.py', 'tests/test_deep_extras.py', 'tests/test_layout.py'];
const hashes = Object.fromEntries(RESULT_FILES.map((p) => [p, crypto.createHash('sha256').update(read(p)).digest('hex')]));
// REPORT.md quotes a sha256 for each v1.0 results file (stage records); read those here so the page can compare them.
const report = read('REPORT.md').toString();
const quoted = Object.fromEntries([...report.toString().matchAll(/(results_\w+\.json) byte-identical across two runs at sha256 ([0-9a-f]{64})/g)].map((m) => [m[1], m[2]]));
// REPORT.md v1.1 backlog items as written, with internal project codes swapped for plain names (only these strings ship).
const PLAIN = [[/the \S+-evals harness \(P27\)/g, 'an external scoring harness'], [/P27 harness integration/g, 'External scoring harness integration'],
  [/the in-repo P06-pattern\s+scorer/g, 'the in-repo scorer'], [/\bLLM\b/g, 'language-model']];
const roadmap = report.split('## v1.1 backlog')[1].split('\n## ')[0].split(/\n(?=\d+\. )/).map((x) => x.trim()).filter((x) => /^\d+\./.test(x))
  .map((x) => PLAIN.reduce((acc, [re, rep]) => acc.replace(re, rep), x.replace(/^\d+\.\s*/, '').replace(/\s+/g, ' ')));
// The README Verdict line, shown on the page as written (fails the build if the README loses it).
const verdictMatch = read('README.md').toString().match(/\*\*Verdict\.\*\*\s+([\s\S]+?)\n\n/);
if (!verdictMatch) throw new Error('README.md has no **Verdict.** line');
const verdict = verdictMatch[1].replace(/\s+/g, ' ').trim();
// test_smoke.py is a plain script with one assertion block, so it counts as one test.
const tests = Object.fromEntries(TEST_FILES.map((p) => [p, Math.max(1, (read(p).toString().match(/^def test_/gm) || []).length)]));

export default defineConfig({
  base: '/rl-environments-and-verifiers/',
  plugins: [react()],
  define: { __HASHES__: JSON.stringify(hashes), __TESTS__: JSON.stringify(tests), __QUOTED__: JSON.stringify(quoted), __ROADMAP__: JSON.stringify(roadmap), __VERDICT__: JSON.stringify(verdict) },
  server: { fs: { allow: ['..'] } },
});
