---
id: intro
title: Kinematic Engine
sidebar_position: 1
---

# Kinematic Engine

`kinematic-engine` is a real, running Zig node — it joins Spine, subscribes to operator-input deltas, solves inverse kinematics via `red` (see below), and publishes joint angles. It's part of a real three-node pipeline today: a Go input node (`keyboard-controller`/`iphone_imu`) → `kinematic-engine` → [CrackHead](/docs/spine-nodes/crack-head/intro), verified running together as separate live processes.

An earlier Python implementation, built on Robotics Toolbox for Python, existed before this — real math, but wired to Spine's old, retired KCP/mDNS transport, and capped at ~75 Hz. It's what motivated writing `red` in the first place (see [Architecture](/docs/architecture#the-target-robot-platform)); this page now describes the current Zig node rather than that earlier version.

## Target role: a stateless RPC service

Per the [Architecture](/docs/architecture) page, the intended design has a separate **Robot Controller** node that owns arm state and decides target poses, calling Kinematic Engine as a stateless RPC `solve(target_pose, mode) → (joint_angles, reachable)`. The current node doesn't do this yet — it directly owns "current joint state" and consumes displacement input itself, combining what the target architecture treats as two separate nodes into one. Splitting that apart (extracting a stateless solve-service interface) is real, not-yet-done work, not just a wiring exercise.

## The current node

```zig
const spine = @import("spine_zig");
const red = @import("red");

var node = try spine.Node.init("rime", "ppap", io, allocator);

const input = try node.subscribe([4][4]f64, "r1-change");
const output = try node.publish([6]f64, "joints");

var r1 = kinematic_engine.Robot.init("r1", input, output);
try r1.run();
```

The run loop: publish the current joint state, block for the next `[4][4]f64` displacement, compose it against the current end-effector pose (forward kinematics), solve inverse kinematics for the new goal, and adopt the result only if the solve succeeded — a failed solve just keeps the previous joint state and waits for the next input, rather than erroring out. This node joins the `"rime"` namespace, not `"common"` — see [Troubleshooting](/docs/troubleshooting) for what that means for `spined` registration (short version: it only works because `spined` either isn't running or is ignored, since `"rime"` isn't a namespace it recognizes).

## `red` — the math underneath

A from-scratch numerical IK solver, written to fix specific problems with the earlier Python solver: speed, and orientation-error blowups near singularities that made linear moves "feel weird." Now a real dependency of `kinematic-engine` (`zig fetch`-installed, tagged `v0.1.1`), not just a standalone library.

**Forward kinematics** chains six revolute-joint transforms; joint parameters are currently **hardcoded for Arctos** — `RobotType(urdf_path)` takes a URDF path argument but ignores it. Real URDF parsing hasn't been built yet.

**Inverse kinematics** is damped least squares (DLS): a numerically-differentiated Jacobian (perturb each joint, measure the resulting pose change), then

```
Δθ = Jᵀ(JJᵀ + λ²I)⁻¹ Δx
```

recomputed from the current pose every iteration (not a single fixed step from the initial guess). The error term `Δx` is a **6D twist** (3 position + 3 axis-angle), computed via the SO(3) logarithm map rather than a roll/pitch/yaw difference — this is specifically what fixes the singularity problem: an Euler-angle difference has a discontinuity near 180° that the log-map formulation doesn't, including a separate closed-form branch for exactly that case.

Two features beyond a bare DLS solver:

- **`ignore_tool_z_rotation`** — treats the task as 5-DOF instead of 6: position and pointing direction solved exactly, rotation about the tool's own approach axis left free. Meant for tools with rotational symmetry (drills, grippers, nozzles). This is very likely where "5-DOF" entered the Capstone Proposal — see [Architecture](/docs/architecture#the-target-robot-platform).
- **`posture_weight`** — a secondary objective, projected into whatever null space the primary task leaves unused, that pulls the solution toward a reference posture (typically the caller's current joint state) so the arm doesn't wander far from where it started when it has spare degrees of freedom to do so. Clamped to `[0, 1]`; a no-op on a fully-determined 6-DOF task, which by construction has no null space to use.

**Measured results** (from `red`'s own test suite, run against random targets):

| Scenario | Success rate |
|---|---|
| Single-shot, random target, cold start (worst case) | ~91–92% |
| Warm-started along a smooth path (the realistic case — each waypoint seeded from the previous solution) | ~95–100% |

The gap between these two numbers is the point: real robot motion is a sequence of nearby waypoints, not random single-shot targets, so the path-following number is the more representative one.

## What's missing before this is the real node the architecture describes

- **The controller/kinematics split** doesn't exist — this node still owns joint state and consumes displacement input directly, combining two roles the target architecture keeps separate. Whichever node ends up doing this needs a thin stateless `solve` RPC wrapper, not this combined loop.
- **No real URDF parsing** — Arctos's joints are hardcoded in `red`.
- **No RCM constraint** — neither this node nor `red` itself models the fixed pivot point corneal surgery requires.

## See also

- [Architecture](/docs/architecture) — the Robot Controller / Kinematic Engine split this page assumes
- [CrackHead](/docs/spine-nodes/crack-head/intro) — the node downstream of this one in the running pipeline
- [Glossary: Inverse Kinematics](/docs/glossary#inverse-kinematics-ik)
- [Glossary: DLS](/docs/glossary#dls-damped-least-squares)
