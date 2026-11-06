# Paper candidate brief: a GRPO-style RLVR teaching analogue note on verifier-only reward in tiny deterministic tasks

Project: P26 rl-environments-and-verifiers
Status: CANDIDATE, brief dated 2026-11-05
Submission note: submission is Jesun's tap. Nothing is submitted by
this brief, and no venue has been contacted.

## Working title

Verifier-only reward, counted exactly: a GRPO-style RLVR
teaching analogue on four tiny deterministic tasks, with two
reward-mode ablations

## Candidate claim, in one line

On four tiny deterministic tasks, a tabular softmax policy
trained with group-relative advantage (groups of 16) and reward
read only from replay verifiers raises sampled success over 500
evaluation episodes from 0.072 to 0.998 (GridWorld), 0.01 to
0.996 (CliffGrid), 0.0 to 1.0 (bandit), and 0.004 to 0.982
(sequence), while two one-change ablations show that a correct
verifier does not imply a learnable reward; the claim is this
measured teaching analogue result, not any LLM training
result, because the policy is tabular softmax with no LLM.

## Scope, stated first

This is a teaching analogue, tabular softmax, no LLM, no KL
penalty, no clipping, and no reference policy, on tiny
deterministic, fully observed tasks. There is no language
model, no token sequence, no critic, and no token-level
credit. Reward comes only from the Build replay verifiers
(level-2-build/rl_build.py, imported unmodified), never from
hand-shaped intermediate rewards. One training seed per task;
evaluation uses 5 seeds (9101 to 9105) at 100 episodes each.
Nothing in this brief measures LLM training.

## Abstract draft

Based only on the measured v1.0 results recorded in the repo.
Scope limits are stated inside the abstract, not after it.

Group-relative policy methods such as GRPO, paired with
reinforcement learning from verifiable rewards (RLVR), are
normally observed only inside large language model runs. This
candidate reports a three level open study that rebuilds the
loop at hand-checkable scale in dependency-free Python. Learn
builds a deterministic GridWorld, a replay verifier grading 6
of 6 scenarios, and tabular Q-learning (greedy return 4 in 6
steps). Build extends the setting to 4 environments with
replay verifiers grading 16 of 16 scenarios and documents
reward-hacking attempts (return inflation, false goal claims,
cliff laundering, payoff forgery), each rejected with a named
reason. Deep trains a tabular softmax policy by
group-relative advantage (groups of 16, advantage (reward
minus group mean) divided by group std) with reward read only
from the Build verifiers: success bit on GridWorld, CliffGrid,
and a sequence task, verifier-validated return on a 3-arm
bandit. Over 500 sampled evaluation episodes per task, success
rose from 0.072 to 0.998, 0.01 to 0.996, 0.0 to 1.0, and 0.004
to 0.982 respectively, with pass@3 and pass@5 at 1.0 after
training on all four tasks. Two ablations carry the note's
argument: CliffGrid return mode collapsed to success 0.0 and
mean return -11.028 (the cliff step, return -11, beats the -20
timeout and is reinforced), and bandit success mode produced
0 of 200 informative groups (all-best success has probability
1/59049 per episode under a uniform policy), leaving the
policy unchanged. Uninformative groups are counted exactly in
the main runs as well (up to 223 of 300 on CliffGrid). The
candidate claims the counted teaching analogue and its
ablations, not LLM behaviour.

## Method summary

- Environments: GridWorld 4 by 4, CliffGrid 3 by 5, 3-arm
  deterministic bandit (payoffs [2, 5, 3], horizon 10), and a
  sequence memory task (target [2, 0, 1, 2]).
- Verifier: replay verification of full trajectories against
  the environment dynamics; tampered rewards, returns, states,
  and goal claims are rejected with named reasons.
- Policy: tabular softmax over state-action logits, zero
  initialised (uniform).
- Update: per iteration, sample a group of 16 episodes,
  replay-verify each, read reward from the verified
  trajectory, compute group-relative advantage with population
  std (a zero-variance group makes no update), and apply the
  softmax policy-gradient step averaged over the group.
  Learning rates and seeds per task are recorded in
  level-3-deep/results_deep.json.
- Evaluation: 500 sampled episodes per policy (5 seeds, 100
  each), pass@k by grouping the success list in order into
  full blocks of k, plus a single verified greedy episode per
  task.

## Results summary (from level-3-deep/results_deep.json)

| Task | Reward mode | Success before | Success after | Mean return before | Mean return after |
| --- | --- | --- | --- | --- | --- |
| GridWorld 4 by 4 | success | 0.072 | 0.998 | -17.666 | 1.882 |
| CliffGrid 3 by 5 | success | 0.01 | 0.996 | -15.776 | 0.724 |
| Bandit, 3 arms | return | 0.0 | 1.0 | 32.914 | 50.0 |
| Sequence memory 4 | success | 0.004 | 0.982 | -3.02 | 11.91 |

Ablations: CliffGrid return mode, success 0.01 to 0.0, mean
return after -11.028, greedy episode one step into the cliff;
bandit success mode, 0 of 200 informative groups, after numbers
identical to before because the policy never moved.

## Limits, for the reviewer

- Teaching analogue only: tabular softmax, no LLM, no KL,
  clipping, or critic; four tiny deterministic tasks.
- One training seed per task; training-seed variance is
  unmeasured (v1.1 work in ROADMAP.md).
- CliffGrid greedy path after training is suboptimal (8
  steps, return 2, against optimal 6 steps, return 4), and
  sampled grid mean returns sit below optimal.
- Scoring is an in-repo implementation following the P06
  pattern; no external harness scored these runs.
- Uniform step credit: every step of a successful episode is
  reinforced equally, detours included; this is named and
  visible in the CliffGrid detour, not fixed in v1.0.

## What a submission would need (Jesun's tap only)

- A named venue and its format; none is named or contacted
  by this brief.
- Training-seed variance runs, or an explicit scope statement
  keeping the single-seed limit in the paper itself.
- Jesun's explicit tap on the submission itself.
