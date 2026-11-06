# Verifiers First: A GRPO-Style RLVR Teaching Analogue That Learns From Replay Checks Alone

By Jesun Ahmad Ushno
Date: 2026-11-05
Status: DRAFT, written fan-out for P26 rl-environments-and-verifiers v1.0. Not posted.

## The problem

Reinforcement learning from verifiable rewards (RLVR) is the idea
behind GRPO-style training of language models: sample a group of
attempts, score each attempt with a checker that can say right or
wrong, and move the policy toward the attempts that beat the group
average. The machinery is usually buried inside an LLM run, where
nothing can be checked by hand. This project rebuilds the same
loop at a size where every number can be recomputed: four tiny
deterministic tasks, a replay verifier as the only source of
reward, and a tabular policy small enough to print.

Repository: https://github.com/JesunAhmadUshno/rl-environments-and-verifiers

## Honest scope, stated first

This is a teaching analogue, tabular softmax, no LLM, no KL
penalty, no clipping, and no reference policy, on tiny
deterministic tasks. There is no language model, no token
sequence, and no critic. What carries over from GRPO is the
group-relative advantage: sample a group of attempts at the same
task, score each attempt only with a verifier, and update toward
the attempts that beat the group mean. What carries over from
RLVR is the reward rule: reward comes only from replay
verifiers, never from hand-shaped intermediate rewards. No
number in this post measures LLM training, and none should be
quoted as one.

## What was built

Learn: a dependency-free deterministic 4 by 4 GridWorld, a
replay verifier that grades trajectories by replaying them, and
tabular Q-learning. The value-iteration greedy policy reaches
the goal in 6 steps with return 4, the verifier graded 6 of 6
scenarios as expected, and the Q-learning greedy policy also
reaches the goal in 6 steps with return 4. Grade 8,700 of
10,000.

Build: 4 environments (GridWorld, CliffGrid 3 by 5, a 3-arm
deterministic bandit with payoffs [2, 5, 3], and a sequence
memory task with target [2, 0, 1, 2]), replay verifiers grading
16 of 16 scenarios as expected (4 per environment), and
reward-hacking post-mortems: return inflation, false goal
claims, cliff laundering, and payoff forgery, each caught by the
verifier with a named reason. Grade 8,500 of 10,000.

Deep: the GRPO-style RLVR teaching analogue described below,
with two measured ablations. Grade 8,400 of 10,000.

## The main result

On the Deep GRPO-style RLVR teaching analogue runs in this repo (tabular softmax, no LLM), sampled success over 500 evaluation episodes rose from 0.072 to 0.998 on GridWorld, from 0.01 to 0.996 on CliffGrid, from 0.0 to 1.0 on the bandit, and from 0.004 to 0.982 on the sequence task, with reward read only from the Build replay verifiers.

In detail. Each task trains one tabular softmax policy starting
at zero logits (uniform). Each iteration samples a group of 16
episodes, replay-verifies every trajectory, reads the reward
from the verified trajectory (success bit on GridWorld,
CliffGrid, and the sequence task; verifier-validated return on
the bandit), computes the group-relative advantage (reward minus
group mean) divided by group std, and applies the softmax
policy-gradient step averaged over the group. Evaluation is 500
sampled episodes per policy, eval seeds 9101 to 9105 at 100
episodes each.

Mean returns moved with success: GridWorld from -17.666 to
1.882, CliffGrid from -15.776 to 0.724, the bandit from 32.914
to 50.0, and the sequence task from -3.02 to 11.91. pass@3 and
pass@5 after training are 1.0 on all four tasks. The greedy
policies after training: GridWorld takes a 6-step optimal path
(return 4), the bandit pulls arm 1 ten times (return 50), the
sequence task reproduces [2, 0, 1, 2] exactly (return 12,
accuracy 1.0), and CliffGrid reaches the goal in 8 steps with
return 2 against the optimal 6 steps and return 4, a suboptimal
detour that is reported, not hidden.

## The two ablations are the real lesson

CliffGrid return mode: reward set to the verifier-validated
return instead of the success bit. Training collapsed to
success 0.0 and mean return -11.028, and the greedy episode
steps straight into the cliff in one step. A cliff step returns
-11, which beats the -20 timeout, so group advantage reinforces
ending the episode in the cliff. A correct verifier does not
imply a learnable reward.

Bandit success mode: reward set to the strict success bit (all
10 pulls on the best arm). It had 0 of 200 informative groups
and an unchanged policy, because all-best success under a
uniform policy has probability (1/3)^10 = 1/59049 per episode,
so no group ever has reward variance. A success definition can
be too strict to learn from at all.

Most groups are uninformative in the main runs too (zero reward
variance, exactly zero update): 145 of 200 on GridWorld, 223 of
300 on CliffGrid, 172 of 200 on the bandit, 110 of 200 on the
sequence task. At LLM scale this is the known GRPO waste
problem; here it is counted exactly, not hidden.

## Limits

- Teaching analogue only: tabular softmax, no LLM, no KL,
  clipping, or critic (the largest Deep deduction, minus 600).
- One training seed per task; training-seed variance is
  unmeasured and is v1.1 work.
- CliffGrid greedy path is suboptimal, and sampled grid mean
  returns sit below the optimal 4 under the stochastic policy.
- Scoring is an in-repo implementation; no external harness
  scored these runs.

## Run it

The tutorial in fanout/tutorial.md walks through every level
with verified commands. Releases v0.1, v0.5, and v1.0 are on
GitHub. Code: Apache-2.0. Tutorials: CC BY 4.0.
