---
id: intro
title: Overview
sidebar_position: 1
---

# Spine Nodes

Spine Nodes are the individual modules that make up the PreciCore pipeline. They're at very different stages, and this page's job is to be honest about which: real code on the current transport, real code stuck on an older, retired transport, or design intent with no code yet. See [Architecture](/docs/architecture) for how they're meant to fit together.

## Nodes

| Node | Description | Status |
|------|-------------|--------|
| [Kinematic Engine](/docs/spine-nodes/kinematics-engine/intro) | Forward/inverse kinematics for the 6-joint arm | **Two real implementations** — a Python solver in current use, and a from-scratch Zig solver (`red`) with no Spine wiring yet |
| [CrackHead](/docs/spine-nodes/crack-head/intro) | MuJoCo physics simulation | **Real code**, but on Spine's older, retired transport — not yet ported |
| [Input nodes](/docs/spine-nodes/input/intro) | Keyboard, Xbox controller, iPhone IMU | **Real code**, same situation as CrackHead |
| [Big-Boss](/docs/spine-nodes/big-boss/intro) | Namespace visualizer / planned runner + log-gatherer | **Real UI shell**, not yet reading a live namespace |
| [Purifier](/docs/spine-nodes/purifier/intro) | Kalman filter for tremor reduction | No code — design only |
| Robot Controller | Owns arm state, calls Kinematic Engine, dispatches to hardware/sim | No code — this is a target-architecture split, not an existing node |

## Pipeline overview (target)

```
Input nodes → Purifier → Robot Controller ⇄ Kinematic Engine (RPC)
                                    │
                                    ├──→ Embedded / Hardware
                                    └──→ CrackHead
```

Every node is meant to talk to every other node exclusively through Spine — no import-time dependency between them. That already holds for the pieces that exist: the Python kinematics node, for instance, only knows about whatever `Subscriber`/`Publisher` objects get passed into its constructor, with zero awareness of what's upstream or downstream.

## See also

- [Architecture](/docs/architecture) — full system diagram with real-vs-planned status, and what changed from earlier drafts of this page
- [Spine Overview](/docs/spine/intro) — the communication layer all nodes are meant to run on
