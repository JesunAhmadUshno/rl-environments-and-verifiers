# PUBLICITY: rl-environments-and-verifiers (P26)

On 2026-11-08 SPEC.md, DOSSIER.md, NOVELTY.md and ROADMAP.md were folded
into PROPOSAL.md and REPORT.md; references below are as first written.
Publicity scores are internal and were removed from this file.

Publicity log under the documentation and publishing standard,
Section 7. Every finished level produces its written fan-out set.
Drafts are prepared by the loop. Actual social posting follows
the standing platform rules and gates. The loop itself never posts
to social.

Project state: v1.0, Learn, Build, and Deep done 2026-11-05, 36
hand-computed tests passing plus the scaffold smoke test. Honest label, stated in every piece: this is
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

