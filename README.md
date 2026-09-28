# 👁️ SceneMemory

> **Uncertainty-Aware Desk Camera Perception & Spatial Memory Overlay**

[![Live Demo](https://img.shields.io/badge/demo-launch--app-brightgreen.svg?style=for-the-badge&logo=googlechrome)](https://reece-challinor.github.io/scenememory/)
[![GitHub Release](https://img.shields.io/github/v/release/Reece-Challinor/scenememory?style=for-the-badge&color=purple)](https://github.com/Reece-Challinor/scenememory/releases/tag/v1.0.0)

**SceneMemory** is a 2D desk camera spatial memory overlay. It uses client-side computer vision (TensorFlow.js COCO-SSD & MediaPipe) on Apple Silicon Macs to monitor objects on your desk (`cup`, `bottle`, `cell phone`).

When an object vanishes, SceneMemory replaces its live box with a **timestamped ghost reticle** (`Last seen 4.2s ago`) for 10 seconds rather than falsely claiming it is still present.

---

## 🚀 Live Demo & Instant Run

### 🌐 Option 1: Launch in Browser (No Installation Required)
Click to run directly on your webcam: **[https://reece-challinor.github.io/scenememory/](https://reece-challinor.github.io/scenememory/)**

---

### 💻 Option 2: Run Locally (1-Minute Setup)

```bash
git clone https://github.com/Reece-Challinor/scenememory.git
cd scenememory
npm ci
npm run dev
# Open http://localhost:3000 in Google Chrome
```

---

## 🕹️ Desk Camera Workflow & How to Test

1. **Point Mac Camera at Desk:** Open laptop lid ~75° pointing toward your keyboard area.
2. **Place Objects:** Put a coffee cup, bottle, or phone on your desk in clear view.
3. **Allow Camera:** Click **Allow** when Chrome requests webcam permission.
4. **Observe:** Solid green bounding boxes confirm active objects (`OBSERVED NOW`).
5. **Test Ghost Memory:** Remove or cover an object—watch it transform into a **timestamped purple ghost reticle** (`LAST OBSERVED HERE — 2.1s ago`).
6. **Reset Viewpoint:** Click **Camera Reset** whenever you move your Mac or camera.

---

## 🛠️ CLI Commands

```bash
make test     # Execute Vitest unit test suite (100% pass rate)
make lint     # Run TypeScript type-checking (tsc --noEmit)
make build    # Build production bundle to dist/
make kill     # Terminate local servers and confirm $0 spend
```

---

## 📄 Documentation

- [`AGENTS.md`](AGENTS.md) — 5-Agent Review Architecture.
- [`docs/MODELS_AND_INFERENCE.md`](docs/MODELS_AND_INFERENCE.md) — Model Profiles & Benchmarks.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — System Design & State Machine Diagrams.
- [`MODEL_PROVENANCE.md`](MODEL_PROVENANCE.md) — Model Asset Provenance & SHA256 Manifest.
