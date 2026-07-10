---
id: intro
title: CrackHead
sidebar_position: 1
---

# CrackHead

**Status: real, working code — on Spine's older, retired transport.** CrackHead is a MuJoCo simulation of the [Arctos](/docs/architecture#the-target-robot-platform) arm. It exists and runs; it just hasn't been ported from the KCP-based Spine to the current Unix-socket one yet, so treat everything below as "validated logic that needs porting," not as a currently-running part of the live pipeline.

## What it actually does

```python
model = mujoco.MjModel.from_xml_path("./arctos_robot_mujoco.xml")
data = mujoco.MjData(model)

spine_namespace = Namespace("rime", "ppap")
r1_sub = Subscriber(spine_namespace, "joints", tuple[MadType.float64, 6])

r1_arm = Arm("r1", model, data, r1_sub)
```

It loads a real MJCF scene (`arctos_robot_mujoco.xml`, with STL meshes for every link), subscribes to a `"joints"` topic (6 `float64`s), and on every message just writes those 6 values directly into MuJoCo's `qpos` for the six named joints (`joint1`–`joint6`) from a background thread — no interpolation, no physics-driven motion, no torque control. The main loop steps MuJoCo's forward dynamics and syncs the viewer at the simulation's own timestep. `Namespace("rime", "ppap")` is the old `spine_py` two-argument constructor (namespace name + key) from before the redesign — see the note on transport below.

There's also a `prefix_script.py` utility for composing multi-robot MuJoCo scenes (it references a Mecademic Meca 500 arm, not Arctos) — this looks like early, inconclusive exploration rather than an active second target; see [Architecture](/docs/architecture#the-target-robot-platform).

## What "porting" actually means here

Two separate things need to happen before this becomes a real node in the current pipeline, and they're not the same task:

1. **Transport**: swap the old `spine_py`/`Namespace` KCP-based API for whatever the current [spine-py](/docs/spine/py/intro) binding looks like once it's caught up to the Unix-socket redesign (or wait for that binding to stabilize).
2. **Interface**: today it just teleports joints to whatever value arrives. The [Architecture](/docs/architecture) target has CrackHead receiving the same joint command as the real hardware driver, from a Robot Controller node that doesn't exist yet — that's a different, richer message than "6 raw floats," and a design decision about what that shared schema looks like hasn't been made.

## The proposed architectural property

The design goal — still just a goal — is that CrackHead should be indistinguishable from the physical hardware driver from Spine's point of view: same topics, same message shapes, so control/vision/input development isn't blocked on hardware availability. That depends on a real hardware driver existing and agreeing on a schema with CrackHead, and on the Robot Controller/Kinematic Engine split from [Architecture](/docs/architecture) actually being built. Neither exists yet.

The proposal also describes CrackHead as the substrate for a planned Quest 3 visualization path — same simulation state, subscribed to by a VR app for 3D rendering. Further downstream of everything above; not started.

## See also

- [Architecture](/docs/architecture) — how CrackHead is meant to fit into the full pipeline
- [Kinematic Engine](/docs/spine-nodes/kinematics-engine/intro) — would feed it joint targets, once both are on the same transport and interface
- [Spine Overview](/docs/spine/intro) — the communication layer it needs to be ported onto
