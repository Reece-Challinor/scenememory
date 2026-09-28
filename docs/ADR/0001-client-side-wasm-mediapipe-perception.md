# ADR 0001: Client-Side WebGL / WASM Computer Vision Inference Runtime

**Status:** Accepted  
**Date:** 2026-09-28  
**Context:** Spatial Proof Lab / SceneMemory v1.0.0  

## Context and Problem Statement
SceneMemory requires real-time 2D object detection from a Mac webcam stream. The system must run within a 10-hour build budget without incurring cloud infrastructure costs or leaking private video frames to external servers.

## Decision Drivers
1. **Zero Cloud Infrastructure Cost:** Eliminate server-side GPU costs.
2. **Privacy First:** Ensure camera video frames never leave the user's browser.
3. **Low Latency:** Achieve >= 30 FPS inference responsiveness.
4. **Offline Resilience:** App must function without active cloud API connections.

## Considered Options
1. **Option A:** Server-side inference via GCP Vertex AI / PyTorch Cloud Run.
2. **Option B (Chosen):** Client-side inference via TF.js WebGL and MediaPipe WASM in browser.
3. **Option C:** Local Python backend (FastAPI + OpenCV + YOLOv8) via WebSocket.

## Decision Outcome
**Chosen Option: Option B (Client-side browser inference)**.

### Positives
- **$0 Cloud Spend:** Static web server costs virtually zero.
- **Privacy Guaranteed:** Frames remain entirely inside browser memory.
- **Ultra-low Latency:** 11.4ms p50 latency on M3 Mac GPU.

### Negatives
- Model sizes are constrained to lightweight architectures (< 10 MB).
- Complex 3D metric reconstruction is limited compared to heavy desktop PyTorch models.
