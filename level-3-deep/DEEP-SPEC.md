# DEEP-SPEC: P26 Level 3, Deep

Written before the Deep code in this folder (rl_deep.py, run_deep.py).
Small prototype runs during design motivated the reward-mode choices and
the two ablations below. Prototype observations are design inputs, not
results. Every reported result comes from run_deep.py and
results_deep.json, reproduced byte-identically across two runs.

## Scope (SPEC.md Deep)

A GRPO or RLVR run against the environments, before and after numbers
scored by the P27 harness where it exists, else by P06 patterns. The P27
harness does not exist as a usable separate scorer at this date, so
scoring follows the P06 pattern: pass@k, mean, and variance over seeded
sampled episodes. Compressed Deep (December Compression Protocol): the
single hardest capability is the GRPO-style RLVR training loop itself.
The rest of the v2 Deep scope is the v1.1 backlog in the repo-root
ROADMAP.md.

## Honest label

This is a teaching analogue of GRPO and RLVR, not an LLM GRPO run. The
policy is a tabular softmax over state-action logits. There is no
language model, no token sequence, no KL penalty term, and no reference
policy. What carries over from GRPO is the group-relative advantage:
sample a group of attempts for the same task, score each attempt only
with a verifier, and update toward the attempts that beat the group
mean. What carries over from RLVR is the reward rule: reward comes only
from the Build replay verifiers (level-2-build/rl_build.py, reused by
import, unmodified), never from hand-shaped intermediate rewards.

## Design

Policy: for each state, logits theta[state][action], initialised to 0
(uniform policy). Actions are sampled from softmax(theta[state]) with a
seeded random.Random stream. One policy per task, trained separately.

Tasks (all four Build environments):
- gridworld-4x4: states are cells, 4 actions, max 20 steps.
- cliffgrid-3x5: states are cells, 4 actions, max 20 steps.
- bandit-3arm-deterministic: one state (the pull slot), 3 actions, an
  episode is 10 pulls.
- sequence-memory-4: states are positions 0 to 3, 4 symbol actions, an
  episode is 4 outputs.

Group update (one training iteration):
1. Sample G = 16 episodes for the task from the current policy.
2. Replay-verify every sampled trajectory with the Build verifier.
   An unverified trajectory scores reward 0 in every mode (by
   construction our own sampler cannot produce one; the check runs
   anyway and the runner asserts it).
3. Reward per task (verifier-derived only, see reward modes below).
4. Advantage per episode: A_i = (R_i - mean(R)) / std(R), population
   std over the group. If std is 0, every advantage is 0 and the group
   is uninformative: no update. Uninformative groups are counted.
5. Gradient: for each episode, for each step (state, action, probs),
   accumulate A_i * (onehot(action) - probs) into a per-state gradient.
6. Update: theta[state] += lr * gradient[state] / G.

Reward modes (both read only from the verifier-checked trajectory):
- success mode: reward 1 if the verifier accepts the trajectory and
  its reached_goal flag is true, else 0. Used for both grid tasks and
  the sequence task: the canonical RLVR binary reward.
- return mode: reward is the trajectory return exactly as validated
  by the verifier (the verifier recomputes every reward and the total
  from the logged actions, so a forged return cannot enter training).
  Used for the bandit: under a uniform policy the bandit success event
  (all 10 pulls on the best arm) has probability (1/3)^10 = 1/59049 per
  episode, so a binary episodic reward yields no informative group at
  this scale (oracle 6 below, and ablation B measures it).

Configuration (fixed here, before the run):
- G = 16 for every task.
- GridWorld: 200 iterations, lr 0.5, success mode, train seed 2601.
- CliffGrid: 300 iterations, lr 0.5, success mode, train seed 2602.
- Bandit: 200 iterations, lr 0.5, return mode, train seed 2603.
- Sequence: 200 iterations, lr 0.5, success mode, train seed 2604.

Ablations (same loop, one change each, reported separately):
- A, CliffGrid return mode: 300 iterations, lr 0.1, train seed 2612.
  Prediction (oracle 7): return-mode group training collapses to
  stepping into the cliff at once, because a cliff return of -11 beats
  the -20 timeout return, so the cliff action earns positive advantage
  in most groups long before any goal trajectory is sampled.
- B, Bandit success mode: 200 iterations, lr 0.5, train seed 2613.
  Prediction (oracle 6): zero informative groups, policy unchanged.

Evaluation (P06 pattern, fixed here):
- Before policy: zero logits (uniform). After policy: trained logits.
- Eval seeds 9101 to 9105, 100 sampled episodes per seed per task.
- Per task and per policy: pooled success list and return list in seed
  order. Reported: episodes, mean return, population variance of
  returns, success rate (pass@1), pass@3 (episodes grouped in order in
  blocks of 3, a trailing partial block is dropped), pass@5 (same,
  blocks of 5). Success is the verifier-checked reached_goal flag.
- Also reported: the greedy (argmax, ties to the lowest action index)
  episode of the trained policy, replay-verified.

## Hand-computed oracles (tests must reproduce these exactly)

1. Advantage, rewards [1, 0, 0, 0]: mean 0.25, population variance
   ((0.75)^2 + 3 * (0.25)^2) / 4 = 0.1875, std sqrt(0.1875).
   Advantages: 0.75 / sqrt(0.1875) = sqrt(3) = 1.732051 (6 dp) for the
   success, and -0.25 / sqrt(0.1875) = -1/sqrt(3) = -0.577350 (6 dp)
   for each failure.
2. Advantage, rewards [1, 1, 1, 1]: std 0, so all advantages are 0 and
   the group makes no update.
3. Softmax of [0, 0, 0, 0] is [0.25, 0.25, 0.25, 0.25].
4. One update by hand: one state, 4 actions, uniform probs, a group of
   2 single-step episodes: episode 1 takes action 1 with reward 1,
   episode 2 takes action 0 with reward 0. Mean 0.5, std 0.5,
   advantages +1 and -1. Summed gradient: action 0 gets
   (-0.25) + (-0.75) = -1.0, action 1 gets 0.75 + 0.25 = 1.0, actions
   2 and 3 get -0.25 + 0.25 = 0. With lr 0.5 and G 2, theta becomes
   [-0.25, 0.25, 0.0, 0.0].
5. pass@k: successes [1,0,0, 0,1,0, 0,0,0] give pass@1 = 2/9 =
   0.222222, pass@3 = 2/3 = 0.666667, pass@5 = 1/1 = 1.0 (only the
   first full block of 5 counts, and it contains a success).
6. Bandit binary dead end: uniform success probability per episode is
   (1/3)^10 = 1/59049, so 200 groups of 16 episodes expect about
   3200/59049 = 0.054 successful episodes in total. Essentially every
   group has std 0.
7. Cliff return trap: the cliff step returns -11 and ends the episode.
   A timeout returns -20. -11 is greater than -20, so under return
   mode the average cliff episode beats the average wandering episode,
   while the optimal goal path returns 4. Group-relative advantage
   therefore reinforces the cliff step early. Success mode gives the
   cliff step reward 0, the same as a timeout, so it cannot earn
   positive advantage from ending early.
8. Sequence start rate: uniform success per episode is (1/4)^4 =
   1/256. A group of 16 holds at least one success with probability
   1 - (255/256)^16, about 0.0607, so early sequence groups are
   mostly uninformative and learning, if it starts, must snowball as
   individual positions sharpen.

## Expected direction (pre-stated)

- GridWorld success mode: success rate and mean return rise from the
  uniform baseline (Build seeded random: goal rate 0.085, mean return
  -17.07 under the Build protocol) toward success near 1.0.
- CliffGrid success mode: same direction, slower start (uniform goal
  rate 0.005 in Build).
- Bandit return mode: mean return rises toward the optimal 50, and
  the all-best-arm episode rate rises with it.
- Sequence success mode: success rate rises from near 0 toward near
  1.0, mean return toward the perfect 12.
- Ablation A: CliffGrid success rate stays at or near 0 and mean
  return settles near -11 (the cliff trap, oracle 7).
- Ablation B: bandit policy unchanged, informative groups 0.

## Failure modes to write up in the level README

- Uninformative groups: when a group has zero reward variance the
  update is exactly zero. Rare-success tasks waste most early groups.
- Cliff trap under return mode (ablation A): group-relative advantage
  is only as good as the reward it relativises; a verifier return can
  still encode a local optimum that ends episodes early.
- Binary bandit dead end (ablation B): a success definition that is
  too strict for the horizon gives no signal at all.
- Credit assignment is uniform over steps: every step of a successful
  episode is reinforced equally, including detours, and every step of
  a failed episode in an informative group is pushed down, including
  correct early steps. This is the known weakness of episodic
  group-relative updates without a critic.
- The sampled after policy stays stochastic: success near 1.0 does
  not imply the greedy path is the optimal path, and the optimal
  return 4 (grids) is reached only if the greedy episode takes the
  6-step path. Both numbers are reported, not merged.
- One training seed per task: results are this seed's run, not a
  distribution over training runs. Evaluation variance over 5 eval
  seeds is reported; training-seed variance is v1.1 work.
- Teaching analogue limits: no KL or clipping, no critic, no token
  level credit, tiny discrete tasks. Nothing here measures LLM
  training.
