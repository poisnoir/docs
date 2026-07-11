---
id: troubleshooting
title: Troubleshooting
sidebar_position: 91
---

# Troubleshooting

Common issues, and how to fix them, drawn from actually reading and running the current `spine-go`/`spined` code — not a generic ROS-style troubleshooting list.

---

## `CreateNode` succeeds but every subsequent `NewService`/`NewPublisher`/etc. fails

**Symptom:** `spine.CreateNode(namespace, name, ctx, logger)` returns no error, but the first `NewService`/`NewPublisher`/`NewServiceCaller`/`NewSubscriber` call afterward fails.

**Cause:** `spined` only ever creates one namespace, `"common"`, at boot. `CreateNode` doesn't check the registration status byte it gets back from `spined`, so registering under any other namespace name fails *silently* at that point — `spined` rejects it and closes the connection server-side, but your process doesn't find out until the next thing tries to use that (now-dead) connection to register an entity.

**Fix:** Use `"common"` as the namespace until namespace creation is exposed. If you need genuine isolation between subsystems today, it isn't available at the `spined` level yet — namespace creation is on the roadmap, not implemented.

---

## There's no way to unregister a single entity without restarting the node

**Symptom:** You're looking for a `Service.Close()`, `Publisher.Close()`, `Subscriber.Close()`, or `ServiceCaller.Close()` method and it doesn't exist (in either `spine-go` or `spine-zig`).

**Cause:** This was removed deliberately, not an oversight — an entity is meant to live as long as its node does, the same way a long-running HTTP server doesn't get told to "stop" individual handlers. `spined` only removes an entity when the *entire node's* connection to it drops.

**Fix:** If you need a topic/service to genuinely go away, end the node's process (or its context) rather than looking for a way to tear down one entity at a time. Real cleanup for `Subscriber`/`ServiceCaller` specifically is planned, not currently available.

---

## Publisher/Subscriber or Service/ServiceCaller never connects

**Symptom:** A `Subscriber` or `ServiceCaller` retries forever (visible via its backoff logging) and never gets data.

**Cause:** There's no discovery here — a `Subscriber`/`ServiceCaller` dials a deterministic Unix socket path (`/tmp/spine/publisher/<namespace>/<name>` or `/tmp/spine/service/<namespace>/<name>`) that only exists once the matching `Publisher`/`Service` has actually created it. Common reasons it never appears:

1. The publisher/service process hasn't started yet, or crashed on startup — check its logs.
2. Namespace mismatch — a subscriber in `"common"` will never see a publisher that (silently) failed to register under a different namespace (see the first entry on this page).
3. `/tmp/spine/` was cleaned up by something else (e.g. a reboot, or another process removing stale sockets) while a listener still thought it owned a now-missing directory.

**Fix:** Confirm both processes are using the same namespace string, and check that the socket path actually exists on disk (`ls /tmp/spine/publisher/common/` or `.../service/common/`) while the publisher/service is running.

---

## Connection succeeds but immediately closes, "service data type is different"

**Symptom:** A `ServiceCaller`/`Subscriber` connects, then the connection is torn down with a type-mismatch error.

**Cause:** On connect, both sides exchange their MAD `Code()` for the key and value types and reject the connection if they don't match exactly (see [MAD](/docs/spine/mad/intro)). This fires whenever the generic type parameters on either end don't describe identical shapes — including field order changes that *shouldn't* matter (MAD sorts struct fields alphabetically before computing the code, so declaration-order differences are fine) but genuine type differences (a `uint32` on one side vs `int32` on the other, an extra field) will trip it.

**Fix:** Double check the exact generic type parameters passed to `NewService[K,V]`/`NewServiceCaller[K,V]` (or `NewPublisher[K]`/`NewSubscriber[K]`) match on both ends.

---

## Error messages from a failed service call are empty

**Symptom:** A `ServiceCaller.Call()` returns an error like `call error: status 252`, with no human-readable message.

**Cause:** This is by design given MAD's current fixed-size-only encoding — the service side can't encode a variable-length string back to the caller, so it only ever sends a status byte. The status codes are in `internal/globals`; `252` is `ERROR_SERVICE_ERROR_CODE` (your handler returned an `error`), `251` is a decode failure, etc.

**Fix:** Look at the *service's* logs (via its `slog.Logger`) for the actual error text — it's logged server-side even though it can't be transmitted back to the caller today.

---

## `zig build test` reports success but nothing seems to have run

**Symptom:** `zig build test` in `spined` exits 0 with no visible test output.

**Cause:** This was a real, since-fixed bug: `spined`'s `src/root.zig` was an empty file, so the "spined" module's test target had nothing to analyze and silently ran ~0 tests, despite `src/mad.zig` containing dozens of unit tests. `root.zig` now re-exports the daemon's internals and forces them into the test build via `std.testing.refAllDecls`, so `zig build test` genuinely exercises `mad.zig`'s test suite.

**Fix:** If you see this again (e.g. after adding a new file that isn't reachable from `root.zig`), check that the new file is actually imported/referenced somewhere `root.zig` can see, not just used internally by `server.zig`.

---

## Still stuck?

There's no public issue tracker referenced in this documentation — check with the team member who owns the piece you're working on (see the Capstone Proposal's team/role table) before assuming a symptom is a bug rather than a documented gap above.
