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

    const predictions = await currentDetector.estimateFaces(imageElement, false);
    
    // Determine the actual coordinate dimensions used by TensorFlow
    const renderedW = imageElement.clientWidth || imageElement.width || 1;
    const renderedH = imageElement.clientHeight || imageElement.height || 1;

    return predictions.map(pred => {
      const start = pred.topLeft;
      const end = pred.bottomRight;
      const w = end[0] - start[0];
      const h = end[1] - start[1];
      
      // CRITICAL FIX: 
      // BlazeFace internally scales its normalized bounding boxes [0..1] by `imageElement.width` and `imageElement.height`.
      // In the browser, `img.width` returns the *RENDERED* layout width, not the natural intrinsic width.
      // Therefore, `pred.topLeft` and `pred.bottomRight` are ALREADY in RENDERED pixels!
      // To get the true percentage (0 to 1), we MUST divide by the rendered width/height.
      const normX = start[0] / renderedW;
      const normY = start[1] / renderedH;
      const normW = w / renderedW;
      const normH = h / renderedH;
      
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
