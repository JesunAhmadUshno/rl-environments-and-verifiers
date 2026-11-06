"""Run the P26 Learn comparison and write results_learn.json.

Deterministic: fixed seeds, sorted JSON keys. Two runs must be byte-identical.
Run: python level-1-learn/run_learn.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rl_learn import (GOAL, PIT, START, evaluate_random, greedy_action,
                      make_greedy_policy, q_greedy_trajectory, run_episode,
                      train_q_learning, value_iteration, verify_trajectory)

HERE = os.path.dirname(os.path.abspath(__file__))


def grader_scenarios(greedy_traj):
    """The five grader scenarios from LEARN-SPEC Section 3."""
    out = []
    ok, reasons = verify_trajectory(greedy_traj)
    out.append({"name": "valid_greedy", "passed_as_expected": ok and not reasons})
    tampered = json.loads(json.dumps(greedy_traj))
    tampered["rewards"][0] = 0
    ok, reasons = verify_trajectory(tampered)
    out.append({"name": "tampered_reward", "passed_as_expected": (not ok) and "reward_mismatch" in reasons})
    tele = json.loads(json.dumps(greedy_traj))
    tele["states"][2] = [3, 3]
    ok, reasons = verify_trajectory(tele)
    out.append({"name": "teleport", "passed_as_expected": (not ok) and "illegal_transition" in reasons})
    wrong = json.loads(json.dumps(greedy_traj))
    wrong["return"] = greedy_traj["return"] + 5
    ok, reasons = verify_trajectory(wrong)
    out.append({"name": "wrong_return_claim", "passed_as_expected": (not ok) and "return_mismatch" in reasons})
    pit_traj = run_episode(lambda s, i: [2, 2, 2][i] if i < 3 else 0)
    false_goal = json.loads(json.dumps(pit_traj))
    false_goal["reached_goal"] = True
    ok, reasons = verify_trajectory(false_goal)
    out.append({"name": "false_goal_claim", "passed_as_expected": (not ok) and "goal_claim_false" in reasons})
    out.append({"name": "pit_trajectory_valid", "passed_as_expected": verify_trajectory(pit_traj)[0]})
    return out, pit_traj


def main():
    V = value_iteration()
    greedy_traj = run_episode(make_greedy_policy(V))
    scenarios, pit_traj = grader_scenarios(greedy_traj)
    random_eval = evaluate_random(seed=20261105, episodes=200)
    Q = train_q_learning(seed=7, episodes=3000)
    q_traj = q_greedy_trajectory(Q)
    results = {
        "task": "gridworld-4x4",
        "start": list(START),
        "goal": list(GOAL),
        "pit": list(PIT),
        "max_steps": 20,
        "gamma": 1.0,
        "optimal_value_start": V[START],
        "optimal_values": {f"{r},{c}": V[(r, c)] for r in range(4) for c in range(4)
                           if (r, c) in V},
        "greedy_policy": {
            "actions": greedy_traj["actions"],
            "rewards": greedy_traj["rewards"],
            "return": greedy_traj["return"],
            "steps": greedy_traj["steps"],
            "reached_goal": greedy_traj["reached_goal"],
            "verified": verify_trajectory(greedy_traj)[0],
        },
        "pit_trajectory": {
            "actions": pit_traj["actions"],
            "rewards": pit_traj["rewards"],
            "return": pit_traj["return"],
            "verified": verify_trajectory(pit_traj)[0],
        },
        "grader_scenarios": scenarios,
        "grader_passed": sum(1 for s in scenarios if s["passed_as_expected"]),
        "grader_total": len(scenarios),
        "random_policy": random_eval,
        "q_learning": {
            "seed": 7,
            "training_episodes": 3000,
            "alpha": 0.1,
            "epsilon": 0.1,
            "greedy_after_training": {
                "actions": q_traj["actions"],
                "return": q_traj["return"],
                "steps": q_traj["steps"],
                "reached_goal": q_traj["reached_goal"],
                "verified": verify_trajectory(q_traj)[0],
            },
        },
    }
    path = os.path.join(HERE, "results_learn.json")
    with open(path, "w") as f:
        json.dump(results, f, indent=1, sort_keys=True)
        f.write("\n")
    print("greedy return", greedy_traj["return"], "steps", greedy_traj["steps"],
          "verified", results["greedy_policy"]["verified"])
    print("grader", results["grader_passed"], "of", results["grader_total"])
    print("random mean_return", random_eval["mean_return"], "goal_rate", random_eval["goal_rate"])
    print("q greedy return", q_traj["return"], "steps", q_traj["steps"],
          "reached_goal", q_traj["reached_goal"])
    print("wrote", path)


if __name__ == "__main__":
    main()
