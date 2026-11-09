# PROPOSAL: rl-environments-and-verifiers (P26)

Status: NOT LOCKED. This repo is not pre-registered. Git history shows
the first commit (509d243, 2026-11-04) held a scaffold scope (SPEC.md
below) with no hypotheses, pass lines or analysis plan, and the Deep
design with its pre-stated directions (level-3-deep/DEEP-SPEC.md) was
committed in the same commit as the code and results (babbbdd). No tag
marks a plan made before results, and none is added after the fact.

This file gathers the planning record that existed (SPEC.md, NOVELTY.md
and DOSSIER.md, folded in on 2026-11-08 and kept as written) so the
proposal stage has one home.

## Question

If the only reward signal is a replay verifier that recomputes every step
of a logged episode, can a GRPO-style group-relative update still train a
policy to solve the task, and which reward definitions break it? (Stated
explicitly in the 2026-11-07 research review; implicit in the scope
below.)

## Pre-stated directions (not a pre-registration)

DEEP-SPEC.md, section "Expected direction (pre-stated)", lists six
directional predictions (D1 to D6), scored in REPORT.md. They carry no
numeric pass line and were committed with the results.

## What a confirmatory cycle needs

A new PROPOSAL lock, tagged before any new run, with: hypotheses that
carry numeric pass lines and a CONFIRMED / REFUTED / INCONCLUSIVE rule;
fresh training and evaluation seeds never used in the exploratory runs;
the baselines (REINFORCE with a mean baseline, Q-learning) fixed in
advance; and a held-out target set for the sequence task. METHOD section
7 lists P26 for such a re-run; it is not part of this migration and
waits for the Owner.

## Original scope (formerly SPEC.md, committed 509d243)

Phase skill: spec-driven-development (house engineering pipeline).
Status: Wave 0 scaffold spec, from Roadmap v2 text and the v3 decision pack. Scope and acceptance criteria below are the v2 section text, kept as the source of truth until the project's wave opens its own spec pass.

Fleet node: BlackBox (GPU). Wave: Wave 6 (after P10).
Hiring evidence: scored in the fleet pass (new candidates P23 to P29: see the decision pack Sections 4 and 5) [confirmed, fleet and scoring pass 2026-11-04, or the decision pack for P23 to P29].

### Project section text (Roadmap v2, or the v3 candidate text for P23 to P29)

Subject: RL environments and verifiers, the top-ranked addition in the Round 3 research (2026-11-04) [confirmed as the research ranking].
- Learn: one small sandboxed task with a verifiable reward and a grader test suite.
- Build: 3 to 5 environments with grader tests and a reward-hacking post-mortem each.
- Deep: a GRPO or RLVR run against the environments, before and after numbers scored by the P27 harness where it exists, else by P06 patterns.

### Acceptance criteria (scaffold level)

- Learn closes when the level-1-learn code runs, its README teaches the idea, and a fresh-eyes reader can follow it.
- Build closes when the system runs end to end, tests pass, and one benchmark or result table with method is in the README.
- Deep closes when the Deep scope in the section text is done, the failure modes are written, and the dossier is updated to ship state.
- No level closes on a claim. Evidence only: code, tests, numbers, links.

## Prior work and proposed novelty (formerly NOVELTY.md)

Status: DRAFT, PROPOSED. Not verified. This text does not move into any public post, paper, or profile until the Jev claim_check gate passes on the exact text.

### Proposed claim

Against RL environment libraries (verifiers class) and gym-style task sets: this project aims to differ in the way its SPEC.md section text defines (a from-zero or self-hosted build, measured in public, on a named home fleet, with the failure modes written down). The exact difference is stated at the project's wave, after the prior art is re-read.

### Prior art table

| Prior art | What it does | What this project does differently | Measured difference |
| --- | --- | --- | --- |
| RL environment libraries (verifiers class) and gym-style task sets | See DOSSIER.md, Past | PROPOSED, see the claim above | NO MEASUREMENT YET |

### Honest size

If the novelty proves small, this file will say so and name the real value instead (a cleaner reproduction, a better benchmark, a first public dataset). No novelty is invented to fill this section.

The 2026-11-07 research review replaced the placeholder above with a
reference list and an honest novelty position: small, a teaching and
reproducibility contribution rather than a methods contribution
(REPORT.md, Related work and novelty).

## Past, present, future (formerly DOSSIER.md)

Written under the documentation and publishing standard (past, present, future). Updated at ship time. v1.0 ship state, 2026-11-05.

### Past

Prior art for this project is named in NOVELTY.md (RL environment libraries (verifiers class) and gym-style task sets). The history of the problem, the key papers and systems, and what was tried before are recorded in the Roadmap v2 section text in SPEC.md.

### Present

Shipped at v1.0, 2026-11-05, all dependency-free Python stdlib on CPU:

- Learn (Level 1): one deterministic 4 by 4 GridWorld with a replay verifier and grader suite. Record: level-1-learn/README.md.
- Build (Level 2): four environments (GridWorld, CliffGrid, a 3-arm deterministic bandit, a sequence-memory task), replay verifiers grading 16 of 16 scenarios, and a reward-hacking post-mortem per environment. Record: level-2-build/README.md.
- Deep (Level 3, compressed): a GRPO-style RLVR teaching analogue, a tabular softmax policy trained by group-relative advantage with reward read only from the Build replay verifiers. Sampled success over 500 evaluation episodes rose from 0.072 to 0.998 (GridWorld), 0.01 to 0.996 (CliffGrid), 0.0 to 1.0 (bandit), and 0.004 to 0.982 (sequence), with two measured ablations (the CliffGrid return-mode cliff trap and the bandit binary-reward dead end). Record: level-3-deep/README.md and DEEP-SPEC.md.

Current demand evidence: hiring value scored in the fleet pass (new candidates P23 to P29: see the decision pack Sections 4 and 5) [confirmed, fleet and scoring pass 2026-11-04; for P23 to P29, the decision pack 2026-11-04]. The Round 3 research (2026-11-04) found the market centre at post-training, evals, environments, and inference depth [confirmed as the research finding; the report is at ~/workspace/research_notes/roadmap-v3-revaluation-research-20261104-0949/report.md].

### Future

The v1.1 backlog is ROADMAP.md at the repo root (now the v1.1 backlog in REPORT.md): a real LLM GRPO run, P27 harness integration when that harness exists, training-seed variance, step-level credit, uninformative-group mitigation, stochastic environment variants, and held-out sequence targets. Any forecast about this field is [unverified] unless a dated primary source is added here.
