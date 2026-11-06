"""Hand-computed Deep tests for P26. Oracles are in DEEP-SPEC.md."""
import copy
import math
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "level-3-deep"))
import random  # noqa: E402

from rl_deep import (  # noqa: E402
    apply_group_update,
    episode_reward,
    evaluate,
    greedy_episode,
    group_advantages,
    initial_theta,
    sample_episode,
    score_episodes,
    softmax,
    train,
)


def test_softmax_uniform_oracle():
    assert softmax([0.0, 0.0, 0.0, 0.0]) == [0.25, 0.25, 0.25, 0.25]
    probs = softmax([1.0, 2.0, 3.0])
    assert abs(sum(probs) - 1.0) < 1e-12 and probs[2] > probs[1] > probs[0]


def test_advantage_oracle_mixed_group():
    adv, mean, std = group_advantages([1.0, 0.0, 0.0, 0.0])
    assert mean == 0.25 and abs(std - math.sqrt(0.1875)) < 1e-12
    assert round(adv[0], 6) == round(math.sqrt(3), 6)
    for a in adv[1:]:
        assert round(a, 6) == round(-1.0 / math.sqrt(3), 6)
    assert abs(sum(adv)) < 1e-9  # group advantages are zero-mean


def test_advantage_zero_variance_group_is_uninformative():
    adv, mean, std = group_advantages([1.0, 1.0, 1.0, 1.0])
    assert std == 0.0 and adv == [0.0, 0.0, 0.0, 0.0]


def test_single_update_by_hand():
    # DEEP-SPEC oracle 4: uniform probs, group of 2 single-step episodes.
    theta = {"s": [0.0, 0.0, 0.0, 0.0]}
    probs = [0.25, 0.25, 0.25, 0.25]
    episodes = [[("s", 1, probs)], [("s", 0, probs)]]
    adv, _mean, _std = group_advantages([1.0, 0.0])
    assert adv == [1.0, -1.0]
    apply_group_update(theta, episodes, adv, lr=0.5, group_size=2)
    assert theta["s"] == [-0.25, 0.25, 0.0, 0.0]


def test_zero_advantage_makes_no_update():
    theta = {"s": [0.1, -0.2, 0.3, 0.0]}
    before = copy.deepcopy(theta)
    probs = softmax(theta["s"])
    apply_group_update(theta, [[("s", 2, probs)]], [0.0], lr=0.5,
                       group_size=1)
    assert theta == before


def test_pass_at_k_oracle():
    successes = [1, 0, 0, 0, 1, 0, 0, 0, 0]
    scored = score_episodes(successes, [4, -1, -1, -1, 4, -1, -1, -1, -1])
    assert scored["pass_at_1"] == round(2 / 9, 6)
    assert scored["pass_at_3"] == round(2 / 3, 6)
    assert scored["pass_at_5"] == 1.0
    assert scored["success_rate"] == round(2 / 9, 6)
    assert scored["mean_return"] == round(1 / 9, 6)


def test_score_episodes_variance_by_hand():
    scored = score_episodes([1, 0], [4, -11])
    assert scored["mean_return"] == -3.5
    # population variance of [4, -11]: mean -3.5, deviations 7.5, -7.5
    assert scored["return_variance"] == 56.25


def test_reward_modes_read_only_the_checked_trajectory():
    good = {"reached_goal": True, "return": 4}
    bad = {"reached_goal": False, "return": -11}
    assert episode_reward("gridworld-4x4", good, "success") == 1.0
    assert episode_reward("gridworld-4x4", bad, "success") == 0.0
    assert episode_reward("bandit-3arm-deterministic", bad, "return") == -11.0


def test_samplers_produce_verified_trajectories():
    # The samplers assert verifier acceptance internally; reaching the
    # return statement means every sampled trajectory verified.
    for task in ("gridworld-4x4", "cliffgrid-3x5",
                 "bandit-3arm-deterministic", "sequence-memory-4"):
        rng = random.Random(42)
        theta = initial_theta(task)
        for _ in range(5):
            steps, traj = sample_episode(task, theta, rng)
            assert steps and traj["steps"] == len(traj["actions"])


def test_short_training_moves_bandit_toward_best_arm():
    theta, info = train("bandit-3arm-deterministic", "return",
                        iterations=50, lr=0.5, seed=2603)
    assert info["episodes_sampled"] == 50 * 16
    greedy = greedy_episode("bandit-3arm-deterministic", theta)
    assert greedy["return"] == 50 and greedy["verified"]


def test_training_is_deterministic_per_seed():
    theta1, _ = train("sequence-memory-4", "success",
                      iterations=20, lr=0.5, seed=2604)
    theta2, _ = train("sequence-memory-4", "success",
                      iterations=20, lr=0.5, seed=2604)
    assert theta1 == theta2


def test_evaluate_before_policy_is_uniform_random_level():
    # The zero policy on the bandit must score near the Build random
    # level (mean return 32.725 over the Build protocol), not near 50.
    scored = evaluate("bandit-3arm-deterministic",
                      initial_theta("bandit-3arm-deterministic"))
    agg = scored["aggregate"]
    assert agg["episodes"] == 500
    assert 28.0 < agg["mean_return"] < 38.0
    assert agg["pass_at_1"] == agg["success_rate"]


if __name__ == "__main__":
    tests = [(n, f) for n, f in sorted(globals().items())
             if n.startswith("test_") and callable(f)]
    for name, fn in tests:
        fn()
        print(name, "PASS")
    print(len(tests), "deep tests passed")
