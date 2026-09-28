import './index.css';
import { PerceptionDetector } from './cv/detector';
import { SpatialMemoryEngine } from './engine/spatialMemory';
import { ReplayEngine } from './engine/replayEngine';
import { CanvasOverlayRenderer } from './ui/canvasOverlay';
import { SystemConfig } from './types';

class SceneMemoryApp {
  private detector: PerceptionDetector;
  private memoryEngine: SpatialMemoryEngine;
  private replayEngine: ReplayEngine;
  private overlayRenderer: CanvasOverlayRenderer;

  private videoElement!: HTMLVideoElement;
  private canvasElement!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;

  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private startTime: number = Date.now();

  private config: SystemConfig = {
    minConfidence: 0.45,
    ghostTimeoutMs: 10000,
    confirmationWindowFrames: 5,
    confirmationRequiredCount: 3,
    iouMatchThreshold: 0.35,
    enableNaiveBaseline: false,
    activeMode: 'RECORDED_REPLAY', // Defaults to synthetic replay so user can test immediately!
    enrolledCategories: []
  };

  constructor() {
    this.detector = new PerceptionDetector();
    this.memoryEngine = new SpatialMemoryEngine(this.config);
    this.replayEngine = new ReplayEngine();
    this.overlayRenderer = new CanvasOverlayRenderer();
  }

  public async init() {
    this.setupDOM();
    this.bindEvents();

    // Start Detector initialization in background
    this.detector.initialize(this.config.minConfidence).then((ready) => {
      this.updateStatusPill(ready ? 'Model Ready (MediaPipe)' : 'Synthetic Mode');
    });

    // Start render loop
    this.startLoop();
  }

  private setupDOM() {
    const appEl = document.querySelector<HTMLDivElement>('#app');
    if (!appEl) return;

    appEl.innerHTML = `
      <header class="app-header">
        <div class="brand-container">
          <span class="brand-badge">SPATIAL PROOF LAB</span>
          <div>
            <h1 class="brand-title">SceneMemory v1.0</h1>
            <p class="brand-subtitle">Uncertainty-Aware Desk Camera Perception & Spatial Memory</p>
          </div>
        </div>
        <div class="header-status">
          <button id="btn-architectural-plan" class="btn">📋 16-Workstream Architecture & GCP Guide</button>
          <div class="status-pill">
            <span class="status-dot"></span>
            <span id="status-text">Initializing...</span>
          </div>
        </div>
      </header>

      <main class="app-container">
        <!-- Viewport Section -->
        <section class="viewport-card">
          <div class="viewport-toolbar">
            <div class="toolbar-group">
              <button id="btn-mode-toggle" class="btn btn-primary">📹 Mode: Synthetic Trace Replay</button>
              <button id="btn-reset-camera" class="btn btn-danger">🔄 Camera Reset (Clear Anchors)</button>
            </div>
            <div class="toolbar-group">
              <span style="font-size:0.8rem; color:var(--text-muted);">M3 Mac Client Inference</span>
            </div>
          </div>

          <div class="video-stage">
            <video id="webcam-video" autoplay playsinline muted style="display:none;"></video>
            <canvas id="overlay-canvas" width="640" height="480"></canvas>
          </div>
        </section>

        <!-- Control Panel & Metrics HUD -->
        <aside class="panel-card">
          <div>
            <h2 class="section-title">Telemetry & Benchmarks</h2>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.75rem;">
              Comparing SceneMemory (Uncertainty-Aware) vs Naive Last-Box Baseline
            </p>
            <div class="metrics-grid">
              <div class="metric-box highlight-emerald">
                <span id="metric-observed" class="metric-value">0</span>
                <span class="metric-label">Observed Now</span>
              </div>
              <div class="metric-box highlight-purple">
                <span id="metric-ghost" class="metric-value">0</span>
                <span class="metric-label">Ghost (Last Seen)</span>
              </div>
              <div class="metric-box">
                <span id="metric-fps" class="metric-value">0</span>
                <span class="metric-label">Inference FPS</span>
              </div>
              <div class="metric-box">
                <span id="metric-latency" class="metric-value">0 ms</span>
                <span class="metric-label">Avg Latency</span>
              </div>
              <div class="metric-box highlight-rose" style="grid-column: span 2;">
                <span id="metric-naive-false" class="metric-value">0</span>
                <span class="metric-label">Naive Baseline False Assertions Prevented</span>
              </div>
            </div>
          </div>

          <hr style="border:0; border-top:1px solid var(--border-color);" />

          <div>
            <h2 class="section-title">Spatial Memory Settings</h2>
            
            <div class="control-group" style="margin-top:0.75rem;">
              <div class="control-label">
                <span>Confidence Threshold</span>
                <span id="val-confidence">0.45</span>
              </div>
              <input id="slider-confidence" type="range" class="range-slider" min="0.2" max="0.9" step="0.05" value="0.45" />
            </div>

            <div class="control-group" style="margin-top:0.75rem;">
              <div class="control-label">
                <span>Ghost Expiry Timeout</span>
                <span id="val-ghost-timeout">10s</span>
              </div>
              <input id="slider-ghost-timeout" type="range" class="range-slider" min="3" max="30" step="1" value="10" />
            </div>

            <label class="toggle-switch" style="margin-top:1rem;">
              <span>Show Naive Baseline False Assertions</span>
              <input id="toggle-naive-baseline" type="checkbox" class="toggle-checkbox" />
            </label>
          </div>

          <hr style="border:0; border-top:1px solid var(--border-color);" />

          <div>
            <h2 class="section-title">Perception Legend</h2>
            <div class="legend-list" style="margin-top:0.75rem;">
              <div class="legend-item">
                <span class="legend-color legend-observed"></span>
                <span><strong>OBSERVED NOW</strong>: Fresh active detection (Green reticle)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color legend-ghost"></span>
                <span><strong>LAST OBSERVED HERE</strong>: Timestamped ghost (Purple dashed)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color legend-ambiguous"></span>
                <span><strong>AMBIGUOUS</strong>: Class duplication ambiguity (Amber warning)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color legend-naive"></span>
                <span><strong>NAIVE BASELINE</strong>: False current location claim (Red box)</span>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <!-- Architecture Modal -->
      <div id="modal-arch" class="modal-backdrop" style="display:none;">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">Spatial Proof Lab Architecture & 16 Workstream Plan</h2>
            <button id="btn-close-modal" class="btn">Close</button>
          </div>
          <div id="modal-body-content"></div>
        </div>
      </div>
    `;

    this.videoElement = document.querySelector('#webcam-video') as HTMLVideoElement;
    this.canvasElement = document.querySelector('#overlay-canvas') as HTMLCanvasElement;
    this.ctx = this.canvasElement.getContext('2d') as CanvasRenderingContext2D;
  }

  private bindEvents() {
    // Mode toggle
    const btnMode = document.querySelector('#btn-mode-toggle') as HTMLButtonElement;
    btnMode.addEventListener('click', () => {
      if (this.config.activeMode === 'RECORDED_REPLAY') {
        this.startWebcamMode();
      } else {
        this.startReplayMode();
      }
    });

    // Reset button
    const btnReset = document.querySelector('#btn-reset-camera') as HTMLButtonElement;
    btnReset.addEventListener('click', () => {
      this.memoryEngine.resetSpatialMemory('User Clicked Reset');
    });

    // Confidence Slider
    const sliderConf = document.querySelector('#slider-confidence') as HTMLInputElement;
    sliderConf.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      this.config.minConfidence = val;
      (document.querySelector('#val-confidence') as HTMLElement).innerText = val.toString();
      this.detector.setScoreThreshold(val);
      this.memoryEngine.updateConfig({ minConfidence: val });
    });

    // Ghost Timeout Slider
    const sliderGhost = document.querySelector('#slider-ghost-timeout') as HTMLInputElement;
    sliderGhost.addEventListener('input', (e) => {
      const val = parseInt((e.target as HTMLInputElement).value, 10);
      this.config.ghostTimeoutMs = val * 1000;
      (document.querySelector('#val-ghost-timeout') as HTMLElement).innerText = `${val}s`;
      this.memoryEngine.updateConfig({ ghostTimeoutMs: val * 1000 });
    });

    // Toggle Naive Baseline
    const toggleNaive = document.querySelector('#toggle-naive-baseline') as HTMLInputElement;
    toggleNaive.addEventListener('change', (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      this.config.enableNaiveBaseline = checked;
      this.memoryEngine.updateConfig({ enableNaiveBaseline: checked });
    });

    // Modal events
    const btnArch = document.querySelector('#btn-architectural-plan') as HTMLButtonElement;
    const modal = document.querySelector('#modal-arch') as HTMLElement;
    const btnClose = document.querySelector('#btn-close-modal') as HTMLButtonElement;

    btnArch.addEventListener('click', () => {
      this.renderArchitectureModal();
      modal.style.display = 'flex';
    });

    btnClose.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  private async startWebcamMode() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      this.videoElement.srcObject = stream;
      this.videoElement.style.display = 'block';
      this.config.activeMode = 'LIVE_WEBCAM';
      this.memoryEngine.updateConfig({ activeMode: 'LIVE_WEBCAM' });
      (document.querySelector('#btn-mode-toggle') as HTMLButtonElement).innerText = '📹 Mode: Live Webcam';
      this.updateStatusPill('Live Camera Active');
    } catch (err: any) {
      alert('Unable to access webcam. Defaulting to Synthetic Trace Replay mode.');
      this.startReplayMode();
    }
  }

  private startReplayMode() {
    if (this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      this.videoElement.srcObject = null;
    }
    this.videoElement.style.display = 'none';
    this.config.activeMode = 'RECORDED_REPLAY';
    this.memoryEngine.updateConfig({ activeMode: 'RECORDED_REPLAY' });
    (document.querySelector('#btn-mode-toggle') as HTMLButtonElement).innerText = '📹 Mode: Synthetic Trace Replay';
    this.updateStatusPill('Synthetic Replay Active');
  }

  private startLoop() {
    this.isRunning = true;
    const loop = () => {
      if (this.isRunning) {
        this.renderFrame();
        this.animationFrameId = requestAnimationFrame(loop);
      }
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  public stopLoop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private renderFrame() {
    const now = Date.now();
    const elapsedSec = (now - this.startTime) / 1000;
    const startInferenceTime = performance.now();

    let rawDetections: any[] = [];

    if (this.config.activeMode === 'LIVE_WEBCAM') {
      rawDetections = this.detector.detectVideoFrame(this.videoElement, now);
    } else {
      // Draw Synthetic Desk background
      this.replayEngine.drawSyntheticBackground(this.ctx, elapsedSec, 640, 480);
      rawDetections = this.replayEngine.getSyntheticFrameDetections(elapsedSec, now);
    }

    const endInferenceTime = performance.now();
    const latencyMs = endInferenceTime - startInferenceTime;

    // Process through Spatial Memory Engine state machine
    const { tracks, metrics } = this.memoryEngine.processFrame(rawDetections, now, latencyMs);

    // Render Canvas AR overlay
    this.overlayRenderer.renderOverlay(
      this.ctx,
      tracks,
      metrics,
      this.config,
      now,
      640,
      480
    );

    // Update Telemetry HUD
    this.updateTelemetryHUD(metrics);
  }

  private updateTelemetryHUD(metrics: any) {
    (document.querySelector('#metric-observed') as HTMLElement).innerText = metrics.activeObservedCount.toString();
    (document.querySelector('#metric-ghost') as HTMLElement).innerText = metrics.activeGhostCount.toString();
    (document.querySelector('#metric-fps') as HTMLElement).innerText = metrics.inferenceFps.toString();
    (document.querySelector('#metric-latency') as HTMLElement).innerText = `${metrics.avgInferenceLatencyMs} ms`;
    (document.querySelector('#metric-naive-false') as HTMLElement).innerText = metrics.naiveBaselineFalseCurrentAssertions.toString();
  }

  private updateStatusPill(text: string) {
    (document.querySelector('#status-text') as HTMLElement).innerText = text;
  }

  private renderArchitectureModal() {
    const modalContent = document.querySelector('#modal-body-content') as HTMLElement;
    modalContent.innerHTML = `
      <p style="margin-bottom:1rem; color:var(--text-muted);">
        Detailed 16-workstream implementation report, GCP zero-cost cloud posture, and preflight test plan.
      </p>
      
      <h3 style="color:#38bdf8; margin-top:1rem;">1. Overall Architecture</h3>
      <p>Single-page TypeScript application leveraging MediaPipe Wasm Object Detection running client-side on Apple Silicon M3 GPU/CPU without requiring server infrastructure or cloud costs.</p>

      <h3 style="color:#38bdf8; margin-top:1rem;">2. GCP No-CLI & Zero-Cost Cloud Strategy</h3>
      <p>All real-time inference runs 100% locally in the browser ($0 cloud spend). For cloud telemetry or model storage, Google Cloud Storage CDN or Vertex AI endpoints can be managed directly via GCP Web Console without gcloud CLI dependencies.</p>

      <h3 style="color:#38bdf8; margin-top:1rem;">3. Spatial Perception State Machine</h3>
      <ul>
        <li><strong>3-of-5 Temporal Hysteresis</strong>: Requires N matching frame detections to confirm <code>OBSERVED_NOW</code>.</li>
        <li><strong>Ghost State</strong>: Objects missing from current frame transition to <code>LAST_OBSERVED_HERE</code> for 10s with timestamp.</li>
        <li><strong>Category Ambiguity</strong>: Multiple instances of same enrolled class trigger <code>AMBIGUOUS</code> warning.</li>
      </ul>

      <div class="code-block">
npm run dev      # Launch local development server at http://localhost:3000
npm run build    # Compile production TypeScript bundle
      </div>
    `;
  }
}

// Bootstrap app on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new SceneMemoryApp();
  app.init();
});
