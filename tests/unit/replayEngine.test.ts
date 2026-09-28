import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReplayEngine } from '../../src/engine/replayEngine';

describe('ReplayEngine Unit Tests', () => {
  let replayEngine: ReplayEngine;

  beforeEach(() => {
    replayEngine = new ReplayEngine();
  });

  it('should return empty detections during desk sequence initial quiet period (t = 0s)', () => {
    const detections = replayEngine.getSyntheticFrameDetections(0.5, 1000);
    expect(detections.length).toBe(0);
  });

  it('should return cup detection during synthetic timeline active period (t = 5s)', () => {
    const detections = replayEngine.getSyntheticFrameDetections(5.0, 5000);
    expect(detections.length).toBe(1);
    expect(detections[0].category).toBe('cup');
  });

  it('should generate synthetic background canvas elements without error when given a canvas context', () => {
    const mockCtx = {
      fillStyle: '',
      fillRect: vi.fn(),
      strokeStyle: '',
      lineWidth: 1,
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      font: '',
      fillText: vi.fn()
    } as unknown as CanvasRenderingContext2D;

    expect(() => {
      replayEngine.drawSyntheticBackground(mockCtx, 5.0, 640, 480);
    }).not.toThrow();

    expect(mockCtx.fillRect).toHaveBeenCalled();
    expect(mockCtx.fillText).toHaveBeenCalled();
  });
});
