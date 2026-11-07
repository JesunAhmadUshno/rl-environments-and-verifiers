"""Tests for the Deep extras: unbiased pass@k, the mean-baseline learner,
learning-curve recording and the committed seed-sweep file.
Run: python tests/test_deep_extras.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "level-3-deep"))
from rl_deep import (  # noqa: E402
    CONFIG,
    mean_baseline_advantages,
    pass_at_k_unbiased,
    theta_json,
    train,
)


def test_unbiased_pass_at_k_hand_values():
    assert pass_at_k_unbiased(5, 1, 1) == 0.2
    assert pass_at_k_unbiased(5, 1, 5) == 1.0
    assert pass_at_k_unbiased(10, 0, 3) == 0.0
    # 1 - C(8,2)/C(10,2) = 1 - 28/45
    assert pass_at_k_unbiased(10, 2, 2) == round(1 - 28 / 45, 6)


def test_mean_baseline_has_no_std_normalisation():
    adv, mean, std = mean_baseline_advantages([1.0, 0.0, 0.0, 0.0])
    assert adv == [0.75, -0.25, -0.25, -0.25] and mean == 0.25
    assert abs(std - 0.4330127018922193) < 1e-12


def test_curve_recording_does_not_change_training():
    mode, iterations, lr, seed = CONFIG["gridworld-4x4"]
    curve = []
    a, info_a = train("gridworld-4x4", mode, 20, lr, seed, curve=curve)
    b, info_b = train("gridworld-4x4", mode, 20, lr, seed)
    assert theta_json("gridworld-4x4", a) == theta_json("gridworld-4x4", b)
    assert len(curve) == 20 and sum(f for _, f in curve) == info_a["informative_groups"]


def test_seed_sweep_includes_the_recorded_run():
    seeds = json.load(open(os.path.join(ROOT, "level-3-deep", "results_seeds.json")))
    deep = json.load(open(os.path.join(ROOT, "level-3-deep", "results_deep.json")))
    for t in deep["tasks"]:
        first = seeds["tasks"][t["task"]]["grpo"]["runs"][0]
        assert first["seed"] == t["train"]["seed"]
        assert first["success_rate"] == t["after"]["aggregate"]["success_rate"]
        assert len(seeds["tasks"][t["task"]]["grpo"]["runs"]) == seeds["n_training_seeds"] == 10


if __name__ == "__main__":
    tests = [(n, f) for n, f in sorted(globals().items())
             if n.startswith("test_") and callable(f)]
    for name, fn in tests:
        fn()
        print(name, "PASS")
    print(len(tests), "deep extras tests passed")
