---
id: intro
title: Input
sidebar_position: 1
---

# Input

**Status: real code for all three, on Spine's older, retired transport.** Keyboard, Xbox controller, and iPhone IMU input nodes all exist and work — they just predate the Unix-socket redesign, so none of them are part of the currently-running pipeline without porting first.

## What each one actually publishes

This matters, because they don't all publish the same shape:

| Node | Publishes | Notes |
|---|---|---|
| [Keyboard](/docs/spine-nodes/input/keyboard/intro) | `[4][4]float64` | Direct translation deltas from held keys |
| [iPhone IMU](/docs/spine-nodes/input/iphone-imu/intro) | `[4][4]float64` | Computed rotation-only delta from consecutive orientation readings |
| [Xbox Controller](/docs/spine-nodes/input/xbox-controller/intro) | A raw button/joystick struct | Not a transform — nothing downstream to convert it was found |

The [Architecture](/docs/architecture) page's target has every input node normalized to the same shape before it reaches Purifier. Keyboard and iPhone IMU already agree; Xbox controller is the odd one out and needs either its own conversion step or a rethink of what "raw" input should look like across all three.

## Porting these

All three use the old, pre-redesign `spine.JointNamespace(namespace, key, logger)` API and default to namespace `"rime"` — neither the namespace nor the API exists in the current `spine-go`. Porting means re-pointing each one at the current `CreateNode`/`NewPublisher` API (see [spine-go](/docs/spine/go/intro)); the actual input-capture logic (evdev reads for Xbox, the ebiten window loop for keyboard, the UDP listener for iPhone IMU) doesn't need to change.

## See also

- [Architecture](/docs/architecture) — how filtered input is meant to reach the Robot Controller
- [Purifier](/docs/spine-nodes/purifier/intro) — the planned downstream consumer
