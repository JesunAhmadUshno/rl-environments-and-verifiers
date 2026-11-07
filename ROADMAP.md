# ROADMAP: rl-environments-and-verifiers (P26), v1.1 backlog

v1.0 shipped 2026-11-05: Learn, Build, and compressed Deep (see
level-3-deep/DEEP-SPEC.md for what compressed Deep means here). This
file is the named remainder of the v2 Deep scope plus the fixes the
v1.0 grades named. Nothing here is claimed as done.

## v1.1 backlog

1. Real LLM GRPO: fine-tune a small open model on verifier-scored
   tasks with a KL penalty and ratio clipping, on a free GPU route,
   and compare its before and after pass@k against this tabular
   analogue. This is the item that turns the teaching analogue into
   the real method.
2. P27 harness integration: when the agent-evals harness (P27)
   exists as a usable scorer, re-score the v1.0 policies through it
   and publish any differences against the in-repo P06-pattern
   scorer.
3. Training-seed variance: at least 5 training seeds per task, with
   success and mean return reported as a distribution, not one run.
   Done in this version: level-3-deep/run_seeds.py retrains every task
   over 10 training seeds and writes the distribution to
   level-3-deep/results_seeds.json.
4. Step-level credit: replace uniform episodic credit with a
   per-step advantage or a learned critic baseline, and re-measure
   the CliffGrid greedy detour (8 steps, return 2 in v1.0).
5. Uninformative-group mitigation: curriculum or success replay so
   rare-success tasks stop spending most groups at zero variance
   (CliffGrid spent 223 of 300 groups uninformative in v1.0).
6. Stochastic environments: add a slip probability variant of
   CliffGrid where the row-1 path beside the cliff is genuinely
   risky, and test whether the trained policy prices that risk.
7. Held-out sequence targets: train and evaluate the sequence task
   on targets never seen in training, to separate recall skill from
   memorisation of one public target (a limit named at Build).
8. Larger and combined tasks: bigger grids, combined
   navigate-then-recall tasks, and a task whose verifier checks a
   multi-step proof or program, closer to real RLVR workloads.
9. Entropy and temperature study: measure how an entropy bonus
   changes the uninformative-group rate and the cliff trap.
10. Reward-mode study, extended: per-step verifier rewards for the
    bandit and sequence tasks, scored against the episodic modes
    used in v1.0 and its two ablations.
