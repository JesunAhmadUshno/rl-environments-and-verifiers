# 0001: A tabular, standard-library teaching analogue, not an LLM GRPO run

Date: 2026-11-05 (recorded 2026-11-08). Status: accepted.

## Context

SPEC.md (now PROPOSAL.md) asked for a GRPO or RLVR run against the
environments. A real GRPO run on a language model needs one GPU with at
least 24 GB of memory for tens of GPU-hours.

## Decision

Build every stage in the Python standard library on CPU: four tiny
deterministic environments, replay verifiers, and a tabular softmax
policy trained by a group-relative advantage, with no KL penalty, no
clipping and no reference policy. Every public piece says so first.

## Consequences

Every number is byte-reproducible in seconds and can be re-run in a
browser, but nothing here measures language-model training. External
validity is the main open threat; the language-model run is backlog
item 1 in REPORT.md and needs the Owner's approval for GPU time.
