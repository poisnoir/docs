---
id: intro
title: Input
sidebar_position: 1
---

# Input

Keyboard, Xbox controller, and iPhone IMU input nodes all exist. Keyboard and iPhone IMU are real, running code on the current Spine transport, verified as part of the live `keyboard-controller`/`iphone_imu` → [Kinematic Engine](/docs/spine-nodes/kinematics-engine/intro) → [CrackHead](/docs/spine-nodes/crack-head/intro) pipeline. Xbox Controller is documented here on the same assumption as the other two — a `[4][4]float64` delta transform — though unlike the other two, there's no code for it in this checkout to confirm that against.

## What each one publishes

| Node | Publishes | Notes |
|---|---|---|
| [Keyboard](/docs/spine-nodes/input/keyboard/intro) | `[4][4]float64` | Direct translation deltas from held keys |
| [iPhone IMU](/docs/spine-nodes/input/iphone-imu/intro) | `[4][4]float64` | Computed rotation-only delta from consecutive orientation readings |
| [Xbox Controller](/docs/spine-nodes/input/xbox-controller/intro) | `[4][4]float64` (assumed) | No code exists here to confirm against — documented on the same shape as the other two for consistency, not verified |

All three publish (or are assumed to publish) the same shape, matching the [Architecture](/docs/architecture) page's target of every input node normalizing to one transform before it reaches Purifier.

## Current API

Keyboard and iPhone IMU both use the current `spine.CreateNode`/`spine.NewPublisher` API (see [spine-go](/docs/spine/go/intro)) — the actual input-capture logic (the ebiten window loop for keyboard, the UDP listener for iPhone IMU) is unchanged from earlier, only the Spine wiring was ported. Both default to namespace `"rime"`, not `"common"` — see [Troubleshooting](/docs/troubleshooting) for what that means.

## See also

- [Architecture](/docs/architecture) — how filtered input is meant to reach the Robot Controller
- [Purifier](/docs/spine-nodes/purifier/intro) — the planned downstream consumer
