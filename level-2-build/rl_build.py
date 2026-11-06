"""P26 Build: 4 deterministic environments, replay verifiers, policies.

Stdlib only. No environment has randomness or I/O. Randomness lives only
in seeded policies, so run_build.py is reproducible.
Rules and hand-computed oracles: BUILD-SPEC.md in this folder.
GridWorld reuses the Learn rules exactly (level-1-learn/rl_learn.py).
"""
import random

# ---------------------------------------------------------------- grids
ACTIONS = {0: (-1, 0), 1: (0, 1), 2: (1, 0), 3: (0, -1)}  # up right down left


class GridSpec:
    def __init__(self, name, rows, cols, start, goal, bad, walls,
                 bad_bonus, max_steps=20):
        self.name = name
        self.rows, self.cols = rows, cols
        self.start, self.goal, self.bad = start, goal, frozenset(bad)
        self.walls = frozenset(walls)
        self.bad_bonus = bad_bonus
        self.max_steps = max_steps


GW = GridSpec("gridworld-4x4", 4, 4, (0, 0), (3, 3), {(3, 0)},
              {(1, 1), (1, 2)}, -5)
CLIFF = GridSpec("cliffgrid-3x5", 3, 5, (2, 0), (2, 4),
                 {(2, 1), (2, 2), (2, 3)}, set(), -10)


def grid_is_terminal(spec, state):
    return state == spec.goal or state in spec.bad


def grid_step(spec, state, action):
    dr, dc = ACTIONS[action]
    nxt = (state[0] + dr, state[1] + dc)
    if not (0 <= nxt[0] < spec.rows and 0 <= nxt[1] < spec.cols) \
            or nxt in spec.walls:
        nxt = state
    reward = -1
    if nxt == spec.goal:
        reward += 10
    elif nxt in spec.bad:
        reward += spec.bad_bonus
    return nxt, reward, grid_is_terminal(spec, nxt)


def grid_run_episode(spec, policy, max_steps=None):
    limit = spec.max_steps if max_steps is None else max_steps
    state, states, actions, rewards, done = spec.start, [spec.start], [], [], False
    for i in range(limit):
        action = policy(state, i)
        state, reward, done = grid_step(spec, state, action)
        actions.append(action)
        rewards.append(reward)
        states.append(state)
        if done:
            break
    return {
        "states": [list(s) for s in states], "actions": actions,
        "rewards": rewards, "return": sum(rewards), "steps": len(actions),
        "reached_goal": states[-1] == spec.goal,
        "ended_in_bad": states[-1] in spec.bad, "terminal": done,
    }


def grid_verify(spec, traj):
    reasons = []
    states = [tuple(s) for s in traj["states"]]
    actions, rewards = list(traj["actions"]), list(traj["rewards"])
    if not states or states[0] != spec.start:
        return False, ["bad_start"]
    if len(states) != len(actions) + 1 or len(rewards) != len(actions):
        return False, ["length_mismatch"]
    if len(actions) > spec.max_steps:
        reasons.append("too_many_steps")
    total = 0
    for i, action in enumerate(actions):
        nxt, reward, done = grid_step(spec, states[i], action)
        if nxt != states[i + 1]:
            reasons.append("illegal_transition")
        if reward != rewards[i]:
            reasons.append("reward_mismatch")
        total += reward
        if done and i != len(actions) - 1:
            reasons.append("steps_after_terminal")
    last = states[-1]
    if traj.get("reached_goal") and last != spec.goal:
        reasons.append("goal_claim_false")
    if grid_is_terminal(spec, last) != bool(traj.get("terminal")):
        reasons.append("terminal_mismatch")
    if total != traj.get("return"):
        reasons.append("return_mismatch")
    return (not reasons), reasons


def grid_value_iteration(spec, tol=1e-12):
    states = [(r, c) for r in range(spec.rows) for c in range(spec.cols)
              if (r, c) not in spec.walls]
    V = {s: 0 for s in states}
    while True:
        delta, new = 0.0, dict(V)
        for s in states:
            if grid_is_terminal(spec, s):
                new[s] = 0
                continue
            new[s] = max(grid_step(spec, s, a)[1] + V[grid_step(spec, s, a)[0]]
                         for a in ACTIONS)
            delta = max(delta, abs(new[s] - V[s]))
        V = new
        if delta < tol:
            return V


def grid_greedy_policy(spec, V):
    def act(state, i):
        best_a, best_v = None, None
        for a in sorted(ACTIONS):
            nxt, reward, _ = grid_step(spec, state, a)
            val = reward + V[nxt]
            if best_v is None or val > best_v:
                best_a, best_v = a, val
        return best_a
    return act


def grid_evaluate_random(spec, seed, episodes):
    rng = random.Random(seed)
    rets, steps, goals, bads = [], [], 0, 0
    for _ in range(episodes):
        t = grid_run_episode(spec, lambda s, i: rng.randrange(4))
        rets.append(t["return"])
        steps.append(t["steps"])
        goals += 1 if t["reached_goal"] else 0
        bads += 1 if t["ended_in_bad"] else 0
    return {"episodes": episodes,
            "mean_return": round(sum(rets) / episodes, 6),
            "mean_steps": round(sum(steps) / episodes, 6),
            "goal_rate": round(goals / episodes, 6),
            "bad_rate": round(bads / episodes, 6)}


def grid_train_q(spec, seed, episodes, alpha=0.1, epsilon=0.1):
    rng = random.Random(seed)
    Q = {}

    def q(state, action):
        return Q.get((state, action), 0.0)

    for _ in range(episodes):
        state = spec.start
        for _i in range(spec.max_steps):
            if rng.random() < epsilon:
                action = rng.randrange(4)
            else:
                action = max(sorted(ACTIONS), key=lambda a: q(state, a))
            nxt, reward, done = grid_step(spec, state, action)
            target = reward if done else reward + max(q(nxt, a) for a in ACTIONS)
            Q[(state, action)] = q(state, action) + alpha * (target - q(state, action))
            state = nxt
            if done:
                break
    return {f"{s[0]},{s[1]}|{a}": round(v, 6) for (s, a), v in sorted(Q.items())}


def grid_q_greedy(spec, Q):
    def act(state, i):
        return max(sorted(ACTIONS),
                   key=lambda a: Q.get(f"{state[0]},{state[1]}|{a}", 0.0))
    return grid_run_episode(spec, act)


# ---------------------------------------------------------------- bandit
PAYOFFS = (2, 5, 3)
BANDIT_HORIZON = 10
BANDIT_BEST = 1


def bandit_run_episode(policy):
    """policy(pull_index, history) -> arm. States are pull indices."""
    states, actions, rewards = [0], [], []
    for t in range(BANDIT_HORIZON):
        arm = policy(t, list(actions))
        actions.append(arm)
        rewards.append(PAYOFFS[arm])
        states.append(t + 1)
    return {"states": states, "actions": actions, "rewards": rewards,
            "return": sum(rewards), "steps": len(actions),
            "reached_goal": all(a == BANDIT_BEST for a in actions),
            "terminal": True}


def bandit_verify(traj):
    reasons = []
    states, actions, rewards = list(traj["states"]), list(traj["actions"]), list(traj["rewards"])
    if not states or states[0] != 0:
        return False, ["bad_start"]
    if len(actions) != BANDIT_HORIZON or len(states) != BANDIT_HORIZON + 1 \
            or len(rewards) != BANDIT_HORIZON:
        return False, ["length_mismatch"]
    total = 0
    for t, arm in enumerate(actions):
        if states[t + 1] != t + 1:
            reasons.append("illegal_transition")
        if arm not in (0, 1, 2):
            reasons.append("illegal_action")
            continue
        if PAYOFFS[arm] != rewards[t]:
            reasons.append("reward_mismatch")
        total += PAYOFFS[arm]
    if traj.get("reached_goal") and not all(a == BANDIT_BEST for a in actions):
        reasons.append("goal_claim_false")
    if total != traj.get("return"):
        reasons.append("return_mismatch")
    return (not reasons), reasons


def bandit_evaluate_random(seed, episodes):
    rng = random.Random(seed)
    rets = []
    best_counts = []
    for _ in range(episodes):
        t = bandit_run_episode(lambda i, h: rng.randrange(3))
        rets.append(t["return"])
        best_counts.append(sum(1 for a in t["actions"] if a == BANDIT_BEST) / BANDIT_HORIZON)
    return {"episodes": episodes,
            "mean_return": round(sum(rets) / episodes, 6),
            "mean_best_arm_rate": round(sum(best_counts) / episodes, 6)}


def bandit_explore_then_exploit(explore_per_arm=10):
    """Pull each arm explore_per_arm times, then exploit the best mean.

    Deterministic payoffs make the observed means exact after one pull
    each; the 10-per-arm schedule is the stated training procedure.
    Returns (evaluation_trajectory, chosen_arm, observed_means).
    """
    totals, counts = [0, 0, 0], [0, 0, 0]
    for arm in range(3):
        for _ in range(explore_per_arm):
            totals[arm] += PAYOFFS[arm]
            counts[arm] += 1
    means = [round(totals[a] / counts[a], 6) for a in range(3)]
    chosen = max(range(3), key=lambda a: means[a])
    traj = bandit_run_episode(lambda i, h: chosen)
    return traj, chosen, means


# ---------------------------------------------------------------- sequence
TARGET = (2, 0, 1, 2)
SEQ_CORRECT, SEQ_WRONG = 3, -2
SEQ_SYMBOLS = (0, 1, 2, 3)


def seq_run_episode(policy):
    states, actions, rewards = [0], [], []
    for t in range(len(TARGET)):
        sym = policy(t, list(actions))
        actions.append(sym)
        rewards.append(SEQ_CORRECT if sym == TARGET[t] else SEQ_WRONG)
        states.append(t + 1)
    correct = sum(1 for t, a in enumerate(actions) if a == TARGET[t])
    return {"states": states, "actions": actions, "rewards": rewards,
            "return": sum(rewards), "steps": len(actions),
            "reached_goal": correct == len(TARGET),
            "accuracy": round(correct / len(TARGET), 6), "terminal": True}


def seq_verify(traj):
    reasons = []
    states, actions, rewards = list(traj["states"]), list(traj["actions"]), list(traj["rewards"])
    if not states or states[0] != 0:
        return False, ["bad_start"]
    if len(actions) != len(TARGET) or len(states) != len(TARGET) + 1 \
            or len(rewards) != len(TARGET):
        return False, ["length_mismatch"]
    total = 0
    for t, sym in enumerate(actions):
        if states[t + 1] != t + 1:
            reasons.append("illegal_transition")
        expected = SEQ_CORRECT if sym == TARGET[t] else SEQ_WRONG
        if expected != rewards[t]:
            reasons.append("reward_mismatch")
        total += expected
    correct = sum(1 for t, a in enumerate(actions) if a == TARGET[t])
    if traj.get("reached_goal") and correct != len(TARGET):
        reasons.append("goal_claim_false")
    if total != traj.get("return"):
        reasons.append("return_mismatch")
    return (not reasons), reasons


def seq_evaluate_random(seed, episodes):
    rng = random.Random(seed)
    rets, accs = [], []
    for _ in range(episodes):
        t = seq_run_episode(lambda i, h: rng.randrange(4))
        rets.append(t["return"])
        accs.append(t["accuracy"])
    return {"episodes": episodes,
            "mean_return": round(sum(rets) / episodes, 6),
            "mean_accuracy": round(sum(accs) / episodes, 6)}
