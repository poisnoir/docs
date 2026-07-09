---
id: intro
title: spine-cpp
sidebar_position: 1
---

# spine-cpp

**Status: not yet found in the codebase.** The project's Capstone Proposal lists C++ as a target language for "the embedded control loop interface and the CrackHead simulation bindings to MuJoCo's C API," and earlier drafts of this documentation described a `spine-cpp` package with a full pub/sub and RPC API. No such package — headers, source, or an installable artifact — currently exists anywhere in this codebase. This page previously documented an invented API (`spine::Node`, `.subscribe`/`.publish`/`.handle`/`.call`, mDNS discovery); none of it is real, and it's been removed rather than left to mislead.

## What actually exists today

- **Go** (`spine-go`) is the verified, working, primary implementation — see [spine-go](/docs/spine/go/intro).
- **Python** (`spine_py`) exists and is in real use by [kinematics-engine](/docs/spine-nodes/kinematics-engine/intro), via a CFFI bridge to a compiled `spineBridge.so` — see [spine-py](/docs/spine/py/intro). Notably, that bridge is *not* written in C++ in any source found here; where its implementation actually lives wasn't determined while writing this page.
- **Zig** (`spine-zig`) has an early, partial client — a single in-progress `NewService` implementation, still mostly `zig init` scaffolding otherwise. Not documented as its own page yet since there isn't enough there to write about beyond "it exists and compiles."

If C++ is genuinely needed for the embedded/MuJoCo-facing work the proposal describes, the two realistic paths are: reuse `spineBridge.so`'s C ABI (the same one `spine_py` calls into via CFFI) directly from C++, or write a native C++ client against the same wire protocol spine-go uses (Unix domain sockets + MAD framing — see [MAD](/docs/spine/mad/intro)). Neither has been started as of this writing.

## Links

- [spine-go](/docs/spine/go/intro) — the implementation to read first if you're porting the protocol to another language
- [MAD](/docs/spine/mad/intro) — the wire format any new implementation needs to match
