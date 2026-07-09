---
id: intro
title: Keyboard
sidebar_position: 1
---

# Keyboard

**Status: not found in the codebase surveyed for this documentation.** A keyboard input path is a natural development/testing convenience for exercising the pipeline without physical controller hardware, but it isn't part of the Capstone Proposal's phased input roadmap (Xbox Controller → iPhone IMU → Quest 3 hand tracking → custom haptic controller — see [Input](/docs/spine-nodes/input/intro)), and no implementation of it exists in this codebase.

## What it would need to produce

Per the proposal's architecture, every input node publishes a raw 4×4 delta transform, cleaned downstream by [Purifier](/docs/spine-nodes/purifier/intro) before reaching [Kinematics Engine](/docs/spine-nodes/kinematics-engine/intro). No specific key mapping or axis discretization scheme has been implemented or specified.

## See also

- [Input Overview](/docs/spine-nodes/input/intro) — the full roadmap and its status
- [Xbox Controller](/docs/spine-nodes/input/xbox-controller/intro) — the proposal's actual Phase 1 baseline device
