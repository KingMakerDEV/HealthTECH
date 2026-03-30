"""
Node 2 — Vision Analysis Agent
Only runs if has_wound_image is True.
Encodes wound photo to base64, sends to NVIDIA vision model.
Extracts severity, clinical signs, and wound_score (0–10).
Saves result to wound_analyses table.
"""
import json
import base64
import logging
from pathlib import Path
from sqlalchemy.orm import Session

from app.agents.state import AgentState
from app.agents.nvidia_client import vision_client, VISION_MODEL
from app.database import SessionLocal
from app.models.models import WoundAnalysis, WoundSeverity

logger = logging.getLogger(__name__)

VISION_SYSTEM_PROMPT = """You are a clinical wound assessment AI assistant.

Analyze the provided wound image and return ONLY a valid JSON object with no extra text, no markdown:

{
  "severity": "<one of: NORMAL, MILD, MODERATE, SEVERE>",
  "redness_detected": <true or false>,
  "swelling_detected": <true or false>,
  "texture_change_detected": <true or false>,
  "analysis_summary": "<2-3 sentence clinical description of what you observe>",
  "wound_score": <float 0.0-10.0>
}

Severity and wound_score mapping:
- NORMAL (score 0-1): No signs of infection. Healing appears normal.
- MILD (score 2-4): Minor redness or slight swelling. Likely normal post-surgical response.
- MODERATE (score 5-7): Noticeable redness, swelling, or texture change. Monitor closely.
- SEVERE (score 8-10): Clear signs of infection — significant redness, pus, open areas, or necrosis.

Be objective and clinical. Do not diagnose. Only describe observable signs.
Return ONLY the JSON object."""


def _encode_image_to_base64(image_path: str) -> str:
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def _get_image_media_type(image_path: str) -> str:
    suffix = Path(image_path).suffix.lower()
    return {
        ".jpg":  "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png":  "image/png",
        ".webp": "image/webp",
    }.get(suffix, "image/jpeg")


async def vision_agent_node(state: AgentState) -> AgentState:
    """
    Analyzes wound image using NVIDIA vision model.
    Skips gracefully if image path is invalid.
    """
    logger.info(f"[VisionAgent] Starting for patient {state['patient_id']}")
    errors = list(state.get("errors", []))

    wound_image_path = state.get("wound_image_path")

    if not wound_image_path or not Path(wound_image_path).exists():
        logger.warning(f"[VisionAgent] Image not found at {wound_image_path}")
        errors.append("VisionAgent: wound image file not found")
        return {
            **state,
            "wound_severity":         "NORMAL",
            "wound_score":            0.0,
            "wound_analysis_id":      None,
            "redness_detected":       False,
            "swelling_detected":      False,
            "texture_change_detected": False,
            "wound_analysis_summary": "Image not available for analysis.",
            "errors": errors,
        }

    # ── Encode image ─────────────────────────────────────────────
    try:
        image_b64  = _encode_image_to_base64(wound_image_path)
        media_type = _get_image_media_type(wound_image_path)
        data_url   = f"data:{media_type};base64,{image_b64}"
    except Exception as e:
        logger.error(f"[VisionAgent] Image encoding failed: {e}")
        errors.append(f"VisionAgent image encoding failed: {e}")
        return {**state, "wound_score": 0.0, "wound_severity": "NORMAL", "errors": errors}

    # ── Call NVIDIA Vision Model ──────────────────────────────────
    try:
        response = await vision_client.chat.completions.create(
            model=VISION_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": data_url},
                        },
                        {
                            "type": "text",
                            "text": "Analyze this wound image and return the JSON assessment as instructed.",
                        },
                    ],
                }
            ],
            temperature=0.1,
            max_tokens=500,
        )

        raw_json = response.choices[0].message.content.strip()

        if raw_json.startswith("```"):
            raw_json = raw_json.split("```")[1]
            if raw_json.startswith("json"):
                raw_json = raw_json[4:]
        raw_json = raw_json.strip()

        result: dict = json.loads(raw_json)
        logger.info(f"[VisionAgent] Analysis result: {result}")

    except json.JSONDecodeError as e:
        logger.error(f"[VisionAgent] JSON parse error: {e}")
        errors.append(f"VisionAgent JSON parse failed: {e}")
        result = {}
    except Exception as e:
        logger.error(f"[VisionAgent] Vision API call failed: {e}")
        errors.append(f"VisionAgent API call failed: {e}")
        result = {}

    # ── Parse result with safe defaults ──────────────────────────
    severity_str = result.get("severity", "NORMAL").upper()
    valid_severities = {"NORMAL", "MILD", "MODERATE", "SEVERE"}
    if severity_str not in valid_severities:
        severity_str = "NORMAL"

    wound_score              = max(0.0, min(10.0, float(result.get("wound_score") or 0.0)))
    redness_detected         = bool(result.get("redness_detected", False))
    swelling_detected        = bool(result.get("swelling_detected", False))
    texture_change_detected  = bool(result.get("texture_change_detected", False))
    analysis_summary         = result.get("analysis_summary", "Analysis incomplete.")
    raw_llm_response         = str(result)

    # ── Save to wound_analyses table ─────────────────────────────
    wound_analysis_id = None
    db: Session = SessionLocal()
    try:
        # Store relative URL for frontend access
        image_url = wound_image_path.replace("\\", "/")
        if "uploads" in image_url:
            image_url = "/" + image_url[image_url.index("uploads"):]

        wound_record = WoundAnalysis(
            patient_id              = state["patient_id"],
            check_in_id             = state.get("check_in_id"),
            image_url               = image_url,
            severity                = WoundSeverity(severity_str),
            raw_llm_response        = raw_llm_response,
            redness_detected        = redness_detected,
            swelling_detected       = swelling_detected,
            texture_change_detected = texture_change_detected,
            analysis_summary        = analysis_summary,
            wound_score             = wound_score,
        )
        db.add(wound_record)
        db.commit()
        db.refresh(wound_record)
        wound_analysis_id = wound_record.id
        logger.info(f"[VisionAgent] Saved wound_analysis {wound_analysis_id}")
    except Exception as e:
        db.rollback()
        logger.error(f"[VisionAgent] DB write failed: {e}")
        errors.append(f"VisionAgent DB write failed: {e}")
    finally:
        db.close()

    return {
        **state,
        "wound_severity":           severity_str,
        "wound_score":              wound_score,
        "wound_analysis_id":        wound_analysis_id,
        "redness_detected":         redness_detected,
        "swelling_detected":        swelling_detected,
        "texture_change_detected":  texture_change_detected,
        "wound_analysis_summary":   analysis_summary,
        "errors":                   errors,
    }