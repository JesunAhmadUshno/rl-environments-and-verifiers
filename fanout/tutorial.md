# Tutorial: P26 rl-environments-and-verifiers, course module

Module: P26-rl-environments-and-verifiers
By Jesun Ahmad Ushno
Date: 2026-11-05
License for this tutorial: CC BY 4.0. Code in the repo: Apache-2.0.

## What you will do

You will clone the rl-environments-and-verifiers repo, run all
three levels, run the test suite for each level, and read your
own results against the recorded v1.0 numbers. Every command
below was verified by running it in this fan-out cycle. The
project needs Python 3.11 or 3.12 and uses the standard library
only. No GPU, cluster, or credential is needed.

One scope fact governs every step: this is a teaching analogue,
tabular softmax, no LLM, no KL penalty, no clipping, and no
reference policy, on tiny deterministic tasks. Reward comes
only from the replay verifiers, never from hand-shaped
intermediate rewards.

## Step 0: Clone and enter the repo

```text
git clone https://github.com/JesunAhmadUshno/rl-environments-and-verifiers.git
cd rl-environments-and-verifiers
```

Optional smoke check, before the levels:

```text
python tests/test_smoke.py
```

Expected: scaffold smoke test: PASS, 8 files present.

## Step 1: Level 1, Learn, GridWorld, replay verifier, Q-learning

Read level-1-learn/README.md first.

```text
python level-1-learn/run_learn.py
python tests/test_learn_rl.py
```

Expected: greedy return 4, steps 6, verified True; grader 6 of
6; random mean return -17.07, goal rate 0.085; Q-learning
greedy return 4, steps 6, reached goal True; 10 Learn tests
passed. The runner writes level-1-learn/results_learn.json
deterministically (byte-identical across two runs).

## Step 2: Level 2, Build, 4 environments and replay verifiers

Read level-2-build/README.md and level-2-build/BUILD-SPEC.md.

```text
python level-2-build/run_build.py
python tests/test_build_rl.py
```

Expected: grader 4 of 4 on each of GridWorld, CliffGrid, the
bandit, and the sequence task, 16 of 16 in total; 14 Build
tests passed. The runner writes
level-2-build/results_build.json deterministically. Read the
reward-hacking post-mortems in the Build README: return
inflation and a false goal claim on GridWorld, cliff laundering
on CliffGrid, and payoff forgery on the bandit, each rejected
by the verifier with a named reason.

## Step 3: Level 3, Deep, GRPO-style RLVR teaching analogue

Read level-3-deep/README.md and level-3-deep/DEEP-SPEC.md.

```text
python level-3-deep/run_deep.py
python tests/test_deep_rl.py
```

Expected: GridWorld before success 0.072, after success 0.998;
CliffGrid before 0.01, after 0.996; bandit before 0.0, after
1.0; sequence before 0.004, after 0.982; CliffGrid return-mode
ablation after success 0.0; bandit success-mode ablation after
success 0.0; 12 Deep tests passed. The runner writes
level-3-deep/results_deep.json deterministically.

What to notice while it runs: each task trains a tabular
softmax policy with groups of 16 episodes and group-relative
advantage (reward minus group mean, divided by group std), and
the only reward source is the Build replay verifiers from
Step 2, imported unmodified. There is no LLM and no token
sequence anywhere in this step.

## Step 4: Lint (optional, matches CI)

```text
python -m pip install ruff
ruff check .
```

Expected: All checks passed. Ruff scope is in ruff.toml (E, F,
I, line-length 120).

## What to try next

- Change one reward mode in the Deep runner call and predict,
  before running, whether the ablation pattern repeats.
- Count informative groups for a shorter run and compare with
  the recorded counts (55 of 200 GridWorld, 77 of 300
  CliffGrid, 28 of 200 bandit, 90 of 200 sequence).
- Read ROADMAP.md for the v1.1 backlog: training-seed
  variance, an external scoring harness, and the rest of the
  v2 Deep scope.
