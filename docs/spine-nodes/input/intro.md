---
id: intro
title: Input
sidebar_position: 1
---

# Input

**Status: no input node implementation was found in the codebase surveyed for this documentation.** This page describes the proposal's "Operator Input & Visualization Roadmap" — a real, phased design, not fabricated — but there is no keyboard, Xbox controller, or iPhone IMU code behind it yet.

## The proposed shape of an input node

The proposal treats operator input as its own design problem: each input source is meant to be an independent Spine node publishing a raw 4×4 delta transform, so the input layer can be swapped or run in parallel without touching the control/kinematics layers downstream. Whatever the eventual message shape is, it needs to reach [Kinematics Engine](/docs/spine-nodes/kinematics-engine/intro) — the one real downstream node — which today expects a displacement it composes against the current end-effector pose via matrix multiplication, consistent with a 4×4 transform.

## Roadmap (per the proposal)

| Phase | Input source | Status |
|---|---|---|
| Phase 1 | [Xbox Controller](/docs/spine-nodes/input/xbox-controller/intro) | Baseline device for early validation — not found in codebase |
| Phase 1–2 | [iPhone IMU](/docs/spine-nodes/input/iphone-imu/intro) | Wrist motion capture — not found in codebase |
| Phase 2 | Meta Quest 3 (visualization) | CrackHead publishes state for a Unity app to render — depends on CrackHead, which doesn't exist yet either |
| Phase 2–3 | Quest 3 hand tracking as input | Pinch/wrist-pose gestures through the same filtering stage as other input sources |
| Phase 3 | Custom haptic controller | Purpose-built device, informed by comparative testing of the above |

A keyboard input path is also referenced elsewhere in earlier drafts of this documentation as a development/testing convenience, though it isn't part of the phased roadmap above — see [Keyboard](/docs/spine-nodes/input/keyboard/intro).

## See also

- [Architecture](/docs/architecture) — how input is meant to reach Purifier and Kinematics Engine
- [Purifier](/docs/spine-nodes/purifier/intro) — the proposed downstream tremor filter
