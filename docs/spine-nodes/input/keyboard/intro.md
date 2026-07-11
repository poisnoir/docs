---
id: intro
title: Keyboard
sidebar_position: 1
---

# Keyboard

**Real, running code, on the current Spine transport.** A small [ebiten](https://ebitengine.org/) (2D game engine) window that captures held keys and publishes a `[4][4]float64` delta transform — not a terminal-based key reader. Part of the live `keyboard-controller` → [Kinematic Engine](/docs/spine-nodes/kinematics-engine/intro) → [CrackHead](/docs/spine-nodes/crack-head/intro) pipeline.

## What it actually does

```go
var goal [4][4]float64
goal[0][0], goal[1][1], goal[2][2], goal[3][3] = 1, 1, 1, 1 // identity

if ebiten.IsKeyPressed(ebiten.KeyW) { goal[1][3] += 0.001 }
if ebiten.IsKeyPressed(ebiten.KeyS) { goal[1][3] -= 0.001 }
if ebiten.IsKeyPressed(ebiten.KeyA) { goal[2][3] += 0.001 }
if ebiten.IsKeyPressed(ebiten.KeyD) { goal[2][3] -= 0.001 }

pub.Publish(goal)
```

`W`/`S`/`A`/`D` nudge translation components of an identity matrix by a fixed step per frame (Update runs at ebiten's 60 Hz), while held — this is a pure translation delta, no rotation. `Escape` quits. The window itself renders nothing (`Draw` is empty) — it exists only to own keyboard focus and run ebiten's input loop.

Connects via `spine.CreateNode(*namespace, *key, context.Background(), logger)` and `spine.NewPublisher[[4][4]float64]` (flags: `-namespace` default `"rime"`, `-name` default `"r1-change"`, `-key` default `"ppap"` — see [spine-go](/docs/spine/go/intro)).

## See also

- [Input Overview](/docs/spine-nodes/input/intro) — how this compares to the other two input nodes
- [iPhone IMU](/docs/spine-nodes/input/iphone-imu/intro) — publishes the same `[4][4]float64` shape, computed differently
