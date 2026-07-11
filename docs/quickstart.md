---
id: quickstart
title: Quickstart
sidebar_position: 1
---

# Quickstart

Get a Spine publisher and subscriber talking to each other locally. This is the part of PreciCore that's actually implemented and runnable today — it doesn't cover Purifier, Kinematics Engine, or CrackHead as a connected pipeline, since those pieces aren't wired together as running nodes yet (see [Architecture](/docs/architecture) for what's real vs. planned).

## Prerequisites

| Dependency | Notes |
|------------|-------|
| Go 1.24+ | For `spine-go` |
| Zig 0.16 | Only needed if you're building `spined` from source |

`spined` is optional for everything in this guide — Spine falls back to "local-only mode" automatically if it can't connect to the daemon. You'll only need it if you want a central place to see what's registered.

## 1 — (Optional) Start spined

```bash
cd spined
zig build run
```

This listens on a Unix domain socket at `/tmp/spine/spined`. If you skip this step, every `spine.CreateNode(...)` call below still works — it just logs a warning and proceeds without registering anywhere.

## 2 — Install spine-go

```bash
go get github.com/poisnoir/spine-go
```

## 3 — Publisher

```go
package main

import (
	"context"
	"log/slog"
	"os"
	"time"

	"github.com/poisnoir/spine-go"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	ctx := context.Background()

	// "common" is the only namespace spined currently supports.
	node, _ := spine.CreateNode("common", "publisher_sample", ctx, logger)

	pub, _ := spine.NewPublisher[uint32](node, "temperature")

	var temp uint32 = 0
	for {
		pub.Publish(temp)
		temp++
		time.Sleep(15 * time.Millisecond)
	}
}
```

```bash
go run main.go
```

## 4 — Subscriber

In a second terminal:

```go
package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"

	"github.com/poisnoir/spine-go"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	ctx := context.Background()

	node, _ := spine.CreateNode("common", "subscriber_sample", ctx, logger)
	sub, _ := spine.NewSubscriber[uint32](node, "temperature")

	for {
		fmt.Println(sub.Get())
	}
}
```

```bash
go run main.go
```

You should see the subscriber print an increasing number. There's no discovery step to wait on — the subscriber dials the publisher's Unix socket at a well-known path (`/tmp/spine/publisher/common/temperature`) the moment it's created, retrying with backoff until the publisher exists.

## What this doesn't cover

- **Services/RPC** — see the [Examples](/docs/spine/examples/intro) page for a `NewService`/`NewServiceCaller` pair.
- **spine-zig** — this walkthrough is Go-only; see [spine-zig](/docs/spine/zig/intro) for the same steps in Zig.
- **Cross-machine setups** — not possible yet; see [Spine Overview](/docs/spine/intro).
- **Namespaces other than `common`** — rejected by `spined` today; see [Troubleshooting](/docs/troubleshooting).
- **Purifier** — no code exists yet; see [Purifier](/docs/spine-nodes/purifier/intro). Kinematics Engine and CrackHead, by contrast, *are* running end-to-end today against a live input source and a live simulator — see [Kinematics Engine](/docs/spine-nodes/kinematics-engine/intro).

## Next steps

- [Architecture](/docs/architecture) — what's built vs. designed across the whole system
- [Spine Overview](/docs/spine/intro) — the full picture of what Spine does and doesn't do today
- [MAD](/docs/spine/mad/intro) — the serialization format underneath every message
