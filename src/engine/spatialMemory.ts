/**
 * @fileoverview Spatial Memory Engine & Temporal Uncertainty State Machine.
 * Manages object track lifecycle, 3-of-5 temporal hysteresis, ghost state expiry,
 * category ambiguity resolution, and naive baseline telemetry benchmarking.
 *
 * @module SpatialMemoryEngine
 * @project Spatial Proof Lab / SceneMemory
 * @author Reece Challinor
 */

import {
  BoundingBox,
  DetectionResult,
  TrackedObject,
  BenchmarkMetrics,
  SystemConfig
} from '../types';

/**
 * Interface contract for Spatial Memory processing engines.
 * Enables Dependency Inversion for unit testing and alternative engine implementations.
 */
export interface ISpatialMemoryEngine {
  updateConfig(newConfig: Partial<SystemConfig>): void;
  getConfig(): SystemConfig;
  resetSpatialMemory(reason?: string): void;
  calculateIoU(boxA: BoundingBox, boxB: BoundingBox): number;
  processFrame(
    detections: DetectionResult[],
    nowTimestampMs: number,
    inferenceLatencyMs: number
  ): { tracks: TrackedObject[]; metrics: BenchmarkMetrics };
}

/**
 * Concrete implementation of spatial memory perception state machine.
 */
export class SpatialMemoryEngine implements ISpatialMemoryEngine {
  private systemConfig: SystemConfig;
  private trackedObjectStore: Map<string, TrackedObject> = new Map();
  private naiveBaselineTrackStore: Map<string, { category: string; lastObservedBox: BoundingBox; isActive: boolean }> = new Map();
  private nextTrackSequenceId: number = 1;
  private totalProcessedFrameCount: number = 0;

  private telemetryMetrics: BenchmarkMetrics = {
    totalFramesProcessed: 0,
    inferenceFps: 0,
    avgInferenceLatencyMs: 0,
    sceneMemoryFalseCurrentAssertions: 0,
    naiveBaselineFalseCurrentAssertions: 0,
    confirmationDelayMs: 0,
    activeObservedCount: 0,
    activeGhostCount: 0,
    activeUnknownCount: 0
  };

  private frameTimestampHistoryMs: number[] = [];
  private inferenceLatencyHistoryMs: number[] = [];

  /**
   * Initializes SpatialMemoryEngine with system parameters.
   * @param config System configuration options.
   */
  constructor(config: SystemConfig) {
    this.systemConfig = { ...config };
  }

  /**
   * Updates configuration parameters dynamically at runtime.
   * @param newConfig Partial configuration update.
   */
  public updateConfig(newConfig: Partial<SystemConfig>): void {
    this.systemConfig = { ...this.systemConfig, ...newConfig };
  }

  /**
   * Returns current active configuration object.
   */
  public getConfig(): SystemConfig {
    return { ...this.systemConfig };
  }

  /**
   * Clears all spatial memory anchors and track stores.
   * Triggered when camera position changes or user requests reset.
   * @param resetReason Optional explanation string.
   */
  public resetSpatialMemory(resetReason: string = 'User Manual Reset'): void {
    console.log(`[SpatialMemoryEngine] Clearing spatial memory anchors. Reason: ${resetReason}`);
    this.trackedObjectStore.clear();
    this.naiveBaselineTrackStore.clear();
    this.nextTrackSequenceId = 1;
  }

  /**
   * Computes 2D Intersection over Union (IoU) overlap score between two bounding boxes.
   * @param boxA First bounding box geometry.
   * @param boxB Second bounding box geometry.
   * @returns IoU score ranging from 0.0 (no overlap) to 1.0 (exact match).
   */
  public calculateIoU(boxA: BoundingBox, boxB: BoundingBox): number {
    const intersectionMinX = Math.max(boxA.originX, boxB.originX);
    const intersectionMinY = Math.max(boxA.originY, boxB.originY);
    const intersectionMaxX = Math.min(boxA.originX + boxA.width, boxB.originX + boxB.width);
    const intersectionMaxY = Math.min(boxA.originY + boxA.height, boxB.originY + boxB.height);

    const intersectionWidth = Math.max(0, intersectionMaxX - intersectionMinX);
    const intersectionHeight = Math.max(0, intersectionMaxY - intersectionMinY);
    const intersectionArea = intersectionWidth * intersectionHeight;

    const boxAArea = boxA.width * boxA.height;
    const boxBArea = boxB.width * boxB.height;
    const unionArea = boxAArea + boxBArea - intersectionArea;

    if (unionArea <= 0) return 0;
    return intersectionArea / unionArea;
  }

  /**
   * Main per-frame state transition and telemetry pipeline.
   * @param rawFrameDetections List of raw bounding box detections from vision model.
   * @param nowTimestampMs Current epoch timestamp in milliseconds.
   * @param inferenceLatencyMs Model execution duration for current frame.
   * @returns Updated object tracks and real-time benchmark metrics.
   */
  public processFrame(
    rawFrameDetections: DetectionResult[],
    nowTimestampMs: number,
    inferenceLatencyMs: number
  ): { tracks: TrackedObject[]; metrics: BenchmarkMetrics } {
    this.totalProcessedFrameCount++;
    this.updateFpsCalculation(nowTimestampMs);
    this.recordInferenceLatency(inferenceLatencyMs);

    // 1. Filter detections based on minimum confidence threshold and enrolled categories
    const qualifyingDetections = rawFrameDetections.filter(
      (detection) =>
        detection.score >= this.systemConfig.minConfidence &&
        (this.systemConfig.enrolledCategories.length === 0 ||
          this.systemConfig.enrolledCategories.includes(detection.category.toLowerCase()))
    );

    // 2. Identify Category Ambiguity (Multiple instances of same enrolled class in single frame)
    const categoryFrequencyMap: Record<string, number> = {};
    qualifyingDetections.forEach((detection) => {
      const categoryKey = detection.category.toLowerCase();
      categoryFrequencyMap[categoryKey] = (categoryFrequencyMap[categoryKey] || 0) + 1;
    });

    const ambiguousCategorySet = new Set<string>();
    Object.entries(categoryFrequencyMap).forEach(([categoryKey, instanceCount]) => {
      if (instanceCount > 1) {
        ambiguousCategorySet.add(categoryKey);
      }
    });

    // 3. Perform Spatial Matching (Greedy IoU matching against existing tracks)
    const unmatchedDetections = new Set<DetectionResult>(qualifyingDetections);
    const matchedTrackIds = new Set<string>();

    const existingTracks = Array.from(this.trackedObjectStore.values());

    for (const existingTrack of existingTracks) {
      let highestIoUScore = 0;
      let bestMatchingDetection: DetectionResult | null = null;

      for (const candidateDetection of unmatchedDetections) {
        if (candidateDetection.category.toLowerCase() === existingTrack.category.toLowerCase()) {
          const calculatedIoU = this.calculateIoU(existingTrack.currentBox, candidateDetection.box);
          if (calculatedIoU > highestIoUScore && calculatedIoU >= this.systemConfig.iouMatchThreshold) {
            highestIoUScore = calculatedIoU;
            bestMatchingDetection = candidateDetection;
          }
        }
      }

      if (bestMatchingDetection) {
        // Spatial match found
        unmatchedDetections.delete(bestMatchingDetection);
        matchedTrackIds.add(existingTrack.trackId);

        existingTrack.currentBox = bestMatchingDetection.box;
        existingTrack.lastObservedBox = bestMatchingDetection.box;
        existingTrack.lastObservedTimestamp = nowTimestampMs;
        existingTrack.confidenceScore = bestMatchingDetection.score;
        existingTrack.detectionHistory.push({
          timestamp: nowTimestampMs,
          detected: true,
          box: bestMatchingDetection.box
        });
      } else {
        // Missed detection in current frame
        existingTrack.detectionHistory.push({
          timestamp: nowTimestampMs,
          detected: false
        });
      }

      // Maintain sliding history window
      if (existingTrack.detectionHistory.length > this.systemConfig.confirmationWindowFrames * 2) {
        existingTrack.detectionHistory.shift();
      }
    }

    // 4. Enroll new tracks for unmatched detections
    for (const unmatchedDetection of unmatchedDetections) {
      const generatedTrackId = `trk_${this.nextTrackSequenceId++}`;
      const newTrackObject: TrackedObject = {
        trackId: generatedTrackId,
        category: unmatchedDetection.category.toLowerCase(),
        state: 'UNKNOWN', // Starts UNKNOWN until temporal hysteresis confirms it
        currentBox: unmatchedDetection.box,
        lastObservedBox: unmatchedDetection.box,
        lastObservedTimestamp: nowTimestampMs,
        firstObservedTimestamp: nowTimestampMs,
        detectionHistory: [{ timestamp: nowTimestampMs, detected: true, box: unmatchedDetection.box }],
        confidenceScore: unmatchedDetection.score
      };
      this.trackedObjectStore.set(generatedTrackId, newTrackObject);
    }

    // Update Naive Baseline Track Store
    qualifyingDetections.forEach((detection) => {
      this.naiveBaselineTrackStore.set(detection.category.toLowerCase(), {
        category: detection.category.toLowerCase(),
        lastObservedBox: detection.box,
        isActive: true
      });
    });

    // 5. Update State Machine Transitions & Hysteresis Rules
    let activeObservedCount = 0;
    let activeGhostCount = 0;
    let activeUnknownCount = 0;

    const confirmationWindowSize = this.systemConfig.confirmationWindowFrames;
    const requiredConfirmationCount = this.systemConfig.confirmationRequiredCount;

    for (const track of Array.from(this.trackedObjectStore.values())) {
      const timeDeltaSinceLastObservationMs = nowTimestampMs - track.lastObservedTimestamp;
      const recentWindowHistory = track.detectionHistory.slice(-confirmationWindowSize);
      const positiveDetectionCountInWindow = recentWindowHistory.filter((entry) => entry.detected).length;

      // Evaluate State
      if (ambiguousCategorySet.has(track.category.toLowerCase())) {
        track.state = 'AMBIGUOUS';
        track.ambiguityReason = `Ambiguity Warning: Multiple '${track.category}' instances observed. Identity re-enrollment required.`;
        activeUnknownCount++;
      } else if (positiveDetectionCountInWindow >= requiredConfirmationCount && timeDeltaSinceLastObservationMs < 800) {
        // OBSERVED_NOW (3-of-5 Temporal Hysteresis Satisfied)
        if (track.state !== 'OBSERVED_NOW') {
          this.telemetryMetrics.confirmationDelayMs = nowTimestampMs - track.firstObservedTimestamp;
        }
        track.state = 'OBSERVED_NOW';
        track.isConfirmed = true;
        activeObservedCount++;
      } else if (track.isConfirmed && timeDeltaSinceLastObservationMs <= this.systemConfig.ghostTimeoutMs) {
        // LAST_OBSERVED_HERE (Timestamped Ghost Marker for previously confirmed objects)
        track.state = 'LAST_OBSERVED_HERE';
        activeGhostCount++;
      } else {
        // UNKNOWN (Ghost Expired or unconfirmed initial candidate)
        track.state = 'UNKNOWN';
        activeUnknownCount++;
      }

      // Benchmarking Naive Baseline False Assertions
      if (track.state === 'LAST_OBSERVED_HERE' || track.state === 'UNKNOWN') {
        const naiveBaselineEntry = this.naiveBaselineTrackStore.get(track.category.toLowerCase());
        if (naiveBaselineEntry && naiveBaselineEntry.isActive) {
          // Naive baseline falsely asserts object is present right now!
          this.telemetryMetrics.naiveBaselineFalseCurrentAssertions++;
        }
      }
    }

    // 6. Aggregate Telemetry Metrics
    const averageLatencyMs =
      this.inferenceLatencyHistoryMs.length > 0
        ? this.inferenceLatencyHistoryMs.reduce((sum, val) => sum + val, 0) / this.inferenceLatencyHistoryMs.length
        : 0;

    this.telemetryMetrics.totalFramesProcessed = this.totalProcessedFrameCount;
    this.telemetryMetrics.avgInferenceLatencyMs = Math.round(averageLatencyMs * 10) / 10;
    this.telemetryMetrics.activeObservedCount = activeObservedCount;
    this.telemetryMetrics.activeGhostCount = activeGhostCount;
    this.telemetryMetrics.activeUnknownCount = activeUnknownCount;

    return {
      tracks: Array.from(this.trackedObjectStore.values()),
      metrics: { ...this.telemetryMetrics }
    };
  }

  private updateFpsCalculation(nowTimestampMs: number): void {
    this.frameTimestampHistoryMs.push(nowTimestampMs);
    const oneSecondWindowThreshold = nowTimestampMs - 1000;
    this.frameTimestampHistoryMs = this.frameTimestampHistoryMs.filter((t) => t > oneSecondWindowThreshold);
    this.telemetryMetrics.inferenceFps = this.frameTimestampHistoryMs.length;
  }

  private recordInferenceLatency(latencyMs: number): void {
    this.inferenceLatencyHistoryMs.push(latencyMs);
    if (this.inferenceLatencyHistoryMs.length > 30) {
      this.inferenceLatencyHistoryMs.shift();
    }
  }
}
