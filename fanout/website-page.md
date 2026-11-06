# Website project page copy: rl-environments-and-verifiers

Site: jesunahmadushno.com
Status: COPY ONLY, draft for the project page. Dated 2026-11-05.
Nothing on any website was changed by this file.

## Headline

rl-environments-and-verifiers: verifiable rewards and a GRPO-style RLVR teaching analogue you can check by hand

## Summary

rl-environments-and-verifiers is an open reinforcement learning
study built by Jesun Ahmad Ushno as project P26 in Roadmap v3.
It builds sandboxed tasks with verifiable rewards three times:
a small Learn version (one GridWorld, one replay verifier,
Q-learning), a Build version (4 environments, replay verifiers
grading 16 of 16 scenarios, reward-hacking post-mortems), and a
Deep version that trains a tabular policy with GRPO-style
group-relative advantage using verifier reward only. It runs
on the Python standard library only.

One scope fact, stated plainly. This is a teaching analogue,
tabular softmax, no LLM, no KL penalty, no clipping, and no
reference policy, on tiny deterministic tasks. What carries
over from GRPO is the group-relative advantage; what carries
over from RLVR is reward only from a verifier.

Status: v1.0, 2026-11-05. Learn, Build, and Deep are done.
Grades on the house 10,000 scale: Learn 8,700, Build 8,500,
Deep 8,400. Total tests: 36 hand-computed tests, plus the
scaffold smoke test.

## Results (teaching analogue, verifier reward only)

| Level | Scenario | Key result | Notes |
| --- | --- | --- | --- |
| Learn | GridWorld 4 by 4 | Greedy 6 steps, return 4, verified; verifier 6 of 6 scenarios; Q-learning greedy 6 steps, return 4 | 10 tests |
| Build | 4 environments | Replay verifiers 16 of 16 scenarios graded as expected; reward-hacking post-mortems for return inflation, false goal claim, cliff laundering, payoff forgery | 14 tests |
| Deep | GRPO-style RLVR, 500 eval episodes per task | Success 0.072 to 0.998 GridWorld, 0.01 to 0.996 CliffGrid, 0.0 to 1.0 bandit, 0.004 to 0.982 sequence | 12 tests; 2 ablations published |

## Honest limits

- Teaching analogue only: tabular softmax, no LLM, no KL,
  clipping, or critic.
- Tiny deterministic, fully observed tasks only.
- One training seed per task; training-seed variance is
  v1.1 work.
- CliffGrid greedy path is suboptimal (8 steps, return 2,
  against the optimal 6 steps, return 4).

## Links

- GitHub repo: https://github.com/JesunAhmadUshno/rl-environments-and-verifiers
- Release v0.1 (Learn): https://github.com/JesunAhmadUshno/rl-environments-and-verifiers/releases/tag/v0.1
- Release v0.5 (Build): https://github.com/JesunAhmadUshno/rl-environments-and-verifiers/releases/tag/v0.5
- Release v1.0 (Learn, Build, Deep): https://github.com/JesunAhmadUshno/rl-environments-and-verifiers/releases/tag/v1.0
- Tutorial: fanout/tutorial.md in the GitHub repo
- Blog post draft: fanout/blog-post.md in the GitHub repo

## License note

Code: Apache-2.0. Tutorials: CC BY 4.0.
