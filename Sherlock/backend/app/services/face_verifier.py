"""
Face Verifier Module — OpenCV 5.x Compatible
Uses histogram comparison and template matching for image similarity.
No external model files needed. Works 100% offline.
"""
import cv2
import numpy as np
import aiohttp
import logging
from typing import Optional, Tuple

logger = logging.getLogger("sherlock.face_verifier")


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


def bytes_to_cv2_image(image_bytes: bytes) -> Optional[np.ndarray]:
    """Convert raw image bytes to OpenCV BGR numpy array."""
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        logger.debug(f"Failed to decode image: {e}")
        return None


def extract_face_crop(img: np.ndarray) -> Optional[np.ndarray]:
    """
    Extract the central region of the image as a 'face crop' heuristic.
    Since OpenCV 5 removed CascadeClassifier and Haar cascades,
    we use a center-crop approach (faces are typically centered in profile photos).
    """
    try:
        h, w = img.shape[:2]
        if h < 30 or w < 30:
            return None

        # Center crop: take the middle 60% of the image (covers most face photos)
        crop_ratio = 0.3
        y1 = int(h * crop_ratio * 0.5)
        y2 = int(h * (1 - crop_ratio * 0.5))
        x1 = int(w * crop_ratio)
        x2 = int(w * (1 - crop_ratio))

        face_region = img[y1:y2, x1:x2]
        gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
        return gray
    except Exception as e:
        logger.debug(f"Face crop error: {e}")
        return None


def compare_faces(target_face_crop: np.ndarray, candidate_img_bytes: bytes) -> Tuple[bool, float]:
    """
    Compare candidate image with target face using histogram + template matching.
    Returns: (is_match: bool, similarity_score: float [0.0 - 1.0])
    """
    candidate_img = bytes_to_cv2_image(candidate_img_bytes)
    if candidate_img is None:
        return False, 0.0

    try:
        # Convert candidate to grayscale and resize
        candidate_gray = cv2.cvtColor(candidate_img, cv2.COLOR_BGR2GRAY)

        # Resize both images to same dimensions for comparison
        target_resized = cv2.resize(target_face_crop, (128, 128))
        candidate_resized = cv2.resize(candidate_gray, (128, 128))

        # --- Method 1: Normalized Cross-Correlation (Template Matching) ---
        result = cv2.matchTemplate(candidate_resized, target_resized, cv2.TM_CCOEFF_NORMED)
        _, max_val, _, _ = cv2.minMaxLoc(result)
        template_score = max(0.0, float(max_val))

        # --- Method 2: Histogram Correlation ---
        hist1 = cv2.calcHist([target_resized], [0], None, [256], [0, 256])
        hist2 = cv2.calcHist([candidate_resized], [0], None, [256], [0, 256])
        cv2.normalize(hist1, hist1, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
        cv2.normalize(hist2, hist2, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
        hist_score = max(0.0, float(cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)))

        # Combined score: template matching weighted higher
        combined_score = round((template_score * 0.7) + (hist_score * 0.3), 2)
        
        is_match = combined_score >= 0.45

        return is_match, combined_score

    except Exception as e:
        logger.debug(f"Face comparison error: {e}")
        return False, 0.0
