"""Run the P26 Build comparison and write results_build.json.

Deterministic: fixed seeds, sorted JSON keys. Two runs must be byte-identical.
Run: python level-2-build/run_build.py
"""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rl_build import (CLIFF, GW, TARGET, bandit_evaluate_random,
                      bandit_explore_then_exploit, bandit_run_episode,
                      bandit_verify, grid_evaluate_random,
                      grid_greedy_policy, grid_q_greedy, grid_run_episode,
                      grid_train_q, grid_value_iteration, grid_verify,
                      seq_evaluate_random, seq_run_episode, seq_verify)

HERE = os.path.dirname(os.path.abspath(__file__))


def scenario(name, ok, expected_fail_reason=None, reasons=None):
    if expected_fail_reason is None:
        passed = ok
    else:
        passed = (not ok) and expected_fail_reason in (reasons or [])
    return {"name": name, "passed_as_expected": passed}


def grid_block(spec, seed_random):
    V = grid_value_iteration(spec)
    greedy = grid_run_episode(spec, grid_greedy_policy(spec, V))
    scenarios = []
    ok, r = grid_verify(spec, greedy)
    scenarios.append(scenario("valid_greedy", ok, None, r))
    t = copy.deepcopy(greedy); t["rewards"][0] = 0
    ok, r = grid_verify(spec, t)
    scenarios.append(scenario("tampered_reward", ok, "reward_mismatch", r))
    t = copy.deepcopy(greedy); t["return"] = greedy["return"] + 5
    ok, r = grid_verify(spec, t)
    scenarios.append(scenario("wrong_return_claim", ok, "return_mismatch", r))
    if spec.name == "gridworld-4x4":
        pit = grid_run_episode(spec, lambda s, i: [2, 2, 2][i] if i < 3 else 0)
        extra_traj, extra = pit, copy.deepcopy(pit)
        extra["reached_goal"] = True
        ok, r = grid_verify(spec, extra)
        scenarios.append(scenario("false_goal_claim", ok, "goal_claim_false", r))
        hack = {"name": "return_inflation_and_false_goal_claim",
                "verifier_caught": True,
                "detail": "claimed return 9 on the optimal log rejected with "
                          "return_mismatch; goal claim on the pit log rejected "
                          "with goal_claim_false"}
        bad_traj = pit
        bad_key, bad_label = "pit_trajectory", "pit"
    else:
        cliff = grid_run_episode(spec, lambda s, i: 1)
        laundered = copy.deepcopy(cliff)
        # Claim the cliff step was a safe row-1 step with reward -1.
        laundered["states"][1] = [1, 0]
        laundered["rewards"][0] = -1
        laundered["return"] = -1
        laundered["terminal"] = False
        ok, r = grid_verify(spec, laundered)
        scenarios.append(scenario("cliff_laundering", ok, "illegal_transition", r))
        hack = {"name": "cliff_laundering",
                "verifier_caught": True,
                "detail": "cliff step relabelled as a safe step rejected with "
                          "illegal_transition and reward_mismatch"}
        bad_traj = cliff
        bad_key, bad_label = "cliff_trajectory", "cliff"
    block = {
        "task": spec.name,
        "optimal_value_start": V[spec.start],
        "optimal_values": {f"{r},{c}": V[(r, c)] for r in range(spec.rows)
                           for c in range(spec.cols) if (r, c) in V},
        "greedy_policy": {"actions": greedy["actions"], "rewards": greedy["rewards"],
                          "return": greedy["return"], "steps": greedy["steps"],
                          "reached_goal": greedy["reached_goal"],
                          "verified": grid_verify(spec, greedy)[0]},
        bad_key: {"actions": bad_traj["actions"], "rewards": bad_traj["rewards"],
                  "return": bad_traj["return"],
                  "verified": grid_verify(spec, bad_traj)[0]},
        "grader_scenarios": scenarios,
        "grader_passed": sum(1 for s in scenarios if s["passed_as_expected"]),
        "grader_total": len(scenarios),
        "random_policy": grid_evaluate_random(spec, seed=seed_random, episodes=200),
        "hack_attempt": hack,
    }
    return block, V, greedy


def main():
    gw, gw_V, gw_greedy = grid_block(GW, seed_random=20261105)
    cliff, cliff_V, cliff_greedy = grid_block(CLIFF, seed_random=20261106)
    Q = grid_train_q(CLIFF, seed=11, episodes=3000)
    q_traj = grid_q_greedy(CLIFF, Q)
    cliff["q_learning"] = {
        "seed": 11, "training_episodes": 3000, "alpha": 0.1, "epsilon": 0.1,
        "greedy_after_training": {"actions": q_traj["actions"],
                                  "return": q_traj["return"],
                                  "steps": q_traj["steps"],
                                  "reached_goal": q_traj["reached_goal"],
                                  "verified": grid_verify(CLIFF, q_traj)[0]}}

    # Bandit
    b_opt = bandit_run_episode(lambda i, h: 1)
    b_scen = []
    ok, r = bandit_verify(b_opt)
    b_scen.append(scenario("valid_optimal", ok, None, r))
    forged = bandit_run_episode(lambda i, h: 0)
    forged["rewards"] = [5] * 10
    forged["return"] = 50
    forged["reached_goal"] = True
    ok, r = bandit_verify(forged)
    b_scen.append(scenario("tampered_reward", ok, "reward_mismatch", r))
    t = copy.deepcopy(b_opt); t["return"] = 55
    ok, r = bandit_verify(t)
    b_scen.append(scenario("wrong_return_claim", ok, "return_mismatch", r))
    # Payoff forgery is the tampered log above; the specific hack scenario
    # re-checks it under its post-mortem name with the same expected reason.
    ok, r = bandit_verify(forged)
    b_scen.append(scenario("payoff_forgery", ok, "reward_mismatch", r))
    b_trained, b_chosen, b_means = bandit_explore_then_exploit()
    bandit = {
        "task": "bandit-3arm-deterministic", "payoffs": [2, 5, 3],
        "horizon": 10,
        "optimal_policy": {"actions": b_opt["actions"], "rewards": b_opt["rewards"],
                           "return": b_opt["return"],
                           "verified": bandit_verify(b_opt)[0]},
        "grader_scenarios": b_scen,
        "grader_passed": sum(1 for s in b_scen if s["passed_as_expected"]),
        "grader_total": len(b_scen),
        "random_policy": bandit_evaluate_random(seed=20261107, episodes=200),
        "explore_then_exploit": {"explore_per_arm": 10, "observed_means": b_means,
                                 "chosen_arm": b_chosen,
                                 "eval_return": b_trained["return"],
                                 "verified": bandit_verify(b_trained)[0]},
        "hack_attempt": {"name": "payoff_forgery",
                         "verifier_caught": True,
                         "detail": "arm 0 pulls logged with arm 1 payoffs rejected "
                                   "with reward_mismatch; a log that also rewrites "
                                   "the arm is internally consistent and replay "
                                   "cannot catch it (named limit)"},
    }

    # Sequence
    s_opt = seq_run_episode(lambda i, h: TARGET[i])
    s_scen = []
    ok, r = seq_verify(s_opt)
    s_scen.append(scenario("valid_perfect", ok, None, r))
    zero = seq_run_episode(lambda i, h: 0)
    claimed = copy.deepcopy(zero)
    claimed["rewards"] = [3, 3, 3, 3]
    claimed["return"] = 12
    claimed["reached_goal"] = True
    ok, r = seq_verify(claimed)
    s_scen.append(scenario("tampered_reward", ok, "reward_mismatch", r))
    t = copy.deepcopy(s_opt); t["return"] = 15
    ok, r = seq_verify(t)
    s_scen.append(scenario("wrong_return_claim", ok, "return_mismatch", r))
    ok, r = seq_verify(claimed)
    s_scen.append(scenario("reward_claiming_without_recall", ok, "reward_mismatch", r))
    seq = {
        "task": "sequence-memory-4", "target": list(TARGET),
        "optimal_policy": {"actions": s_opt["actions"], "rewards": s_opt["rewards"],
                           "return": s_opt["return"], "accuracy": s_opt["accuracy"],
                           "verified": seq_verify(s_opt)[0]},
        "always_zero": {"actions": zero["actions"], "rewards": zero["rewards"],
                        "return": zero["return"], "accuracy": zero["accuracy"],
                        "verified": seq_verify(zero)[0]},
        "grader_scenarios": s_scen,
        "grader_passed": sum(1 for s in s_scen if s["passed_as_expected"]),
        "grader_total": len(s_scen),
        "random_policy": seq_evaluate_random(seed=20261108, episodes=200),
        "hack_attempt": {"name": "reward_claiming_without_recall",
                         "verifier_caught": True,
                         "detail": "all-zero outputs logged with +3 at every "
                                   "position rejected with reward_mismatch; "
                                   "hardcoding the public target passes and is "
                                   "a named limit, not detected by replay"},
    }

    envs = [gw, cliff, bandit, seq]
    results = {
        "level": "build",
        "environments": envs,
        "environment_count": len(envs),
        "grader_passed_total": sum(e["grader_passed"] for e in envs),
        "grader_total": sum(e["grader_total"] for e in envs),
        "gamma": 1.0,
    }
    path = os.path.join(HERE, "results_build.json")
    with open(path, "w") as f:
        json.dump(results, f, indent=1, sort_keys=True)
        f.write("\n")
    for e in envs:
        print(e["task"], "grader", e["grader_passed"], "of", e["grader_total"])
    print("total grader", results["grader_passed_total"], "of", results["grader_total"])
    print("wrote", path)


if __name__ == "__main__":
    main()
