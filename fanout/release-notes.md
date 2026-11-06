# Release notes: rl-environments-and-verifiers (P26)

One section per release line. Every number below comes from the
level README of that release and the release text on GitHub,
verified with gh release list on 2026-11-05. Every release is a
teaching analogue line: tabular softmax at Deep, no LLM, no KL
penalty, no clipping, and no reference policy, on tiny
deterministic tasks, with reward only from replay verifiers.
The full release text lives on the GitHub releases page:
https://github.com/JesunAhmadUshno/rl-environments-and-verifiers/releases

## v0.1, Learn (2026-11-05)

- What shipped: a dependency-free deterministic 4 by 4
  GridWorld, a replay verifier, and tabular Q-learning, with
  10 hand-computed tests plus the scaffold smoke test.
- Result: value-iteration greedy policy 6 steps, return 4,
  verified; replay verifier graded 6 of 6 scenarios as
  expected; seeded random policy over 200 episodes at mean
  return -17.07, goal rate 0.085, pit rate 0.295; Q-learning
  greedy (seed 7, 3,000 episodes) 6 steps, return 4, reached
  goal.
- Level grade: 8,700 of 10,000.
- Release: https://github.com/JesunAhmadUshno/rl-environments-and-verifiers/releases/tag/v0.1

## v0.5, Build (2026-11-05)

- What shipped: 4 environments (GridWorld, CliffGrid, a 3-arm
  bandit, a sequence memory task), replay verifiers, and
  reward-hacking post-mortems, with 14 new tests (24 tests in
  total at that point, plus the smoke test).
- Result: replay verifiers graded 16 of 16 scenarios as
  expected (4 per environment); CliffGrid Q-learning greedy
  (seed 11, 3,000 episodes) 6 steps, return 4; bandit optimal
  policy return 50 over 10 pulls; sequence perfect policy
  return 12, accuracy 1.0.
- Level grade: 8,500 of 10,000.
- Release: https://github.com/JesunAhmadUshno/rl-environments-and-verifiers/releases/tag/v0.5

## v1.0, Learn, Build, and Deep (2026-11-05)

- What shipped: a GRPO-style RLVR teaching analogue: a tabular
  softmax policy trained by group-relative advantage (groups
  of 16) with reward read only from the Build replay
  verifiers, two measured ablations, written failure modes,
  and 12 new tests (36 tests in total, plus the scaffold
  smoke test). The rest of the v2 Deep scope is named in
  ROADMAP.md as the v1.1 backlog.
- Result: over 500 evaluation episodes (seeds 9101 to 9105),
  sampled success rose from 0.072 to 0.998 on GridWorld (mean
  return -17.666 to 1.882), from 0.01 to 0.996 on CliffGrid
  (mean return -15.776 to 0.724), from 0.0 to 1.0 on the
  bandit (mean return 32.914 to 50.0), and from 0.004 to
  0.982 on the sequence task (mean return -3.02 to 11.91).
  CliffGrid return-mode ablation collapsed to success 0.0;
  bandit success-mode ablation had 0 of 200 informative
  groups.
- Level grade: 8,400 of 10,000.
- Release: https://github.com/JesunAhmadUshno/rl-environments-and-verifiers/releases/tag/v1.0

## Held channels

- Social posts for every release above: HELD under the standing
  platform rules. The loop prepares drafts and never posts;
  Threads needs Jesun's one tap per post.
