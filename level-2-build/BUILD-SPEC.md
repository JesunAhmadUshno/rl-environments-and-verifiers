# BUILD-SPEC: P26 Level 2 Build, 2026-11-05

Written before any Build code, per the house rule. All expected values
below are computed by hand from the rules in each section. The code must
match them; a mismatch is a code bug, not a spec change.

Scope, from SPEC.md Build: 3 to 5 environments with grader tests and a
reward-hacking post-mortem each. This Build ships 4 environments. All are
deterministic, sandboxed, stdlib only, with no file or network access in
the environment code. Randomness lives only in seeded policies.

Shared verifier contract (the Learn pattern, extended to every task):
a verifier never trusts a claimed return. Given a recorded trajectory
(states, actions, rewards, claimed return, success claim) it checks the
start state, replays every action and checks each next state and reward,
checks length, step limit, and terminal agreement, recomputes the return,
and returns passed plus named failure reasons.

## Environment 1: GridWorld 4 by 4 (Learn task, kept unchanged)

Rules are exactly the Learn rules (LEARN-SPEC Section 1): start (0, 0),
goal (3, 3) terminal with net +9 on entry, pit (3, 0) terminal with net
-6 on entry, walls (1, 1) and (1, 2), step cost -1, limit 20 steps.

Hand oracles (from LEARN-SPEC, re-stated as Build regression oracles):
optimal path actions [1, 1, 1, 2, 2, 2], rewards [-1, -1, -1, -1, -1, 9],
return 4, V(start) 4. Pit path actions [2, 2, 2], rewards [-1, -1, -6],
return -8.

Hack attempt for the post-mortem: return inflation. The agent submits
the optimal trajectory with claimed return 9 instead of 4, and a second
log that claims the goal on the pit trajectory. The verifier must reject
the first with return_mismatch and the second with goal_claim_false.

## Environment 2: CliffGrid 3 by 5

- States: (row, col), row in 0..2, col in 0..4. Start (2, 0).
- Actions: 0 up, 1 right, 2 down, 3 left. Deterministic. Moving off the
  grid leaves the agent in place. No walls.
- Goal: (2, 4), terminal. Cliff: (2, 1), (2, 2), (2, 3), all terminal.
- Rewards: every step costs -1. Entering the goal adds +10 (net +9).
  Entering a cliff cell adds -10 (net -11). Gamma 1.0. Limit 20 steps.

Hand oracles:
- Shortest safe path: (2,0) to (1,0) to (1,1) to (1,2) to (1,3) to
  (1,4) to (2,4): 6 steps, actions [0, 1, 1, 1, 1, 2], rewards
  [-1, -1, -1, -1, -1, 9], return 4.
- Optimal values: V(2,4) 0 and V(2,1..3) 0 (terminal), V(1,4) 9,
  V(1,3) 8, V(1,2) 7, V(1,1) 6, V(1,0) 5, V(2,0) 4, V(0,4) 8,
  V(0,3) 7, V(0,2) 6, V(0,1) 5, V(0,0) 4. Spot check V(2,0): right
  enters the cliff for -11, up to (1,0) gives -1 + 5 = 4, so 4.
  Spot check V(0,0): right to (0,1) gives -1 + 5 = 4, down to (1,0)
  gives -1 + 5 = 4, so 4.
- Cliff oracle: from start, action right enters (2, 1): reward -11,
  return -11, terminal by cliff.

Hack attempt for the post-mortem: cliff laundering. The agent steps
into the cliff, then edits the log so the cliff step looks like a safe
step on row 1 with reward -1. The verifier must reject it: replay from
(2, 0) with action right lands on (2, 1), so the logged next state is
an illegal_transition and the logged reward is a reward_mismatch.

## Environment 3: Three-arm deterministic bandit

- State: the pull index t, from 0 to 9. Horizon 10 pulls, then done.
- Actions: arm 0, 1, or 2. Payoffs are fixed: arm 0 pays 2, arm 1 pays
  5, arm 2 pays 3. No step cost. The reward is the payoff.
- A trajectory is the list of arms pulled and the rewards received.

Hand oracles:
- Optimal policy (always arm 1): rewards [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  return 50.
- Always arm 0: return 20. Always arm 2: return 30.
- Expected return of a uniform random policy: mean payoff per pull is
  (2 + 5 + 3) / 3 = 10/3, so the expected 10-pull return is 100/3
  (about 33.33). The measured seeded value is reported, not predicted.

Hack attempt for the post-mortem: payoff forgery. The agent pulls arm 0
but logs the reward of arm 1 (5 instead of 2) on every pull, claiming
return 50. The verifier replays each logged arm and must reject the log
with reward_mismatch. A second, honest failure is named in the README:
if the agent also rewrites the logged arm to 1, the forged log is
internally consistent and replay cannot detect it, and if the agent
runs many episodes and reports only the best one, each single-episode
verifier passes. Selection bias is an aggregate-level failure that a
per-episode replay verifier does not catch. The defence used in this
Build is procedural: fixed seeds and every episode counted in the
reported aggregate.

## Environment 4: Sequence memory, length 4

- State: the position index t, from 0 to 3. Target sequence: [2, 0, 1, 2].
- Actions: symbols 0, 1, 2, or 3. At each position the agent outputs
  one symbol. Correct output pays +3, wrong output pays -2. The episode
  ends after 4 outputs. No step cost beyond these rewards.

Hand oracles:
- Perfect policy (outputs the target): rewards [3, 3, 3, 3], return 12,
  accuracy 1.0.
- Always symbol 0: outputs [0, 0, 0, 0]. Position 0 target 2: wrong,
  -2. Position 1 target 0: correct, +3. Position 2 target 1: wrong, -2.
  Position 3 target 2: wrong, -2. Rewards [-2, 3, -2, -2], return -3,
  accuracy 0.25.

Hack attempt for the post-mortem: reward claiming without recall. The
agent outputs [0, 0, 0, 0] but logs reward +3 at every position,
claiming return 12. The verifier replays each output against the
target and must reject the log with reward_mismatch. A second, honest
failure is named in the README: the target is fixed and public in this
spec, so a policy that hardcodes the target passes the verifier and
scores 12 without any general memory ability. The verifier checks
consistency with this one target; it cannot separate memorization of
the public target from a general sequence skill. A held-out target
would be needed for that claim, and no such claim is made here.

## Policies compared, per environment

- Random policy: uniform over the action set, seeded random.Random,
  evaluated over 200 episodes. Outcomes are measured, not predicted.
- Optimal policy: value iteration for the two grids (ties broken by
  action order up, right, down, left), the best arm for the bandit, and
  the target policy for the sequence task. Each must reproduce its
  hand oracle above exactly.
- Trained policy where the method fits: tabular Q-learning on CliffGrid
  (seed 11, 3,000 episodes, alpha 0.1, epsilon 0.1, gamma 1.0), with
  the same success criterion style as Learn: the greedy policy after
  training must reach the goal in the optimal 6 steps with return 4.
  For the bandit, an explore-then-exploit policy (pull each arm 10
  times, then always pull the arm with the highest observed mean) must
  evaluate to return 50, because the payoffs are deterministic.

## Grader scenarios

Each environment gets 4 grader scenarios, 16 in total: a valid optimal
trajectory passes, a tampered reward fails, a wrong claimed return
fails, and one environment-specific hack from its post-mortem section
fails (GridWorld: false goal claim on the pit trajectory; CliffGrid:
cliff laundering; bandit: payoff forgery; sequence: reward claiming
without recall). Every scenario is recorded in results_build.json with
passed_as_expected.

## Deliverables and determinism

- rl_build.py: the 4 environments, their verifiers, value iteration,
  the policies, Q-learning, and the explore-then-exploit bandit policy.
- run_build.py: writes results_build.json (sorted keys, fixed seeds).
- results_build.json must be byte-identical across two runs.
- tests/test_build_rl.py: hand-computed tests from the oracles above.
- Level README: the exact Summary claim, the full measured table, one
  reward-hacking post-mortem per environment with the honest limit of
  each defence, failure modes, and the grade.
