# Changelog

All notable changes to the **SceneMemory** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-09-28

### Added
- **Uncertainty Perception Engine:** Initial release of SceneMemory 2D camera spatial perception engine (`src/engine/spatialMemory.ts`).
- **3-of-5 Temporal Hysteresis:** Added 3-of-5 sliding window detection filter over 1 second to confirm candidate tracks into `OBSERVED_NOW`.
- **Timestamped Ghost State:** Added `LAST_OBSERVED_HERE` ghost reticle state with 10-second decay and relative timestamp counter.
- **Category Ambiguity Latch:** Added automatic `AMBIGUOUS` state warnings when duplicate instances of the same enrolled category appear.
- **Dual Model Support:** Integrated TensorFlow.js COCO-SSD (`lite_mobilenet_v2`) WebGL primary and MediaPipe (`EfficientDet Lite0`) WASM secondary detectors.
- **Canvas AR HUD:** Custom 2D canvas overlay renderer (`src/ui/canvasOverlay.ts`) with target reticles, radar pulse animations, and naive baseline comparison indicators.
- **Telemetry HUD:** Live benchmarking counter measuring inference FPS, avg latency, active observed/ghost counts, and false location assertions prevented.
- **Testing Suite:** Vitest unit test suite (`tests/unit/spatialMemory.test.ts`, `tests/unit/replayEngine.test.ts`) achieving 100% test pass rate.
- **Automation Makefile:** Makefile with `make dev`, `make lint`, `make test`, `make build`, `make docs`, and `make release` targets.
- **GCP Cloud Run Serverless:** Express static production server (`server.js`) with `/healthz` check, multi-stage Dockerfile, and GCP deployment script (`scripts/deploy-gcp.sh`).
- **Comprehensive Documentation:** Architecture guide, model inference guide, ADRs (0001, 0002, 0003), 4 review reports, and model provenance manifest.
