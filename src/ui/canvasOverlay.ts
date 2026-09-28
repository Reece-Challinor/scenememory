import { TrackedObject, BenchmarkMetrics, SystemConfig } from '../types';

export class CanvasOverlayRenderer {
  public renderOverlay(
    ctx: CanvasRenderingContext2D,
    tracks: TrackedObject[],
    metrics: BenchmarkMetrics,
    config: SystemConfig,
    nowTimestamp: number,
    canvasWidth: number,
    canvasHeight: number,
    scaleX: number = 1,
    scaleY: number = 1
  ) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    for (const track of tracks) {
      if (track.state === 'UNKNOWN') continue; // Expired unknown tracks are hidden from active overlay

      const box = track.state === 'OBSERVED_NOW' ? track.currentBox : track.lastObservedBox;
      const x = box.originX * scaleX;
      const y = box.originY * scaleY;
      const w = box.width * scaleX;
      const h = box.height * scaleY;

      const timeSinceLastSec = ((nowTimestamp - track.lastObservedTimestamp) / 1000).toFixed(1);

      if (track.state === 'OBSERVED_NOW') {
        // --- 1. OBSERVED NOW (Green / Emerald AR Reticle) ---
        const color = '#10b981'; // Emerald Green
        const fillColor = 'rgba(16, 185, 129, 0.12)';

        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        // Reticle Corner Accents
        const cornerLen = Math.min(16, w / 4, h / 4);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#34d399';

        // Top-Left
        ctx.beginPath(); ctx.moveTo(x, y + cornerLen); ctx.lineTo(x, y); ctx.lineTo(x + cornerLen, y); ctx.stroke();
        // Top-Right
        ctx.beginPath(); ctx.moveTo(x + w - cornerLen, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cornerLen); ctx.stroke();
        // Bottom-Left
        ctx.beginPath(); ctx.moveTo(x, y + h - cornerLen); ctx.lineTo(x, y + h); ctx.lineTo(x + cornerLen, y + h); ctx.stroke();
        // Bottom-Right
        ctx.beginPath(); ctx.moveTo(x + w - cornerLen, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cornerLen); ctx.stroke();

        // Label Tag
        const labelText = `${track.category.toUpperCase()} ${Math.round(track.confidenceScore * 100)}% • OBSERVED NOW`;
        this.drawBadge(ctx, x, y - 28, labelText, '#065f46', '#34d399', '#ecfdf5');

      } else if (track.state === 'LAST_OBSERVED_HERE') {
        // --- 2. LAST OBSERVED HERE (Ghost Marker) ---
        const opacity = Math.max(0.2, 1 - (nowTimestamp - track.lastObservedTimestamp) / config.ghostTimeoutMs);
        const color = `rgba(168, 85, 247, ${opacity})`; // Purple Ghost
        const fillColor = `rgba(168, 85, 247, ${opacity * 0.15})`;

        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);

        // Dashed Bounding Box
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(x, y, w, h);
        ctx.restore();

        // Radar Pulse animation at center
        const centerX = x + w / 2;
        const centerY = y + h / 2;
        const pulseRadius = (nowTimestamp % 1500) / 1500 * (Math.min(w, h) / 3);
        ctx.strokeStyle = `rgba(192, 132, 252, ${0.8 * opacity * (1 - pulseRadius / (Math.min(w, h) / 3))})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Label Tag
        const labelText = `👻 GHOST: ${track.category.toUpperCase()} • Last seen ${timeSinceLastSec}s ago`;
        this.drawBadge(ctx, x, y - 28, labelText, `rgba(88, 28, 135, ${opacity})`, `rgba(216, 180, 254, ${opacity})`, '#ffffff');

      } else if (track.state === 'AMBIGUOUS') {
        // --- 3. AMBIGUOUS (Caution Warning) ---
        ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
        ctx.fillRect(x, y, w, h);

        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x, y, w, h);

        const labelText = `⚠️ AMBIGUOUS: ${track.category.toUpperCase()} (Identity check needed)`;
        this.drawBadge(ctx, x, y - 28, labelText, '#713f12', '#fde047', '#fefce8');
      }
    }

    // --- NAIVE BASELINE OVERLAY (If Enabled) ---
    if (config.enableNaiveBaseline && metrics.activeGhostCount > 0) {
      for (const track of tracks) {
        if (track.state === 'LAST_OBSERVED_HERE') {
          const box = track.lastObservedBox;
          const x = box.originX * scaleX;
          const y = box.originY * scaleY;
          const w = box.width * scaleX;
          const h = box.height * scaleY;

          // Red warning box showing Naive Baseline's false claim
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);

          this.drawBadge(ctx, x, y + h + 8, `❌ NAIVE BASELINE ASSERTION: Falsely claiming '${track.category}' present`, '#7f1d1d', '#fca5a5', '#ffffff');
        }
      }
    }
  }

  private drawBadge(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    text: string,
    bgColor: string,
    borderColor: string,
    textColor: string
  ) {
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    const textWidth = ctx.measureText(text).width;
    const paddingX = 8;
    const height = 20;

    const clampY = Math.max(8, y);

    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(x, clampY, textWidth + paddingX * 2, height, 4);
    ctx.fill();

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.fillText(text, x + paddingX, clampY + 14);
  }
}
