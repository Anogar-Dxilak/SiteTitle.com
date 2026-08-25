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
    
    // Map blazeface output to our expected format
    return predictions.map(pred => {
      const start = pred.topLeft;
      const end = pred.bottomRight;
      const size = [end[0] - start[0], end[1] - start[1]];
      
      return {
        score: pred.probability[0],
        box: {
          xMin: start[0],
          yMin: start[1],
          width: size[0],
          height: size[1]
        }
      };
    });
  } catch (error) {
    console.error("Error detecting face:", error);
    return [];
  }
};
