---
name: docker-helper
description: Work with Docker containers, images, compose files, volumes, and daemon issues. Use when building, running, debugging, or containerizing workflows.
disable-model-invocation: true
---

# Docker Helper

## Quick Start
1. Clarify the request, available inputs, constraints, and success criteria.
2. Check daemon availability, image state, mounts, ports, and container logs.
3. Keep host changes minimal and isolate project work in bind mounts or containers.
4. Return the result in the requested format with assumptions and open risks.

## Output Guidance
- Return exact docker commands, observed errors, and cleanup steps.
- Keep findings concise, traceable, and separated from speculation.
