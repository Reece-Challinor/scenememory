/**
 * @fileoverview Spatial Memory & Perception Engine Core Type Definitions.
 * Defines domain entities, state enumerations, bounding box schemas, telemetry metrics,
 * and system configuration options for the SceneMemory application.
 *
 * @module Types
 * @project Spatial Proof Lab / SceneMemory
 * @author Reece Challinor
 */

/**
 * Enumeration representing the uncertainty-aware perception states of a tracked object.
 *
 * - `OBSERVED_NOW`: Object is actively detected in the current video frame with high confidence.
 * - `LAST_OBSERVED_HERE`: Object is missing from the current frame; system renders a timestamped ghost marker.
 * - `UNKNOWN`: Spatial anchor has expired (>10s) or camera reset occurred; system refuses to make spatial claims.
 * - `AMBIGUOUS`: Multiple instances of the same enrolled class detected simultaneously; re-enrollment required.
 */
export type PerceptionState = 'OBSERVED_NOW' | 'LAST_OBSERVED_HERE' | 'UNKNOWN' | 'AMBIGUOUS';

/**
 * Normalized or pixel-space 2D bounding box definition.
 */
export interface BoundingBox {
  /** X-coordinate of top-left origin (pixels or normalized [0..1]) */
  originX: number;
  /** Y-coordinate of top-left origin (pixels or normalized [0..1]) */
  originY: number;
  /** Width of bounding box */
  width: number;
  /** Height of bounding box */
  height: number;
}

/**
 * Represents a single raw object detection output from the computer vision model.
 */
export interface DetectionResult {
  /** Unique detection identifier */
  id: string;
  /** Object class label (e.g. 'cup', 'bottle', 'cell phone') */
  category: string;
  /** Model confidence score [0.0 .. 1.0] */
  score: number;
  /** 2D Bounding box geometry */
  box: BoundingBox;
  /** Unix timestamp (milliseconds) when detection occurred */
  timestamp: number;
}

/**
 * Represents an object tracked over time with spatial history and temporal state.
 */
export interface TrackedObject {
  /** Unique persistent track identifier (e.g., 'trk_1') */
  trackId: string;
  /** Primary category label */
  category: string;
  /** Current uncertainty perception state */
  state: PerceptionState;
  /** Latest active bounding box geometry */
  currentBox: BoundingBox;
  /** Bounding box geometry when last positively observed */
  lastObservedBox: BoundingBox;
  /** Timestamp (ms) when object was last positively detected */
  lastObservedTimestamp: number;
  /** Timestamp (ms) when object was first enrolled */
  firstObservedTimestamp: number;
  /** Whether track has passed 3-of-5 hysteresis confirmation at least once */
  isConfirmed?: boolean;
  /** Sliding window of frame detection history used for temporal hysteresis */
  detectionHistory: { timestamp: number; detected: boolean; box?: BoundingBox }[];
  /** Model confidence score of latest detection */
  confidenceScore: number;
  /** Diagnostic message explaining reason for AMBIGUOUS or UNKNOWN state */
  ambiguityReason?: string;
}

/**
 * Real-time benchmarking & telemetry metrics comparison.
 * Compares SceneMemory (Uncertainty-Aware) vs Naive Last-Box Baseline.
 */
export interface BenchmarkMetrics {
  /** Total video frames processed since app start */
  totalFramesProcessed: number;
  /** Measured real-time computer vision inference FPS */
  inferenceFps: number;
  /** Average model inference latency in milliseconds */
  avgInferenceLatencyMs: number;
  /** Count of false current location claims made by SceneMemory (Always 0 by design!) */
  sceneMemoryFalseCurrentAssertions: number;
  /** Count of false current location claims made by Naive Last-Box Baseline */
  naiveBaselineFalseCurrentAssertions: number;
  /** Time (ms) required to confirm an object after initial observation (3-of-5 hysteresis filter) */
  confirmationDelayMs: number;
  /** Number of objects currently in OBSERVED_NOW state */
  activeObservedCount: number;
  /** Number of objects currently in LAST_OBSERVED_HERE (Ghost) state */
  activeGhostCount: number;
  /** Number of objects in UNKNOWN / AMBIGUOUS state */
  activeUnknownCount: number;
}

/**
 * Application system configuration parameters.
 */
export interface SystemConfig {
  /** Minimum detection confidence score threshold (default: 0.45) */
  minConfidence: number;
  /** Expiry timeout for ghost markers in milliseconds (default: 10,000 ms) */
  ghostTimeoutMs: number;
  /** Sliding window frame count for temporal confirmation (default: 5 frames) */
  confirmationWindowFrames: number;
  /** Required positive detection count within confirmation window (default: 3 of 5) */
  confirmationRequiredCount: number;
  /** Minimum Intersection-over-Union (IoU) threshold for spatial tracking match (default: 0.35) */
  iouMatchThreshold: number;
  /** Whether to render Naive Baseline false assertion overlays on screen */
  enableNaiveBaseline: boolean;
  /** Active input mode: Live Mac Webcam vs Synthetic Trace Replay */
  activeMode: 'LIVE_WEBCAM' | 'RECORDED_REPLAY';
  /** List of enrolled categories to monitor (empty list monitors all detected classes) */
  enrolledCategories: string[];
}
