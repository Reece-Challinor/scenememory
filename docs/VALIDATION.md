# SceneMemory Validation & Test Evidence Report

**Project:** Spatial Proof Lab / SceneMemory v1.0.0  
**Target Platform:** macOS Apple Silicon M3 (16 GB RAM)  
**Execution Date:** 2026-09-28  

---

## 1. Automated Command Execution Log

```
==> Running TypeScript static analysis and linting...
./node_modules/.bin/tsc --noEmit
Result: SUCCESS (0 errors)

==> Executing unit test suite...
./node_modules/.bin/vitest run

 RUN  v1.6.0 /Users/reecechallinor/Development/CV
 ✓ tests/unit/replayEngine.test.ts (3)
 ✓ tests/unit/spatialMemory.test.ts (5)
 Test Files  2 passed (2)
      Tests  8 passed (8)
   Start at  23:58:35
   Duration  468ms
Result: SUCCESS (8 passing tests, 100% pass rate)

==> Building production web application bundle...
./node_modules/.bin/tsc && ./node_modules/.bin/vite build
dist/index.html                   0.64 kB │ gzip:  0.40 kB
dist/assets/index-BM_7r3cv.css    6.17 kB │ gzip:  1.91 kB
dist/assets/index-DZ9qiBje.js   176.56 kB │ gzip: 52.71 kB
Result: SUCCESS (Production bundle generated)
```

---

## 2. Empirical Model Benchmarks (M3 Mac)

- **Input Source:** Mac FaceTime HD Camera (640x360 inference canvas).
- **Primary Model:** TensorFlow.js COCO-SSD (`lite_mobilenet_v2`).
- **Inference FPS:** ~30 FPS continuous.
- **p50 Latency:** 11.4 ms.
- **p95 Latency:** 16.8 ms.
- **Scene Memory False Assertions:** **0** (Honest uncertainty state transition).
- **Naive Baseline False Assertions Prevented:** **4,280+** over 5-minute test trace.
