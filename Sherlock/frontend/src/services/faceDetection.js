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
    const naturalW = imageElement.naturalWidth || renderedW;
    const naturalH = imageElement.naturalHeight || renderedH;

    return predictions.map(pred => {
      const start = pred.topLeft;
      const end = pred.bottomRight;
      const w = end[0] - start[0];
      const h = end[1] - start[1];
      
      // BlazeFace using tf.browser.fromPixels on an HTMLImageElement ALWAYS returns 
      // coordinates relative to the image's intrinsic size (naturalWidth/naturalHeight),
      // regardless of how the image is scaled via CSS on the screen.
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
