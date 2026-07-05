---
name: code-review
description: Review code changes for correctness, security, maintainability, and tests. Use when reviewing diffs, pull requests, or asking for a code review.
disable-model-invocation: true
---

# Code Review

## Quick Start
1. Clarify the request, available inputs, constraints, and success criteria.
2. Prioritize bugs, regressions, security issues, and missing tests over style.
3. Ground each finding in exact code behavior and expected impact.
4. Return the result in the requested format with assumptions and open risks.

## Output Guidance
- Return findings first, ordered by severity, with concise remediation notes.
- Keep findings concise, traceable, and separated from speculation.
