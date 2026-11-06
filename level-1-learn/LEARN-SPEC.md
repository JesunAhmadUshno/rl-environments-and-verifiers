# LEARN-SPEC: P26 Level 1 Learn, 2026-11-05

Written before any code, per the house rule. All expected values below are
computed by hand from the rules in Section 1. The code must match them; a
mismatch is a code bug, not a spec change.

## 1. The task (one small sandboxed task, per SPEC.md Learn)

A deterministic 4 by 4 GridWorld. No randomness in the environment itself.

- States: (row, col), row and col in 0..3. Start (0, 0).
- Actions: 0 up, 1 right, 2 down, 3 left. Deterministic moves.
- Walls: (1, 1) and (1, 2). Moving into a wall or off the grid leaves the
  agent in place.
- Goal: (3, 3), terminal. Pit: (3, 0), terminal.
- Rewards: every step costs -1. Entering the goal adds +10 (net +9 on that
  step). Entering the pit adds -5 (net -6 on that step). Discount gamma 1.0
  (undiscounted episodic teaching task, stated plainly).
- Episode limit: 20 steps. Reaching the limit ends the episode, not terminal
  by goal or pit, with no extra reward.
- Sandbox: stdlib only, no file or network access in the environment, a
  reset always returns to (0, 0). This is the CPU teaching design: SPEC's
  Learn scope is a small verifiable task, so no GPU is used by design.

## 2. Hand-computed oracles

Shortest safe path: (0,0) to (0,1) to (0,2) to (0,3) to (1,3) to (2,3) to
(3,3): 6 steps, actions [right, right, right, down, down, down], rewards
[-1, -1, -1, -1, -1, +9], return 4.

Optimal values (value iteration must reproduce these exactly):
V(goal) = 0 (terminal), V(2,3) = 9, V(3,2) = 9, V(1,3) = 8, V(2,2) = 8,
V(3,1) = 8, V(0,3) = 7, V(2,1) = 7, V(0,2) = 6, V(2,0) = 6, V(0,1) = 5,
V(1,0) = 5, V(0,0) = 4, V(1,3) = 8, V(1,0) = 5, V(3,1) = 8.
Spot checks by hand: V(2,0): down enters the pit for -6, right to (2,1)
gives -1 + 7 = 6, so 6. V(1,0): up to (0,0) gives -1 + 4 = 3, down to
(2,0) gives -1 + 6 = 5, so 5.

Wall oracle: from (0,1), action down targets wall (1,1): the agent stays at
(0,1) and the reward is -1.

Pit oracle: from start, actions [down, down, down] visit (1,0), (2,0),
(3,0): rewards [-1, -1, -6], return -8, terminal by pit.

Edge oracle: from (0,0), action up or left leaves the agent at (0,0),
reward -1, not terminal.

## 3. The verifier (grader)

The verifier never trusts a claimed return. Given a recorded trajectory
(states, actions, rewards, claimed return) it:

1. Checks the first state is the start.
2. Replays every action through the environment rules and checks each next
   state and each reward matches the record.
3. Checks terminal state and step count agree with the record.
4. Recomputes the return as the sum of replayed rewards and checks it
   equals the claimed return.
5. Returns passed plus a list of named failure reasons (empty on pass).

Grader scenarios that must be graded as stated: a valid greedy trajectory
passes; a tampered reward fails; a teleport (a state jump no action can
make) fails; a claimed return that differs from the recomputed sum fails;
a trajectory that claims the goal while ending elsewhere fails.

Reward hacking note taught by this level: a policy (or a log) that reports
a high return without a replayable trajectory is rejected by step 4 and 5.
Reward is a claim; the trajectory is the receipt.

## 4. Policies compared

- Random policy: uniform over 4 actions, seeded random.Random, evaluated
  over a fixed number of episodes. Outcomes are measured, not predicted.
- Greedy optimal policy: at each state choose the action value iteration
  ranks first (ties broken by action order up, right, down, left). Must
  reproduce the Section 2 path, 6 steps, return 4.
- Tabular Q-learning: epsilon-greedy, alpha 0.1, gamma 1.0, epsilon 0.1,
  seeded, a fixed number of training episodes, then greedy evaluation.
  Success criterion (not a pre-claim): the greedy policy after training
  reaches the goal in the optimal 6 steps with return 4.

## 5. Deliverables and determinism

- rl_learn.py: environment, verifier, value iteration, policies, Q-learning.
- run_learn.py: writes results_learn.json (sorted keys, fixed seeds).
- results_learn.json must be byte-identical across two runs.
- tests/test_learn_rl.py: hand-computed tests from Sections 2 and 3.
- Level README: the exact Summary claim and the full measured table beside
  it, the failure modes, and what Build adds next.
