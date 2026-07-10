---
id: intro
title: Kinematic Engine
sidebar_position: 1
---

# Kinematic Engine

There are **two real implementations** of kinematics in this codebase, at very different stages: `kinematic-engine` (Python — real math, but wired to Spine's old, retired transport) and `red` (Zig, a from-scratch rewrite with better numerics, not wired to Spine at all yet). Neither is the final answer — this page describes both honestly rather than presenting one as "the" kinematics engine.

## Target role: a stateless RPC service

Per the [Architecture](/docs/architecture) page, the intended design has a separate **Robot Controller** node that owns arm state and decides target poses, calling Kinematic Engine as a stateless RPC `solve(target_pose, mode) → (joint_angles, reachable)`. Neither existing implementation does this yet — both directly own the "current joint state" and consume displacement input themselves, combining what the target architecture treats as two separate nodes into one. Splitting that apart (extracting a stateless solve-service interface) is real, not-yet-done work, not just a wiring exercise.

## `kinematic-engine` (Python) — real math, old transport

Built on [Robotics Toolbox for Python](https://petercorke.github.io/robotics-toolbox-python/) (`roboticstoolbox`), with `pinocchio`/`pink` also imported in `main.py` (a scratch/debug script, not the node's real entry point). A 6-joint Denavit-Hartenberg chain:

```python
robot = DHRobot([
    RevoluteDH(a=0*mm,       alpha=0,        d=287.87*mm, offset=0),
    RevoluteDH(a=20.174*mm,  alpha=-np.pi/2, d=0,         offset=-np.pi/2),
    RevoluteDH(a=260.986*mm, alpha=0,        d=0,         offset=0),
    RevoluteDH(a=19.219*mm,  alpha=0,        d=260.753*mm, offset=0),
    RevoluteDH(a=0*mm,       alpha=np.pi/2,  d=0,         offset=0),
    RevoluteDH(a=0*mm,       alpha=-np.pi/2, d=74.745*mm, offset=np.pi),
])
```

These parameters match the [Arctos](/docs/architecture#the-target-robot-platform) arm, and are hardcoded from a URDF rather than parsed at runtime. IK is numerical — `robot.ets().ikine_LM(...)`, Levenberg-Marquardt via Peter Corke's "sugihara" method, with joint limits and a handful of tuned gains (`kq`, `ps`, `pi`). There's no RCM pivot-point constraint and no motion-scaling gain in this code — if either is needed, it lives elsewhere in the pipeline or hasn't been built.

Spine wiring — combines controller and kinematics into one loop:

```python
class Robot:
    def __init__(self, name, input_source: Subscriber, output_source: Publisher):
        self.current_joints = np.zeros(6, dtype=np.float64)

    def run(self):
        while True:
            self.output_source.publish(tuple(self.current_joints))
            displacement = np.array(self.input_source.get_data(), dtype=np.float64)
            goal = forward_kinematics(self.current_joints) @ displacement
            result = inverse_kinematics(goal, self.current_joints)
            if not result.success:
                continue
            self.current_joints = result.q
```

Publish current state, read the next displacement, compose it against the current pose, solve, adopt the new joints only on success — a failed solve is silently dropped, not logged or surfaced. Uses [spine-py](/docs/spine/py/intro) — which, importantly, is a binding for Spine's **old, retired** KCP/mDNS transport, not the current `spine-go`/`spined`. This node's kinematics math is real and usable standalone; its Spine wiring needs the same porting work as the Go input nodes and CrackHead before it talks to the current daemon.

**Known limitations:** no RCM constraint, no motion scaling, failed solves are invisible, it's locked to ~75 Hz in practice (which is exactly what motivated `red`), and its Spine wiring targets the retired backend.

## `red` (Zig) — in development, not yet wired to anything

A from-scratch numerical IK solver, written to fix specific problems with the Python solver: speed, and orientation-error blowups near singularities that made linear moves "feel weird." It has no Spine integration yet — it's a standalone library with its own test suite and a tiny CLI demo (`main.zig`), not a running node.

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
| Single-shot, random target, cold start (worst case) | ~91% |
| Warm-started along a smooth path (the realistic case — each waypoint seeded from the previous solution) | >95% |

The gap between these two numbers is the point: real robot motion is a sequence of nearby waypoints, not random single-shot targets, so the path-following number is the more representative one.

## What's missing before either one is a real node on the current Spine

- **Python**: needs its Spine wiring re-pointed from the old `spine_py`/cgo bridge to whatever current binding exists by the time this is picked up — see [spine-py](/docs/spine/py/intro)
- **`red`**: no Spine wiring at all yet — it's a library, not a node; would need either a Go/Zig-interop bridge or its own client against the current Unix-socket protocol
- **Both**: no real URDF parsing (Arctos's joints are hardcoded in both), no RCM constraint, and the controller/kinematics split from [Architecture](/docs/architecture) doesn't exist in either — whichever one becomes the real node needs a thin stateless `solve` RPC wrapper, not a port of the Python `Robot` class's combined controller+kinematics loop

## Links

- [spine-py](/docs/spine/py/intro) — the binding the Python implementation uses
- [MAD](/docs/spine/mad/intro) — including the Python/Go wire-format caveat, relevant once either implementation needs to talk to a Go node directly

## See also

- [Architecture](/docs/architecture) — the Robot Controller / Kinematic Engine split this page assumes
- [Glossary: Inverse Kinematics](/docs/glossary#inverse-kinematics-ik)
- [Glossary: DLS](/docs/glossary#dls-damped-least-squares)
