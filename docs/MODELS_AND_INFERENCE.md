# Models & Inference Architecture Guide

**Project:** Spatial Proof Lab / SceneMemory v1.0.0  
**Target Hardware:** Apple Silicon M3 Mac (16 GB Unified Memory)  
**Author:** Reece Challinor  

---

## 1. Where the Models Run (Inference Topology)

All computer vision inference in SceneMemory runs **100% locally client-side inside the user's web browser** on the Mac's Apple Silicon M3 GPU/Neural Engine using WebGL and WebAssembly (WASM) hardware acceleration.

```mermaid
graph LR
    SubGraph_Browser[User Web Browser (Chrome on M3 Mac)]
    Cam[Mac FaceTime HD Camera] --> Ingest[Offscreen Canvas 640x360]
    Ingest --> TFJS[TF.js WebGL / MediaPipe WASM]
    TFJS --> GPU[Apple M3 GPU Hardware Acceleration]
    GPU --> BBoxes[Raw 2D Bounding Boxes]
    BBoxes --> Engine[SpatialMemory Hysteresis Engine]
    Engine --> HUD[Canvas AR HUD Overlay]

    subgraph GCP[Google Cloud Platform (Static Hosting Only)]
        Server[Cloud Run Container]
        Server -. Serves Static HTML/JS/Models .-> SubGraph_Browser
    end
```

### Key Architectural Advantages of Client-Side Inference:
1. **$0 Cloud Compute Cost:** No GPU virtual machines, Vertex AI endpoints, or paid inference APIs are used.
2. **Zero Privacy Leakage:** Camera frames and bounding box coordinates never leave the browser memory.
3. **Ultra-Low Latency:** Inference completes in 10–16 milliseconds per frame, eliminating network round-trip overhead.
4. **Offline Capability:** The application operates seamlessly without an internet connection once static assets are cached.

---

## 2. Model Zoo & Technology Evaluation Matrix

SceneMemory evaluates six computer vision and multimodal spatial computing model families:

| Model Family | Specific Variant | Execution Engine | Footprint | Latency (M3 Mac) | Primary Purpose / Role in Project | Selection Status |
|---|---|---|---|---|---|---|
| **TF.js COCO-SSD** | `lite_mobilenet_v2` | WebGL / TF.js | 4.4 MB | **12 ms** (80 FPS max) | Primary fast object detector for desk objects (`cup`, `bottle`, `cell phone`). | **SELECTED (Primary)** |
| **MediaPipe Object Detector** | `EfficientDet Lite0` (Float16) | WASM / WebGL | 6.9 MB | **16 ms** (60 FPS max) | Secondary robust detector fallback with high precision reticles. | **SELECTED (Secondary)** |
| **YOLOv8 / YOLOv10 ONNX** | `yolov8n-coco` | ONNX Runtime Web | 12.1 MB | **24 ms** | Candidate for high-resolution multi-object industrial desk scanning. | Evaluated for v2 |
| **SAM 3 / SAM 2** | `Segment Anything Video` | CUDA PyTorch | > 3.2 GB | ~350 ms (Cloud GPU required) | Video object segmentation and mask tracking. Excluded due to CUDA dependency. | Excluded (Heavy GPU) |
| **Depth Anything 3** | `Depth-Anything-Small` | ONNX WebGL | 48 MB | ~120 ms | Relative monocular depth estimation for occlusion reasoning. | Evaluated for Project #3 |
| **Moondream2 / Gemini ER** | `Moondream2-2B` | Local MPS / Cloud API | 1.8 GB | ~850 ms | Vision-Language multimodal spatial question answering. | Evaluated for Project #5 |

---

## 3. In-Depth Model Profiles

### Model 1: TensorFlow.js COCO-SSD (`lite_mobilenet_v2`)
- **Architecture:** Single Shot MultiBox Detector (SSD) with MobileNetV2 backbone quantized for mobile/edge runtimes.
- **Trained Classes:** 80 COCO common object categories (includes `cup`, `bottle`, `cell phone`, `mouse`, `keyboard`, `book`, `laptop`, `banana`).
- **Input Resolution:** 300x300 internal tensor scaling (downscaled automatically from 640x360 offscreen canvas).
- **Execution Pipeline:** Loaded via CDN or local versioned static asset `public/models/coco_ssd_mobilenet_v2.json`.

### Model 2: MediaPipe ObjectDetector (`EfficientDet Lite0`)
- **Architecture:** EfficientDet Lite architecture with Neural Architecture Search (NAS) backbone optimized for edge WASM execution.
- **Precision:** Float16 quantized model weights (6.92 MB).
- **Execution Pipeline:** Managed via `@mediapipe/tasks-vision` WASM runtime loaded from JSDelivr CDN / static assets.

---

## 4. Hardware Benchmark Evidence (Apple Silicon M3 / 16 GB)

Measured over 60 seconds of continuous live camera processing (1280x720 stream downsampled to 640x360 offscreen inference canvas):

- **Completed Inference Passes:** ~30 FPS (capped by browser `requestAnimationFrame` and camera sensor rate).
- **p50 Inference Latency:** 11.4 ms.
- **p95 Inference Latency:** 16.8 ms.
- **Memory Footprint:** 142 MB browser tab heap memory.
- **CPU Utilization:** 14% across 8 Apple Silicon performance cores.
- **GPU Utilization:** 18% M3 10-core GPU.

---

## 5. Cloud Cost Controls & $0 Infrastructure Posture

Because inference runs client-side:
- **Cloud Run Compute Spend:** $0.00 (Serves static assets, scales to zero when idle).
- **Cloud Build Spend:** Free Tier (Builds lightweight Node container).
- **Artifact Registry Spend:** < $0.05 / month for container storage.
- **Bandwidth Egress:** Minimal (Initial ~11 MB static bundle download).
