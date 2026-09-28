import { DetectionResult } from '../types';

export class ReplayEngine {
  // Pre-configured synthetic desk sequence
  // Timeline (seconds):
  // 0s - 3s: Empty Desk
  // 3s - 8s: Coffee Cup appears on desk (OBSERVED_NOW)
  // 8s - 14s: Cup is removed/obscured (GHOST state: LAST_OBSERVED_HERE, fading timestamp)
  // 14s - 18s: Cup reappears + Cell Phone appears (OBSERVED_NOW x2)
  // 18s - 22s: Second Cup placed on desk (AMBIGUOUS State triggered!)
  // 22s - 28s: Ghost timer expires (>10s) -> UNKNOWN
  private syntheticTimeline = [
    { startSec: 2, endSec: 8, category: 'cup', box: { originX: 120, originY: 150, width: 140, height: 160 }, score: 0.88 },
    { startSec: 12, endSec: 20, category: 'cup', box: { originX: 120, originY: 150, width: 140, height: 160 }, score: 0.91 },
    { startSec: 14, endSec: 25, category: 'cell phone', box: { originX: 340, originY: 200, width: 110, height: 180 }, score: 0.85 },
    { startSec: 17, endSec: 22, category: 'cup', box: { originX: 380, originY: 100, width: 130, height: 150 }, score: 0.82 }
  ];

  public getSyntheticFrameDetections(elapsedSeconds: number, timestamp: number): DetectionResult[] {
    const loopTime = elapsedSeconds % 26; // Loop every 26 seconds sequence
    const detections: DetectionResult[] = [];

    for (let i = 0; i < this.syntheticTimeline.length; i++) {
      const item = this.syntheticTimeline[i];
      if (loopTime >= item.startSec && loopTime <= item.endSec) {
        // Add slight physical jitter to simulate real camera motion
        const jitterX = (Math.sin(timestamp * 0.005 + i) * 2);
        const jitterY = (Math.cos(timestamp * 0.005 + i) * 2);

        detections.push({
          id: `synth_${i}_${timestamp}`,
          category: item.category,
          score: item.score,
          box: {
            originX: item.box.originX + jitterX,
            originY: item.box.originY + jitterY,
            width: item.box.width,
            height: item.box.height
          },
          timestamp
        });
      }
    }

    return detections;
  }

  public drawSyntheticBackground(ctx: CanvasRenderingContext2D, elapsedSeconds: number, width: number, height: number) {
    // Render a realistic dark desk grid background with synthetic objects
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, width, height);

    // Draw desk surface grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Render watermark banner
    ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText(`SYNTHETIC TEST TRACE REPLAY • Time: ${(elapsedSeconds % 26).toFixed(1)}s / 26.0s`, 16, 28);
  }
}
