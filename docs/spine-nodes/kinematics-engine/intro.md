---
id: intro
title: Kinematics Engine
sidebar_position: 1
---

# Kinematics Engine

The Kinematics Engine (`kinematic-engine`, Python) computes joint angles from a target end-effector pose. This is the one Spine node in the whole PreciCore pipeline with real, working code behind it — but its actual implementation is meaningfully different from earlier descriptions of it, so this page describes what's actually there rather than the proposal's design intent.

## What it actually is

- **Language: Python**, not C++. Built on [Robotics Toolbox for Python](https://petercorke.github.io/robotics-toolbox-python/) (`roboticstoolbox`), with `pinocchio`/`pink` also imported (in `main.py`, which looks like a scratch/debug script rather than the node's real entry point).
- **A 6-joint Denavit-Hartenberg (DH) chain**, not a generic "5-DOF" description:

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

  These parameters correspond to a URDF file named `arctos.urdf` in the same repository, forward-kinematics-checked separately in `main.py` via Pinocchio. See the [Glossary: DOF](/docs/glossary#dof-degrees-of-freedom) entry for the 5-vs-6-DOF inconsistency between different parts of the proposal.

- **Inverse kinematics is numerical, not an analytic RCM solver.** `inverse_kinematics` calls `robot.ets().ikine_LM(...)` — Levenberg-Marquardt IK via Peter Corke's "sugihara" method, with joint limits enabled and a handful of tuned gains (`kq`, `ps`, `pi`). There is no explicit Remote Center of Motion constraint in this code — no pivot-point enforcement, no collinearity check against an entry point. If RCM behavior is required, it isn't here yet; either it needs to be added to the IK formulation directly, or enforced as a post-processing constraint on the solution.
- **No motion scaling gain, no configurable coarse/fine/micro modes** are present in this code. If motion scaling exists, it lives elsewhere in the pipeline (upstream, e.g. in whatever feeds this node's `input_source`) — not in `kinematics.py`/`robot.py`.

## The actual Spine wiring

```python
from spine import Publisher, Subscriber
from mad import MadType
from kinematics import forward_kinematics, inverse_kinematics
import numpy as np

class Robot:
    def __init__(self, name, input_source: Subscriber, output_source: Publisher):
        self.name = name
        self.input_source = input_source
        self.output_source = output_source
        self.current_joints = np.zeros(6, dtype=np.float64)

    def run(self):
        while True:
            self.output_source.publish(tuple(self.current_joints))
            input_data = self.input_source.get_data()
            displacement = np.array(input_data, dtype=np.float64)
            current_position = forward_kinematics(self.current_joints)
            goal = current_position @ displacement
            result = inverse_kinematics(goal, self.current_joints)
            if not result.success:
                continue
            self.current_joints = result.q
```

Each loop iteration: publish the current joint state, read the next displacement from the `Subscriber`, compose it against the current forward-kinematics pose to get a target transform, solve IK, and adopt the new joints only if the solve succeeded (otherwise the loop just retries with the same state next tick — a failed IK solve is silently dropped, not surfaced anywhere).

The `Subscriber`/`Publisher` here come from [spine-py](/docs/spine/py/intro) — the CFFI bridge, not `spine-go`. What topic names this actually runs against in practice depends on whatever code constructs a `Robot(...)` and wires in real `Namespace`-backed `Subscriber`/`Publisher` instances; that wiring wasn't found alongside `robot.py`/`kinematics.py` in the repository, so treat this as the node's core logic rather than a fully assembled, deployed pipeline.

## What's missing relative to the proposal

- No RCM pivot constraint
- No motion-scaling gain
- No integration point with a real Purifier or CrackHead (neither exists yet — see [Purifier](/docs/spine-nodes/purifier/intro), [CrackHead](/docs/spine-nodes/crack-head/intro))
- A failed IK solve is silently ignored rather than logged or surfaced

## Links

- [spine-py](/docs/spine/py/intro) — the binding this node actually uses
- [MAD](/docs/spine/mad/intro) — including the Python/Go wire-format caveat, relevant if this node ever needs to talk to a Go node directly

## See also

- [Architecture](/docs/architecture) — where this fits (and doesn't yet fit) into the full pipeline
- [Glossary: Inverse Kinematics](/docs/glossary#inverse-kinematics-ik)
- [Glossary: RCM](/docs/glossary#rcm-remote-center-of-motion)
