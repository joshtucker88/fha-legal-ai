---
name: terminal-helper
description: Plan and run terminal commands safely and efficiently. Use when the user asks for shell commands, environment checks, process inspection, or command output interpretation.
disable-model-invocation: true
---

# Terminal Helper

## Quick Start
1. Clarify the request, available inputs, constraints, and success criteria.
2. Check working directory, existing processes, and command side effects before execution.
3. Prefer scoped, quoted, non-destructive commands and capture useful output.
4. Return the result in the requested format with assumptions and open risks.

## Output Guidance
- Return command results, failures, and next safe command if needed.
- Keep findings concise, traceable, and separated from speculation.
