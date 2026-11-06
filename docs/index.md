# rl-environments-and-verifiers

RL environments and verifiers: sandboxed tasks with verifiable rewards, grader tests, and reward-hacking post-mortems. Plain scope, stated first: this is a teaching analogue, tabular softmax, no LLM, no KL penalty, no clipping, and no reference policy. Every level is dependency-free Python standard library, run on the Muse VM CPU. Reward comes only from replay verifiers, never from hand-shaped intermediate rewards.

- Learn: deterministic 4 by 4 GridWorld, replay verifier, and tabular Q-learning. Value-iteration greedy policy: 6 steps, return 4, verified. Replay verifier graded 6 of 6 scenarios as expected. Q-learning greedy (seed 7, 3,000 episodes): 6 steps, return 4. 10 tests. Grade 8,700 of 10,000.
- Build: 4 environments (GridWorld, CliffGrid, a 3-arm bandit, and a sequence-memory task), replay verifiers grading 16 of 16 scenarios as expected, and reward-hacking post-mortems. 14 tests. Grade 8,500 of 10,000.
- Deep: a GRPO-style RLVR teaching analogue: a tabular softmax policy trained by group-relative advantage (groups of 16) with reward read only from the Build replay verifiers. Over 500 evaluation episodes (seeds 9101 to 9105), sampled success rose from 0.072 to 0.998 on GridWorld, from 0.01 to 0.996 on CliffGrid, from 0.0 to 1.0 on the bandit, and from 0.004 to 0.982 on the sequence task. Two measured ablations are published with the run: CliffGrid return mode collapsed to success 0.0, and bandit success mode had 0 of 200 informative groups. 12 tests. Grade 8,400 of 10,000.

Tests: 36 hand-computed tests in total (10 Learn, 14 Build, 12 Deep), plus the scaffold smoke test.

Grades on record (of 10,000): Learn 8,700, Build 8,500, Deep 8,400.

Every number above is already published in this repo (README.md and the three level READMEs and results files) and reproduced by the runners in this repo, checked in CI. The v1.1 backlog in ROADMAP.md names training-seed variance, an external scoring harness, and the rest of the v2 Deep scope.

Releases: https://github.com/JesunAhmadUshno/rl-environments-and-verifiers/releases
