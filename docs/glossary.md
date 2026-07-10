---
id: glossary
title: Glossary
sidebar_position: 90
---

# Glossary

Reference for terms used throughout the PreciCore documentation. Where a term describes something aspirational rather than currently implemented, that's called out explicitly rather than left ambiguous.

---

### Arctos

The 6-joint open-source robot arm targeted by every piece of kinematics/simulation code found in this codebase (`kinematic-engine`'s DH chain, `red`'s hardcoded joint parameters, CrackHead's MJCF scene and STL meshes) — the leading candidate for the physical platform, though not formally finalized. See [Architecture](/docs/architecture#the-target-robot-platform).

---

### Big-Boss

The operator-facing desktop app (Go + [Wails](https://wails.io/) + Svelte) meant to launch/manage the node graph, visualize it live, and gather logs. Exists today as a real UI shell rendering a hardcoded example graph — not yet reading a live `spined` namespace. See [Big-Boss](/docs/spine-nodes/big-boss/intro).

---

### DLS (Damped Least Squares)

A numerical inverse-kinematics method that solves `Δθ = Jᵀ(JJᵀ + λ²I)⁻¹ Δx` — a regularized pseudo-inverse of the Jacobian, more numerically stable near singularities than a plain pseudo-inverse. Used by [`red`](/docs/spine-nodes/kinematics-engine/intro), the newer of the two kinematics implementations in this codebase.

---

### DOF (Degrees of Freedom)

The number of independent axes along which a mechanical system can move. [Arctos](/docs/architecture#the-target-robot-platform) has 6 joints — confirmed consistently across every implementation that targets it. The Capstone Proposal's occasional "5-DOF" almost certainly refers to `red`'s tool-symmetric solve mode (`ignore_tool_z_rotation`), which treats certain tasks as 5-dimensional even though the arm itself has 6 joints — not a different physical arm. See [Architecture](/docs/architecture#the-target-robot-platform).

---

### Entity

`spined`'s term for anything a node registers: a Service, Publisher, ServiceCaller, or Subscriber. Entities live as long as the node connection that registered them stays open — closing an entity object in application code (`Service.Close()`, etc.) does not currently tell `spined` to remove it; only a full node disconnect does. See [spine-go](/docs/spine/go/intro).

---

### IMU (Inertial Measurement Unit)

A sensor that measures specific force (accelerometer) and angular rate (gyroscope). A real iPhone IMU input node exists — it listens for UDP packets from an iPhone sensor-streaming app and computes a rotation-only delta transform — but it's built on Spine's old, retired transport. See [iPhone IMU](/docs/spine-nodes/input/iphone-imu/intro).

---

### Inverse Kinematics (IK)

The mathematical problem of computing joint angles that place a robotic end-effector at a desired position and orientation, as opposed to *forward kinematics*, which computes position given joint angles. Two real solvers exist here: a Levenberg-Marquardt solver (`kinematic-engine`, Python, via `roboticstoolbox`'s `ikine_LM`) and a from-scratch [DLS](#dls-damped-least-squares) solver (`red`, Zig) with a more robust orientation-error metric. See [Kinematic Engine](/docs/spine-nodes/kinematics-engine/intro).

---

### Kalman Filter

A recursive algorithm that estimates the true state of a system from noisy measurements, producing an estimate more accurate than any single measurement alone. The proposal's Purifier node is meant to apply one to raw operator input to suppress hand tremor; no Purifier implementation exists yet. See [Purifier](/docs/spine-nodes/purifier/intro).

---

### KCP / mDNS

The transport and discovery mechanism of Spine's **previous, retired** design — reliable delivery over UDP (KCP) with zero-config peer discovery (mDNS), plus AES-GCM-encrypted namespaces. Real and it worked, per the project's own design notes, but was replaced by the current Unix-domain-socket design over performance (unnecessary network-stack overhead for same-machine nodes), mDNS discovery bugs, and cross-language tooling pain. `spine-py`'s `spineBridge.so` is a compiled artifact of this retired version — see [spine-py](/docs/spine/py/intro).

---

### MAD (Serializer)

Spine's binary serialization format: a reflection-driven, fixed-size-only codec (no strings, slices, or maps in the current Go/Zig implementations) with alphabetically-sorted struct fields and a type-fingerprint `Code()` used to validate that two ends of a connection agree on message shape. The Python `mad` package (used by `spine-py`) is a separate, older implementation that still supports variable-length types with a different wire-code scheme — a leftover from before the Go/Zig side dropped that support, not currently interoperable. See [MAD](/docs/spine/mad/intro).

---

### MuJoCo

Multi-Joint dynamics with Contact. An open-source physics engine developed by DeepMind, used in robotics research for its accurate contact dynamics. [CrackHead](/docs/spine-nodes/crack-head/intro) is a real MuJoCo simulation of the Arctos arm — built, but still on Spine's old, retired transport.

---

### Namespace

A grouping concept in Spine/`spined` meant to isolate logical subsystems from each other. Today, `spined` only ever creates one namespace, `"common"`, at boot — there is no way yet to create additional ones, and namespaces carry no encryption or access control beyond that grouping (that used to exist, in the retired [KCP/mDNS](#kcp--mdns) design, as an AES-GCM key per namespace). See [Spine Overview](/docs/spine/intro).

---

### Phantom Cornea

A synthetic physical or simulated model of a human cornea used for testing and calibration, so that needle trajectories can be validated before any contact with real tissue. Not modeled in the current CrackHead scene, which simulates the arm itself but not a target tissue.

---

### Pub/Sub (Publish/Subscribe)

A messaging pattern where publishers emit values under a name (a "topic," identified by namespace + entity name in Spine) and subscribers read the latest value, with no direct coupling between the two. Real and working in current `spine-go` — see [Spine Overview](/docs/spine/intro).

---

### RCM (Remote Center of Motion)

A kinematic constraint that forces a robotic arm to pivot around a fixed point in space — here, the entry point through the cornea — so the tool can be reoriented without moving the incision site. Not present in either current kinematics implementation (Python or `red`) — both solve generic pose targets without an explicit pivot constraint. See [Kinematic Engine](/docs/spine-nodes/kinematics-engine/intro).

---

### Robot Controller

A target-architecture node, not yet built, that would own the arm's current state, decide target end-effector poses from filtered operator input, and call [Kinematic Engine](/docs/spine-nodes/kinematics-engine/intro) as a stateless RPC service rather than doing kinematics itself. See [Architecture](/docs/architecture).

---

### RPC (Remote Procedure Call)

A pattern where a client sends a request to a named service and waits for a response. Spine supports this as `Service`/`ServiceCaller` (sequential) and `ThreadedService` (parallel) — real and working in current `spine-go`. See [Examples](/docs/spine/examples/intro).

---

### SO(3) Logarithm Map / Error Twist

A way of expressing the rotational difference between two orientations as a single axis-angle vector, used by [`red`](/docs/spine-nodes/kinematics-engine/intro) as its IK error metric instead of a roll/pitch/yaw difference. The advantage: no discontinuity near 180° rotation, which is exactly where a naive Euler-angle difference breaks down — likely the fix for "linear movement was weird" behavior reported against the older Python solver.

---

### Spine

PreciCore's communication layer: pub/sub and RPC over Unix domain sockets on the local machine, with a registry daemon (`spined`) for bookkeeping. See [Spine Overview](/docs/spine/intro) for what it does and doesn't do today, and [KCP/mDNS](#kcp--mdns) for the retired design it replaced. Not to be confused with `spine` (lowercase), the planned command-line tool for administering `spined` — see [Spine Overview](/docs/spine/intro).

---

### Spine Node

Any process that connects to Spine via `CreateNode`. A node can register Services, ServiceCallers, Publishers, and Subscribers. See [spine-go](/docs/spine/go/intro).

---

### spined

The registry daemon for Spine, written in Zig. Lets nodes register themselves and their entities into a namespace so there's a central place to see what's running. Does **not** sit on the message data path today — publishers/subscribers and services/callers connect directly to each other over well-known Unix socket paths regardless of whether `spined` is running. See [Spine Overview](/docs/spine/intro).

---

### Tremor

Involuntary rhythmic muscular oscillation. Physiological hand tremor in a surgeon's hands occurs at 8–12 Hz and can produce tip displacements of 50–100 µm — far exceeding the sub-millimetre precision corneal surgery requires. Filtering it out is Purifier's proposed job; the real [iPhone IMU](/docs/spine-nodes/input/iphone-imu/intro) node currently only has a crude fixed-threshold noise gate as a placeholder for this.

---

### Unix Domain Socket

An IPC mechanism for processes on the same machine to communicate via a filesystem path instead of a network address. This is Spine's actual transport today — every `Service`, `Publisher`, `ServiceCaller`, and `Subscriber` in current `spine-go` connects over one. Access control is whatever the filesystem permissions on the socket path allow; there is no separate authentication or encryption layer on top. See [Spine Overview](/docs/spine/intro).
