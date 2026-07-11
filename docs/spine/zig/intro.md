---
id: intro
title: spine-zig
sidebar_position: 1
---

# spine-zig

The Zig implementation of Spine (`github.com/poisnoir/spine-zig`), wire-compatible with [spine-go](/docs/spine/go/intro) — a Go publisher can talk to a Zig subscriber and vice versa, verified as separate live processes for every entity type (Publisher/Subscriber, Service/ServiceCaller), not just assumed. It's built directly on top of `spined`'s own `mad.zig` codec (copied in, not reimplemented) rather than a separate serializer, which is a large part of why the two stay in sync.

Smaller in scope than spine-go today: node registration, Pub/Sub, and RPC are implemented; there's no `NewThreadedService` distinction — one `Service` implementation is wire-compatible with both of spine-go's, since each accepted connection is already handled by its own concurrent task.

## Installation

```bash
zig fetch --save git+https://github.com/poisnoir/spine-zig#v0.1.0
```

Then in `build.zig`:

```zig
const spine_zig_dep = b.dependency("spine_zig", .{ .target = target, .optimize = optimize });
exe.root_module.addImport("spine_zig", spine_zig_dep.module("spine_zig"));
```

## Creating a node

Every program that talks to Spine starts by creating a `Node`. This registers with the `spined` daemon if one is reachable at `/tmp/spine/spined` — if not, the node silently falls back to "local-only mode" and keeps working (see [Troubleshooting](/docs/troubleshooting)), same as spine-go.

```zig
const spine = @import("spine_zig");

pub fn main(init: std.process.Init) !void {
    const io = init.io;
    const allocator = init.arena.allocator();

    var node = try spine.Node.init("common", "my-node", io, allocator);
    defer node.deinit();
}
```

The namespace argument matters the same way it does for spine-go: `spined` only ever has one namespace, `"common"`, created at boot. Registering under any other name gets rejected by the daemon.

## Pub/Sub

```zig
const pub = try node.publish(u32, "temperature");
try pub.publish(37);
```

```zig
const sub = try node.subscribe(u32, "temperature");
const value = try sub.next(); // blocks until the next published value
```

`K` in `node.publish(K, topic)`/`node.subscribe(K, topic)` can be any type MAD can encode — see [MAD](/docs/spine/mad/intro) (no strings or slices).

**A real semantic difference from spine-go, not just a naming one:** spine-go's `Subscriber.Get()` returns the *latest* value — if several messages arrive faster than you call `Get()`, you only ever see the newest one, and stale intermediate values are silently dropped. spine-zig's `Subscriber.next()` instead delivers every published message **in order**, one per call, like a stream rather than a "latest value" cell — if your subscriber falls behind, later calls just work through the backlog rather than skipping to the newest one. Neither is "more correct"; they're different tools. If you need spine-go's coalescing behavior in Zig, you'd build it yourself on top of `next()` (e.g. a background task draining to a single-slot cell).

## Services (RPC)

```zig
fn timesTwo(input: u32) anyerror!u32 {
    return input * 2;
}
_ = try node.newService(u32, u32, "double", timesTwo);
```

```zig
const caller = try node.newServiceCaller(u32, u32, "double");
const result = try caller.call(21); // 42
```

Unlike spine-go, there's only one `Service` — no separate "sequential vs. threaded" choice, because every accepted connection already runs as its own concurrent task under the hood. It's wire-compatible with both of spine-go's variants, since they share an identical protocol and only differ in how Go schedules handler execution internally.

## Entities live as long as the node does

Same design as spine-go: there's no `deinit()`/`Close()` on `Publisher`, `Subscriber`, `Service`, or `ServiceCaller` — an entity is meant to live as long as its node does. A process that creates a `Publisher`/`Service` can't return normally from `main()` for this reason either — their accept loops run forever on a background thread, and Zig's own runtime shutdown sequence would otherwise block joining them. Long-running programs call `std.process.exit(0)` explicitly instead of returning.

## Reconnect-on-drop

Both `Subscriber` and `ServiceCaller` reconnect automatically on a broken connection, with the same exponential backoff (100ms → 5s cap) as the initial connect — but not identically, because one has an idempotency concern the other doesn't:

- **`Subscriber.next()`** treats a broken connection as transient: it reconnects and keeps retrying the read internally, so a call to `next()` never surfaces a disconnect as an error — it just blocks a little longer. Reading has no side effects, so retrying inside the same call is free.
- **`ServiceCaller.call()`** reconnects first if the previous attempt marked the connection dead, but a failure *during* the current request still returns that request's own error rather than silently retrying it — the request may have already taken effect server-side by the time the failure is observed. The *next* call reconnects and proceeds normally.

Verified live: killing and restarting a real service process out from under a long-running caller, the caller logs the one failed call and resumes correctly on its own once the service comes back.

A type mismatch (the `Code()` check below failing) is treated as permanent, not transient, in both — it returns immediately instead of retrying forever, since `K`/`V` are fixed at compile time and retrying can never fix it.

## What's actually happening on the wire

Same well-known filesystem paths as spine-go — this is exactly what makes the two interoperable without any negotiation step:

- `/tmp/spine/service/<namespace>/<name>` — a `Service`'s Unix socket
- `/tmp/spine/publisher/<namespace>/<name>` — a `Publisher`'s Unix socket

A `ServiceCaller`/`Subscriber` dials the path directly; `spined` is not consulted to resolve it. On connect, both sides exchange their MAD type `code()` for the key and value types and refuse to proceed if they don't match. One cross-language quirk worth knowing: on a mismatch, spine-go's `Service` sends **no response byte at all** — it just closes the connection. spine-zig's `Service` mirrors that exact behavior rather than "improving" it, since a real spine-go `ServiceCaller` only knows how to interpret that specific shape of failure.

## Links

- [GitHub](https://github.com/poisnoir/spine-zig)
- [spine-go](/docs/spine/go/intro) — the wire-compatible Go counterpart
- [MAD](/docs/spine/mad/intro) — the serializer used for every message
- [Spine Overview](/docs/spine/intro) — how this fits together with `spined`
