---
id: intro
title: iPhone IMU
sidebar_position: 1
---

# iPhone IMU

**Status: real code, on Spine's older, retired transport.** Listens for UDP packets from an iPhone sensor-streaming app and publishes a `[4][4]float64` rotation-only delta transform.

## What it actually does

A UDP listener (`IphoneWorker`, bound to a hardcoded `172.20.10.3:<port>`) receives JSON packets shaped like:

```go
type IphoneOutput struct {
    Seq                          int64
    Roll, Pitch, Yaw             float64 // motion
    QuatX, QuatY, QuatZ, QuatW   float64
    Rot11..Rot33                 float64 // rotation matrix, row-major
    GravityX/Y/Z, AccelX/Y/Z,
    GyroX/Y/Z, MagX/Y/Z          float64
    Latitude, Longitude          float64
}
```

— accelerometer, gyroscope, magnetometer, gravity vector, quaternion, rotation matrix, GPS, all provided directly by the phone's sensor-fusion, not computed here.

Each loop iteration computes `CreateDelta`: the Euler-angle difference (yaw/roll/pitch) between the current and previous reading, with deltas under ~1° zeroed out as a noise floor, converted to a rotation matrix by direct trigonometric formula (not a library) and written into a `[4][4]float64` with **zero translation** — only the rotation block is populated, `result[3][3] = 1`, everything else in the translation column is `0`. The result is published as the delta transform; there's no accumulated absolute pose, no drift correction beyond that per-step noise gate, and no analytical Kalman filtering — this is what [Purifier](/docs/spine-nodes/purifier/intro) is meant to eventually replace.

Connects via the same pre-redesign `spine.JointNamespace("rime", "ppap", logger)` API as the other input nodes, publishing under the default name `iphone_imu`. A separate `MemoryRecorder` buffers every raw reading and dumps it to a timestamped JSON file in `./runs/` on exit — useful for offline filter tuning, independent of whether Spine itself is even reachable.

## See also

- [Input Overview](/docs/spine-nodes/input/intro) — how this compares to the other two input nodes
- [Keyboard](/docs/spine-nodes/input/keyboard/intro) — publishes the same `[4][4]float64` shape, computed differently
- [Purifier](/docs/spine-nodes/purifier/intro) — the planned filter this node's crude noise gate is a placeholder for
