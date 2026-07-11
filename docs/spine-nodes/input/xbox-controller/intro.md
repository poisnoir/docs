---
id: intro
title: Xbox Controller
sidebar_position: 1
---

# Xbox Controller

**Not present in this checkout.** Documented here on the same assumption as [Keyboard](/docs/spine-nodes/input/keyboard/intro) and [iPhone IMU](/docs/spine-nodes/input/iphone-imu/intro): reads a physical Xbox controller (via Linux `evdev`, the same approach the other two Go input nodes use) and publishes a `[4][4]float64` delta transform, consistent with the rest of the input layer rather than a raw button/joystick struct. Unlike the other two, there's no code here to confirm this shape against — treat this page as the intended contract for whenever this node is written or ported in, not a description of running code.

## Assumed shape

```go
pub.Publish([4][4]float64{...}) // same delta-transform convention as Keyboard/iPhone IMU
```

Left stick / right stick and triggers would map to translation and/or rotation deltas the same way `W`/`A`/`S`/`D` do for [Keyboard](/docs/spine-nodes/input/keyboard/intro) — the exact axis mapping isn't decided, since there's no implementation to derive it from yet.

## What this would need

- `spine.CreateNode`/`spine.NewPublisher[[4][4]float64]`, same as the other two input nodes (see [spine-go](/docs/spine/go/intro)) — not the old pre-redesign `JointNamespace` API, since there's no legacy version of this node to port from.
- A conversion step from raw controller state (buttons, joysticks, triggers) to a delta transform, analogous to iPhone IMU's `CreateDelta`.

## See also

- [Input Overview](/docs/spine-nodes/input/intro) — how this fits with the other two input nodes
- [Keyboard](/docs/spine-nodes/input/keyboard/intro) / [iPhone IMU](/docs/spine-nodes/input/iphone-imu/intro) — the two that actually exist and run today
