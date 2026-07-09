---
id: intro
title: Examples
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Examples

These are drawn directly from the working example programs in `spine-go/example/`, plus the one real Python consumer of `spine_py`. If you copy-paste from this page, it should actually run against a checked-out `spine-go` and (optionally) a running `spined`.

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
  <TabItem value="py" label="Python (spine_py)">
  ```python
  from spine import Namespace, Publisher
  from mad import MadType

  ns = Namespace("common", "")
  pub = Publisher(ns, "temperature", MadType.float32)
  pub.publish(37.0)
  ```
  </TabItem>
</Tabs>

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
      node, _ := spine.CreateNode("common", "subscriber_sample", ctx, logger)

      lenFunc := func(i uint32) (uint32, error) {
          return i * 2, nil
      }
      _, _ = spine.NewService(node, "string_length", lenFunc)

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

      c, _ := spine.NewServiceCaller[string, string](node, "print")
      result, _ := c.Call("hello world", ctx)
      fmt.Println(result)
  }
  ```
  </TabItem>
</Tabs>

## A real cross-language node: kinematics-engine

`kinematics-engine` (Python) is the one place in this codebase where a non-Go node actually wires into Spine. It subscribes to an operator-input displacement, runs it through forward/inverse kinematics, and publishes the resulting joint angles — a `Subscriber` and a `Publisher` on either end of a plain computation, no RPC involved:

```python
from spine import Publisher, Subscriber
from mad import MadType
from kinematics import forward_kinematics, inverse_kinematics
import numpy as np

class Robot:
    def __init__(self, name, input_source: Subscriber, output_source: Publisher):
        self.name = name
        self.input_source = input_source
        self.output_source = output_source
        self.current_joints = np.zeros(6, dtype=np.float64)

    def run(self):
        while True:
            self.output_source.publish(tuple(self.current_joints))
            displacement = np.array(self.input_source.get_data(), dtype=np.float64)
            goal = forward_kinematics(self.current_joints) @ displacement
            result = inverse_kinematics(goal, self.current_joints)
            if result.success:
                self.current_joints = result.q
```

See [Kinematics Engine](/docs/spine-nodes/kinematics-engine/intro) for the full picture, including the [MAD](/docs/spine/mad/intro) wire-format caveat that applies whenever a Python node talks to a Go one.

## What's not real yet

Earlier drafts of this page showed mDNS-based multi-machine discovery and AES-GCM encrypted namespaces (`spine.WithNamespace(...)`, `spine.WithKey(...)`). Neither exists in the code — there is no cross-machine transport at all today (see [Spine Overview](/docs/spine/intro)), so those examples have been removed rather than left in as if they were runnable.

## See also

- [spine-go](/docs/spine/go/intro) · [spine-py](/docs/spine/py/intro) · [spine-cpp](/docs/spine/cpp/intro)
