import { ObjectDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import { DetectionResult } from '../types';

export class PerceptionDetector {
  private detector: ObjectDetector | null = null;
  private isInitializing: boolean = false;
  private isReady: boolean = false;
  private initError: string | null = null;

  async initialize(minConfidence: number = 0.45): Promise<boolean> {
    if (this.isReady) return true;
    if (this.isInitializing) return false;
    this.isInitializing = true;
    this.initError = null;

    try {
      console.log('Initializing MediaPipe Object Detector...');
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      this.detector = await ObjectDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`,
          delegate: 'GPU'
        },
        scoreThreshold: minConfidence,
        runningMode: 'VIDEO'
      });

      this.isReady = true;
      this.isInitializing = false;
      console.log('MediaPipe Object Detector ready!');
      return true;
    } catch (err: any) {
      console.warn('GPU/CDN MediaPipe initialization failed, trying CPU fallback:', err);
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        this.detector = await ObjectDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`,
            delegate: 'CPU'
          },
          scoreThreshold: minConfidence,
          runningMode: 'VIDEO'
        });
        this.isReady = true;
        this.isInitializing = false;
        return true;
      } catch (fallbackErr: any) {
        this.initError = fallbackErr.message || 'Failed to initialize MediaPipe Object Detector';
        this.isInitializing = false;
        console.error('MediaPipe Detector Init Error:', fallbackErr);
        return false;
      }
    }
  }

  public setScoreThreshold(minConfidence: number) {
    if (this.detector) {
      this.detector.setOptions({ scoreThreshold: minConfidence });
    }
  }

  public detectVideoFrame(videoElement: HTMLVideoElement, timestamp: number): DetectionResult[] {
    if (!this.detector || !this.isReady || videoElement.readyState < 2) {
      return [];
    }

    try {
      const result = this.detector.detectForVideo(videoElement, timestamp);
      const detections: DetectionResult[] = [];

      if (result && result.detections) {
        for (let i = 0; i < result.detections.length; i++) {
          const det = result.detections[i];
          const category = det.categories[0]?.categoryName || 'object';
          const score = det.categories[0]?.score || 0;
          const box = det.boundingBox;

          if (box) {
            detections.push({
              id: `det_${timestamp}_${i}`,
              category: category.toLowerCase(),
              score,
              box: {
                originX: box.originX,
                originY: box.originY,
                width: box.width,
                height: box.height
              },
              timestamp
            });
          }
        }
      }
      return detections;
    } catch (err) {
      console.warn('Inference error frame:', err);
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
