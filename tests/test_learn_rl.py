"""Hand-computed Learn tests for P26. Oracles are in LEARN-SPEC Sections 2-3."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                                "level-1-learn"))
from rl_learn import (GOAL, PIT, START, evaluate_random, greedy_action,
                      make_greedy_policy, q_greedy_trajectory, run_episode,
                      step, train_q_learning, value_iteration,
                      verify_trajectory)

V = value_iteration()


def test_step_rules():
    assert step((0, 0), 1) == ((0, 1), -1, False)          # right
    assert step((2, 3), 2) == ((3, 3), 9, True)            # into goal: -1 + 10
    assert step((2, 0), 2) == ((3, 0), -6, True)           # into pit: -1 - 5
    assert step((0, 0), 0) == ((0, 0), -1, False)          # off grid: stay
    assert step((0, 0), 3) == ((0, 0), -1, False)          # off grid: stay
    assert step((0, 1), 2) == ((0, 1), -1, False)          # wall (1,1): stay
    assert step((0, 2), 2) == ((0, 2), -1, False)          # wall (1,2): stay
    assert step((2, 1), 0) == ((2, 1), -1, False)          # wall from below


def test_optimal_values_hand_computed():
    expected = {(3, 3): 0, (2, 3): 9, (3, 2): 9, (1, 3): 8, (2, 2): 8,
                (3, 1): 8, (0, 3): 7, (2, 1): 7, (0, 2): 6, (2, 0): 6,
                (0, 1): 5, (1, 0): 5, (0, 0): 4, (3, 0): 0}
    for state, value in expected.items():
        assert V[state] == value, (state, V[state], value)


def test_greedy_path_is_the_hand_path():
    traj = run_episode(make_greedy_policy(V))
    assert traj["actions"] == [1, 1, 1, 2, 2, 2]
    assert traj["rewards"] == [-1, -1, -1, -1, -1, 9]
    assert traj["return"] == 4 and traj["steps"] == 6
    assert traj["reached_goal"] and traj["terminal"]


def test_pit_trajectory():
    traj = run_episode(lambda s, i: [2, 2, 2][i] if i < 3 else 0)
    assert traj["rewards"] == [-1, -1, -6]
    assert traj["return"] == -8 and traj["ended_in_pit"] and traj["terminal"]


def test_timeout_is_not_terminal():
    traj = run_episode(lambda s, i: 0)  # always up: stays at start
    assert traj["steps"] == 20 and traj["return"] == -20
    assert not traj["terminal"] and not traj["reached_goal"]


def test_verifier_accepts_valid():
    traj = run_episode(make_greedy_policy(V))
    ok, reasons = verify_trajectory(traj)
    assert ok and reasons == []


def test_verifier_rejects_tampering():
    import copy
    traj = run_episode(make_greedy_policy(V))
    t = copy.deepcopy(traj); t["rewards"][0] = 0
    ok, r = verify_trajectory(t); assert not ok and "reward_mismatch" in r
    t = copy.deepcopy(traj); t["states"][2] = [3, 3]
    ok, r = verify_trajectory(t); assert not ok and "illegal_transition" in r
    t = copy.deepcopy(traj); t["return"] += 5
    ok, r = verify_trajectory(t); assert not ok and "return_mismatch" in r
    t = copy.deepcopy(traj); t["states"][0] = [1, 0]
    ok, r = verify_trajectory(t); assert not ok and "bad_start" in r
    pit = run_episode(lambda s, i: [2, 2, 2][i] if i < 3 else 0)
    t = copy.deepcopy(pit); t["reached_goal"] = True
    ok, r = verify_trajectory(t); assert not ok and "goal_claim_false" in r


def test_random_policy_deterministic_and_bounded():
    a = evaluate_random(seed=20261105, episodes=200)
    b = evaluate_random(seed=20261105, episodes=200)
    assert a == b
    assert 0.0 <= a["goal_rate"] <= 1.0 and a["episodes"] == 200
    # Random play cannot beat the optimal return of 4 on average.
    assert a["mean_return"] < 4


def test_q_learning_greedy_is_optimal():
    Q = train_q_learning(seed=7, episodes=3000)
    traj = q_greedy_trajectory(Q)
    assert traj["reached_goal"] and traj["steps"] == 6 and traj["return"] == 4
    assert verify_trajectory(traj)[0]


def test_q_learning_deterministic():
    assert train_q_learning(seed=7, episodes=200) == train_q_learning(seed=7, episodes=200)


if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for fn in fns:
        fn()
        print("PASS", fn.__name__)
    print(len(fns), "Learn tests passed")
