---
id: intro
title: spine-go
sidebar_position: 1
---

# spine-go

The primary Spine implementation, written in Go (`github.com/poisnoir/spine-go`). A node is a process; nodes exchange typed messages through two primitives — **Services** (RPC) and **Pub/Sub** — using Go generics instead of an IDL. Everything runs over local **Unix domain sockets** today; there is no network transport yet (see [Spine Overview](/docs/spine/intro) for what that does and doesn't mean in practice).

## Installation

```bash
go get github.com/poisnoir/spine-go
```

## Creating a node

Every program that talks to Spine starts by creating a `Node`. This registers with the `spined` daemon if one is reachable at `/tmp/spine/spined` — if not, the node silently falls back to "local-only mode" and keeps working (see [Troubleshooting](/docs/troubleshooting)).

```go
package main

import (
	"context"
	"log/slog"
	"os"

	"github.com/poisnoir/spine-go"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	ctx := context.Background()

	node, err := spine.CreateNode("common", "my-node", ctx, logger)
	if err != nil {
		panic(err)
	}
	_ = node
}
```

The namespace argument matters: `spined`, as it exists today, only ever has one namespace, `"common"`, created at boot. Registering under any other name gets rejected by the daemon (see [Troubleshooting](/docs/troubleshooting)).

## Pub/Sub

Publishers hold the latest value and push it to every connected subscriber; subscribers poll for the latest value rather than blocking on individual messages — if a subscriber is slow, it gets the newest value next time it asks, not a backlog.

```go
pub, err := spine.NewPublisher[uint32](node, "temperature")
pub.Publish(37)
```

```go
sub, err := spine.NewSubscriber[uint32](node, "temperature")
value, err := sub.Get() // blocks until the first value arrives, then returns the latest
```

`K` in `NewPublisher[K]`/`NewSubscriber[K]` can be any type MAD can encode — see [MAD](/docs/spine/mad/intro) for what that currently means (no strings or slices).

## Services (RPC)

Turn any Go function into a request/response endpoint. Two execution modes:

- **`NewService`** — sequential. Requests queue and are handled one at a time by a single goroutine. Use this when the handler mutates shared state.
- **`NewThreadedService`** — each request is handled on its own goroutine. Use this for stateless or I/O-bound handlers (no shared state to protect).

```go
handler := func(input string) (int, error) {
	return len(input), nil
}
service, err := spine.NewService(node, "string_length", handler)
```

```go
caller, err := spine.NewServiceCaller[string, int](node, "string_length")
result, err := caller.Call("hello spine", context.Background())
```

`ServiceCaller` and `Subscriber` both retry their underlying connection with exponential backoff (via `github.com/cenkalti/backoff/v4`) — a transient disconnect (e.g. the service process restarting) doesn't require the caller to be recreated.

## Entities live as long as the node does

There's no `Close()` on `Service`, `Publisher`, `Subscriber`, or `ServiceCaller` — this was removed deliberately: an entity is meant to live as long as its node does, the same way a long-running HTTP server doesn't get told to "stop" individual handlers. If you need a topic/service to genuinely go away, that means ending the node's process (or its context) rather than tearing down one entity at a time. Real cleanup for `Subscriber`/`ServiceCaller` specifically — the two cases where it'd plausibly matter, since they represent momentary *interest* rather than a node's own identity — is planned, not bolted on.

## What's actually happening on the wire

There's no service discovery step beyond the well-known filesystem paths Spine uses by convention:

- `/tmp/spine/service/<namespace>/<name>` — a `Service`'s Unix socket
- `/tmp/spine/publisher/<namespace>/<name>` — a `Publisher`'s Unix socket

A `ServiceCaller`/`Subscriber` just dials the path directly; `spined` is not consulted to resolve it. On connect, both sides exchange their MAD type `Code()` for the key and value types and refuse to proceed if they don't match — this is the only type-safety check that happens at runtime, since there's no shared IDL to check against ahead of time.

## Links

- [GitHub](https://github.com/poisnoir/spine-go)
- [spine-zig](/docs/spine/zig/intro) — the wire-compatible Zig counterpart
- [MAD](/docs/spine/mad/intro) — the serializer used for every message
- [Spine Overview](/docs/spine/intro) — how this fits together with `spined`
