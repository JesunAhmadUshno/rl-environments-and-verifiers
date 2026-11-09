# Changelog

All notable changes to this project. Format: Keep a Changelog 1.1.
Versions follow Semantic Versioning. Tags v0.1, v0.5 and v1.0 were cut
under the earlier Learn / Build / Deep scheme and predate the portfolio
standard v2; they are kept as they are.

## [Unreleased]

### Changed
- 2026-11-08: Adopted the portfolio standard v2. README opens with the
  question, headline (with its 95% interval), field, job family and
  verdict: Functional, not pre-registered. Git history shows no plan
  with hypotheses or pass lines was committed before the results, so no
  proposal-v1 tag is added. SPEC.md, NOVELTY.md and DOSSIER.md folded
  into PROPOSAL.md; ROADMAP.md, docs/research-review.md and the old
  README benchmarks and stage summaries folded into REPORT.md;
  docs/index.md (the legacy Pages summary, a duplicate of the README)
  removed. Level and publicity grades removed from every public file
  (grades are internal). Decisions 0001 to 0003 recorded. Layout test
  added (required files, README abstract, no public grade). CI runs
  with read-only permissions; CodeQL also scans the dashboard's
  JavaScript; Dependabot also watches site/ npm. The dashboard now reads
  the results sha256 quotes and the v1.1 backlog from REPORT.md and
  shows the README verdict.

### Added
- 2026-11-07: Verifier fuzz test: every single-field mutation of 44
  valid logs (7,880 mutations) checked against an independent replay
  oracle (tests/test_verifier_fuzz.py).
- 2026-11-07: Seed sweep over 10 training seeds with 95% t-intervals,
  REINFORCE (mean baseline) and Q-learning baselines at the same episode
  budget, unbiased pass@k, an lr by group-size grid, the CliffGrid
  detour and sequence held-out measurements (level-3-deep/run_seeds.py,
  results_seeds.json), and learning curves (results_deep_curves.json).
  results_deep.json unchanged.
- 2026-11-07: CI reruns every runner and fails on any diff to the
  committed results (pinned to Python 3.12, docs/decisions/0002).
- 2026-11-07: Live dashboard (site/): a JavaScript port of the
  environments, verifiers and trainer, checked at build time against
  every results file, and a Pages workflow.
- 2026-11-07: Research review of the method, evidence and gaps (now in
  REPORT.md).

### Security
- 2026-11-07: vite upgraded to 6.4.5 so npm audit reports no high or
  critical advisories.

## [1.0] - 2026-11-05

### Added
- Deep: a GRPO-style RLVR teaching analogue, a tabular softmax policy
  trained by group-relative advantage (groups of 16) with reward read
  only from the Build replay verifiers; two measured ablations
  (CliffGrid return mode, bandit success mode); 12 tests.
- CI on Python 3.11 and 3.12 with ruff, CodeQL, Dependabot, a release
  artifact workflow, Labeler, Greetings and Stale.
- Fan-out drafts in fanout/ and the channel log in PUBLICITY.md
  (nothing posted).

## [0.5] - 2026-11-05

### Added
- Build: four environments (GridWorld, CliffGrid, a 3-arm bandit, a
  sequence-memory task), replay verifiers grading 16 of 16 scenarios as
  expected, and a reward-hacking post-mortem per environment; 14 tests.

## [0.1] - 2026-11-05

### Added
- Learn: a deterministic 4 by 4 GridWorld, a replay verifier grading 6
  of 6 scenarios as expected, and tabular Q-learning; 10 tests.
- 2026-11-04: Scaffold with the scope in SPEC.md (now in PROPOSAL.md).

[Unreleased]: https://github.com/JesunAhmadUshno/rl-environments-and-verifiers/compare/v1.0...HEAD
[1.0]: https://github.com/JesunAhmadUshno/rl-environments-and-verifiers/compare/v0.5...v1.0
[0.5]: https://github.com/JesunAhmadUshno/rl-environments-and-verifiers/compare/v0.1...v0.5
[0.1]: https://github.com/JesunAhmadUshno/rl-environments-and-verifiers/releases/tag/v0.1
