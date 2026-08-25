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
 * Returns bounding boxes as fractions of the image's natural dimensions (0..1).
 * @param {HTMLImageElement} imageElement 
 * @returns {Promise<Array>} List of detected faces with normalized bounding boxes
 */
export const detectFace = async (imageElement) => {
  try {
    const currentDetector = await initDetector();
    if (!currentDetector) throw new Error("Detector not initialized");

    // Use a canvas at the image's natural resolution so we control exactly
    // what coordinate space BlazeFace operates in.
    const natW = imageElement.naturalWidth || imageElement.width;
    const natH = imageElement.naturalHeight || imageElement.height;

    const canvas = document.createElement('canvas');
    canvas.width = natW;
    canvas.height = natH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageElement, 0, 0, natW, natH);

    // BlazeFace will read canvas.width / canvas.height which are natW / natH.
    // So returned coordinates are in [0..natW] x [0..natH].
    const predictions = await currentDetector.estimateFaces(canvas, false);

    console.log('[FaceDetection] canvas size:', natW, 'x', natH);
    console.log('[FaceDetection] predictions:', JSON.stringify(predictions.map(p => ({
      topLeft: [p.topLeft[0], p.topLeft[1]],
      bottomRight: [p.bottomRight[0], p.bottomRight[1]],
    }))));

    return predictions.map(pred => {
      const x1 = pred.topLeft[0];
      const y1 = pred.topLeft[1];
      const x2 = pred.bottomRight[0];
      const y2 = pred.bottomRight[1];

      return {
        score: pred.probability[0],
        // Normalized 0..1 fractions of the natural image size
        normalized: {
          x: x1 / natW,
          y: y1 / natH,
          width: (x2 - x1) / natW,
          height: (y2 - y1) / natH,
        },
        // Raw pixel coordinates in natural image space
        box: {
          xMin: x1,
          yMin: y1,
          width: x2 - x1,
          height: y2 - y1,
        }
      };
    });
  } catch (error) {
    console.error("Error detecting face:", error);
    return [];
  }
};
