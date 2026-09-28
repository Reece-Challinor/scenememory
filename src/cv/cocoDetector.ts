/**
 * @fileoverview TensorFlow.js COCO-SSD Object Detector Implementation.
 * Primary lightweight detector for browser client-side inference on M3 Mac.
 * Supports lite_mobilenet_v2 model architecture.
 *
 * @module CocoDetector
 * @project Spatial Proof Lab / SceneMemory
 * @author Reece Challinor
 */

import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { DetectionResult } from '../types';

export class CocoDetector {
  private model: cocoSsd.ObjectDetection | null = null;
  private isInitializing: boolean = false;
  private isReady: boolean = false;
  private initError: string | null = null;

  /**
   * Initializes TensorFlow.js WebGL backend and loads COCO-SSD lite_mobilenet_v2 model.
   * @param minConfidence Score threshold for qualifying detections.
   */
  async initialize(minConfidence: number = 0.45): Promise<boolean> {
    if (this.isReady) return true;
    if (this.isInitializing) return false;
    this.isInitializing = true;
    this.initError = null;

    try {
      console.log('[CocoDetector] Initializing TensorFlow.js WebGL backend...');
      await tf.setBackend('webgl');
      await tf.ready();

      console.log('[CocoDetector] Loading COCO-SSD lite_mobilenet_v2 model...');
      this.model = await cocoSsd.load({
        base: 'lite_mobilenet_v2'
      });

      this.isReady = true;
      this.isInitializing = false;
      console.log('[CocoDetector] COCO-SSD ready!');
      return true;
    } catch (err: any) {
      console.warn('[CocoDetector] WebGL initialization failed, attempting CPU fallback:', err);
      try {
        await tf.setBackend('cpu');
        await tf.ready();
        this.model = await cocoSsd.load({
          base: 'lite_mobilenet_v2'
        });
        this.isReady = true;
        this.isInitializing = false;
        return true;
      } catch (fallbackErr: any) {
        this.initError = fallbackErr.message || 'Failed to initialize TensorFlow.js COCO-SSD model';
        this.isInitializing = false;
        console.error('[CocoDetector] Error:', fallbackErr);
        return false;
      }
    }
  }

  /**
   * Runs inference on offscreen canvas or video element.
   * @param inputElement Canvas or Video input frame.
   * @param timestamp Current timestamp (ms).
   * @param minConfidence Confidence score threshold.
   */
  async detectFrame(
    inputElement: HTMLCanvasElement | HTMLVideoElement,
    timestamp: number,
    minConfidence: number = 0.45
  ): Promise<DetectionResult[]> {
    if (!this.model || !this.isReady) return [];

    try {
      const rawPredictions = await this.model.detect(inputElement, 20, minConfidence);
      const detections: DetectionResult[] = [];

      for (let i = 0; i < rawPredictions.length; i++) {
        const pred = rawPredictions[i];
        if (pred.score >= minConfidence) {
          const [x, y, width, height] = pred.bbox;
          detections.push({
            id: `coco_${timestamp}_${i}`,
            category: pred.class.toLowerCase(),
            score: pred.score,
            box: {
              originX: x,
              originY: y,
              width,
              height
            },
            timestamp
          });
        }
      }
      return detections;
    } catch (err) {
      console.warn('[CocoDetector] Inference error:', err);
      return [];
    }
  }

  public getStatus(): { isReady: boolean; isInitializing: boolean; error: string | null } {
    return {
      isReady: this.isReady,
      isInitializing: this.isInitializing,
      error: this.initError
    };
  }
}
