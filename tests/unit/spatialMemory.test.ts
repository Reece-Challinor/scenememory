import { describe, it, expect, beforeEach } from 'vitest';
import { SpatialMemoryEngine } from '../../src/engine/spatialMemory';
import { SystemConfig, DetectionResult } from '../../src/types';

describe('SpatialMemoryEngine Unit Tests', () => {
  let engine: SpatialMemoryEngine;
  const defaultConfig: SystemConfig = {
    minConfidence: 0.45,
    ghostTimeoutMs: 10000,
    confirmationWindowFrames: 5,
    confirmationRequiredCount: 3,
    iouMatchThreshold: 0.35,
    enableNaiveBaseline: true,
    activeMode: 'RECORDED_REPLAY',
    enrolledCategories: []
  };

  beforeEach(() => {
    engine = new SpatialMemoryEngine(defaultConfig);
  });

  it('should correctly calculate Intersection over Union (IoU) overlap', () => {
    const boxA = { originX: 0, originY: 0, width: 100, height: 100 };
    const boxB = { originX: 50, originY: 0, width: 100, height: 100 };

    // Overlap width = 50, height = 100 -> Intersection = 5000
    // Union = 10000 + 10000 - 5000 = 15000 -> IoU = 5000 / 15000 = 0.3333...
    const iouScore = engine.calculateIoU(boxA, boxB);
    expect(iouScore).toBeCloseTo(0.3333, 3);
  });

  it('should transition track state from UNKNOWN -> OBSERVED_NOW after 3-of-5 temporal hysteresis', () => {
    const nowMs = 1000;
    const testDetection: DetectionResult = {
      id: 'det_1',
      category: 'cup',
      score: 0.85,
      box: { originX: 100, originY: 100, width: 120, height: 140 },
      timestamp: nowMs
    };

    // Frame 1: Initial detection -> State starts UNKNOWN (1 of 5)
    let res = engine.processFrame([testDetection], nowMs, 12);
    expect(res.tracks[0].state).toBe('UNKNOWN');

    // Frame 2: Second detection (2 of 5)
    res = engine.processFrame([testDetection], nowMs + 33, 11);
    expect(res.tracks[0].state).toBe('UNKNOWN');

    // Frame 3: Third detection -> Hysteresis satisfied (3 of 5) -> State becomes OBSERVED_NOW!
    res = engine.processFrame([testDetection], nowMs + 66, 10);
    expect(res.tracks[0].state).toBe('OBSERVED_NOW');
    expect(res.metrics.activeObservedCount).toBe(1);
  });

  it('should transition to LAST_OBSERVED_HERE (Ghost State) when object vanishes', () => {
    const startMs = 1000;
    const testDetection: DetectionResult = {
      id: 'det_1',
      category: 'cup',
      score: 0.90,
      box: { originX: 100, originY: 100, width: 120, height: 140 },
      timestamp: startMs
    };

    // Confirm object first (3 positive frames)
    engine.processFrame([testDetection], startMs, 10);
    engine.processFrame([testDetection], startMs + 33, 10);
    let res = engine.processFrame([testDetection], startMs + 66, 10);
    expect(res.tracks[0].state).toBe('OBSERVED_NOW');

    // Now object disappears (empty detections array)
    res = engine.processFrame([], startMs + 1500, 5); // 1.5 seconds later
    expect(res.tracks[0].state).toBe('LAST_OBSERVED_HERE');
    expect(res.metrics.activeGhostCount).toBe(1);
    expect(res.metrics.naiveBaselineFalseCurrentAssertions).toBeGreaterThan(0);
  });

  it('should trigger AMBIGUOUS state when multiple instances of same enrolled category are detected', () => {
    const startMs = 1000;
    const cupDetection1: DetectionResult = {
      id: 'det_1',
      category: 'cup',
      score: 0.88,
      box: { originX: 100, originY: 100, width: 100, height: 100 },
      timestamp: startMs
    };
    const cupDetection2: DetectionResult = {
      id: 'det_2',
      category: 'cup',
      score: 0.82,
      box: { originX: 300, originY: 100, width: 100, height: 100 },
      timestamp: startMs
    };

    const res = engine.processFrame([cupDetection1, cupDetection2], startMs, 15);
    const ambiguousTrack = res.tracks.find((t) => t.state === 'AMBIGUOUS');
    expect(ambiguousTrack).toBeDefined();
    expect(ambiguousTrack?.ambiguityReason).toContain('Ambiguity Warning');
  });

  it('should clear all tracks when spatial memory reset is invoked', () => {
    const testDetection: DetectionResult = {
      id: 'det_1',
      category: 'bottle',
      score: 0.80,
      box: { originX: 50, originY: 50, width: 80, height: 180 },
      timestamp: 1000
    };

    engine.processFrame([testDetection], 1000, 10);
    engine.resetSpatialMemory('Camera Viewpoint Shift');

    const res = engine.processFrame([], 1033, 5);
    expect(res.tracks.length).toBe(0);
  });
});
