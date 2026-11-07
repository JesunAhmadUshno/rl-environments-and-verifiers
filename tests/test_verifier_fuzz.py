"""Verifier fuzz test: every single-field mutation of a valid log.

For each valid trajectory (the optimal ones plus seeded random ones), this
applies every single-field mutation (one action, one state, one reward, the
claimed return, the goal flag, the terminal flag) and checks the replay
verifier against an independent oracle: the verifier must accept the
mutated log exactly when replaying its actions from the start reproduces
every logged field, and reject it otherwise. Seeded, stdlib, under a second.
Run: python tests/test_verifier_fuzz.py
"""
import copy
import os
import random
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "level-2-build"))
from rl_build import (  # noqa: E402
    CLIFF,
    GW,
    PAYOFFS,
    SEQ_CORRECT,
    SEQ_WRONG,
    TARGET,
    bandit_run_episode,
    bandit_verify,
    grid_greedy_policy,
    grid_is_terminal,
    grid_run_episode,
    grid_step,
    grid_value_iteration,
    grid_verify,
    seq_run_episode,
    seq_verify,
)

SEED = 20261107


# ------------------------------------------------------------ oracles
def grid_oracle(spec, t):
    """True when the log is exactly what replaying its actions gives."""
    states = [tuple(s) for s in t["states"]]
    if len(states) != len(t["actions"]) + 1 or len(t["rewards"]) != len(t["actions"]):
        return False
    if states[0] != spec.start or len(t["actions"]) > spec.max_steps:
        return False
    state, total = spec.start, 0
    for i, a in enumerate(t["actions"]):
        state, reward, done = grid_step(spec, state, a)
        if state != states[i + 1] or reward != t["rewards"][i]:
            return False
        if done and i != len(t["actions"]) - 1:
            return False
        total += reward
    if t["return"] != total or bool(t["terminal"]) != grid_is_terminal(spec, state):
        return False
    return not (t["reached_goal"] and state != spec.goal)


def bandit_oracle(t):
    if t["states"] != list(range(11)) or len(t["actions"]) != 10:
        return False
    if any(a not in (0, 1, 2) for a in t["actions"]):
        return False
    rewards = [PAYOFFS[a] for a in t["actions"]]
    if rewards != t["rewards"] or sum(rewards) != t["return"]:
        return False
    return not (t["reached_goal"] and any(a != 1 for a in t["actions"]))


def seq_oracle(t):
    if t["states"] != list(range(5)) or len(t["actions"]) != 4:
        return False
    rewards = [SEQ_CORRECT if a == TARGET[i] else SEQ_WRONG for i, a in enumerate(t["actions"])]
    if rewards != t["rewards"] or sum(rewards) != t["return"]:
        return False
    return not (t["reached_goal"] and list(t["actions"]) != list(TARGET))


# ------------------------------------------------------------ mutations
def mutations(t, action_values, state_values):
    """Yield (label, mutated log) for every single-field change."""
    for i, a in enumerate(t["actions"]):
        for v in action_values:
            if v != a:
                m = copy.deepcopy(t)
                m["actions"][i] = v
                yield f"action[{i}]={v}", m
    for i in range(1, len(t["states"])):
        for v in state_values:
            if v != t["states"][i]:
                m = copy.deepcopy(t)
                m["states"][i] = copy.deepcopy(v)
                yield f"state[{i}]={v}", m
    for i in range(len(t["rewards"])):
        for d in (-1, 1, 5):
            m = copy.deepcopy(t)
            m["rewards"][i] += d
            yield f"reward[{i}]{d:+d}", m
    for d in (-1, 1, 5):
        m = copy.deepcopy(t)
        m["return"] += d
        yield f"return{d:+d}", m
    for flag in ("reached_goal", "terminal"):
        m = copy.deepcopy(t)
        m[flag] = not m[flag]
        yield f"{flag} flipped", m


def check(name, logs, verify, oracle, action_values, state_values):
    checked = rejected = 0
    for t in logs:
        assert verify(t)[0] and oracle(t), f"{name}: base log must be valid"
        for label, m in mutations(t, action_values, state_values):
            ok = verify(m)[0]
            assert ok == oracle(m), f"{name} {label}: verifier said {ok}, replay oracle disagrees"
            checked += 1
            rejected += 0 if ok else 1
    return checked, rejected


def grid_logs(spec, rng, n):
    V = grid_value_iteration(spec)
    logs = [grid_run_episode(spec, grid_greedy_policy(spec, V))]
    logs += [grid_run_episode(spec, lambda s, i: rng.randrange(4)) for _ in range(n)]
    return logs


def test_grid_fuzz():
    rng = random.Random(SEED)
    for spec in (GW, CLIFF):
        cells = [[r, c] for r in range(spec.rows) for c in range(spec.cols)]
        checked, rejected = check(spec.name, grid_logs(spec, rng, 10),
                                  lambda t, s=spec: grid_verify(s, t),
                                  lambda t, s=spec: grid_oracle(s, t), range(4), cells)
        assert checked > 1000 and rejected > 0.9 * checked
        print(spec.name, checked, "mutations,", rejected, "rejected")


def test_bandit_fuzz():
    rng = random.Random(SEED + 1)
    logs = [bandit_run_episode(lambda i, h: 1)]
    logs += [bandit_run_episode(lambda i, h: rng.randrange(3)) for _ in range(10)]
    checked, rejected = check("bandit", logs, bandit_verify, bandit_oracle, range(4), range(12))
    assert checked > 1000
    print("bandit", checked, "mutations,", rejected, "rejected")


def test_sequence_fuzz():
    rng = random.Random(SEED + 2)
    logs = [seq_run_episode(lambda i, h: TARGET[i])]
    logs += [seq_run_episode(lambda i, h: rng.randrange(4)) for _ in range(10)]
    checked, rejected = check("sequence", logs, seq_verify, seq_oracle, range(4), range(6))
    assert checked > 500
    print("sequence", checked, "mutations,", rejected, "rejected")


def test_known_blind_spots_stay_named():
    """Mutations the verifier accepts are exactly the replay-consistent ones.

    Two such classes exist by design: a different action with the same
    outcome (bumping a wall or edge) and under-claiming the goal flag.
    """
    t = grid_run_episode(GW, grid_greedy_policy(GW, grid_value_iteration(GW)))
    under = copy.deepcopy(t)
    under["reached_goal"] = False
    assert grid_verify(GW, under)[0] and grid_oracle(GW, under)
    edge = grid_run_episode(GW, lambda s, i: 0 if i == 0 else [2, 2, 1, 1, 2, 1][i - 1])
    assert grid_verify(GW, edge)[0]
    swapped = copy.deepcopy(edge)
    swapped["actions"][0] = 3  # left from (0, 0) also stays put with reward -1
    assert grid_verify(GW, swapped)[0] and grid_oracle(GW, swapped)


if __name__ == "__main__":
    tests = [(n, f) for n, f in sorted(globals().items())
             if n.startswith("test_") and callable(f)]
    for name, fn in tests:
        fn()
        print(name, "PASS")
    print(len(tests), "fuzz tests passed")
