"""Training-seed sweep, baselines, sensitivity and learning curves for Deep.

Writes two NEW files and never touches results_deep.json (its sha256 is
quoted in the README):
- results_seeds.json: 10 training seeds per task for the GRPO-style run,
  REINFORCE with a mean baseline and tabular Q-learning at the same episode
  budget, the unbiased pass@k next to the block version, an lr x group-size
  grid at a fixed episode budget, the sequence held-out-target check and the
  CliffGrid detour breakdown.
- results_deep_curves.json: per-iteration group mean reward and the
  informative flag for the 4 recorded runs and the 2 ablations.
Deterministic: fixed seeds, sorted JSON keys, no timing fields.
Run: python level-3-deep/run_seeds.py
"""
import itertools
import json
import math
import os
import random
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "level-2-build"))
from rl_build import TARGET, grid_q_greedy, grid_train_q  # noqa: E402
from rl_deep import (  # noqa: E402
    ABLATIONS,
    CONFIG,
    EVAL_EPISODES_PER_SEED,
    EVAL_SEEDS,
    GRID_SPECS,
    GROUP,
    evaluate,
    greedy_episode,
    initial_theta,
    pass_at_k_unbiased,
    sample_episode,
    softmax,
    train,
)

N_SEEDS = 10
SEED_STRIDE = 1000  # seed i is the recorded seed + 1000 * i; i = 0 is the recorded run
T_975_DF9 = 2.262157  # Student t quantile for a 95% interval with 10 seeds
SENS_LR = [0.1, 0.25, 0.5, 1.0]
SENS_GROUP = [4, 8, 16, 32]
SENS_SEEDS = 3


def summary(values):
    n = len(values)
    mean = sum(values) / n
    sd = math.sqrt(sum((v - mean) ** 2 for v in values) / (n - 1)) if n > 1 else 0.0
    half = T_975_DF9 * sd / math.sqrt(n) if n == N_SEEDS else None
    out = {"n": n, "mean": round(mean, 6), "sd": round(sd, 6),
           "min": round(min(values), 6), "max": round(max(values), 6)}
    if half is not None:
        out["ci95"] = [round(mean - half, 6), round(mean + half, 6)]
    return out


def seed_list(base):
    return [base + SEED_STRIDE * i for i in range(N_SEEDS)]


def run_learner(task, mode, iterations, lr, seed, advantage):
    theta, info = train(task, mode, iterations, lr, seed, advantage=advantage)
    agg = evaluate(task, theta)["aggregate"]
    return {"seed": seed, "success_rate": agg["success_rate"],
            "mean_return": agg["mean_return"],
            "informative_groups": info["informative_groups"],
            "greedy_reached_goal": greedy_episode(task, theta)["reached_goal"]}


def learner_block(runs):
    return {"runs": runs,
            "success_rate": summary([r["success_rate"] for r in runs]),
            "mean_return": summary([r["mean_return"] for r in runs]),
            "greedy_goal_seeds": sum(1 for r in runs if r["greedy_reached_goal"])}


def q_learning_block(task, episodes, seeds):
    spec = GRID_SPECS[task]
    runs = []
    for seed in seeds:
        t = grid_q_greedy(spec, grid_train_q(spec, seed, episodes))
        runs.append({"seed": seed, "greedy_reached_goal": t["reached_goal"],
                     "greedy_return": t["return"], "greedy_steps": t["steps"]})
    return {"episodes": episodes, "alpha": 0.1, "epsilon": 0.1, "runs": runs,
            "greedy_goal_seeds": sum(1 for r in runs if r["greedy_reached_goal"]),
            "greedy_return": summary([r["greedy_return"] for r in runs])}


def pass_k_block(agg):
    n = agg["episodes"]
    c = round(agg["success_rate"] * n)
    return {"successes": c, "episodes": n,
            "block": {k: agg[f"pass_at_{k}"] for k in (1, 3, 5)},
            "unbiased": {k: pass_at_k_unbiased(n, c, k) for k in (1, 3, 5)}}


def sensitivity(task, mode, iterations):
    budget = iterations * GROUP
    seeds = seed_list(CONFIG[task][3])[:SENS_SEEDS]
    cells = []
    for lr, group in itertools.product(SENS_LR, SENS_GROUP):
        succ = []
        for seed in seeds:
            theta, _ = train(task, mode, budget // group, lr, seed, group=group)
            succ.append(evaluate(task, theta)["aggregate"]["success_rate"])
        cells.append({"lr": lr, "group": group, "iterations": budget // group,
                      "success_rates": succ,
                      "mean_success_rate": round(sum(succ) / len(succ), 6)})
    return {"episode_budget": budget, "seeds": seeds, "cells": cells}


def sequence_heldout(theta):
    """Expected sampled success on every target other than the trained one.

    The tabular policy is indexed by position only, so this measures how much
    of the trained success is memorisation of the one public target.
    """
    probs = [softmax(theta[t]) for t in range(len(TARGET))]
    scores = []
    for target in itertools.product(range(4), repeat=len(TARGET)):
        if target == TARGET:
            continue
        scores.append(math.prod(probs[t][s] for t, s in enumerate(target)))
    greedy = tuple(max(range(4), key=lambda a: theta[t][a]) for t in range(len(TARGET)))
    return {"trained_target": list(TARGET), "heldout_targets": len(scores),
            "greedy_output": list(greedy),
            "greedy_heldout_hits": sum(1 for t in itertools.product(range(4), repeat=4)
                                       if t != TARGET and t == greedy),
            "expected_success_mean": round(sum(scores) / len(scores), 6),
            "expected_success_max": round(max(scores), 6),
            "trained_target_expected_success": round(
                math.prod(probs[t][s] for t, s in enumerate(TARGET)), 6)}


def cliff_detour(theta):
    """Episode-length breakdown of successful CliffGrid evaluation episodes."""
    lengths = {}
    successes = 0
    for seed in EVAL_SEEDS:
        rng = random.Random(seed)
        for _ in range(EVAL_EPISODES_PER_SEED):
            _steps, traj = sample_episode("cliffgrid-3x5", theta, rng)
            if traj["reached_goal"]:
                successes += 1
                key = str(traj["steps"])
                lengths[key] = lengths.get(key, 0) + 1
    return {"successes": successes, "steps_histogram": lengths,
            "optimal_steps": 6, "optimal_share": round(lengths.get("6", 0) / successes, 6),
            "greedy": greedy_episode("cliffgrid-3x5", theta)}


def main():
    tasks = {}
    curves = {"tasks": {}, "ablations": {}}
    for task, (mode, iterations, lr, seed) in CONFIG.items():
        seeds = seed_list(seed)
        block = {"reward_mode": mode, "iterations": iterations, "lr": lr,
                 "group_size": GROUP, "episodes_per_run": iterations * GROUP,
                 "seeds": seeds,
                 "grpo": learner_block([run_learner(task, mode, iterations, lr, s, "group") for s in seeds]),
                 "reinforce_mean_baseline": learner_block(
                     [run_learner(task, mode, iterations, lr, s, "mean") for s in seeds])}
        if task in GRID_SPECS:
            block["q_learning"] = q_learning_block(task, iterations * GROUP, seeds)
        curve = []
        theta, _ = train(task, mode, iterations, lr, seed, curve=curve)
        curves["tasks"][task] = curve
        before = evaluate(task, initial_theta(task))["aggregate"]
        after = evaluate(task, theta)["aggregate"]
        block["pass_at_k"] = {"before": pass_k_block(before), "after": pass_k_block(after)}
        block["sensitivity"] = sensitivity(task, mode, iterations)
        if task == "sequence-memory-4":
            block["heldout_targets"] = sequence_heldout(theta)
        if task == "cliffgrid-3x5":
            block["detour"] = cliff_detour(theta)
        tasks[task] = block
        g = block["grpo"]["success_rate"]
        print(task, "grpo success mean", g["mean"], "sd", g["sd"],
              "reinforce mean", block["reinforce_mean_baseline"]["success_rate"]["mean"])
    for ab in ABLATIONS:
        curve = []
        train(ab["task"], ab["reward_mode"], ab["iterations"], ab["lr"], ab["seed"], curve=curve)
        curves["ablations"][ab["name"]] = curve

    results = {
        "level": "deep-seeds",
        "method": ("same tabular softmax policy and Build verifiers as results_deep.json; "
                   "each task retrained over 10 training seeds (seed i = recorded seed + 1000 i), "
                   "with REINFORCE (mean baseline, no std normalisation) and tabular Q-learning "
                   "at the same episode budget; evaluation as in results_deep.json"),
        "evaluation": {"seeds": EVAL_SEEDS, "episodes_per_seed": EVAL_EPISODES_PER_SEED},
        "n_training_seeds": N_SEEDS,
        "tasks": tasks,
    }
    for name, obj in (("results_seeds.json", results), ("results_deep_curves.json", curves)):
        path = os.path.join(HERE, name)
        with open(path, "w") as f:
            json.dump(obj, f, indent=1, sort_keys=True)
            f.write("\n")
        print("wrote", path)


if __name__ == "__main__":
    main()
