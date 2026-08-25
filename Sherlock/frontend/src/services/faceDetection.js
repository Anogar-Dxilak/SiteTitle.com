import '@tensorflow/tfjs-backend-webgl';
import * as blazeface from '@tensorflow-models/blazeface';

let detector = null;
let isLoading = false;

/**
 * Initializes the face detection model.
 */
export const initDetector = async () => {
  if (detector) return detector;
  if (isLoading) {
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return detector;
  }
  
  try {
    isLoading = true;
    detector = await blazeface.load();
    return detector;
  } catch (error) {
    console.error("Error initializing face detector:", error);
    throw error;
  } finally {
    isLoading = false;
  }
};

/**
 * Detects faces in the given HTMLImageElement.
 * @param {HTMLImageElement} imageElement 
 * @returns {Promise<Array>} List of detected faces with bounding boxes
 */
export const detectFace = async (imageElement) => {
  try {
    const currentDetector = await initDetector();
    if (!currentDetector) throw new Error("Detector not initialized");

    const naturalW = imageElement.naturalWidth || imageElement.width || 1;
    const naturalH = imageElement.naturalHeight || imageElement.height || 1;

    // By drawing the image to a canvas of exact intrinsic size, we:
    // 1. Bypass any CSS scaling bugs where img.width is used by blazeface
    // 2. Guarantee coordinates are in the exact [0..naturalW] space
    // 3. Fix potential EXIF rotation bugs in some browsers
    const canvas = document.createElement('canvas');
    canvas.width = naturalW;
    canvas.height = naturalH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageElement, 0, 0, naturalW, naturalH);

    const predictions = await currentDetector.estimateFaces(canvas, false);

    return predictions.map(pred => {
      const start = pred.topLeft;
      const end = pred.bottomRight;
      const w = end[0] - start[0];
      const h = end[1] - start[1];
      
      // Since we passed a canvas of size [naturalW, naturalH], 
      // the coordinates are 100% guaranteed to be in this exact space.
      const normX = naturalW > 0 ? start[0] / naturalW : 0;
      const normY = naturalH > 0 ? start[1] / naturalH : 0;
      const normW = naturalW > 0 ? w / naturalW : 0;
      const normH = naturalH > 0 ? h / naturalH : 0;
      
      return {
        score: pred.probability[0],
        normalized: {
          x: Math.max(0, Math.min(1, normX)),
          y: Math.max(0, Math.min(1, normY)),
          width: Math.max(0, Math.min(1, normW)),
          height: Math.max(0, Math.min(1, normH)),
        },
        box: {
          xMin: start[0],
          yMin: start[1],
          width: w,
          height: h
        }
      };
    });
  } catch (error) {
    console.error("Error detecting face:", error);
    return [];
  }
};
