# Level 2, Build: rl-environments-and-verifiers

Four sandboxed environments with grader tests and a reward-hacking
post-mortem each (PROPOSAL.md Build scope), built dependency-free in Python
stdlib. Design and hand-computed oracles, written before the code:
BUILD-SPEC.md.

## Summary

Build shipped 4 dependency-free deterministic environments in Python stdlib on the Muse VM CPU: GridWorld 4 by 4 kept from Learn with its value-iteration greedy policy at 6 steps and return 4 and a seeded random policy over 200 episodes at mean return -17.07 with goal rate 0.085 and pit rate 0.295, CliffGrid 3 by 5 with a value-iteration greedy policy at 6 steps and return 4, tabular Q-learning (seed 11, 3,000 training episodes, alpha 0.1, epsilon 0.1) whose greedy policy also reaches the goal in 6 steps with return 4, and a seeded random policy over 200 episodes at mean return -15.755 with goal rate 0.005 and cliff rate 0.89, a three-arm deterministic bandit with payoffs [2, 5, 3] where the optimal policy returns 50 over 10 pulls, an explore-then-exploit policy (10 pulls per arm) chooses arm 1 and evaluates at return 50, and a seeded random policy over 200 episodes scores mean return 32.725 with best-arm rate 0.3095, and a sequence-memory task with target [2, 0, 1, 2] where the perfect policy returns 12 with accuracy 1.0, an always-zero policy returns -3 with accuracy 0.25, and a seeded random policy over 200 episodes scores mean return -3.125 with mean accuracy 0.24375, with replay verifiers grading 16 of 16 grader scenarios as expected (4 per environment), 14 hand-computed Build tests passing plus the 10 Learn tests and the scaffold smoke test, and results_build.json byte-identical across two runs at sha256 f3b19e4adc79ea9ee35b3deaec446b5b95aea4dee976187da6b74231079efacc.

## The environments

| Environment | Task | Optimal policy | Random policy (seeded, 200 episodes) | Trained policy |
| --- | --- | --- | --- | --- |
| GridWorld 4 by 4 | start (0, 0), goal (3, 3) net +9, pit (3, 0) net -6, walls (1, 1) and (1, 2), step -1 | 6 steps, return 4, verified | mean return -17.07, mean steps 16.445, goal rate 0.085, pit rate 0.295 | Learn Q-learning stands (level-1-learn) |
| CliffGrid 3 by 5 | start (2, 0), goal (2, 4) net +9, cliff (2, 1) to (2, 3) net -11, step -1 | 6 steps, return 4, verified | mean return -15.755, mean steps 6.905, goal rate 0.005, cliff rate 0.89 | Q-learning (seed 11, 3,000 episodes): greedy 6 steps, return 4, verified |
| Bandit, 3 arms | 10 pulls, payoffs arm 0 = 2, arm 1 = 5, arm 2 = 3 | always arm 1, return 50, verified | mean return 32.725, best-arm rate 0.3095 | explore-then-exploit (10 per arm): means [2.0, 5.0, 3.0], chooses arm 1, eval return 50 |
| Sequence memory 4 | target [2, 0, 1, 2], correct +3, wrong -2 | target policy, return 12, accuracy 1.0, verified | mean return -3.125, mean accuracy 0.24375 | not applicable: the target policy is the oracle |

Grader totals: 16 of 16 scenarios graded as expected, 4 per environment
(a valid optimal trajectory, a tampered reward, a wrong claimed return,
and the environment-specific hack below).

## Reward-hacking post-mortems

### GridWorld: return inflation and a false goal claim

Hack attempted: the optimal log is resubmitted with claimed return 9
instead of 4, and the pit trajectory (return -8) is resubmitted with
reached_goal set to true. Outcome: the verifier rejects the first with
return_mismatch and the second with goal_claim_false. Where the defence
fails or stops: the verifier checks a log against the environment rules.
It cannot judge whether the goal cell itself is the right goal. A
misspecified task passes its own verifier, exactly as named at Learn.

### CliffGrid: cliff laundering

Hack attempted: the agent steps right from the start into the cliff
(reward -11, terminal), then edits the log so that step looks like a
safe step to (1, 0) with reward -1 and no termination. Outcome: replay
from (2, 0) with action right lands on (2, 1), so the verifier rejects
the log with illegal_transition and reward_mismatch. Where the defence
fails or stops: the environment is deterministic, so the risky row-1
path beside the cliff costs nothing extra here. With a stochastic slip
probability the same path would be genuinely risky and a longer safe
detour could be optimal; the verifier grades consistency, not risk,
and this Build makes no risk-sensitivity claim.

### Bandit: payoff forgery, and the selection limit

Hack attempted: the agent pulls arm 0 ten times but logs reward 5 (the
arm 1 payoff) on every pull, claiming return 50 and the best-arm flag.
Outcome: the verifier replays each logged arm and rejects the log with
reward_mismatch on every forged pull. Where the defence honestly
fails: if the agent also rewrites the logged arm from 0 to 1, the
forged log is internally consistent and replay alone cannot catch it,
because replay verifies the log, not the physical pull. A second
failure sits one level up: an agent that runs many episodes and reports
only the best one passes every single-episode verification. Selection
bias is invisible to a per-episode verifier. The defence in this Build
is procedural, not cryptographic: fixed seeds, and every episode
counted in the reported aggregate (200 episodes, no selection).

### Sequence memory: reward claiming without recall, and memorization

Hack attempted: the agent outputs [0, 0, 0, 0] (true rewards
[-2, 3, -2, -2], return -3) but logs +3 at every position, claiming
return 12. Outcome: the verifier replays each output against the
target and rejects the log with reward_mismatch. Where the defence
honestly fails: the target is fixed and public in BUILD-SPEC.md, so a
policy that hardcodes [2, 0, 1, 2] passes the verifier and scores 12
with no general memory ability at all. The verifier proves consistency
with this one target; it cannot separate memorization of a public
target from a general sequence skill. A held-out target would be
needed for that claim, and no such claim is made here.

## Failure modes at this level

- All 4 environments are deterministic and fully observed. Stochastic
  transitions, partial observability, and continuous actions remain
  Deep scope; the CliffGrid post-mortem names one place this matters.
- Every verifier is a per-episode replay check. Aggregate-level gaming
  (episode selection, seed shopping) is outside what replay can see;
  the bandit post-mortem names it and the runner defends only by fixed
  seeds and full counting.
- Q-learning is shown on one new task (CliffGrid), one seed, and one
  configuration, with the Learn GridWorld result as the second data
  point. No claim is made about other seeds or larger tasks.
- The bandit payoffs are deterministic, so explore-then-exploit finds
  the best arm with certainty. A stochastic bandit would need regret
  analysis, which this level does not do.

## Run it

    python level-2-build/run_build.py
    python tests/test_build_rl.py
    python tests/test_learn_rl.py
    python tests/test_smoke.py

## Next

Deep: a GRPO or RLVR run against these environments, before and after
numbers scored by the P27 harness where it exists, else by P06
patterns, per PROPOSAL.md.
