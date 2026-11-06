# PUBLICITY: rl-environments-and-verifiers (P26)

Publicity log under the documentation and publishing standard,
Section 7. Every finished level produces its written fan-out set,
each piece graded on the 1,000-point publicity rubric (accuracy 300,
research 200, gap fit 200, clarity 150, reach format 150), ship line
900. Drafts are prepared by the loop. Actual social posting follows
the standing platform rules and gates. The loop itself never posts
to social.

Project state: v1.0, Learn, Build, and Deep done 2026-11-05, 36
hand-computed tests passing plus the scaffold smoke test. Level
grades on record: Learn 8,700 of 10,000, Build 8,500 of 10,000,
Deep 8,400 of 10,000. Honest label, stated in every piece: this is
a teaching analogue, tabular softmax, no LLM, no KL penalty, no
clipping, and no reference policy, on tiny deterministic tasks.

## Actions polish pack (2026-11-05)

Applied through a pull request on 2026-11-05, following the Actions
polish pack standard. The pack adds: CI on a Python 3.11 and 3.12
matrix with a ruff lint step (every pre-existing CI step preserved:
scaffold smoke test, Learn tests and runner, Build tests and
runner, Deep tests and runner), CodeQL scanning, Dependabot for
pip and GitHub Actions, a release workflow that attaches a source
tarball named rl-environments-and-verifiers-<tag>.tar.gz to v* tag
releases, Labeler, Greetings (snake_case inputs for
actions/first-interaction@v3: repo_token, issue_message,
pr_message), Stale in comment-only mode (days-before-close: -1,
never closes), and a docs summary page at docs/index.md for GitHub
Pages. Ruff scope is recorded in ruff.toml (E, F, I, line-length
120). Ruff fixes in this pull request were style only: 38 initial
errors (23 E702 multiple statements on one line split onto separate
lines, 8 I001 import blocks sorted, 5 F401 unused imports removed,
2 F841 unused variables removed), with no change to behaviour, to
any value, or to any string. All three results files
(results_learn.json, results_build.json, results_deep.json) stayed
byte-identical across the runners in this cycle, so no results file
changes in this pull request. requirements.txt records the
standard-library-only fact so Dependabot pip has a manifest to
watch.

| Channel | Outcome on 2026-11-05 |
| --- | --- |
| GitHub Pages | Docs page added at docs/index.md in this pull request. Pages enablement and live build status are verified after merge and recorded in the batch ledger; no live claim is made in this file before that check. |
| PyPI publishing | Held: needs a PyPI token, a new credential. Jesun's tap only. Not set up. |
| Social channels (LinkedIn, X, Facebook, Instagram, Threads) | Held: no posts made. The loop never posts to social; Threads waits for Jesun's tap per post under the standing gates. |

Publicity grade for this polish pack log piece, on the 1,000
point rubric (accuracy 300, research 200, gap fit 200, clarity
150, reach format 150), ship line 900:

| Piece | Accuracy /300 | Research /200 | Gap fit /200 | Clarity /150 | Reach /150 | Total /1000 |
| --- | --- | --- | --- | --- | --- | --- |
| PUBLICITY.md polish pack section (2026-11-05) | 295 | 180 | 195 | 145 | 95 | 910 |

At or above the 900 ship line. Named deductions: research minus
20, because the pack is a standard applied across repos and this
section records its application rather than new research; reach
minus 55, because the docs page is copy in this pull request with
no live Pages claim yet, PyPI publishing is held, and no social
channel carries this piece by the standing gates; accuracy minus
5, gap fit minus 5, and clarity minus 5 for summary compression
of the full pack standard, which lives in the batch files.

## v1.0 fan-out set (2026-11-05)

Written fan-out set prepared in this cycle, in fanout/. Every
piece states plainly that this is a teaching analogue, tabular
softmax, no LLM, no KL penalty, no clipping, and no reference
policy, on tiny deterministic tasks. Every number is sourced
from the repo files (README.md, DOSSIER.md, the three level
READMEs, and the three results files). Tutorial commands were
verified by running them; the full suite (36 hand-computed
tests plus the scaffold smoke test) passes, and all three
results files stayed byte-identical across the runners.

Overall fan-out grade: 9,462 of 10,000 (the mean of the six
piece grades below, scaled to 10,000: 5,677 of 6,000).

Jev claim_check on the blog main results claim (extracted byte
exact from fanout/blog-post.md by script): model jev-1.13.0,
745 input tokens, 20 output tokens, question id supported,
noul 0.87, route CLEAR (claim_check bands: clear at 0.85 or
above, block at 0.10 or below, review between). Spec and
results are in the goal hidden_files
(jev-p26-fanout-claim-spec-2026-11-05.json and
jev-p26-fanout-claim-results-2026-11-05.json).

| Channel | Piece | Outcome on 2026-11-05 |
| --- | --- | --- |
| GitHub release v0.1 | Learn release | Live: https://github.com/JesunAhmadUshno/rl-environments-and-verifiers/releases/tag/v0.1 |
| GitHub release v0.5 | Build release | Live: https://github.com/JesunAhmadUshno/rl-environments-and-verifiers/releases/tag/v0.5 |
| GitHub release v1.0 | Learn, Build, Deep release | Live: https://github.com/JesunAhmadUshno/rl-environments-and-verifiers/releases/tag/v1.0 |
| GitHub Pages | Docs summary page | Live, built: https://jesunahmadushno.github.io/rl-environments-and-verifiers/ (legacy, main, /docs, verified HTTP 200 after the polish pack merge) |
| Repo (blog) | Blog post draft | fanout/blog-post.md, repo draft. Not posted to any blog platform. |
| Repo (tutorial) | Tutorial draft | fanout/tutorial.md, repo draft. Every command verified by running it in this cycle. |
| Repo (website) | Website page copy draft | fanout/website-page.md, copy only. No website was changed by this file. |
| LinkedIn | Post draft | fanout/linkedin-post.md, DRAFT NOT POSTED. Held: posting follows the standing platform rules; the link is carried as the first-comment line in the draft, per the LinkedIn rule. |
| Paper | Candidate brief | fanout/paper-candidate.md. Submission is Jesun's tap; nothing submitted, no venue contacted. |
| Repo (release notes) | Release notes | fanout/release-notes.md, covering v0.1, v0.5, and v1.0 with results and release links verified with gh release list. |
| X | Social post | Held: no post made. The loop never posts to social; drafts only under the standing platform rules. |
| Facebook | Social post | Held: no post made. Standing Facebook rule applies (no link in body or comments, keyword call to action by DM) and the loop never posts to social. |
| Instagram | Social post | Held: no post made. Standing Instagram rule applies (link in bio) and the loop never posts to social. |
| Threads | Social post | Held: awaiting Jesun's tap. Every Threads post needs his one-tap pre-approval, hash-locked on exact text and media. |
| Video | 3D playbook video | Held: flagship video production runs through the January engine queue. No video produced in this cycle. |
| Book | Book chapter | Held: chapter drafted from finished projects under the journey publishing plan; no chapter file is claimed in this cycle. |

Per-piece publicity grades, on the 1,000-point rubric (accuracy
300, research 200, gap fit 200, clarity 150, reach format 150),
ship line 900:

| Piece | Accuracy /300 | Research /200 | Gap fit /200 | Clarity /150 | Reach /150 | Total /1000 |
| --- | --- | --- | --- | --- | --- | --- |
| fanout/blog-post.md | 295 | 186 | 195 | 143 | 137 | 956 |
| fanout/tutorial.md | 298 | 184 | 195 | 148 | 138 | 963 |
| fanout/website-page.md | 295 | 174 | 190 | 145 | 140 | 944 |
| fanout/linkedin-post.md | 290 | 168 | 190 | 143 | 145 | 936 |
| fanout/paper-candidate.md | 293 | 186 | 190 | 140 | 123 | 932 |
| fanout/release-notes.md | 298 | 182 | 186 | 145 | 135 | 946 |
| PUBLICITY.md fan-out section (this section) | 295 | 175 | 190 | 145 | 130 | 935 |

All six fan-out pieces are at or above the 900 ship line. Named
deductions: accuracy loses 2 to 10 per piece for summary
compression of the level READMEs (the full method, oracle, and
per-seed tables live in the level folders, not in the fan-out
pieces); research loses 14 to 32 per piece because the fan-out
reports measured repo work and names prior art from DOSSIER.md
and NOVELTY.md rather than adding new external research, and
the paper brief names no venue; gap fit loses 5 to 10 per
piece because the teaching analogue (tabular, no LLM) caps how
far any piece can speak to real LLM reinforcement learning
roles; clarity loses 2 to 10 per piece for the repeated
teaching analogue and no LLM lines, which are mandatory
honesty and cost reading flow; reach loses 5 to 27 per piece
because every social channel is held under the standing gates,
the paper is an unsubmitted brief, and no live website or blog
publication exists yet, so reach is draft reach, not published
reach.
