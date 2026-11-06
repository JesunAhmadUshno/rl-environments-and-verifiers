"""Run the P26 Deep GRPO-style RLVR comparison and write results_deep.json.

Deterministic: fixed seeds, sorted JSON keys, no timing fields. Two runs
must be byte-identical.
Run: python level-3-deep/run_deep.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rl_deep import (ABLATIONS, CONFIG, EVAL_EPISODES_PER_SEED, EVAL_SEEDS,
                     evaluate, greedy_episode, initial_theta, theta_json,
                     train)

HERE = os.path.dirname(os.path.abspath(__file__))


def run_task(task, reward_mode, iterations, lr, seed):
    before = evaluate(task, initial_theta(task))
    theta, train_info = train(task, reward_mode, iterations, lr, seed)
    after = evaluate(task, theta)
    return theta, train_info, before, after


def main():
    tasks = []
    for task, (mode, iterations, lr, seed) in CONFIG.items():
        theta, train_info, before, after = run_task(
            task, mode, iterations, lr, seed)
        tasks.append({
            "task": task, "reward_mode": mode,
            "train": {"seed": seed, "lr": lr, **train_info},
            "before": before, "after": after,
            "greedy_after": greedy_episode(task, theta),
            "theta_after": theta_json(task, theta),
        })
        print(task, "before success", before["aggregate"]["success_rate"],
              "after success", after["aggregate"]["success_rate"])

    ablations = []
    for ab in ABLATIONS:
        task = ab["task"]
        theta, train_info, before, after = run_task(
            task, ab["reward_mode"], ab["iterations"], ab["lr"], ab["seed"])
        ablations.append({
            "name": ab["name"], "task": task,
            "reward_mode": ab["reward_mode"],
            "train": {"seed": ab["seed"], "lr": ab["lr"], **train_info},
            "before": before, "after": after,
            "greedy_after": greedy_episode(task, theta),
        })
        print(ab["name"], "after success",
              after["aggregate"]["success_rate"])

    results = {
        "level": "deep",
        "method": ("tabular softmax policy, GRPO-style group-relative "
                   "advantage, RLVR reward from the Build replay "
                   "verifiers only; teaching analogue, not an LLM run"),
        "evaluation": {"seeds": EVAL_SEEDS,
                       "episodes_per_seed": EVAL_EPISODES_PER_SEED,
                       "metrics": ["pass_at_1", "pass_at_3", "pass_at_5",
                                   "mean_return", "return_variance",
                                   "success_rate"]},
        "tasks": tasks,
        "ablations": ablations,
    }
    path = os.path.join(HERE, "results_deep.json")
    with open(path, "w") as f:
        json.dump(results, f, indent=1, sort_keys=True)
        f.write("\n")
    print("wrote", path)


if __name__ == "__main__":
    main()
