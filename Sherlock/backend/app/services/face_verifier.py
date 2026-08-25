"""
Face Verifier Module — Deep Learning with OpenCV
Uses state-of-the-art SFace and YuNet models for highly accurate face recognition.
Runs 100% offline via OpenCV DNN, no extra dependencies.
"""
import cv2
import numpy as np
import aiohttp
import logging
from typing import Optional, Tuple
import os

logger = logging.getLogger("sherlock.face_verifier")

# Initialize models globally so they load once
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models", "dnn")
YUNET_PATH = os.path.join(MODELS_DIR, "face_detection_yunet.onnx")
SFACE_PATH = os.path.join(MODELS_DIR, "face_recognition_sface.onnx")

detector = None
recognizer = None

try:
    if os.path.exists(YUNET_PATH) and os.path.exists(SFACE_PATH):
        # Initialize detector with a dummy size, we will update it per image
        detector = cv2.FaceDetectorYN.create(YUNET_PATH, "", (320, 320), 0.9, 0.3, 5000)
        recognizer = cv2.FaceRecognizerSF.create(SFACE_PATH, "")
        logger.info("Successfully loaded YuNet and SFace models for face recognition.")
    else:
        logger.warning(f"DNN Models not found at {MODELS_DIR}. Face recognition will fail.")
except Exception as e:
    logger.error(f"Error loading face models: {e}")


async def download_image_as_bytes(url: str, session: aiohttp.ClientSession, timeout: int = 3) -> Optional[bytes]:
    """Download candidate image/thumbnail bytes asynchronously with fast timeout."""
    try:
        client_timeout = aiohttp.ClientTimeout(total=timeout, connect=1.5)
        async with session.get(url, timeout=client_timeout) as response:
            if response.status == 200:
                return await response.read()
    except Exception as e:
        logger.debug(f"Failed to download image from {url}: {e}")
    return None


def bytes_to_cv2_image(image_bytes: bytes, max_dim: int = 320) -> Optional[np.ndarray]:
    """Convert raw image bytes to OpenCV BGR numpy array with strict memory-safe downscaling."""
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return None
        h, w = img.shape[:2]
        if max(h, w) > max_dim:
            scale = max_dim / max(h, w)
            new_w, new_h = int(w * scale), int(h * scale)
            img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
        return img
    except Exception as e:
        logger.debug(f"Failed to decode image: {e}")
        return None


def create_optimized_face_crop(image_path: str) -> str:
    """
    Detects the primary face in the image and saves a nicely padded portrait crop.
    Downsamples large images to keep RAM usage minimal.
    """
    if detector is None:
        return image_path
    
    try:
        img = cv2.imread(image_path)
        if img is None:
            return image_path
            
        h, w = img.shape[:2]
        if max(h, w) > 640:
            scale = 640 / max(h, w)
            img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
            h, w = img.shape[:2]
            
        detector.setInputSize((w, h))
        
        _, faces = detector.detect(img)
        if faces is None or len(faces) == 0:
            return image_path
            
        face = faces[0]
        fx, fy, fw, fh = int(face[0]), int(face[1]), int(face[2]), int(face[3])
        
        # Add 30% padding around face for natural portrait context
        pad_x = int(fw * 0.30)
        pad_y_top = int(fh * 0.35)
        pad_y_bottom = int(fh * 0.25)
        
        x1 = max(0, fx - pad_x)
        y1 = max(0, fy - pad_y_top)
        x2 = min(w, fx + fw + pad_x)
        y2 = min(h, fy + fh + pad_y_bottom)
        
        cropped_img = img[y1:y2, x1:x2]
        if cropped_img.size == 0:
            return image_path
            
        crop_path = f"{image_path}_cropped_face.jpg"
        cv2.imwrite(crop_path, cropped_img)
        logger.info(f"Successfully created optimized face crop ({x2-x1}x{y2-y1}) at {crop_path}")
        return crop_path
    except Exception as e:
        logger.warning(f"Error creating face crop: {e}")
        return image_path


def extract_face_crop(img: np.ndarray) -> Optional[np.ndarray]:
    """
    Extract the face FEATURE (embedding) directly using SFace.
    Downscales large inputs to prevent RAM spikes.
    """
    if detector is None or recognizer is None or img is None:
        return None
    
    try:
        h, w = img.shape[:2]
        if max(h, w) > 640:
            scale = 640 / max(h, w)
            img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
            h, w = img.shape[:2]
            
        detector.setInputSize((w, h))
        
        _, faces = detector.detect(img)
        if faces is None or len(faces) == 0:
            return None
        
        aligned_face = recognizer.alignCrop(img, faces[0])
        feature = recognizer.feature(aligned_face)
        return feature
    except Exception as e:
        logger.debug(f"Face extraction error: {e}")
        return None


def compare_faces(target_feature: np.ndarray, candidate_img_bytes: bytes) -> Tuple[bool, float]:
    """
    Compare candidate image with target face using Cosine Similarity of SFace embeddings.
    Memory-safe and lightweight.
    """
    if recognizer is None or target_feature is None:
        return False, 0.0

    candidate_img = bytes_to_cv2_image(candidate_img_bytes, max_dim=320)
    if candidate_img is None:
        return False, 0.0

    try:
        candidate_feature = extract_face_crop(candidate_img)
        if candidate_feature is None:
            return False, 0.0

        score = recognizer.match(target_feature, candidate_feature, cv2.FaceRecognizerSF_FR_COSINE)
        
        normalized_score = 0.0
        is_match = bool(score >= 0.363)
        
        if is_match:
            normalized_score = 0.80 + ((score - 0.363) / (1.0 - 0.363)) * 0.20
        else:
            normalized_score = (score / 0.363) * 0.80

        normalized_score = max(0.0, min(1.0, float(normalized_score)))
        return is_match, normalized_score

    except Exception as e:
        logger.debug(f"Face comparison error: {e}")
        return False, 0.0
