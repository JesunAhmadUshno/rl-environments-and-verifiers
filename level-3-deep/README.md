# Level 3, Deep: rl-environments-and-verifiers

A GRPO-style RLVR run against the four Build environments (SPEC.md
Deep scope), built dependency-free in Python stdlib. Design,
hand-computed oracles, and pre-stated expected directions, written
before the code: DEEP-SPEC.md.

## Summary

Deep shipped a GRPO-style RLVR teaching analogue in Python stdlib on the Muse VM CPU: a tabular softmax policy trained by group-relative advantage (groups of 16, advantage (reward minus group mean) divided by group std) with reward read only from the Build replay verifiers, success-bit reward on GridWorld, CliffGrid and the sequence task and verifier-validated return on the bandit, raising sampled success over 500 evaluation episodes (seeds 9101 to 9105) from 0.072 to 0.998 on GridWorld with mean return from -17.666 to 1.882, from 0.01 to 0.996 on CliffGrid with mean return from -15.776 to 0.724, from 0.0 to 1.0 on the bandit with mean return from 32.914 to 50.0, and from 0.004 to 0.982 on the sequence task with mean return from -3.02 to 11.91, with two measured ablations (CliffGrid return mode collapsed to success 0.0 and mean return -11.028 with a greedy episode that steps straight into the cliff, and bandit success mode had 0 of 200 informative groups and an unchanged policy), 12 hand-computed Deep tests passing plus the 14 Build tests, the 10 Learn tests and the scaffold smoke test, and results_deep.json byte-identical across two runs at sha256 40c404fcc91e3822fbb25332d9ae3a2e6c821b22cb88d00b9b88c6d7d2f9826a.

## Honest label

This is a teaching analogue of GRPO and RLVR, not an LLM GRPO run. The
policy is a tabular softmax over state-action logits. There is no
language model, no token sequence, no KL penalty, no clipping, and no
reference policy. What carries over from GRPO is the group-relative
advantage: sample a group of attempts at the same task, score each
attempt only with a verifier, and update toward the attempts that beat
the group mean. What carries over from RLVR is the reward rule: reward
comes only from the Build replay verifiers (level-2-build/rl_build.py,
imported unmodified), never from hand-shaped intermediate rewards.

## Method in one paragraph

Per task, one tabular softmax policy starts at zero logits (uniform).
Each training iteration samples a group of 16 episodes, replay-verifies
every trajectory, reads the reward from the verified trajectory
(success mode: 1 if verified and reached_goal, else 0; return mode:
the verifier-validated episode return), computes the group-relative
advantage (reward minus group mean) divided by group std (population;
a zero-variance group has all-zero advantages and makes no update),
and applies the softmax policy-gradient step averaged over the group:
theta += lr * sum(A * (onehot(action) - probs)) / 16. Scoring follows
the P06 pattern (the P27 harness does not exist as a usable separate
scorer at this date): 500 sampled episodes per policy, eval seeds 9101
to 9105 at 100 episodes each, pass@k by grouping the success list in
order into full blocks of k.

## Results: before and after (500 sampled episodes per policy)

| Task | Reward mode | Success before | Success after | pass@3 after | pass@5 after | Mean return before | Mean return after | Return variance after |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GridWorld 4 by 4 | success | 0.072 | 0.998 | 1.0 | 1.0 | -17.666 | 1.882 | 5.772076 |
| CliffGrid 3 by 5 | success | 0.01 | 0.996 | 1.0 | 1.0 | -15.776 | 0.724 | 3.423824 |
| Bandit, 3 arms | return | 0.0 | 1.0 | 1.0 | 1.0 | 32.914 | 50.0 | 0.0 |
| Sequence memory 4 | success | 0.004 | 0.982 | 1.0 | 1.0 | -3.02 | 11.91 | 0.4419 |

Notes on reading this table. Bandit success is the strict Build
definition: every one of the 10 pulls on the best arm. Before numbers
here are the zero-logit policy under this evaluation protocol; they
are close to, not identical to, the Build seeded-random numbers
(GridWorld goal rate 0.085, CliffGrid 0.005), because the sampler and
seeds differ while the distribution (uniform) is the same. pass@1
equals the success rate by construction.

## Training record

| Task | Iterations | Group | lr | Train seed | Episodes sampled | Informative groups | Uninformative groups |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GridWorld 4 by 4 | 200 | 16 | 0.5 | 2601 | 3,200 | 55 | 145 |
| CliffGrid 3 by 5 | 300 | 16 | 0.5 | 2602 | 4,800 | 77 | 223 |
| Bandit, 3 arms | 200 | 16 | 0.5 | 2603 | 3,200 | 28 | 172 |
| Sequence memory 4 | 200 | 16 | 0.5 | 2604 | 3,200 | 90 | 110 |

Most groups are uninformative (zero reward variance, exactly zero
update). Learning starts when one sampled episode in a group succeeds;
after that the success rate snowballs, which is why 28 informative
bandit groups and 55 informative GridWorld groups are enough here.
Per-seed after success rates sit between 0.97 and 1.0 on every task
(full per-seed table in results_deep.json).

## Greedy policy after training (single deterministic episode, verified)

| Task | Greedy actions | Return | Optimal return | Note |
| --- | --- | --- | --- | --- |
| GridWorld 4 by 4 | [2, 2, 1, 1, 2, 1] | 4 | 4 | a 6-step optimal path, different from the value-iteration path |
| CliffGrid 3 by 5 | [0, 1, 0, 1, 1, 1, 2, 2] | 2 | 4 | reaches the goal in 8 steps with a detour; sampled success is 0.996 but the greedy path is not the optimal path |
| Bandit, 3 arms | arm 1 ten times | 50 | 50 | exact |
| Sequence memory 4 | [2, 0, 1, 2] | 12 | 12 | exact, accuracy 1.0 |

## Ablations (same loop, one change each)

| Ablation | Change | Informative groups | Success before | Success after | Mean return after | Reading |
| --- | --- | --- | --- | --- | --- | --- |
| CliffGrid return mode | reward = verifier return, lr 0.1, seed 2612 | 132 of 300 | 0.01 | 0.0 | -11.028 | the cliff trap, predicted in DEEP-SPEC oracle 7: a cliff step returns -11, which beats the -20 timeout, so group advantage reinforces ending the episode in the cliff; the greedy episode after training is a single step right into the cliff (return -11, verified) and return variance collapses to 0.115216 |
| Bandit success mode | reward = success bit, lr 0.5, seed 2613 | 0 of 200 | 0.0 | 0.0 | 32.914 | the binary dead end, predicted in DEEP-SPEC oracle 6: all-best success under a uniform policy has probability (1/3)^10 = 1/59049 per episode, so no group ever has reward variance; the after numbers are identical to the before numbers because the policy never moved |

Both ablations are the reason the main run mixes reward modes: the
reward must come from the verifier, and it must also be a reward the
task can actually produce at the starting policy.

## Failure modes at this level

- Uninformative groups dominate early training. CliffGrid used 223
  of 300 groups with zero reward variance. At LLM scale this is the
  known GRPO waste problem; here it is counted exactly, not hidden.
- Group-relative advantage is only as good as its reward. The
  CliffGrid return-mode ablation shows a verifier-checked return
  still encoding a local optimum (end early in the cliff) that the
  group baseline then amplifies. A correct verifier does not imply a
  learnable reward.
- A success definition can be too strict to learn from at all
  (bandit success mode, 0 informative groups). RLVR reward design is
  a horizon and base-rate calculation before it is a training run.
- Uniform credit over steps: every step of a successful episode is
  reinforced equally, detours included, and every step of a failed
  episode in an informative group is pushed down, correct early steps
  included. The CliffGrid greedy detour (8 steps, return 2, against
  the optimal 6 steps, return 4) is this weakness made visible.
- The after policy is still a sampled policy. Sampled mean returns
  on the grids (1.882 and 0.724) sit below the optimal 4 because
  sampled episodes still wander; success rate and greedy return are
  reported separately so the gap stays visible.
- One training seed per task. These are this seed's runs.
  Evaluation variance over 5 eval seeds is reported in
  results_deep.json; training-seed variance is v1.1 work (ROADMAP.md).
- Teaching analogue limits: no KL penalty, no clipping, no critic,
  no token-level credit, four tiny deterministic fully observed
  tasks. Nothing in this level measures LLM training, and no number
  here should be quoted as one.

## Run it

    python level-3-deep/run_deep.py
    python tests/test_deep_rl.py

Code: level-3-deep/rl_deep.py and run_deep.py. Data:
level-3-deep/results_deep.json (byte-identical across two runs,
sha256 40c404fcc91e3822fbb25332d9ae3a2e6c821b22cb88d00b9b88c6d7d2f9826a).
Tests: tests/test_deep_rl.py, 12 hand-computed tests (advantage
oracles sqrt(3) and -1/sqrt(3), the by-hand single update to
[-0.25, 0.25, 0.0, 0.0], pass@k oracles, determinism, and a
short-training bandit check).

## Grade

8,400 of 10,000 (compressed Deep band). Deductions, itemized:
- Teaching analogue only: tabular softmax, no LLM, no KL, clipping,
  or critic (minus 600).
- One training seed per task; training-seed variance unmeasured
  (minus 350).
- Scoring is an in-repo P06-pattern implementation; no external P27
  harness exists to score against (minus 250).
- CliffGrid greedy path is suboptimal (8 steps, return 2, against
  optimal 6 steps, return 4) and sampled grid mean returns sit below
  optimal under the stochastic policy (minus 200).
- Uniform step credit assignment is named and measured, not fixed
  (minus 100).
- Uninformative-group waste is counted (up to 223 of 300 groups) but
  not mitigated in v1.0 (minus 100).
Total deductions 1,600. The rest of the v2 Deep scope is the v1.1
backlog in the repo-root ROADMAP.md.
