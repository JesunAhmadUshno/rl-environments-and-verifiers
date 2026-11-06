# LinkedIn post draft: P26 rl-environments-and-verifiers v1.0

Status: DRAFT NOT POSTED
Date drafted: 2026-11-05
Author: Jesun Ahmad Ushno
Rule for this platform: the link goes in the first comment, not in the
post body. The first comment line is at the end of this file.

## Post body

GRPO and RLVR are usually hidden inside an LLM run where
nothing can be checked by hand. I rebuilt the loop at a size
where every number can be recomputed, and I am labelling the
limit up front: it is a teaching analogue, not an LLM run.

rl-environments-and-verifiers v1.0 is done: Learn, Build, and
Deep, all open, Python standard library only.

The scope, up front: tabular softmax, no LLM, no KL penalty,
no clipping, and no reference policy, on tiny deterministic
tasks. Reward comes only from replay verifiers.

Learn: one deterministic GridWorld, a replay verifier grading
6 of 6 scenarios, and Q-learning reaching the goal in 6 steps
with return 4.

Build: 4 environments, replay verifiers grading 16 of 16
scenarios, and reward-hacking post-mortems. Return inflation,
a false goal claim, cliff laundering, and payoff forgery were
each caught by the verifier with a named reason.

Deep: group-relative advantage over groups of 16, reward read
only from the Build verifiers. Over 500 evaluation episodes,
sampled success rose from 0.072 to 0.998 on GridWorld, 0.01 to
0.996 on CliffGrid, 0.0 to 1.0 on the bandit, and 0.004 to
0.982 on the sequence task.

The ablations taught more than the wins. CliffGrid with return
as the reward collapsed to success 0.0: a cliff step beats a
timeout, so the group baseline reinforced falling in. The
bandit with a strict success bit had 0 of 200 informative
groups and never moved. A correct verifier does not imply a
learnable reward.

Grades, house scale: Learn 8,700, Build 8,500, Deep 8,400 of
10,000. 36 hand-computed tests, plus the smoke test.

What reward definition last surprised you by being correct
and unlearnable at the same time?

## First comment (post this as the first comment, per the standing rule)

Repo, releases v0.1, v0.5, and v1.0, and the full tutorial: https://github.com/JesunAhmadUshno/rl-environments-and-verifiers
