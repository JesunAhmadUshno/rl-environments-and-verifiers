# rl-environments-and-verifiers

**Question.** If the only reward signal is a replay verifier that
recomputes every step of a logged episode, can a GRPO-style
group-relative update still train a policy to solve the task, and which
reward definitions break it?

**Headline.** Trained only on replay-verifier rewards, a tabular
GRPO-style policy reached a mean sampled success rate of 0.970 on the
hardest task, sequence memory (95% t-interval 0.947 to 0.993 over 10
training seeds; 0.004 untrained), against 0.025 (0.004 to 0.046) for a
REINFORCE baseline at the same budget; on the other three tasks both
rules reach at least 0.976. Teaching analogue: tabular softmax, no
language model, no KL penalty, no clipping.

**Field.** ML and AI research. **Job family.** Machine learning
engineering: post-training, RL from verifiable rewards, and evaluation.

**Verdict.** Functional, not pre-registered. Tests pass in CI on Python
3.11 and 3.12, one command regenerates every results file byte for byte
(checked in CI on Python 3.12), and the trainer has run end to end on all
four tasks with the results committed. No proposal was locked before the
results existed, so the verdict is capped at Functional until a
confirmatory cycle runs under a locked PROPOSAL.md.

Live dashboard: https://jesunahmadushno.github.io/rl-environments-and-verifiers/ (the replay verifier and the GRPO-style trainer run in the browser; the build checks them against the committed results files).

## Reproduce

```text
for t in tests/test_*.py; do python3 "$t" || exit 1; done
python3 level-1-learn/run_learn.py && python3 level-2-build/run_build.py && python3 level-3-deep/run_deep.py && python3 level-3-deep/run_seeds.py
git diff --exit-code -- level-1-learn level-2-build level-3-deep
```

Python 3 standard library only, CPU, about 15 seconds for all four
runners. Byte parity of the results files holds on Python 3.12 and later
(docs/decisions/0002). The dashboard rebuilds with
`cd site && npm ci && npm run build`.

## Lifecycle

- Question: DONE 2026-11-04
- Proposal: OPEN (not pre-registered: no plan was locked before the results)
- Baseline: DONE 2026-11-05
- Build: DONE 2026-11-05
- Evaluate: OPEN (exploratory seed sweep, baselines and ablations 2026-11-07; a confirmatory run needs a locked proposal)
- Report: DONE 2026-11-08
- Review: OPEN
- Release: OPEN (tags v0.1, v0.5 and v1.0 predate this standard)

## Layout

| Path | Role in the standard | What it holds |
| --- | --- | --- |
| PROPOSAL.md | Proposal (not locked) | Question, original scope, pre-stated directions, prior work, what a confirmatory cycle needs |
| REPORT.md | Report | Background, method, results with intervals, hypotheses scored, threats, related work, backlog |
| level-1-learn/ | Baseline (code and results) | GridWorld, replay verifier, Q-learning; LEARN-SPEC.md, run_learn.py, results_learn.json |
| level-2-build/ | Build (code and results) | Four environments, replay verifiers, reward-hacking post-mortems; BUILD-SPEC.md, run_build.py, results_build.json |
| level-3-deep/ | Evaluate (code and results) | GRPO-style trainer, seed sweep, baselines, ablations; DEEP-SPEC.md, run_deep.py, run_seeds.py, results_deep*.json, results_seeds.json |
| tests/ | Tests | Hand-computed oracle tests, verifier fuzz test, layout test, run in CI |
| docs/decisions/ | Decisions | Records of hard-to-reverse choices |
| site/ | Dashboard | Live dashboard; reads the results files and REPORT.md at build time |
| fanout/, PUBLICITY.md | Outreach drafts | Blog, tutorial, release notes and post drafts, and the channel log (nothing posted) |
| CHANGELOG.md, CITATION.cff, SECURITY.md, LICENSE | Project files | History, citation, security policy, licence |

There is no separate src/, experiments/ or results/ folder: the code lives
in the three stage folders, and every results file is the deterministic
output of its runner with no external raw data, so each runner and its
results file sit together (docs/decisions/0003).

## License

Code: Apache-2.0 (see LICENSE). Tutorials: CC BY 4.0. Ruled in D-V3-11, 2026-11-04.
