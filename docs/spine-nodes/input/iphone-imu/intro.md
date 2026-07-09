---
id: intro
title: iPhone IMU
sidebar_position: 1
---

# iPhone IMU

**Status: not found in the codebase surveyed for this documentation.** The proposal describes wrist motion captured via an iPhone's onboard inertial measurement unit, streamed over Spine as a Phase 1–2 input node — a closer approximation of natural surgical hand motion than a joystick, developed in parallel with the [Xbox Controller](/docs/spine-nodes/input/xbox-controller/intro) path as a direct comparison point. No code implementing this exists in this codebase yet.

## Why IMU-based control (per the proposal)

Joystick input requires learning an abstract mapping between stick movement and robot motion. Wrist-worn IMU capture is intended to be closer to how a surgeon actually moves during a procedure, and is explicitly framed as a stepping stone toward the Phase 3 custom haptic controller — a way to compare input modalities before committing to bespoke hardware.

## What it would need to produce

Per the proposal's architecture, every input node publishes a raw 4×4 delta transform, cleaned downstream by [Purifier](/docs/spine-nodes/purifier/intro) before reaching [Kinematics Engine](/docs/spine-nodes/kinematics-engine/intro). No specific sensor fusion approach, sample rate, or transport (Wi-Fi, Bluetooth, or otherwise) has been implemented or specified beyond that.

## See also

- [Input Overview](/docs/spine-nodes/input/intro) — the full roadmap and its status
- [Purifier](/docs/spine-nodes/purifier/intro) — the proposed downstream filter
- [Kinematics Engine](/docs/spine-nodes/kinematics-engine/intro) — the real node that would ultimately consume this
