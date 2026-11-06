"""Hand-computed Build tests for P26. Oracles are in BUILD-SPEC.md."""
import copy
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                                "level-2-build"))
from rl_build import (CLIFF, GW, PAYOFFS, TARGET, bandit_evaluate_random,
                      bandit_explore_then_exploit, bandit_run_episode,
                      bandit_verify, grid_evaluate_random, grid_greedy_policy,
                      grid_q_greedy, grid_run_episode, grid_step,
                      grid_train_q, grid_value_iteration, grid_verify,
                      seq_evaluate_random, seq_run_episode, seq_verify)


def test_gridworld_oracles_still_hold():
    V = grid_value_iteration(GW)
    assert V[(0, 0)] == 4 and V[(2, 3)] == 9
    traj = grid_run_episode(GW, grid_greedy_policy(GW, V))
    assert traj["actions"] == [1, 1, 1, 2, 2, 2]
    assert traj["rewards"] == [-1, -1, -1, -1, -1, 9] and traj["return"] == 4
    assert grid_verify(GW, traj)[0]


def test_cliff_step_rules():
    assert grid_step(CLIFF, (2, 0), 1) == ((2, 1), -11, True)   # cliff: -1 -10
    assert grid_step(CLIFF, (1, 4), 2) == ((2, 4), 9, True)     # goal: -1 +10
    assert grid_step(CLIFF, (2, 0), 0) == ((1, 0), -1, False)   # up is safe
    assert grid_step(CLIFF, (0, 0), 0) == ((0, 0), -1, False)   # off grid: stay


def test_cliff_optimal_values_and_path():
    V = grid_value_iteration(CLIFF)
    expected = {(2, 0): 4, (1, 0): 5, (1, 1): 6, (1, 2): 7, (1, 3): 8,
                (1, 4): 9, (0, 4): 8, (0, 0): 4, (2, 4): 0, (2, 2): 0}
    for s, v in expected.items():
        assert V[s] == v, (s, V[s], v)
    traj = grid_run_episode(CLIFF, grid_greedy_policy(CLIFF, V))
    assert traj["actions"] == [0, 1, 1, 1, 1, 2]
    assert traj["rewards"] == [-1, -1, -1, -1, -1, 9] and traj["return"] == 4
    assert grid_verify(CLIFF, traj)[0]


def test_cliff_trajectory_oracle():
    traj = grid_run_episode(CLIFF, lambda s, i: 1)
    assert traj["rewards"] == [-11] and traj["return"] == -11
    assert traj["ended_in_bad"] and traj["terminal"] and traj["steps"] == 1


def test_cliff_verifier_rejects_laundering_and_tamper():
    traj = grid_run_episode(CLIFF, lambda s, i: 1)
    t = copy.deepcopy(traj)
    t["states"][1] = [1, 0]; t["rewards"][0] = -1; t["return"] = -1; t["terminal"] = False
    ok, r = grid_verify(CLIFF, t)
    assert not ok and "illegal_transition" in r and "reward_mismatch" in r
    good = grid_run_episode(CLIFF, grid_greedy_policy(CLIFF, grid_value_iteration(CLIFF)))
    t = copy.deepcopy(good); t["return"] += 5
    ok, r = grid_verify(CLIFF, t); assert not ok and "return_mismatch" in r


def test_cliff_q_learning_greedy_is_optimal():
    Q = grid_train_q(CLIFF, seed=11, episodes=3000)
    traj = grid_q_greedy(CLIFF, Q)
    assert traj["reached_goal"] and traj["steps"] == 6 and traj["return"] == 4
    assert grid_verify(CLIFF, traj)[0]


def test_bandit_oracles():
    assert PAYOFFS == (2, 5, 3)
    opt = bandit_run_episode(lambda i, h: 1)
    assert opt["rewards"] == [5] * 10 and opt["return"] == 50 and bandit_verify(opt)[0]
    assert bandit_run_episode(lambda i, h: 0)["return"] == 20
    assert bandit_run_episode(lambda i, h: 2)["return"] == 30


def test_bandit_verifier_rejects_payoff_forgery():
    forged = bandit_run_episode(lambda i, h: 0)
    forged["rewards"] = [5] * 10; forged["return"] = 50; forged["reached_goal"] = True
    ok, r = bandit_verify(forged)
    assert not ok and "reward_mismatch" in r


def test_bandit_explore_then_exploit():
    traj, chosen, means = bandit_explore_then_exploit()
    assert means == [2.0, 5.0, 3.0] and chosen == 1
    assert traj["return"] == 50 and bandit_verify(traj)[0]


def test_bandit_random_deterministic():
    a = bandit_evaluate_random(seed=20261107, episodes=200)
    assert a == bandit_evaluate_random(seed=20261107, episodes=200)
    assert a["mean_return"] < 50


def test_sequence_oracles():
    perfect = seq_run_episode(lambda i, h: TARGET[i])
    assert perfect["rewards"] == [3, 3, 3, 3] and perfect["return"] == 12
    assert perfect["accuracy"] == 1.0 and seq_verify(perfect)[0]
    zero = seq_run_episode(lambda i, h: 0)
    assert zero["rewards"] == [-2, 3, -2, -2] and zero["return"] == -3
    assert zero["accuracy"] == 0.25 and seq_verify(zero)[0]


def test_sequence_verifier_rejects_reward_claiming():
    claimed = seq_run_episode(lambda i, h: 0)
    claimed["rewards"] = [3, 3, 3, 3]; claimed["return"] = 12; claimed["reached_goal"] = True
    ok, r = seq_verify(claimed)
    assert not ok and "reward_mismatch" in r


def test_sequence_random_deterministic():
    a = seq_evaluate_random(seed=20261108, episodes=200)
    assert a == seq_evaluate_random(seed=20261108, episodes=200)
    assert a["mean_return"] < 12


def test_grid_random_deterministic():
    a = grid_evaluate_random(CLIFF, seed=20261106, episodes=200)
    assert a == grid_evaluate_random(CLIFF, seed=20261106, episodes=200)
    assert a["goal_rate"] <= 1.0 and a["bad_rate"] <= 1.0


if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for fn in fns:
        fn()
        print("PASS", fn.__name__)
    print(len(fns), "Build tests passed")
