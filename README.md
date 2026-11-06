# rl-environments-and-verifiers

RL environments and verifiers: sandboxed tasks with verifiable rewards, grader tests, reward-hacking post-mortems, wired into the GRPO work in finetune-lab.

Status: Learn DONE 2026-11-05 (early Sprint 4 pull). Build DONE 2026-11-05. Deep DONE 2026-11-05. v1.0 shipped.
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
| Build CliffGrid greedy (value iteration) | 6 steps, return 4, verified |
| Build CliffGrid Q-learning greedy (seed 11, 3,000 episodes) | 6 steps, return 4, reached goal |
| Build CliffGrid random (seed 20261106, 200 episodes) | mean return -15.755, goal rate 0.005, cliff rate 0.89 |
| Build bandit optimal (10 pulls, payoffs [2, 5, 3]) | return 50, verified |
| Build bandit random (seed 20261107, 200 episodes) | mean return 32.725, best-arm rate 0.3095 |
| Build sequence perfect (target [2, 0, 1, 2]) | return 12, accuracy 1.0, verified |
| Build sequence random (seed 20261108, 200 episodes) | mean return -3.125, mean accuracy 0.24375 |
| Build replay verifiers grader (4 environments) | 16 of 16 scenarios graded as expected |
| Deep GridWorld GRPO-style RLVR (success, 500 eval episodes) | 0.072 to 0.998, mean return -17.666 to 1.882 |
| Deep CliffGrid GRPO-style RLVR (success, 500 eval episodes) | 0.01 to 0.996, mean return -15.776 to 0.724 |
| Deep bandit GRPO-style RLVR (return, 500 eval episodes) | 0.0 to 1.0, mean return 32.914 to 50.0 |
| Deep sequence GRPO-style RLVR (success, 500 eval episodes) | 0.004 to 0.982, mean return -3.02 to 11.91 |

## Novelty

PROPOSED. See NOVELTY.md. The novelty text is a draft until the Jev claim_check gate passes on it.

## Learn (Level 1, DONE 2026-11-05)

Learn built a dependency-free deterministic 4 by 4 GridWorld in Python stdlib on the Muse VM CPU: the value-iteration greedy policy follows a hand-computed optimal path in 6 steps with rewards [-1, -1, -1, -1, -1, 9] and return 4, the replay verifier graded 6 of 6 grader scenarios as expected, a seeded random policy over 200 episodes scored mean return -17.07 with goal rate 0.085 and pit rate 0.295, tabular Q-learning (seed 7, 3,000 training episodes, alpha 0.1, epsilon 0.1) produced a greedy policy that also reaches the goal in 6 steps with return 4, with 10 hand-computed Learn tests passing plus the scaffold smoke test, and results_learn.json byte-identical across two runs at sha256 bd84055952618e7a9295fd6262022ec3754cf6a89968a99a0bb0cb2bf012df6d.

Full measured table, failure modes, and grade (8,700 of 10,000): level-1-learn/README.md. Code: level-1-learn/rl_learn.py and run_learn.py. Tests: tests/test_learn_rl.py.

## Build (Level 2, DONE 2026-11-05)

Build shipped 4 dependency-free deterministic environments in Python stdlib on the Muse VM CPU: GridWorld 4 by 4 kept from Learn with its value-iteration greedy policy at 6 steps and return 4 and a seeded random policy over 200 episodes at mean return -17.07 with goal rate 0.085 and pit rate 0.295, CliffGrid 3 by 5 with a value-iteration greedy policy at 6 steps and return 4, tabular Q-learning (seed 11, 3,000 training episodes, alpha 0.1, epsilon 0.1) whose greedy policy also reaches the goal in 6 steps with return 4, and a seeded random policy over 200 episodes at mean return -15.755 with goal rate 0.005 and cliff rate 0.89, a three-arm deterministic bandit with payoffs [2, 5, 3] where the optimal policy returns 50 over 10 pulls, an explore-then-exploit policy (10 pulls per arm) chooses arm 1 and evaluates at return 50, and a seeded random policy over 200 episodes scores mean return 32.725 with best-arm rate 0.3095, and a sequence-memory task with target [2, 0, 1, 2] where the perfect policy returns 12 with accuracy 1.0, an always-zero policy returns -3 with accuracy 0.25, and a seeded random policy over 200 episodes scores mean return -3.125 with mean accuracy 0.24375, with replay verifiers grading 16 of 16 grader scenarios as expected (4 per environment), 14 hand-computed Build tests passing plus the 10 Learn tests and the scaffold smoke test, and results_build.json byte-identical across two runs at sha256 f3b19e4adc79ea9ee35b3deaec446b5b95aea4dee976187da6b74231079efacc.

Full measured table, reward-hacking post-mortems, failure modes, and grade (8,500 of 10,000): level-2-build/README.md. Code: level-2-build/rl_build.py and run_build.py. Tests: tests/test_build_rl.py.

## Deep (Level 3, DONE 2026-11-05)

Deep shipped a GRPO-style RLVR teaching analogue in Python stdlib on the Muse VM CPU: a tabular softmax policy trained by group-relative advantage (groups of 16, advantage (reward minus group mean) divided by group std) with reward read only from the Build replay verifiers, success-bit reward on GridWorld, CliffGrid and the sequence task and verifier-validated return on the bandit, raising sampled success over 500 evaluation episodes (seeds 9101 to 9105) from 0.072 to 0.998 on GridWorld with mean return from -17.666 to 1.882, from 0.01 to 0.996 on CliffGrid with mean return from -15.776 to 0.724, from 0.0 to 1.0 on the bandit with mean return from 32.914 to 50.0, and from 0.004 to 0.982 on the sequence task with mean return from -3.02 to 11.91, with two measured ablations (CliffGrid return mode collapsed to success 0.0 and mean return -11.028 with a greedy episode that steps straight into the cliff, and bandit success mode had 0 of 200 informative groups and an unchanged policy), 12 hand-computed Deep tests passing plus the 14 Build tests, the 10 Learn tests and the scaffold smoke test, and results_deep.json byte-identical across two runs at sha256 40c404fcc91e3822fbb25332d9ae3a2e6c821b22cb88d00b9b88c6d7d2f9826a.

Full measured tables, ablations, failure modes, and grade (8,400 of 10,000): level-3-deep/README.md. Design and oracles: level-3-deep/DEEP-SPEC.md. Code: level-3-deep/rl_deep.py and run_deep.py. Tests: tests/test_deep_rl.py. The rest of the v2 Deep scope is the v1.1 backlog in ROADMAP.md.

## License

Code: Apache-2.0 (see LICENSE). Tutorials: CC BY 4.0. Ruled in D-V3-11, 2026-11-04.
