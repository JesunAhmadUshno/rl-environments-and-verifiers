"""P26 Deep: GRPO-style RLVR training of a tabular softmax policy.

Teaching analogue, labelled as such everywhere: no language model, no
tokens, no KL term, no critic. The group-relative advantage and the
verifier-only reward are the parts that carry over from GRPO and RLVR.
Design and hand-computed oracles: DEEP-SPEC.md in this folder.

Stdlib only. The four environments and their replay verifiers are the
Build code (level-2-build/rl_build.py), imported unmodified.
Deterministic: every random draw comes from a seeded random.Random.
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(
    os.path.abspath(__file__))), "level-2-build"))
from rl_build import (  # noqa: E402
    CLIFF,
    GW,
    bandit_run_episode,
    bandit_verify,
    grid_run_episode,
    grid_verify,
    seq_run_episode,
    seq_verify,
)

GROUP = 16
EVAL_SEEDS = [9101, 9102, 9103, 9104, 9105]
EVAL_EPISODES_PER_SEED = 100

# task name -> (reward mode, iterations, lr, train seed)
CONFIG = {
    "gridworld-4x4": ("success", 200, 0.5, 2601),
    "cliffgrid-3x5": ("success", 300, 0.5, 2602),
    "bandit-3arm-deterministic": ("return", 200, 0.5, 2603),
    "sequence-memory-4": ("success", 200, 0.5, 2604),
}
ABLATIONS = [
    {"name": "cliffgrid-return-mode", "task": "cliffgrid-3x5",
     "reward_mode": "return", "iterations": 300, "lr": 0.1, "seed": 2612},
    {"name": "bandit-success-mode", "task": "bandit-3arm-deterministic",
     "reward_mode": "success", "iterations": 200, "lr": 0.5, "seed": 2613},
]
GRID_SPECS = {"gridworld-4x4": GW, "cliffgrid-3x5": CLIFF}
N_ACTIONS = {"gridworld-4x4": 4, "cliffgrid-3x5": 4,
             "bandit-3arm-deterministic": 3, "sequence-memory-4": 4}


def softmax(logits):
    m = max(logits)
    ex = [math.exp(x - m) for x in logits]
    total = sum(ex)
    return [e / total for e in ex]


def sample_action(rng, probs):
    x = rng.random()
    acc = 0.0
    for i, p in enumerate(probs):
        acc += p
        if x < acc:
            return i
    return len(probs) - 1


def group_advantages(rewards):
    """GRPO-style group-relative advantage with population std.

    Returns (advantages, mean, std). A zero-variance group gives all
    zero advantages: it is uninformative and makes no update.
    """
    n = len(rewards)
    mean = sum(rewards) / n
    var = sum((r - mean) ** 2 for r in rewards) / n
    std = math.sqrt(var)
    if std < 1e-12:
        return [0.0] * n, mean, std
    return [(r - mean) / std for r in rewards], mean, std


def apply_group_update(theta, episodes, advantages, lr, group_size):
    """One group update, in place. episodes hold (state, action, probs).

    theta[state] += lr * (sum over episodes and steps of
    A * (onehot(action) - probs)) / group_size.
    """
    grad = {}
    for steps, adv in zip(episodes, advantages):
        if adv == 0.0:
            continue
        for state, action, probs in steps:
            g = grad.setdefault(state, [0.0] * len(probs))
            for k in range(len(probs)):
                g[k] += adv * ((1.0 - probs[k]) if k == action else -probs[k])
    for state, g in grad.items():
        logits = theta[state]
        for k in range(len(g)):
            logits[k] += lr * g[k] / group_size


def score_episodes(successes, returns):
    """P06-pattern scoring: pass@1, pass@3, pass@5, mean, variance.

    pass@k groups the success list in order into full blocks of k (a
    trailing partial block is dropped); a block passes if any episode
    in it succeeded. Variance is the population variance of returns.
    """
    n = len(returns)
    mean = sum(returns) / n
    var = sum((r - mean) ** 2 for r in returns) / n

    def pass_at(k):
        blocks = [successes[i:i + k] for i in range(0, n - k + 1, k)]
        if not blocks:
            return 0.0
        return round(sum(1 for b in blocks if any(b)) / len(blocks), 6)

    return {"episodes": n, "mean_return": round(mean, 6),
            "return_variance": round(var, 6),
            "success_rate": round(sum(successes) / n, 6),
            "pass_at_1": pass_at(1), "pass_at_3": pass_at(3),
            "pass_at_5": pass_at(5)}


# ------------------------------------------------------------ sampling
def sample_grid_episode(spec, theta, rng):
    steps = []

    def policy(state, i):
        probs = softmax(theta.setdefault(state, [0.0] * 4))
        action = sample_action(rng, probs)
        steps.append((state, action, probs))
        return action

    traj = grid_run_episode(spec, policy)
    ok, _ = grid_verify(spec, traj)
    assert ok, "sampler produced an unverified grid trajectory"
    return steps, traj


def sample_bandit_episode(theta, rng):
    steps = []

    def policy(t, history):
        probs = softmax(theta.setdefault(0, [0.0] * 3))
        action = sample_action(rng, probs)
        steps.append((0, action, probs))
        return action

    traj = bandit_run_episode(policy)
    ok, _ = bandit_verify(traj)
    assert ok, "sampler produced an unverified bandit trajectory"
    return steps, traj


def sample_sequence_episode(theta, rng):
    steps = []

    def policy(t, history):
        probs = softmax(theta.setdefault(t, [0.0] * 4))
        action = sample_action(rng, probs)
        steps.append((t, action, probs))
        return action

    traj = seq_run_episode(policy)
    ok, _ = seq_verify(traj)
    assert ok, "sampler produced an unverified sequence trajectory"
    return steps, traj


def sample_episode(task, theta, rng):
    if task in GRID_SPECS:
        return sample_grid_episode(GRID_SPECS[task], theta, rng)
    if task == "bandit-3arm-deterministic":
        return sample_bandit_episode(theta, rng)
    return sample_sequence_episode(theta, rng)


def episode_reward(task, traj, reward_mode):
    """Reward read only from the verifier-checked trajectory."""
    if reward_mode == "success":
        return 1.0 if traj["reached_goal"] else 0.0
    return float(traj["return"])


def initial_theta(task):
    """Zero logits for every state the sampler can reach."""
    theta = {}
    if task in GRID_SPECS:
        spec = GRID_SPECS[task]
        for r in range(spec.rows):
            for c in range(spec.cols):
                if (r, c) not in spec.walls:
                    theta[(r, c)] = [0.0] * 4
    elif task == "bandit-3arm-deterministic":
        theta[0] = [0.0] * 3
    else:
        for t in range(4):
            theta[t] = [0.0] * 4
    return theta


def train(task, reward_mode, iterations, lr, seed, group=GROUP):
    rng = random.Random(seed)
    theta = initial_theta(task)
    informative = 0
    for _ in range(iterations):
        episodes, rewards = [], []
        for _ in range(group):
            steps, traj = sample_episode(task, theta, rng)
            episodes.append(steps)
            rewards.append(episode_reward(task, traj, reward_mode))
        advantages, _mean, std = group_advantages(rewards)
        if std >= 1e-12:
            informative += 1
        apply_group_update(theta, episodes, advantages, lr, group)
    return theta, {"iterations": iterations, "group_size": group,
                   "episodes_sampled": iterations * group,
                   "informative_groups": informative,
                   "uninformative_groups": iterations - informative}


# ------------------------------------------------------------ evaluate
def evaluate(task, theta):
    """Sampled evaluation over EVAL_SEEDS, P06-pattern aggregate."""
    successes, returns, per_seed = [], [], []
    for seed in EVAL_SEEDS:
        rng = random.Random(seed)
        s_list, r_list = [], []
        for _ in range(EVAL_EPISODES_PER_SEED):
            _steps, traj = sample_episode_for_eval(task, theta, rng)
            s_list.append(1 if traj["reached_goal"] else 0)
            r_list.append(traj["return"])
        per_seed.append(score_episodes(s_list, r_list))
        successes.extend(s_list)
        returns.extend(r_list)
    return {"aggregate": score_episodes(successes, returns),
            "per_seed": per_seed}


def sample_episode_for_eval(task, theta, rng):
    """Eval sampling must not mutate theta: copy-on-read via setdefault
    on a shallow per-state copy is avoided by pre-filling all states in
    initial_theta; the samplers use theta.setdefault, and every
    reachable state is already present for a trained or zero theta."""
    return sample_episode(task, theta, rng)


def greedy_episode(task, theta):
    if task in GRID_SPECS:
        spec = GRID_SPECS[task]

        def policy(state, i):
            logits = theta[state]
            return max(range(len(logits)), key=lambda a: logits[a])

        traj = grid_run_episode(spec, policy)
        return {"actions": traj["actions"], "return": traj["return"],
                "steps": traj["steps"],
                "reached_goal": traj["reached_goal"],
                "verified": grid_verify(spec, traj)[0]}
    if task == "bandit-3arm-deterministic":
        best = max(range(3), key=lambda a: theta[0][a])
        traj = bandit_run_episode(lambda t, h: best)
        return {"actions": traj["actions"], "return": traj["return"],
                "steps": traj["steps"],
                "reached_goal": traj["reached_goal"],
                "verified": bandit_verify(traj)[0]}
    traj = seq_run_episode(
        lambda t, h: max(range(4), key=lambda a: theta[t][a]))
    return {"actions": traj["actions"], "return": traj["return"],
            "steps": traj["steps"], "reached_goal": traj["reached_goal"],
            "accuracy": traj["accuracy"], "verified": seq_verify(traj)[0]}


def theta_json(task, theta):
    out = {}
    for state in sorted(theta, key=lambda s: str(s)):
        if isinstance(state, tuple):
            key = f"{state[0]},{state[1]}"
        else:
            key = str(state)
        out[key] = [round(v, 6) for v in theta[state]]
    return out
