"""
Node 2 — Vision Analysis Agent (Classical CV — No LLM)
Analyses a wound photo using OpenCV image processing.

Detects:
  - Redness: HSV color thresholding (red hue ranges)
  - Swelling: contour area relative to expected incision area (placeholder baseline)
  - Texture change: local variance / edge density

Outputs a wound score (0–10) and persists WoundAnalysis record.
"""
import base64
import logging
import cv2
import numpy as np
from typing import Optional
from pathlib import Path
from sqlalchemy.orm import Session

from app.agents.state import AgentState
from app.database import SessionLocal
from app.models.models import WoundAnalysis, WoundSeverity

logger = logging.getLogger(__name__)


# ------------------------------------------------------------------
# OpenCV Analysis Functions
# ------------------------------------------------------------------

def _detect_redness(image_bgr: np.ndarray) -> tuple[bool, float]:
    """
    Detect redness in wound region using HSV color space.
    Returns (redness_detected, redness_score 0–10).
    """
    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
    
    # Red wraps around 0: lower red (0-10) and upper red (160-180)
    lower_red1 = np.array([0, 50, 50])
    upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([160, 50, 50])
    upper_red2 = np.array([180, 255, 255])
    
    mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
    mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
    red_mask = cv2.bitwise_or(mask1, mask2)
    
    # Optional: apply morphological opening to remove noise
    kernel = np.ones((3, 3), np.uint8)
    red_mask = cv2.morphologyEx(red_mask, cv2.MORPH_OPEN, kernel, iterations=1)
    
    total_pixels = image_bgr.shape[0] * image_bgr.shape[1]
    red_pixels = np.sum(red_mask > 0)
    red_ratio = red_pixels / total_pixels if total_pixels > 0 else 0
    
    # Map ratio to 0–10 score (thresholds are empirical)
    if red_ratio < 0.02:
        redness_score = 0.0
        detected = False
    elif red_ratio < 0.05:
        redness_score = 2.5
        detected = True
    elif red_ratio < 0.10:
        redness_score = 5.0
        detected = True
    else:
        redness_score = 8.0
        detected = True
        
    logger.debug(f"Redness ratio: {red_ratio:.4f} -> score: {redness_score}")
    return detected, redness_score


def _detect_swelling(image_bgr: np.ndarray, baseline_area: Optional[float] = None) -> tuple[bool, float]:
    """
    Approximate swelling via contour area of the wound/incision.
    Without baseline, we assume an incision area threshold.
    Returns (swelling_detected, swelling_score 0–10).
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    
    # Find contours
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return False, 0.0
    
    # Assume largest contour is the wound/incision
    largest_contour = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(largest_contour)
    
    # If baseline provided, compute change; else use heuristic threshold
    if baseline_area is not None and baseline_area > 0:
        area_change = (area - baseline_area) / baseline_area
        if area_change > 0.2:   # 20% increase = swelling
            swelling_score = min(10.0, 5.0 + (area_change * 20))
            detected = True
        else:
            swelling_score = 0.0
            detected = False
    else:
        # Heuristic: incision area relative to image size
        total_pixels = image_bgr.shape[0] * image_bgr.shape[1]
        area_ratio = area / total_pixels
        # Typical incision is small (<2% of image). Swollen incision larger.
        if area_ratio > 0.05:
            swelling_score = 7.0
            detected = True
        elif area_ratio > 0.03:
            swelling_score = 4.0
            detected = True
        else:
            swelling_score = 0.0
            detected = False
            
    logger.debug(f"Contour area: {area:.0f}, ratio: {area/total_pixels:.4f} -> swelling score: {swelling_score}")
    return detected, swelling_score


def _detect_texture_change(image_bgr: np.ndarray) -> tuple[bool, float]:
    """
    Estimate texture irregularity using local variance (Laplacian variance).
    High variance indicates rough/uneven texture (possible discharge, crusting).
    Returns (texture_change_detected, texture_score 0–10).
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    variance = laplacian.var()
    
    # Variance thresholds (empirical, may need tuning)
    if variance < 50:
        texture_score = 0.0
        detected = False
    elif variance < 150:
        texture_score = 3.0
        detected = False  # still normal variation
    elif variance < 300:
        texture_score = 5.0
        detected = True
    else:
        texture_score = 8.0
        detected = True
        
    logger.debug(f"Laplacian variance: {variance:.2f} -> texture score: {texture_score}")
    return detected, texture_score


def analyze_wound_image(image_path: str) -> dict:
    """
    Main analysis function. Returns structured findings similar to LLM-based version.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not load image: {image_path}")
    
    # Resize for consistency (optional, but speeds up processing)
    max_dim = 800
    h, w = img.shape[:2]
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        new_w = int(w * scale)
        new_h = int(h * scale)
        img = cv2.resize(img, (new_w, new_h))
    
    # Detect redness
    redness_detected, redness_score = _detect_redness(img)
    
    # Detect swelling (without baseline)
    swelling_detected, swelling_score = _detect_swelling(img)
    
    # Detect texture change
    texture_detected, texture_score = _detect_texture_change(img)
    
    # Combine scores into overall wound score (weighted average)
    # Redness 40%, Swelling 30%, Texture 30%
    overall_score = (redness_score * 0.4) + (swelling_score * 0.3) + (texture_score * 0.3)
    overall_score = round(overall_score, 1)
    
    # Determine severity
    if overall_score < 2.0:
        severity = WoundSeverity.NORMAL
    elif overall_score < 4.0:
        severity = WoundSeverity.MILD
    elif overall_score < 7.0:
        severity = WoundSeverity.MODERATE
    else:
        severity = WoundSeverity.SEVERE
        
    # Build summary
    findings = []
    if redness_detected: findings.append("redness")
    if swelling_detected: findings.append("swelling")
    if texture_detected: findings.append("unusual texture")
    
    if not findings:
        summary = "Wound appears clean with no signs of infection detected."
    elif len(findings) == 1:
        summary = f"Wound shows some {findings[0]}. Worth monitoring but not immediately alarming."
    else:
        summary = f"Wound shows {' and '.join(findings)}. Doctor has been notified to review."
    
    return {
        "redness_detected": redness_detected,
        "swelling_detected": swelling_detected,
        "texture_change_detected": texture_detected,
        "severity": severity,
        "score": overall_score,
        "summary": summary,
        "raw_response": f"CV analysis: redness={redness_score:.1f}, swelling={swelling_score:.1f}, texture={texture_score:.1f}",
        "redness_score": redness_score,
        "swelling_score": swelling_score,
        "texture_score": texture_score,
    }


# ------------------------------------------------------------------
# Agent Node (Maintained same interface)
# ------------------------------------------------------------------

async def vision_agent_node(state: AgentState) -> AgentState:
    """
    Runs wound photo through classical CV analysis.
    Stores a WoundAnalysis record and updates AgentState.
    """
    logger.info(f"[VisionAgent] Starting CV analysis for patient {state['patient_id']}")
    errors = list(state.get("errors", []))

    wound_path = state.get("wound_image_path")
    if not wound_path or not Path(wound_path).exists():
        logger.warning(f"[VisionAgent] Wound image path not found: {wound_path}")
        return {
            **state,
            "wound_severity": "NORMAL",
            "wound_score": 0.0,
            "redness_detected": False,
            "swelling_detected": False,
            "texture_change_detected": False,
            "wound_analysis_summary": "No wound image available for analysis.",
            "errors": errors,
        }

    try:
        findings = analyze_wound_image(wound_path)
    except Exception as e:
        logger.error(f"[VisionAgent] CV analysis failed: {e}")
        errors.append(f"VisionAgent CV analysis failed: {e}")
        return {
            **state,
            "wound_severity": "NORMAL",
            "wound_score": 0.0,
            "redness_detected": False,
            "swelling_detected": False,
            "texture_change_detected": False,
            "wound_analysis_summary": "Wound image could not be processed.",
            "errors": errors,
        }

    # Persist to DB
    db: Session = SessionLocal()
    wound_analysis_id = None
    try:
        analysis = WoundAnalysis(
            patient_id=state["patient_id"],
            check_in_id=state["check_in_id"],
            image_url=wound_path,
            severity=findings["severity"],
            raw_llm_response=findings["raw_response"],  # reuse field for CV output
            redness_detected=findings["redness_detected"],
            swelling_detected=findings["swelling_detected"],
            texture_change_detected=findings["texture_change_detected"],
            analysis_summary=findings["summary"],
            wound_score=findings["score"],
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        wound_analysis_id = analysis.id
        logger.info(
            f"[VisionAgent] WoundAnalysis saved — id={analysis.id} "
            f"severity={findings['severity'].value} score={findings['score']}"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"[VisionAgent] DB write failed: {e}")
        errors.append(f"VisionAgent DB write failed: {e}")
    finally:
        db.close()

    return {
        **state,
        "wound_severity":          findings["severity"].value,
        "wound_score":             findings["score"],
        "wound_analysis_id":       wound_analysis_id,
        "redness_detected":        findings["redness_detected"],
        "swelling_detected":       findings["swelling_detected"],
        "texture_change_detected": findings["texture_change_detected"],
        "wound_analysis_summary":  findings["summary"],
        "errors":                  errors,
    }