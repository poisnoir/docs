---
id: intro
title: Examples
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Examples

These are drawn directly from the working example programs in `spine-go/example/` and `spine-zig/src/main.zig`. If you copy-paste from this page, it should actually run against a checked-out `spine-go`/`spine-zig` and (optionally) a running `spined`.

## Publisher / Subscriber

<Tabs>
  <TabItem value="go-pub" label="Go — publisher" default>
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
  </TabItem>
  <TabItem value="go-sub" label="Go — subscriber">
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
  </TabItem>
  <TabItem value="zig-pub" label="Zig — publisher">
  ```zig
  const spine = @import("spine_zig");

  pub fn main(init: std.process.Init) !void {
      const io = init.io;
      const allocator = init.arena.allocator();

      var node = try spine.Node.init("common", "publisher_sample", io, allocator);
      const pub = try node.publish(u32, "temperature");

      var temp: u32 = 0;
      while (true) : (temp += 1) {
          try pub.publish(temp);
          try io.sleep(std.Io.Duration.fromMilliseconds(15), .awake);
      }
  }
  ```
  </TabItem>
  <TabItem value="zig-sub" label="Zig — subscriber">
  ```zig
  const spine = @import("spine_zig");

  pub fn main(init: std.process.Init) !void {
      const io = init.io;
      const allocator = init.arena.allocator();

      var node = try spine.Node.init("common", "subscriber_sample", io, allocator);
      const sub = try node.subscribe(u32, "temperature");

      while (true) {
          const value = try sub.next();
          std.debug.print("{d}\n", .{value});
      }
  }
  ```
  </TabItem>
</Tabs>

Note the semantic difference between the two `Subscriber`s, covered on the [spine-zig](/docs/spine/zig/intro) page: Go's `Get()` returns the latest value (stale intermediates get silently dropped); Zig's `next()` delivers every message in order, like a stream.

## Service / ServiceCaller

<Tabs>
  <TabItem value="go-service" label="Go — service" default>
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
      node, _ := spine.CreateNode("common", "service_sample", ctx, logger)

      lenFunc := func(i uint32) (uint32, error) {
          return i * 2, nil
      }
      _, _ = spine.NewService(node, "double", lenFunc)

      select {} // block forever
  }
  ```
  </TabItem>
  <TabItem value="go-caller" label="Go — caller">
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
      node, _ := spine.CreateNode("common", "service_caller_sample", ctx, logger)

      c, _ := spine.NewServiceCaller[uint32, uint32](node, "double")
      result, _ := c.Call(21, ctx)
      fmt.Println(result) // 42
  }
  ```
  </TabItem>
  <TabItem value="zig-service" label="Zig — service">
  ```zig
  const spine = @import("spine_zig");

  fn timesTwo(input: u32) anyerror!u32 {
      return input * 2;
  }

  pub fn main(init: std.process.Init) !void {
      const io = init.io;
      const allocator = init.arena.allocator();

      var node = try spine.Node.init("common", "service_sample", io, allocator);
      _ = try node.newService(u32, u32, "double", timesTwo);

      while (true) {
          try io.sleep(std.Io.Duration.fromSeconds(3600), .awake);
      }
  }
  ```
  </TabItem>
  <TabItem value="zig-caller" label="Zig — caller">
  ```zig
  const spine = @import("spine_zig");

  pub fn main(init: std.process.Init) !void {
      const io = init.io;
      const allocator = init.arena.allocator();

      var node = try spine.Node.init("common", "service_caller_sample", io, allocator);
      const caller = try node.newServiceCaller(u32, u32, "double");

      const result = try caller.call(21);
      std.debug.print("{d}\n", .{result}); // 42
  }
  ```
  </TabItem>
</Tabs>

Either service can be called by either language's caller — this exact pair (a `time_two` service and caller) has been run cross-language in both directions as separate live processes, not just assumed compatible.

## A real cross-language pub/sub pipeline: kinematics-engine

`kinematic-engine` (Zig, using [`red`](/docs/spine-nodes/kinematics-engine/intro) for the actual math) is a real three-node pipeline running today: a Go input node (`keyboard-controller` or `iphone_imu`) publishes a `[4][4]float64` delta transform, `kinematic-engine` subscribes to it, solves IK, and publishes the resulting `[6]f64` joint angles, which `crack-head` (also Zig) subscribes to and renders in MuJoCo. All three talk directly to each other over Spine, verified running together as separate live processes — a shell script that builds and launches all three in the right order lives alongside the repo checkouts for this project (`run-demo.sh`), though it isn't published anywhere on its own:

```zig
const spine = @import("spine_zig");
const red = @import("red");

const ArctosRobot = red.RobotType("arctos.urdf");

pub fn main(init: std.process.Init) !void {
    const io = init.io;
    const allocator = init.arena.allocator();

    var node = try spine.Node.init("rime", "kinematic-engine", io, allocator);

    const input = try node.subscribe([4][4]f64, "r1-change");
    const output = try node.publish([6]f64, "joints");

    var arm = ArctosRobot.init();
    var current_joints: [6]f64 = .{ 0, 0, 0, 0, 0, 0 };

    while (true) {
        try output.publish(current_joints);
        const delta = try input.next();
        // ...forward kinematics, compose delta, inverse kinematics...
    }
}
```

See [Kinematic Engine](/docs/spine-nodes/kinematics-engine/intro) for the full picture, including why this pipeline runs in its own `"rime"` namespace rather than `"common"` (and what that means for `spined`).

## What's not real yet

Earlier drafts of this page showed mDNS-based multi-machine discovery and AES-GCM encrypted namespaces (`spine.WithNamespace(...)`, `spine.WithKey(...)`). Neither exists in the code — there is no cross-machine transport at all today (see [Spine Overview](/docs/spine/intro)), so those examples have been removed rather than left in as if they were runnable.

## See also

- [spine-go](/docs/spine/go/intro) · [spine-zig](/docs/spine/zig/intro)
