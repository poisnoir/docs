---
id: intro
title: spine-cpp
sidebar_position: 1
---

# spine-cpp

**Status: not found in the codebase, though a C++ wrapper was reportedly attempted once.** Per the project's own design notes, the retired KCP/mDNS-era Spine was wrapped via cgo for **both** C++ and Python — [spine-py](/docs/spine/py/intro)'s `spineBridge.so` is the surviving half of that; no equivalent C++ headers, source, or build artifact were found anywhere in this codebase. Whether that means the C++ side was never finished, never committed, or removed isn't determinable from what's here.

## What actually exists today

- **Go** (`spine-go`) is the verified, working, primary implementation — see [spine-go](/docs/spine/go/intro).
- **Python** (`spine_py`) exists and is real, but bound to the old, retired backend rather than current `spine-go`/`spined` — see [spine-py](/docs/spine/py/intro) for the full story.
- **Zig** (`spine-zig`) has an early, partial client — a single in-progress `NewService` implementation, still mostly `zig init` scaffolding otherwise. Not documented as its own page yet since there isn't enough there to write about beyond "it exists and compiles."

If C++ is genuinely needed — the Capstone Proposal names it for the embedded control-loop interface and MuJoCo C API bindings — the realistic paths are the same as for any new binding: write a native C++ client against the current Unix-socket + MAD protocol (see [MAD](/docs/spine/mad/intro)), or repeat the cgo-wrapper approach against **current** `spine-go` instead of the retired version. Given that approach was already tried once and moved away from (see [spine-py](/docs/spine/py/intro)'s history), a native client is probably the better default unless there's a specific reason to prefer wrapping Go again.

## Links

- [spine-go](/docs/spine/go/intro) — the implementation to read first if you're porting the protocol to another language
- [MAD](/docs/spine/mad/intro) — the wire format any new implementation needs to match
