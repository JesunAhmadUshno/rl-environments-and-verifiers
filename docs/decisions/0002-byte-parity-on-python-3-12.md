# 0002: Results byte parity is checked on Python 3.12

Date: 2026-11-07 (recorded 2026-11-08). Status: accepted.

## Context

Python 3.12 changed float `sum()` to compensated summation. The runners
sum floats, so a results file written on 3.12 differs in the last digits
from one written on 3.11.

## Decision

The committed results files are the Python 3.12 output. CI runs the
tests and the runners on 3.11 and 3.12, and checks that the runners
reproduce the committed files byte for byte only on 3.12.

## Consequences

A reader on Python 3.11 can run everything but will see last-digit
differences in the results files. Moving the reference to a later Python
means regenerating every results file in one pull request.
