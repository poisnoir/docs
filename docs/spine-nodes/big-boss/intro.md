---
id: intro
title: Big-Boss
sidebar_position: 1
---

# Big-Boss

**Status: a real, working UI shell — not yet reading a live namespace.** Big-Boss is a desktop app (Go backend via [Wails](https://wails.io/), Svelte frontend) that renders a Spine namespace as a graph. Long-term it's meant to be the operator-facing orchestrator: launch and manage the node graph, visualize it live, and gather logs. Today it does the middle third, and only against hardcoded example data.

## What it actually does

`app.go` exposes one method to the frontend, `GetSpineGraph()`, bound through Wails so Svelte can call it directly as if it were a local function. It does not connect to `spined` or read any real namespace — it returns a **hardcoded example graph**: six process groups (`input_device`, `filtering`, `robot_controller`, `kinematic_engine`, `robot_embedded_systems`, `simulator`), each containing a few Spine entities (publisher/subscriber/service/service_caller), with edges generated automatically by matching publisher↔subscriber and service_caller↔service pairs on name.

That example graph is worth reading on its own terms — it's the clearest existing statement of the target pipeline shape, and it's what [Architecture](/docs/architecture) and [Kinematic Engine](/docs/spine-nodes/kinematics-engine/intro)'s Robot Controller/Kinematic Engine split are drawn from: kinematics modeled as a `solve` service called by a separate controller node, both hardware and simulator subscribing to identical `hw_commands`.

## What it would need to become real

Big-Boss needs exactly the introspection operations described in the control-interface design work — `ListNodes`/`ListEntities` (or equivalent) over an admin connection to `spined` — none of which exist yet (`spined` only has the local node/entity registration path today; see [Spine Overview](/docs/spine/intro)). Once those exist, `GetSpineGraph()` swaps its hardcoded slice for a real query and the rest of the frontend (which already just renders whatever `Node`/`Edge`/`Group` structs it's given) shouldn't need to change.

## See also

- [Architecture](/docs/architecture) — the pipeline shape drawn from Big-Boss's own example graph
- [Spine Overview](/docs/spine/intro) — what introspection support `spined` would need before Big-Boss can show live data
