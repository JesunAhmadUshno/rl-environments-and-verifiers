# rl-environments-and-verifiers

RL environments and verifiers: sandboxed tasks with verifiable rewards, grader tests, reward-hacking post-mortems, wired into the GRPO work in finetune-lab.

Status: Learn DONE 2026-11-05 (early Sprint 4 pull). Build and Deep not started.
Project: P26. Fleet node: BlackBox (GPU). Wave: Wave 6 (after P10).

## Start here

1. Read SPEC.md for scope and acceptance criteria.
2. Read DOSSIER.md for the past, present, and future of this problem (v1).
3. Read NOVELTY.md for the proposed novelty (DRAFT, pending the Jev claim_check gate).
4. Start at level-1-learn/README.md, then level-2-build, then level-3-deep.

## Level map

- Level 1, Learn: the core idea, built small and clean, with a teaching path.
- Level 2, Build: a real working system other people can run.
- Level 3, Deep: benchmarks, optimization, evaluation, hard cases.

## Benchmarks

| Test | Result |
| --- | --- |
| Learn GridWorld greedy (value iteration) | 6 steps, return 4, verified |
| Learn random policy (seed 20261105, 200 episodes) | mean return -17.07, goal rate 0.085, pit rate 0.295 |
| Learn Q-learning greedy (seed 7, 3,000 episodes) | 6 steps, return 4, reached goal |
| Learn replay verifier grader | 6 of 6 scenarios graded as expected |

## Novelty

PROPOSED. See NOVELTY.md. The novelty text is a draft until the Jev claim_check gate passes on it.

## Learn (Level 1, DONE 2026-11-05)

Learn built a dependency-free deterministic 4 by 4 GridWorld in Python stdlib on the Muse VM CPU: the value-iteration greedy policy follows a hand-computed optimal path in 6 steps with rewards [-1, -1, -1, -1, -1, 9] and return 4, the replay verifier graded 6 of 6 grader scenarios as expected, a seeded random policy over 200 episodes scored mean return -17.07 with goal rate 0.085 and pit rate 0.295, tabular Q-learning (seed 7, 3,000 training episodes, alpha 0.1, epsilon 0.1) produced a greedy policy that also reaches the goal in 6 steps with return 4, with 10 hand-computed Learn tests passing plus the scaffold smoke test, and results_learn.json byte-identical across two runs at sha256 bd84055952618e7a9295fd6262022ec3754cf6a89968a99a0bb0cb2bf012df6d.

Full measured table, failure modes, and grade (8,700 of 10,000): level-1-learn/README.md. Code: level-1-learn/rl_learn.py and run_learn.py. Tests: tests/test_learn_rl.py.

## License

Code: Apache-2.0 (see LICENSE). Tutorials: CC BY 4.0. Ruled in D-V3-11, 2026-11-04.
