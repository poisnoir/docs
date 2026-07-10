---
id: intro
title: spine-py
sidebar_position: 1
---

# spine-py

The Python binding for Spine (package name `spine_py`, imported as `spine`). It's **not** a pure-Python reimplementation of the protocol — it's a thin [CFFI](https://cffi.readthedocs.io/) wrapper around a compiled shared library, `spineBridge.so`, loaded at import time. All the real work happens on the other side of that FFI boundary; the Python layer just marshals arguments across it.

## It's a build of the old, retired Spine — not the current one

This was previously an open question in this documentation. It's resolved now: per the project's own design notes, `spineBridge.so` is a **cgo-compiled build of the pre-redesign Go implementation** (the KCP-over-UDP, mDNS-discovery, AES-GCM-encrypted-namespace version), wrapped for Python (and originally C++ too) specifically because writing a native Python transport implementation wasn't worth the effort. It predates the current Unix-socket `spine-go`/`spined` and hasn't been rebuilt against it.

This is confirmed independently by the API shape and by the [MAD](/docs/spine/mad/intro) mismatch below — both point the same direction. Practical consequence: **any Python node built on `spine_py` today — including [Kinematic Engine](/docs/spine-nodes/kinematics-engine/intro)'s Python implementation — is on the old, retired transport**, the same situation as the Go input nodes and CrackHead. It is not currently interoperable with `spined`/`spine-go` as they exist in this codebase now.

## API (as it exists today, on the old backend)

```python
from spine import Namespace, Publisher, Subscriber, ServiceCaller
from mad import Mad, MadType

ns = Namespace("rime", "ppap")  # namespace name, encryption key — the old API
pub = Publisher(ns, "temperature", MadType.float32)
pub.publish(37.0)

sub = Subscriber(ns, "temperature", MadType.float32)
value = sub.get_data()  # returns None if nothing has arrived yet

caller = ServiceCaller(ns, "string_length", MadType.string, MadType.uint32)
result = caller.call("hello spine", time_out=1000)
```

The second `Namespace` argument — which has no equivalent in the current `spine-go`'s `CreateNode(namespace, name, ctx, logger)` — is the old AES-GCM namespace encryption key. That mystery is solved now too: it isn't a forward-looking feature the new Spine hasn't caught up to, it's a retired one.

Every constructor takes a `MadType` (or a `@dataclass` built from `MadType` fields) and builds a `Mad(...)` serializer from it internally — the same idea as spine-go deriving a `mad.Mad[K]` from a generic type parameter, just resolved at Python runtime instead of Go compile time.

## The MAD mismatch (independent confirmation)

The Python `mad` package installed alongside `spine_py` is a **different, richer** serializer than the one current `spine-go`/`spined` use — it still supports `string`, `dict`, and dataclasses, with a completely different (digit-prefixed) wire-code scheme, where the Go/Zig side removed string/slice/map support entirely and uses letter-prefixed codes. See [MAD](/docs/spine/mad/intro). This is exactly what you'd expect if `spine_py` simply hasn't been touched since before that redesign — one more confirmation this binding is frozen at the old design, not a parallel-but-current implementation.

## What rebuilding this would take

There's no path yet from "old cgo-wrapped binding" to "binding for the current spine-go" other than starting over: either compile the *current* Go implementation with cgo exports and rewrap it (repeating the approach that was already tried and moved away from once), or write a native Python client against the current Unix-socket protocol directly. Neither has been started.

## Links

- [MAD](/docs/spine/mad/intro) — the serializer, and where the Go/Python split actually is
- [spine-go](/docs/spine/go/intro) — the current, primary implementation this binding does not talk to
- [Kinematic Engine](/docs/spine-nodes/kinematics-engine/intro) — the real code that uses this binding today
