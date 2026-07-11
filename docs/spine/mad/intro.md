---
id: intro
title: MAD
sidebar_position: 1
---

# MAD

MAD is Spine's binary serialization format — a reflection-driven codec that turns a plain struct/dataclass into a fixed-layout byte string with no schema file and no runtime type tags. There is no `.proto`, no code generation step, and no length-prefixed dynamic fields: every type's wire size is derived from its shape alone.

## Design

Each supported type maps to a fixed-width encoding:

| Kind | Wire size |
|------|-----------|
| `bool` | 1 byte |
| `int8`/`uint8` | 1 byte |
| `int16`/`uint16` | 2 bytes |
| `int32`/`uint32`/`float32` | 4 bytes |
| `int64`/`uint64`/`float64` | 8 bytes |
| fixed-size array `[N]T` | `N × size(T)` |
| struct | sum of field sizes, **fields sorted alphabetically by name, not declaration order** |

The alphabetical field sort is the detail that trips people up: two structs with the same fields declared in a different order still produce byte-identical output, because both the Go and Zig implementations re-sort fields by name before encoding. Field values are laid out back-to-back with no padding, tags, or delimiters — reading the wrong type off a valid buffer will silently produce garbage rather than an error.

### The `code()` fingerprint

Every type also has a `Code()` — a short string derived purely from its shape (e.g. a `uint32` is `b14`, a struct is `f` followed by each sorted field's own code joined by `z`). This is how a `ServiceCaller`/`Subscriber` and the `Service`/`Publisher` it connects to agree they're speaking about the same type: on connect, each side exchanges its key/value type codes over the wire and refuses the connection if they don't match exactly. There's no IDL and no versioning — a code mismatch is the whole story; there's no reflection at the receiving end to recover from it.

## No variable-length types

An earlier version of MAD supported strings, slices, and maps. That support was **removed** from both the Go (`mad-go`) and Zig (used inside `spined`) implementations — `generateFuncs`/the Zig `getRequiredSize`/`code`/`encode`/`decode` switch only handle `bool`/`int`/`uint`/`float`/`array`/`struct` now. Anything with a `[]T` or `string` field will fail to construct a `Mad[T]` (Go) or fail to compile the moment the type is used (Zig, since it's `comptime`-driven). This is a deliberate simplification: without variable-length data, every message has a size known before a single byte is read, which is what lets the transport layer allocate one fixed buffer per connection and never grow it.

Practical implication: if you need a "string" field in a message today, you're modeling it as a fixed-size byte array with an explicit length field, the same way Spine encodes node/entity names internally (`{ data: [64]u8, len: u8 }`), not as a dynamically-sized value.

## Implementations

MAD exists in two places today, and they're wire-compatible — verified as separate live processes, not just assumed:

| Implementation | Location | Wire code scheme |
|---|---|---|
| `mad-go` | `github.com/poisnoir/mad-go`, used by spine-go | letter-prefixed (`b14`, `f...z`, ...) |
| `mad.zig` | vendored inside `spined`, copied verbatim into `spine-zig` | same scheme as `mad-go` |

`spine-zig` deliberately reuses `spined`'s own `mad.zig` rather than maintaining a separate implementation, which is a large part of why the two stay compatible without extra effort.

## Usage (Go)

```go
import "github.com/poisnoir/mad-go"

type ControlMsg struct {
    X, Y, Z float32
    Buttons uint8
}

m, err := mad.NewMad[ControlMsg]()

buf := make([]byte, m.GetRequiredSize())
err = m.Encode(&ControlMsg{X: 1.0, Y: -0.5, Z: 0.0, Buttons: 0b0001}, buf)

var out ControlMsg
err = m.Decode(buf, &out)
```

`GetRequiredSize()` takes no arguments — since every supported type is fixed-size, the size is known from the type alone, not from a specific instance. (This is a recent change; earlier revisions took a `*T` argument to size variable-length data that no longer exists.)

You typically don't call `mad.NewMad` directly in application code — `Service`, `ServiceCaller`, `Publisher`, and `Subscriber` all construct their own key/value serializers internally from your generic type parameters.

## Usage (Zig)

Same idea, but `comptime`-driven instead of reflection-driven — the type itself is a compile-time argument, not a runtime value wrapped in a struct:

```zig
const mad = @import("mad.zig");

const ControlMsg = struct {
    x: f32,
    y: f32,
    z: f32,
    buttons: u8,
};

const size = mad.getRequiredSize(ControlMsg);

var buf: [size]u8 = undefined;
_ = mad.encode(ControlMsg, .{ .x = 1.0, .y = -0.5, .z = 0.0, .buttons = 0b0001 }, &buf);

var out: ControlMsg = undefined;
_ = mad.decode(ControlMsg, &out, &buf);
```

As in Go, you don't normally call this directly — `spine_zig`'s `Node.publish`/`subscribe`/`newService`/`newServiceCaller` all resolve `getRequiredSize`/`encode`/`decode` for your `comptime K`/`V` type parameters internally.

## See also

- [spine-go](/docs/spine/go/intro) / [spine-zig](/docs/spine/zig/intro) — both use MAD for all message encoding
- [Spine Overview](/docs/spine/intro) — how messages travel between nodes
