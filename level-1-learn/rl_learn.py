"""P26 Learn: a deterministic GridWorld, a replay verifier, and small policies.

Stdlib only. The environment has no randomness and no I/O. Randomness lives
only in the seeded policies, so every run of run_learn.py is reproducible.
Rules and hand-computed oracles: LEARN-SPEC.md in this folder.
"""
import random

ROWS = COLS = 4
START = (0, 0)
GOAL = (3, 3)
PIT = (3, 0)
WALLS = frozenset({(1, 1), (1, 2)})
MAX_STEPS = 20
STEP_REWARD = -1
GOAL_BONUS = 10
PIT_BONUS = -5
ACTIONS = {0: (-1, 0), 1: (0, 1), 2: (1, 0), 3: (0, -1)}  # up right down left
ACTION_NAMES = {0: "up", 1: "right", 2: "down", 3: "left"}


def is_terminal(state):
    return state in (GOAL, PIT)


def step(state, action):
    """One deterministic transition. Returns (next_state, reward, done)."""
    dr, dc = ACTIONS[action]
    nxt = (state[0] + dr, state[1] + dc)
    if not (0 <= nxt[0] < ROWS and 0 <= nxt[1] < COLS) or nxt in WALLS:
        nxt = state
    reward = STEP_REWARD
    if nxt == GOAL:
        reward += GOAL_BONUS
    elif nxt == PIT:
        reward += PIT_BONUS
    return nxt, reward, is_terminal(nxt)


def run_episode(policy, max_steps=MAX_STEPS):
    """policy(state, step_index) -> action. Returns a trajectory dict."""
    state = START
    states, actions, rewards = [state], [], []
    done = False
    for i in range(max_steps):
        action = policy(state, i)
        state, reward, done = step(state, action)
        actions.append(action)
        rewards.append(reward)
        states.append(state)
        if done:
            break
    return {
        "states": [list(s) for s in states],
        "actions": actions,
        "rewards": rewards,
        "return": sum(rewards),
        "steps": len(actions),
        "reached_goal": states[-1] == list(GOAL) or states[-1] == GOAL,
        "ended_in_pit": states[-1] == PIT,
        "terminal": done,
    }


def verify_trajectory(traj):
    """Replay a recorded trajectory and grade it. Never trusts the claim.

    Returns (passed, reasons). Reasons are named, in check order.
    """
    reasons = []
    states = [tuple(s) for s in traj["states"]]
    actions = list(traj["actions"])
    rewards = list(traj["rewards"])
    if not states or states[0] != START:
        reasons.append("bad_start")
        return False, reasons
    if len(states) != len(actions) + 1 or len(rewards) != len(actions):
        reasons.append("length_mismatch")
        return False, reasons
    if len(actions) > MAX_STEPS:
        reasons.append("too_many_steps")
    total = 0
    for i, action in enumerate(actions):
        nxt, reward, done = step(states[i], action)
        if nxt != states[i + 1]:
            reasons.append("illegal_transition")
        if reward != rewards[i]:
            reasons.append("reward_mismatch")
        total += reward
        if done and i != len(actions) - 1:
            reasons.append("steps_after_terminal")
    last = states[-1]
    if traj.get("reached_goal") and last != GOAL:
        reasons.append("goal_claim_false")
    if is_terminal(last) != bool(traj.get("terminal")):
        reasons.append("terminal_mismatch")
    if total != traj.get("return"):
        reasons.append("return_mismatch")
    return (not reasons), reasons


def value_iteration(tol=1e-12):
    """Exact optimal values for this small task (gamma 1.0, episodic)."""
    states = [(r, c) for r in range(ROWS) for c in range(COLS)
              if (r, c) not in WALLS]
    V = {s: 0 for s in states}
    while True:
        delta = 0.0
        new = dict(V)
        for s in states:
            if is_terminal(s):
                new[s] = 0
                continue
            new[s] = max(step(s, a)[1] + V[step(s, a)[0]] for a in ACTIONS)
            delta = max(delta, abs(new[s] - V[s]))
        V = new
        if delta < tol:
            return V


def greedy_action(V, state):
    """Best action by one-step lookahead on V; ties by action order."""
    best_a, best_v = None, None
    for a in sorted(ACTIONS):
        nxt, reward, _ = step(state, a)
        val = reward + V[nxt]
        if best_v is None or val > best_v:
            best_a, best_v = a, val
    return best_a


def make_greedy_policy(V):
    return lambda state, i: greedy_action(V, state)


def evaluate_random(seed, episodes):
    rng = random.Random(seed)
    returns, steps, goals, pits = [], [], 0, 0
    for _ in range(episodes):
        traj = run_episode(lambda s, i: rng.randrange(4))
        returns.append(traj["return"])
        steps.append(traj["steps"])
        goals += 1 if traj["reached_goal"] else 0
        pits += 1 if traj["ended_in_pit"] else 0
    return {
        "episodes": episodes,
        "mean_return": round(sum(returns) / episodes, 6),
        "mean_steps": round(sum(steps) / episodes, 6),
        "goal_rate": round(goals / episodes, 6),
        "pit_rate": round(pits / episodes, 6),
    }


def train_q_learning(seed, episodes, alpha=0.1, epsilon=0.1):
    """Tabular Q-learning, gamma 1.0. Returns the Q table (string keys)."""
    rng = random.Random(seed)
    Q = {}
    def q(state, action):
        return Q.get((state, action), 0.0)
    for _ in range(episodes):
        state = START
        for _i in range(MAX_STEPS):
            if rng.random() < epsilon:
                action = rng.randrange(4)
            else:
                action = max(sorted(ACTIONS), key=lambda a: q(state, a))
            nxt, reward, done = step(state, action)
            target = reward if done else reward + max(q(nxt, a) for a in ACTIONS)
            Q[(state, action)] = q(state, action) + alpha * (target - q(state, action))
            state = nxt
            if done:
                break
    return {f"{s[0]},{s[1]}|{a}": round(v, 6) for (s, a), v in sorted(Q.items())}


def q_greedy_trajectory(Q):
    def act(state, i):
        return max(sorted(ACTIONS),
                   key=lambda a: Q.get(f"{state[0]},{state[1]}|{a}", 0.0))
    return run_episode(act)
