---
id: intro
title: CrackHead
sidebar_position: 1
---

# CrackHead

**Status: not found in the codebase surveyed for this documentation.** CrackHead is the proposal's name for a [MuJoCo](/docs/glossary#mujoco)-based physics simulation environment, meant to validate control algorithms and trajectories before they run on physical hardware. No implementation — scene files, bindings, or an installable artifact — exists anywhere in this codebase yet. This page describes the design intent from the proposal; treat anything below as a spec, not documentation of running software.

## The proposed architectural property

The proposal's key design goal for CrackHead is that it would be indistinguishable from the physical hardware driver *from Spine's point of view*: simulated force readings at the tool tip and simulated joint encoders would be published over Spine using the same message format as the physical embedded layer, so the control system, vision pipeline, and any input device could be developed and tested against the simulated robot with zero code changes needed to later target real hardware.

This is a meaningful property *if* it holds, since it would decouple software/control development from hardware fabrication and procurement delays — but it depends on both CrackHead and the physical hardware driver existing and agreeing on a schema, and neither exists in this codebase yet. [Kinematics Engine](/docs/spine-nodes/kinematics-engine/intro), the one real node in the pipeline, doesn't currently publish or subscribe to anything shaped like a joint-state or force message that a simulator could stand in for.

## What CrackHead is meant to model

Per the proposal:

- **Robot model** — a URDF/MJCF description of the arm matching the physical prototype's link lengths, joint limits, and actuator characteristics, so trajectories validated in simulation transfer to hardware with minimal retuning. (A URDF, `arctos.urdf`, already exists and is in real use — but by [Kinematics Engine](/docs/spine-nodes/kinematics-engine/intro) directly via Pinocchio/Robotics Toolbox, not by a MuJoCo-based CrackHead.)
- **Phantom cornea model** — a deformable or rigid approximation of the physical silicone phantom, with contact parameters tuned to approximate the real material's force-displacement behavior.
- **Sensor and actuator emulation** — simulated force readings and joint encoders, published over Spine per the architectural property above.

The proposal also describes CrackHead as the substrate for a planned Quest 3 visualization path — the same simulation state used for control-system testing would be what a VR application subscribes to for 3D rendering. That's a further downstream dependency on CrackHead existing, also not yet built.

## See also

- [Architecture](/docs/architecture) — how CrackHead is meant to fit into the full pipeline, and what actually exists today
- [Kinematics Engine](/docs/spine-nodes/kinematics-engine/intro) — the node that would feed it joint targets, if wired up
- [Spine Overview](/docs/spine/intro) — the communication layer it would need to publish through
