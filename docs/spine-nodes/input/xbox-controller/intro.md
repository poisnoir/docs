---
id: intro
title: Xbox Controller
sidebar_position: 1
---

# Xbox Controller

**Status: real code, on Spine's older, retired transport — and the odd one out.** Reads a physical Xbox controller via Linux `evdev` and publishes its raw button/joystick state directly, unlike [Keyboard](/docs/spine-nodes/input/keyboard/intro) and [iPhone IMU](/docs/spine-nodes/input/iphone-imu/intro), which both publish a `[4][4]float64` delta transform.

## What it actually publishes

```go
type XboxController struct {
    A, B, X, Y             bool
    LB, RB                 bool
    LT, RT                 int32
    LeftStick, RightStick   Joystick // {X, Y int32}
    LSB, RSB                bool
    Up, Down, Left, Right   bool
    Back, Start, Guide      bool
}
```

The raw struct, updated in place from `evdev` button/axis events and republished on every event. There is no conversion from this into a `[4][4]float64` transform anywhere in the code found — whatever is meant to consume this either needs to accept this shape directly, or a conversion step needs to be written before this can feed the same downstream path as the other two input nodes.

Reads from a fixed device path (`-usb`, default `/dev/input/event19` — will need to match whatever `evdev` enumerates the controller as on a given machine) and connects via the same pre-redesign `spine.JointNamespace("rime", "ppap", logger)` API as the others.

## See also

- [Input Overview](/docs/spine-nodes/input/intro) — the shape mismatch with the other two input nodes
- [Keyboard](/docs/spine-nodes/input/keyboard/intro) / [iPhone IMU](/docs/spine-nodes/input/iphone-imu/intro) — both publish `[4][4]float64` instead
