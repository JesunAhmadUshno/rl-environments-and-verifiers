# DOSSIER: rl-environments-and-verifiers (P26)

Written under the documentation and publishing standard (past, present, future). Updated at ship time. v1.0 ship state, 2026-11-05.

## Past

Prior art for this project is named in NOVELTY.md (RL environment libraries (verifiers class) and gym-style task sets). The history of the problem, the key papers and systems, and what was tried before are recorded in the Roadmap v2 section text in SPEC.md.

## Present

Shipped at v1.0, 2026-11-05, all dependency-free Python stdlib on CPU:

- Learn (Level 1): one deterministic 4 by 4 GridWorld with a replay verifier and grader suite. Grade 8,700 of 10,000. Record: level-1-learn/README.md.
- Build (Level 2): four environments (GridWorld, CliffGrid, a 3-arm deterministic bandit, a sequence-memory task), replay verifiers grading 16 of 16 scenarios, and a reward-hacking post-mortem per environment. Grade 8,500 of 10,000. Record: level-2-build/README.md.
- Deep (Level 3, compressed): a GRPO-style RLVR teaching analogue, a tabular softmax policy trained by group-relative advantage with reward read only from the Build replay verifiers. Sampled success over 500 evaluation episodes rose from 0.072 to 0.998 (GridWorld), 0.01 to 0.996 (CliffGrid), 0.0 to 1.0 (bandit), and 0.004 to 0.982 (sequence), with two measured ablations (the CliffGrid return-mode cliff trap and the bandit binary-reward dead end). Grade 8,400 of 10,000. Record: level-3-deep/README.md and DEEP-SPEC.md.

Current demand evidence: hiring value scored in the fleet pass (new candidates P23 to P29: see the decision pack Sections 4 and 5) [confirmed, fleet and scoring pass 2026-11-04; for P23 to P29, the decision pack 2026-11-04]. The Round 3 research (2026-11-04) found the market centre at post-training, evals, environments, and inference depth [confirmed as the research finding; the report is at ~/workspace/research_notes/roadmap-v3-revaluation-research-20261104-0949/report.md].

## Future

The v1.1 backlog is ROADMAP.md at the repo root: a real LLM GRPO run, P27 harness integration when that harness exists, training-seed variance, step-level credit, uninformative-group mitigation, stochastic environment variants, and held-out sequence targets. Any forecast about this field is [unverified] unless a dated primary source is added here.
