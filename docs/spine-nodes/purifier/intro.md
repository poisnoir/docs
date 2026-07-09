---
id: intro
title: Purifier
sidebar_position: 1
---

# Purifier

**Status: not found in the codebase surveyed for this documentation.** Purifier is the proposal's name for the tremor-filtering stage between raw operator input and the control system. Everything below is the design as specified in the Capstone Proposal's Control System section — real design content, not fabricated — but there is no code implementing it yet, so treat this page as a spec to build against rather than a description of running behavior.

## Why filter input?

Operator input is modeled as a true intended trajectory corrupted by additive, approximately zero-mean tremor noise — physiological tremor is well characterized in the literature as concentrated in the 8–12 Hz band. In corneal surgery, where tolerances are measured in micrometres, tremor-induced tip displacement can exceed the safe operating margin on its own.

## The designed filter

A discrete-time Kalman filter is specified to produce a minimum-variance estimate of the intended trajectory from noisy position measurements. State vector `x_k = [position, velocity]ᵀ`:

**Prediction:**

```
x̂ₖ|ₖ₋₁ = F x̂ₖ₋₁|ₖ₋₁
Pₖ|ₖ₋₁ = F Pₖ₋₁|ₖ₋₁ Fᵀ + Q
```

**Update:**

```
Kₖ = Pₖ|ₖ₋₁ Hᵀ (H Pₖ|ₖ₋₁ Hᵀ + R)⁻¹
x̂ₖ|ₖ = x̂ₖ|ₖ₋₁ + Kₖ(zₖ − H x̂ₖ|ₖ₋₁)
```

Where `F` is the constant-velocity transition model, `Q` the process noise covariance, `R` the measurement noise covariance (meant to be characterized empirically from baseline operator input), and `z_k` the raw measurement. `Q` and `R` are meant to be tuned against recorded operator input traces, with filter performance evaluated by residual high-frequency power in the 8–12 Hz band — i.e. the acceptance criterion is spectral, not just a qualitative "feels smoother."

## What isn't specified yet

The proposal specifies the filter design above but not: the exact Spine message shape Purifier would subscribe to or publish, how it would be configured/tuned at runtime, or which upstream input source(s) it's meant to normalize across (keyboard, Xbox controller, and iPhone IMU are all described as separate input nodes in the proposal's roadmap — see [Input](/docs/spine-nodes/input/intro) — but nothing in this codebase shows how their outputs would be unified before reaching this filter).

## See also

- [Input nodes](/docs/spine-nodes/input/intro) — the proposed upstream sources
- [Kinematics Engine](/docs/spine-nodes/kinematics-engine/intro) — the one real node in the pipeline, and the proposed downstream consumer of Purifier's output
- [Glossary: Kalman Filter](/docs/glossary#kalman-filter)
- [Glossary: Tremor](/docs/glossary#tremor)
