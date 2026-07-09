---
id: intro
title: Xbox Controller
sidebar_position: 1
---

# Xbox Controller

**Status: not found in the codebase surveyed for this documentation.** The proposal names the Xbox controller as the Phase 1 baseline input device: well-documented, reliable analog input, and sufficient for validating motion scaling and tremor filtering in simulation before more specialized hardware is introduced. No code implementing this node exists in this codebase yet.

## Why Xbox first (per the proposal)

The Xbox controller's role is explicitly to be a placeholder that de-risks the rest of the pipeline — it lets motion scaling and tremor filtering get validated against a well-understood, reliable analog input source before the team invests in the iPhone IMU path or a custom haptic controller. See [Input](/docs/spine-nodes/input/intro) for the full roadmap this fits into.

## What it would need to produce

Per the proposal's architecture, every input node publishes a raw 4×4 delta transform, cleaned downstream by [Purifier](/docs/spine-nodes/purifier/intro) before reaching [Kinematics Engine](/docs/spine-nodes/kinematics-engine/intro). No specific field layout, axis mapping, or button scheme for an Xbox controller has been implemented or specified beyond that.

## See also

- [Input Overview](/docs/spine-nodes/input/intro) — the full roadmap and its status
- [Purifier](/docs/spine-nodes/purifier/intro) — the proposed downstream filter
- [Spine Overview](/docs/spine/intro) — the transport this would run over
