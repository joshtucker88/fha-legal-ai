# Utility Belt Harness

Use this project workflow at chat startup and before substantial work.

## Order Of Operations

1. Cursor (`gpt5.5 x-high fast`) > Codex: builders; hands-on implementation with fast, efficient output.
2. Openscr: use exact permitted GitHub agent source where available; preserve licensing and attribution.
3. Daytona: sandboxing when available; use `/tmp` scratch while key access is pending.
4. Greptile: review gate.
5. Grep-loop: fix -> rerun -> review -> repeat until clean.
6. Svelte + Convex: cockpit stack.

## Guardrails

- Do not store or use passwords, sudo credentials, API keys, or other secrets in project files.
- Treat any credential pasted into chat as exposed and recommend rotation.
- Prefer the fastest safe path that preserves source integrity, licensing, and reviewability.
