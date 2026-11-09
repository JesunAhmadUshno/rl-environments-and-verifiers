# 0003: Code and results stay in the three stage folders

Date: 2026-11-08. Status: accepted.

## Context

The portfolio standard v2 layout names src/, experiments/ and results/.
This repo keeps code, specs and results in level-1-learn/,
level-2-build/ and level-3-deep/. The dashboard build, the CI byte-parity
diff, the tests, the release tarballs and the fan-out drafts all name
these paths.

## Decision

Keep the three folders and map them in the README layout table as
baseline, build and evaluate. Each results file is the deterministic
output of the runner beside it, with no external raw data, so there is
no separate evidence to move into experiments/.

## Consequences

No path breaks. If a later study adds raw evidence that is not produced
by a runner (for example a GPU run's logs), it goes into a dated
experiments/ folder with a results script, per the standard.
