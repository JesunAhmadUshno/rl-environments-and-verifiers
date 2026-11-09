# Level 1, Learn: rl-environments-and-verifiers

One small sandboxed task with a verifiable reward and a grader test suite
(PROPOSAL.md Learn scope), built dependency-free in Python stdlib.
Design and hand-computed oracles, written before the code: LEARN-SPEC.md.

## Summary

Learn built a dependency-free deterministic 4 by 4 GridWorld in Python stdlib on the Muse VM CPU: the value-iteration greedy policy follows a hand-computed optimal path in 6 steps with rewards [-1, -1, -1, -1, -1, 9] and return 4, the replay verifier graded 6 of 6 grader scenarios as expected, a seeded random policy over 200 episodes scored mean return -17.07 with goal rate 0.085 and pit rate 0.295, tabular Q-learning (seed 7, 3,000 training episodes, alpha 0.1, epsilon 0.1) produced a greedy policy that also reaches the goal in 6 steps with return 4, with 10 hand-computed Learn tests passing plus the scaffold smoke test, and results_learn.json byte-identical across two runs at sha256 bd84055952618e7a9295fd6262022ec3754cf6a89968a99a0bb0cb2bf012df6d.

## The task

- 4 by 4 grid, start (0, 0), goal (3, 3) terminal, pit (3, 0) terminal,
  walls (1, 1) and (1, 2). Actions up, right, down, left, deterministic.
- Every step costs -1. Entering the goal adds +10 (net +9), entering the
  pit adds -5 (net -6). Gamma 1.0. Episode limit 20 steps.
- Moving into a wall or off the grid leaves the agent in place (reward -1).

## Measured results (run_learn.py, 2026-11-05, Muse VM CPU)

| Policy or check | Episodes | Steps | Return | Other measured values |
| --- | --- | --- | --- | --- |
| Greedy on optimal values | 1 | 6 | 4 | actions [1, 1, 1, 2, 2, 2], rewards [-1, -1, -1, -1, -1, 9], verified true |
| Pit trajectory (down x3) | 1 | 3 | -8 | rewards [-1, -1, -6], verified true |
| Random (seed 20261105) | 200 | mean 16.445 | mean -17.07 | goal rate 0.085, pit rate 0.295 |
| Q-learning greedy (seed 7, 3,000 train) | 1 eval | 6 | 4 | actions [2, 2, 1, 1, 1, 2], reached goal, verified true |
| Replay verifier grader | 6 scenarios | n/a | n/a | 6 of 6 graded as expected |
| Optimal value V(start) | n/a | n/a | 4 | full value table in results_learn.json |

Two different optimal paths exist (top row first, or left column first with
the pit avoided at (2, 0) by turning right). Value iteration and Q-learning
found one each; both are 6 steps and return 4. A path is optimal here, not
the optimal path.

## The verifier idea (the teaching point)

A reward number is a claim. The verifier in rl_learn.py grades a recorded
trajectory by replaying it: start check, per-step transition and reward
replay, terminal check, and a recomputed return compared to the claimed
return. Grader scenarios: valid greedy passes; tampered reward, teleport,
wrong claimed return, and false goal claim each fail with a named reason;
the pit trajectory passes as a valid (bad) episode. A log that reports a
high return with no replayable trajectory cannot pass. That gap between
claimed reward and verified reward is where reward hacking lives, and it
is the subject Build expands with post-mortems.

## Failure modes at this level

- Gamma 1.0 with a step cost makes timeout returns very negative (random
  mean -17.07); a discounted task would rank policies differently.
- The verifier checks consistency with the environment rules, not whether
  the rules themselves are the right task. A misspecified goal passes its
  own verifier. Rule design is a human decision, named here, not solved.
- Q-learning success is shown for one seed and one small task. No claim is
  made about larger tasks, other seeds, or function approximation.
- The environment is fully deterministic and fully observed. Stochastic
  transitions, partial observability, and continuous actions are Build and
  Deep scope, not hidden limitations of this level.

## Run it

    python level-1-learn/run_learn.py
    python tests/test_learn_rl.py
    python tests/test_smoke.py

## Next

Build: 3 to 5 environments with grader tests and a reward-hacking
post-mortem each, per PROPOSAL.md.
