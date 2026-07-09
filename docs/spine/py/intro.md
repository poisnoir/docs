---
id: intro
title: spine-py
sidebar_position: 1
---

# spine-py

The Python binding for Spine (package name `spine_py`, imported as `spine`). Unlike spine-go, this is **not** a pure-Python reimplementation of the protocol — it's a thin [CFFI](https://cffi.readthedocs.io/) wrapper around a compiled shared library, `spineBridge.so`, loaded at import time. All the real work (namespace/service/publisher/subscriber bookkeeping, the actual socket I/O) happens on the other side of that FFI boundary; the Python layer just marshals arguments across it.

This is the binding used today by [kinematics-engine](/docs/spine-nodes/kinematics-engine/intro), the one real consumer of `spine_py` found in this codebase.

## API

```python
from spine import Namespace, Publisher, Subscriber, ServiceCaller
from mad import Mad, MadType
```

```python
ns = Namespace("common", "")  # name, key — see the note on `key` below
```

```python
pub = Publisher(ns, "temperature", MadType.float32)
pub.publish(37.0)
```

```python
sub = Subscriber(ns, "temperature", MadType.float32)
value = sub.get_data()  # returns None if nothing has arrived yet
```

```python
caller = ServiceCaller(ns, "string_length", MadType.string, MadType.uint32)
result = caller.call("hello spine", time_out=1000)
```

Every constructor takes a `MadType` (or a `@dataclass` built from `MadType` fields) describing the message shape, and internally builds a `Mad(...)` serializer from it — mirroring how spine-go derives a `mad.Mad[K]` from a Go generic type parameter, just resolved at Python runtime instead of compile time.

## The `key` parameter and the wire-format gap

`Namespace(name, key)` takes a second argument that spine-go's `CreateNode(namespace, name, ctx, logger)` has no equivalent for. What `key` actually does on the other side of `spineBridge.so` isn't verifiable from the Python source alone — the bridge is a compiled artifact, not something with source in this codebase. Don't assume it implies working encryption or that it's compatible with anything on the Go/spined side; treat it as an open question to resolve with whoever owns `spineBridge.so`, not a documented feature.

More concretely verifiable: the Python `mad` package installed alongside `spine_py` is a **different, richer** serializer than the one spine-go and spined use — it still supports `string`, `dict`, and dataclasses with a completely different wire-code scheme (digit-prefixed vs. the Go/Zig letter-prefixed codes). See [MAD](/docs/spine/mad/intro) for the details. Practical upshot: don't assume a Python node and a Go node agree on bytes for "the same" message today, even if the field types look identical.

## Links

- [MAD](/docs/spine/mad/intro) — the serializer, and where the Go/Python split actually is
- [spine-go](/docs/spine/go/intro) — the primary, verified-in-source implementation
- [Kinematics Engine](/docs/spine-nodes/kinematics-engine/intro) — the real code that uses this binding
