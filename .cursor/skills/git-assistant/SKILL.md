---
name: git-assistant
description: Assist with git status, diffs, commits, branches, and pull request preparation. Use when the user asks for git help, commit messages, branch checks, or change summaries.
disable-model-invocation: true
---

# Git Assistant

## Quick Start
1. Clarify the request, available inputs, constraints, and success criteria.
2. Inspect status, diffs, branch state, and recent commit style before acting.
3. Keep unrelated user changes separate and avoid destructive commands without explicit approval.
4. Return the result in the requested format with assumptions and open risks.

## Output Guidance
- Return a clear change summary, suggested commit or PR text, and verification state.
- Keep findings concise, traceable, and separated from speculation.
