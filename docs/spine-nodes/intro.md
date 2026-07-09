---
id: intro
title: Overview
sidebar_position: 1
---

# Spine Nodes

Spine Nodes are the individual modules the Capstone Proposal describes as making up the PreciCore pipeline — from physics simulation to operator input. This page is honest about which of them exist as code today versus which are design intent for later phases; see [Architecture](/docs/architecture) for the same distinction applied to the whole system.

## Nodes

| Node | Description | Status |
|------|-------------|--------|
| [kinematics-engine](/docs/spine-nodes/kinematics-engine/intro) | Forward/inverse kinematics for a 6-joint arm | **Real code** (Python) — see the page for how it differs from the proposal's C++/RCM description |
| [crack-head](/docs/spine-nodes/crack-head/intro) | MuJoCo-powered physics simulator | Not found in the codebase surveyed for this documentation |
| [purifier](/docs/spine-nodes/purifier/intro) | Kalman filter for tremor reduction | Not found in the codebase surveyed for this documentation |
| [input](/docs/spine-nodes/input/intro) | Operator input layer (keyboard, Xbox controller, iPhone IMU) | Not found in the codebase surveyed for this documentation |

## Pipeline overview (as proposed)

```
Input nodes  →  Purifier  →  Kinematics Engine  →  CrackHead / Hardware
```

Each node is meant to communicate exclusively through Spine, with no direct dependencies between nodes — any node can be replaced, restarted, or swapped out without modifying any other node. That property holds for the one node that actually exists: `kinematics-engine` talks to whatever feeds it and whatever it feeds purely through `spine_py` `Subscriber`/`Publisher` objects passed into its constructor, with no import-time dependency on Purifier or CrackHead's code.

## See also

- [Architecture](/docs/architecture) — full system diagram with real-vs-planned status
- [Spine Overview](/docs/spine/intro) — the communication layer all nodes are meant to run on
