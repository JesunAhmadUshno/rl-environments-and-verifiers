# SPEC: rl-environments-and-verifiers (P26)

Phase skill: spec-driven-development (house engineering pipeline).
Status: Wave 0 scaffold spec, from Roadmap v2 text and the v3 decision pack. Scope and acceptance criteria below are the v2 section text, kept as the source of truth until the project's wave opens its own spec pass.

Fleet node: BlackBox (GPU). Wave: Wave 6 (after P10).
Hiring evidence: scored in the fleet pass (new candidates P23 to P29: see the decision pack Sections 4 and 5) [confirmed, fleet and scoring pass 2026-11-04, or the decision pack for P23 to P29].

## Project section text (Roadmap v2, or the v3 candidate text for P23 to P29)

Subject: RL environments and verifiers, the top-ranked addition in the Round 3 research (2026-11-04) [confirmed as the research ranking].
- Learn: one small sandboxed task with a verifiable reward and a grader test suite.
- Build: 3 to 5 environments with grader tests and a reward-hacking post-mortem each.
- Deep: a GRPO or RLVR run against the environments, before and after numbers scored by the P27 harness where it exists, else by P06 patterns.

## Acceptance criteria (scaffold level)

- Learn closes when the level-1-learn code runs, its README teaches the idea, and a fresh-eyes reader can follow it.
- Build closes when the system runs end to end, tests pass, and one benchmark or result table with method is in the README.
- Deep closes when the Deep scope in the section text is done, the failure modes are written, and the dossier is updated to ship state.
- No level closes on a claim. Evidence only: code, tests, numbers, links.
