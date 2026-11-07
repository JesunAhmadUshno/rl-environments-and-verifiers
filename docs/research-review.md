# Research review: rl-environments-and-verifiers

A review of this repo against a doctoral-level research rubric, written for the v1.0 code plus the
upgrades added with the live dashboard. Every number below is read from a committed results file
(`level-*/results_*.json`); file and key are named next to each one.

Scope as the repo states it: a teaching analogue of GRPO and RLVR. A tabular softmax policy on four
tiny deterministic tasks, reward read only from replay verifiers, no language model, no KL penalty,
no clipping, no reference policy. The review grades the work for what it claims, not for what a
large-scale GRPO study would need.

## Summary of grades

| Rubric dimension | Before this change | After this change | What moved it |
| --- | --- | --- | --- |
| Research question | B | B | Clear but implicit; stated below |
| Hypotheses | B+ | B+ | Pre-stated directions in DEEP-SPEC.md, all confirmed |
| Method | A- | A- | Fully specified, hand-computed oracles, deterministic |
| Baselines | C | B+ | Matched-budget REINFORCE and Q-learning added |
| Statistics and uncertainty | D | B | 10 training seeds, t-intervals, unbiased pass@k |
| Reproducibility | A | A | Byte-identical reruns, CI diff, browser port checked bit for bit |
| Threats to validity | B | B+ | Verifier fuzzing, detour and memorisation measured |
| Related work | D | B- | References and an honest novelty position added here |
| Limitations | A- | A- | Stated plainly in every README and on the dashboard |

Overall: a careful, honest teaching artefact. The main gaps were statistical (one training seed,
no baseline, no curves) and scholarly (no related work). The statistical ones are closed in this
change. What remains needs a GPU or an outside reviewer, and each item says which.

## 1. Research question

Implicit in SPEC.md and DEEP-SPEC.md. Stated explicitly: *if the only reward signal is a replay
verifier that recomputes every step of a logged episode, can a GRPO-style group-relative update
still train a policy to solve the task, and which reward definitions break it?*

The question is answerable on these tasks and the repo answers it. It is narrow by design.

## 2. Hypotheses

DEEP-SPEC.md, section "Expected direction (pre-stated)", fixes six directional predictions before
the code ran: success rises toward 1 on all four tasks, CliffGrid in return mode falls into the
cliff trap near return -11, and the bandit in success mode gets zero informative groups. All six
were confirmed (`results_deep.json`: `tasks[*].after.aggregate.success_rate` 0.998, 0.996, 1.0,
0.982; `ablations[0].after.aggregate.mean_return` -11.028; `ablations[1].train.informative_groups`
0). Predictions were directional only, with no effect sizes or thresholds, so they could not fail
by degree. Grade B+.

## 3. Method

Each environment, verifier, sampler and update rule is a few dozen lines of stdlib Python with a
hand-computed oracle written first (LEARN-SPEC.md, BUILD-SPEC.md, DEEP-SPEC.md). The update is the
standard softmax policy gradient with a group-relative advantage, (r - mean) / std over a group of
16, and zero-variance groups make no update. The method is fully specified and deterministic.
Grade A-. The minus is for uniform episodic credit, which DEEP-SPEC.md names as a failure mode.

## 4. Baselines

Before: the only comparisons were a uniform random policy, value-iteration optimum and one
Q-learning seed per grid. Nothing tested whether the group-relative advantage itself helps.

Fixed in this change (`level-3-deep/run_seeds.py`, `results_seeds.json`):

- REINFORCE with a mean baseline and no std normalisation, same seeds, same lr, same group size,
  same episode budget (`tasks.*.reinforce_mean_baseline`).
- Tabular Q-learning at the same episode budget on both grids (`tasks.*.q_learning`).

Result: the two advantage rules are close where success is common (GridWorld mean success 0.9972
vs 0.9912, CliffGrid 0.9964 vs 0.9766, bandit 1.0 vs 0.9994) and far apart where success is rare
(sequence 0.97 vs 0.0254). Dividing by a small group std scales up the one success in a group,
which matters when success starts at (1/4)^4. Q-learning's greedy policy reaches the goal in 10 of
10 seeds on both grids (`q_learning.greedy_goal_seeds`). Grade B+: no Q baseline exists for the
bandit and sequence tasks, where the repo has no tabular Q code to reuse.

## 5. Statistics and uncertainty

Before: every before/after delta came from one training run. pass@k used disjoint in-order blocks
of k and the README did not say how that differs from the usual estimator. No intervals.

Fixed in this change:

- 10 training seeds per task (seed i = recorded seed + 1000 i, so seed 0 is the recorded run),
  reported as mean, sample sd, min, max and a 95% Student t-interval (`tasks.*.grpo.success_rate`).
  The recorded single runs sit inside the seed spread; the widest spread is the sequence task, sd
  0.032069, min 0.88.
- The unbiased pass@k estimator 1 - C(n-c,k)/C(n,k) (Chen et al. 2021) computed next to the block
  version (`tasks.*.pass_at_k`). On these runs they agree to within 0.000004 because success is
  either very rare or nearly certain; the block version is kept because the recorded files use it.
- Per-iteration learning curves for the 4 runs and 2 ablations (`results_deep_curves.json`).
- A learning-rate by group-size grid at a fixed episode budget, 3 seeds per cell
  (`tasks.*.sensitivity`). The sequence task is the sensitive one: at lr 0.1 mean success falls
  from 0.53 (group 4) to 0.007 (group 32).

Evaluation uses the same five evaluation seeds (9101 to 9105) for every policy. That is
deliberate common random numbers: comparisons between conditions are paired on identical sampling
streams, which lowers the variance of the differences. The cost is that evaluation-sampling noise
is not averaged over in the absolute numbers; with 500 episodes per policy and success rates near
0 or 1, that noise is small next to the seed-to-seed spread reported above. Grade B.

## 6. Reproducibility

Strong before and stronger now. Every runner writes sorted JSON with no timing fields; two runs
are byte-identical and the README quotes the sha256 of each results file. CI now reruns all four
runners and fails on any diff (pinned to Python 3.12, because 3.12 changed float `sum()` to
compensated summation, which the runs depend on). The dashboard ports the code to JavaScript,
including CPython's Mersenne Twister seeding, and `site/src/rl.check.mjs` fails the site build
unless the port reproduces every recorded number, curve and policy table exactly. Grade A.

## 7. Threats to validity

Internal validity. The verifier was tested on 22 hand-picked scenarios. Fixed in this change:
`tests/test_verifier_fuzz.py` applies every single-field mutation (each action, each state, each
reward, the return, the goal and terminal flags) to 44 valid logs, 7,880 mutations in all, and
checks the verifier against an independent replay oracle. It accepts exactly the mutations that
are replay-consistent (an action that bumps the same wall, a goal flag under-claimed) and rejects
the rest.

The unexplained CliffGrid detour (greedy 8 steps, return 2, against an optimum of 6 steps,
return 4). Fixed by measurement (`tasks.cliffgrid-3x5.detour`): of 498 successful evaluation
episodes only 0.2% take 6 steps and 225 take 8. The success-bit reward pays every successful path
the same, so nothing in the objective prefers the short one. This is the credit-assignment limit
DEEP-SPEC.md predicted, now quantified.

Construct validity of "recall" on the sequence task. Fixed by measurement
(`tasks.sequence-memory-4.heldout_targets`): the trained policy's expected success is 0.983805 on
the trained target and 0.000064 averaged over the 255 other targets. It memorised one target. The
repo claims nothing more, and the dashboard now says so with the number.

External validity. Limited by design: tabular policy, four tiny deterministic tasks, no language
model, no KL term, no clipping, no reference policy. **Remaining; needs a GPU:** a GRPO run with a
KL penalty and ratio clipping on a small open language model (on the order of 0.5B to 1.5B
parameters) against verifier-scored tasks, which takes one GPU with at least 24 GB of memory for
tens of GPU-hours. ROADMAP item 1.

Grade B+.

## 8. Related work and novelty

Before: NOVELTY.md was a placeholder ("NO MEASUREMENT YET") and no prior work was cited.

Prior work this repo builds on or should be read against:

- GRPO, the group-relative advantage without a critic: Shao, Z., Wang, P., Zhu, Q., et al. (2024).
  *DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models.*
  arXiv:2402.03300.
- RLVR, reinforcement learning from verifiable rewards: Lambert, N., Morrison, J., Pyatkin, V.,
  et al. (2024). *Tulu 3: Pushing Frontiers in Open Language Model Post-Training.*
  arXiv:2411.15124.
- REINFORCE and baselines: Williams, R. J. (1992). Simple statistical gradient-following
  algorithms for connectionist reinforcement learning. *Machine Learning*, 8, 229-256.
- Q-learning: Watkins, C. J. C. H., and Dayan, P. (1992). Q-learning. *Machine Learning*, 8,
  279-292.
- Value iteration: Bellman, R. (1957). *Dynamic Programming.* Princeton University Press.
- Gridworld and cliff tasks: Sutton, R. S., and Barto, A. G. (2018). *Reinforcement Learning: An
  Introduction*, 2nd ed., MIT Press (the cliff-walking example in chapter 6 is the larger
  ancestor of CliffGrid).
- Unbiased pass@k: Chen, M., Tworek, J., Jun, H., et al. (2021). *Evaluating Large Language Models
  Trained on Code.* arXiv:2107.03374.
- Reward hacking as a formal object: Skalse, J., Howe, N. H. R., Krasheninnikov, D., and Krueger,
  D. (2022). *Defining and Characterizing Reward Hacking.* NeurIPS 2022. arXiv:2209.13085.
- Environment interfaces: Towers, M., et al. (2024). *Gymnasium: A Standard Interface for
  Reinforcement Learning Environments.* arXiv:2407.17032. Environment libraries with verifiable
  rewards for language-model training, for example the open-source `verifiers` library
  (https://github.com/willccbrown/verifiers).
- Seed variance and reporting in RL: Henderson, P., et al. (2018). *Deep Reinforcement Learning
  that Matters.* arXiv:1709.06560. Agarwal, R., et al. (2021). *Deep Reinforcement Learning at the
  Edge of the Statistical Precipice.* NeurIPS 2021. arXiv:2108.13264.

Novelty, stated honestly: small. None of the components is new. The value is a fully transparent,
dependency-free, byte-reproducible miniature of the GRPO plus verifier loop, with the reward-hacking
attempts and the two failure modes recorded, and a browser port that provably reproduces it. That
is a teaching and reproducibility contribution, not a methods contribution. Grade B-: the
references are listed, but no systematic comparison against an existing environment library was
run.

## 9. Limitations

Stated plainly in README.md, every level README, ROADMAP.md and on the dashboard: teaching
analogue, tiny tasks, replay checks consistency not task correctness, two named hacks that replay
cannot see (a bandit log that rewrites arm and payoff together, and hard-coding the public
sequence target), uninformative groups on rare-success tasks (CliffGrid 223 of 300,
`results_deep.json` `tasks[1].train.uninformative_groups`). Grade A-.

## Gaps: fixed or remaining

| Gap | Status | Where |
| --- | --- | --- |
| One training seed per task | Fixed | `run_seeds.py`, `results_seeds.json` |
| No learning curves | Fixed | `results_deep_curves.json`, dashboard trainer |
| No baseline at matched budget | Fixed | REINFORCE and Q-learning blocks in `results_seeds.json` |
| Block pass@k not explained | Fixed | both estimators in `results_seeds.json`, `rl_deep.pass_at_k_unbiased` |
| Verifier tested only on hand-picked logs | Fixed | `tests/test_verifier_fuzz.py`, in CI |
| No hyperparameter sensitivity | Fixed | `tasks.*.sensitivity` |
| CliffGrid detour unexplained | Fixed | `tasks.cliffgrid-3x5.detour` |
| Recall vs memorisation on the sequence task | Fixed by measurement | `tasks.sequence-memory-4.heldout_targets` |
| No related work, novelty unestablished | Fixed in this review | section 8 |
| No language-model GRPO (external validity) | Remaining | needs one GPU with at least 24 GB for tens of GPU-hours; ROADMAP item 1 |
| Generalising recall to unseen sequence targets | Out of scope, measured | a position-indexed table cannot generalise by construction (measured above); testing recall needs a parametric policy that shares structure across targets, a different model class from the tabular analogue this repo studies; ROADMAP item 7 |
| Self-assessed grades | Remaining | needs an independent human reviewer or an external scoring harness; ROADMAP item 2 |

## How to check this review

```
python3 tests/test_verifier_fuzz.py
python3 tests/test_deep_extras.py
python3 level-3-deep/run_seeds.py && git diff --exit-code -- level-3-deep
cd site && npm ci && npm run build
```
