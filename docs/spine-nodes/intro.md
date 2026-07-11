---
id: intro
title: Overview
sidebar_position: 1
---

# Spine Nodes

Spine Nodes are the individual modules that make up the PreciCore pipeline. They're at very different stages, and this page's job is to be honest about which: real code running on the current transport, or design intent with no code yet. See [Architecture](/docs/architecture) for how they're meant to fit together.

## Nodes

| Node | Description | Status |
|------|-------------|--------|
| [Kinematic Engine](/docs/spine-nodes/kinematics-engine/intro) | Forward/inverse kinematics for the 6-joint arm | **Real, running** — a Zig node using a from-scratch DLS solver (`red`) |
| [CrackHead](/docs/spine-nodes/crack-head/intro) | MuJoCo physics simulation | **Real, running** — Zig, subscribing to live joint angles |
| [Input nodes](/docs/spine-nodes/input/intro) | Keyboard, iPhone IMU (Xbox controller has no code yet) | **Real, running** for keyboard/iPhone IMU |
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

Every node is meant to talk to every other node exclusively through Spine — no import-time dependency between them. That already holds for the pieces that exist: `kinematic-engine`, for instance, only knows about whatever `Subscriber`/`Publisher` it's given, with zero awareness of what's upstream or downstream.

## See also

- [Architecture](/docs/architecture) — full system diagram with real-vs-planned status, and what changed from earlier drafts of this page
- [Spine Overview](/docs/spine/intro) — the communication layer all nodes are meant to run on
