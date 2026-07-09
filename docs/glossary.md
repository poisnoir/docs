---
id: glossary
title: Glossary
sidebar_position: 90
---

# Glossary

Reference for terms used throughout the PreciCore documentation. Where a term describes something aspirational rather than currently implemented, that's called out explicitly rather than left ambiguous.

---

### DOF (Degrees of Freedom)

The number of independent axes along which a mechanical system can move. The Capstone Proposal describes the PreciCore arm inconsistently across sections — "5-DOF" in the embedded hardware and RCM sections, "6-DOF" in the CrackHead section. The real `kinematics-engine` code defines a 6-joint `DHRobot` chain against a URDF named `arctos.urdf`. See [Architecture](/docs/architecture) for the note on this.

---

### Entity

`spined`'s term for anything a node registers: a Service, Publisher, ServiceCaller, or Subscriber. Entities live as long as the node connection that registered them stays open — closing an entity object in application code (`Service.Close()`, etc.) does not currently tell `spined` to remove it; only a full node disconnect does. See [spine-go](/docs/spine/go/intro).

---

### IMU (Inertial Measurement Unit)

A sensor that measures specific force (accelerometer) and angular rate (gyroscope). The Capstone Proposal describes an iPhone IMU node capturing wrist motion and streaming it into Spine as a pub/sub input source. No implementation of this node was found in the codebase surveyed for this documentation — see [iPhone IMU](/docs/spine-nodes/input/iphone-imu/intro).

---

### Inverse Kinematics (IK)

The mathematical problem of computing joint angles that place a robotic end-effector (the needle tip) at a desired position and orientation in 3D space, as opposed to *forward kinematics*, which computes position given joint angles. [Kinematics Engine](/docs/spine-nodes/kinematics-engine/intro) solves this numerically today, using Levenberg-Marquardt (`ikine_LM` from `roboticstoolbox`) — not the RCM-constrained analytic solver described in the proposal.

---

### Kalman Filter

A recursive algorithm that estimates the true state of a system from noisy measurements, producing an estimate more accurate than any single measurement alone. The proposal's Purifier node is meant to apply one to raw operator input to suppress hand tremor; no Purifier implementation was found in the codebase surveyed for this documentation. See [Purifier](/docs/spine-nodes/purifier/intro).

---

### MAD (Serializer)

Spine's binary serialization format: a reflection-driven, fixed-size-only codec (no strings, slices, or maps in the Go/Zig implementations) with alphabetically-sorted struct fields and a type-fingerprint `Code()` used to validate that two ends of a connection agree on message shape. A separate, older Python implementation still supports variable-length types and uses a different wire-code scheme — the two are not currently interoperable. See [MAD](/docs/spine/mad/intro).

---

### MuJoCo

Multi-Joint dynamics with Contact. An open-source physics engine developed by DeepMind, used in robotics research for its accurate contact dynamics. The proposal's CrackHead simulator is meant to be built on it; no CrackHead implementation was found in the codebase surveyed for this documentation. See [CrackHead](/docs/spine-nodes/crack-head/intro).

---

### Namespace

A grouping concept in Spine/`spined` meant to isolate logical subsystems from each other. Today, `spined` only ever creates one namespace, `"common"`, at boot — there is no way yet to create additional ones, and namespaces carry no encryption or access control beyond that grouping. See [Spine Overview](/docs/spine/intro).

---

### Phantom Cornea

A synthetic physical or simulated model of a human cornea used for testing and calibration, so that needle trajectories can be validated before any contact with real tissue. In the proposal, the simulated version is meant to live inside CrackHead; no CrackHead implementation exists in the codebase surveyed for this documentation.

---

### Pub/Sub (Publish/Subscribe)

A messaging pattern where publishers emit values under a name (a "topic," identified by namespace + entity name in Spine) and subscribers read the latest value, with no direct coupling between the two. This is real and working in `spine-go` today — see [Spine Overview](/docs/spine/intro).

---

### RCM (Remote Center of Motion)

A kinematic constraint that forces a robotic arm to pivot around a fixed point in space — here, the entry point through the cornea — so the tool can be reoriented without moving the incision site. Described in the proposal as enforced at the inverse-kinematics level; not present in the current `kinematics-engine` code, which uses generic joint-limit-constrained numerical IK without an explicit pivot constraint. See [Kinematics Engine](/docs/spine-nodes/kinematics-engine/intro).

---

### RPC (Remote Procedure Call)

A pattern where a client sends a request to a named service and waits for a response. Spine supports this as `Service`/`ServiceCaller` (sequential) and `ThreadedService` (parallel) — real and working in `spine-go` today. See [Examples](/docs/spine/examples/intro).

---

### Spine

PreciCore's communication layer: pub/sub and RPC over Unix domain sockets on the local machine, with a registry daemon (`spined`) for bookkeeping. Not what earlier drafts of this documentation described — there is no mDNS discovery, no AES-GCM encryption, and no KCP/UDP transport anywhere in the code. See [Spine Overview](/docs/spine/intro) for the accurate picture.

---

### Spine Node

Any process that connects to Spine via `CreateNode`. A node can register Services, ServiceCallers, Publishers, and Subscribers. See [spine-go](/docs/spine/go/intro).

---

### spined

The registry daemon for Spine, written in Zig. Lets nodes register themselves and their entities into a namespace so there's a central place to see what's running. Does **not** sit on the message data path today — publishers/subscribers and services/callers connect directly to each other over well-known Unix socket paths regardless of whether `spined` is running. See [Spine Overview](/docs/spine/intro).

---

### Tremor

Involuntary rhythmic muscular oscillation. Physiological hand tremor in a surgeon's hands occurs at 8–12 Hz and can produce tip displacements of 50–100 µm — far exceeding the sub-millimetre precision corneal surgery requires. Filtering it out is Purifier's proposed job; see [Purifier](/docs/spine-nodes/purifier/intro) for its current (unimplemented) status.

---

### Unix Domain Socket

An IPC mechanism for processes on the same machine to communicate via a filesystem path instead of a network address. This is Spine's actual transport today — every `Service`, `Publisher`, `ServiceCaller`, and `Subscriber` in `spine-go` connects over one. Access control is whatever the filesystem permissions on the socket path allow; there is no separate authentication or encryption layer on top. See [Spine Overview](/docs/spine/intro).
