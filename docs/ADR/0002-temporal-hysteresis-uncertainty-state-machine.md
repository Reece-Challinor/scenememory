# ADR 0002: 3-of-5 Temporal Hysteresis & Uncertainty State Machine

**Status:** Accepted  
**Date:** 2026-09-28  
**Context:** Spatial Proof Lab / SceneMemory v1.0.0  

## Context and Problem Statement
Raw frame-by-frame object detection produces detection flicker, transient false positives, and sudden dropouts due to lighting shifts or hand occlusions. A naive baseline system asserts that an object is present right now based on a single frame, leading to false current-location claims when objects disappear.

## Decision Drivers
1. **Honesty About Uncertainty:** Never assert present location if an object is missing or ambiguous.
2. **Noise Suppression:** Prevent single-frame detection noise from creating false spatial anchors.
3. **Inspectable Telemetry:** Quantify false assertions prevented compared to naive systems.

## Decision Outcome
Implement a deterministic 4-state perception state machine (`OBSERVED_NOW`, `LAST_OBSERVED_HERE`, `UNKNOWN`, `AMBIGUOUS`) governed by a 3-of-5 temporal hysteresis filter.

### Rules
- **Enrollment:** Requires 3 qualifying detections over the last 5 frames before transitioning to `OBSERVED_NOW`.
- **Ghost State:** When detection misses, transition to `LAST_OBSERVED_HERE` (purple ghost reticle + timestamp counter) for up to 10 seconds.
- **Ambiguity Latch:** Trigger `AMBIGUOUS` warning whenever multiple instances of the same enrolled category appear simultaneously.
- **Expiry:** Expire ghost anchors to `UNKNOWN` after 10 seconds.
