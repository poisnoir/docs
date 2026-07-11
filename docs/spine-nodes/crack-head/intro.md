---
id: intro
title: CrackHead
sidebar_position: 1
---

# CrackHead

**Real, running code, on the current transport.** CrackHead is a MuJoCo simulation of the [Arctos](/docs/architecture#the-target-robot-platform) arm, written in Zig, driving MuJoCo directly via `@cImport` (no wrapper language in between). It's the last stage of a real three-node pipeline — a Go input node → [Kinematic Engine](/docs/spine-nodes/kinematics-engine/intro) → CrackHead — verified running together as separate live processes, not just individually.

An earlier Python version of CrackHead existed before this — real, working code, but on Spine's old, retired KCP/mDNS transport. This page now describes the current Zig node.

## What it actually does

```zig
const spine = @import("spine_zig");

var node = try spine.Node.init("rime", "crack-head", io, allocator);
const subscriber = try node.subscribe([6]f64, "joints");
_ = try io.concurrent(receiveJoints, .{ io, subscriber });
```

It loads a real MJCF scene (`arctos_robot_mujoco.xml`, with STL meshes for every link), subscribes to a `"joints"` topic (`[6]f64`), and applies received values directly to MuJoCo's `qpos` for the six named joints (`joint1`–`joint6`) — no interpolation, no physics-driven motion, no torque control. Joints are received on a background task and applied once per render frame from a shared, mutex-guarded value, so the visualizer keeps rendering smoothly between messages instead of stalling on the network. The main loop steps MuJoCo's forward dynamics and syncs a GLFW-based viewer at the simulation's own timestep.

Like [Kinematic Engine](/docs/spine-nodes/kinematics-engine/intro), this joins the `"rime"` namespace rather than `"common"` — see [Troubleshooting](/docs/troubleshooting) for what that means for `spined` registration.

## What's still missing before this is the real pipeline node

Two separate things, and they're not the same task:

1. **Interface**: today it just teleports joints to whatever value arrives. The [Architecture](/docs/architecture) target has CrackHead receiving the same joint command as the real hardware driver, from a Robot Controller node that doesn't exist yet — that's a different, richer message than "6 raw floats," and a design decision about what that shared schema looks like hasn't been made.
2. **The controller/kinematics split** — see [Kinematic Engine](/docs/spine-nodes/kinematics-engine/intro) — needs to exist before CrackHead's input is really "the same command the hardware driver gets," rather than just whatever `kinematic-engine` happens to publish today.

## The proposed architectural property

The design goal — still just a goal — is that CrackHead should be indistinguishable from the physical hardware driver from Spine's point of view: same topics, same message shapes, so control/vision/input development isn't blocked on hardware availability. That depends on a real hardware driver existing and agreeing on a schema with CrackHead, and on the Robot Controller/Kinematic Engine split from [Architecture](/docs/architecture) actually being built. Neither exists yet.

The proposal also describes CrackHead as the substrate for a planned Quest 3 visualization path — same simulation state, subscribed to by a VR app for 3D rendering. Further downstream of everything above; not started.

## See also

- [Architecture](/docs/architecture) — how CrackHead is meant to fit into the full pipeline
- [Kinematic Engine](/docs/spine-nodes/kinematics-engine/intro) — feeds it joint targets today
- [Spine Overview](/docs/spine/intro) — the communication layer it runs on
