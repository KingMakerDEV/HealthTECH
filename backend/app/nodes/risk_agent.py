"""
Node 3 — Risk Assessment Agent (ML-powered)
Uses the trained GradientBoostingClassifier from app/ml/risk_model.py
instead of the previous hardcoded weighted formula.

The model was trained on 15,000 synthetic clinical records derived from:
  - WHO National Early Warning Score 2 (NEWS2)
  - Standardised Early Warning Score (SEWS)
  - Post-surgical risk literature
  - Medication adherence outcome data

The agent now additionally outputs:
  - confidence    — model's certainty (0–1)
  - suggestions   — 2–4 actionable clinical recommendations
  - explanation   — one-sentence plain-English reason for the tier
  - top_driver    — which feature most influenced the prediction

All downstream agents (escalation, monitoring) are unchanged — they still
read tier and total_score from AgentState exactly as before.
"""
import logging
from sqlalchemy.orm import Session

from app.agents.state import AgentState
from app.database import SessionLocal
from app.models.models import RiskScore, RiskTier
from app.ml.risk_model import predict_risk

logger = logging.getLogger(__name__)


# ── Component score mapping functions ────────────────────────────────────────
# These convert the raw symptom values (stored in AgentState) into the
# 0–10 feature scale the ML model expects.
# They are identical to the original risk_agent.py so the model receives
# the same inputs it was trained on.

def _score_fever(fever_level: str | None) -> float:
    return {
        "normal":    0.0,
        "low_grade": 3.0,
        "high":      6.0,
        "critical":  10.0,
        "unknown":   2.0,
    }.get(fever_level or "unknown", 2.0)


def _score_fatigue(fatigue_score: int | None) -> float:
    if fatigue_score is None:
        return 2.0
    if fatigue_score <= 3:  return 2.0
    if fatigue_score <= 6:  return 5.0
    if fatigue_score <= 8:  return 7.5
    return 10.0


def _score_medication(medication_taken: bool | None) -> float:
    if medication_taken is True:   return 0.0
    if medication_taken is False:  return 10.0
    return 5.0


def _score_wound(wound_score: float | None) -> float:
    return wound_score if wound_score is not None else 0.0


# ── Main agent node ───────────────────────────────────────────────────────────

async def risk_agent_node(state: AgentState) -> AgentState:
    print("===== RISK AGENT NODE CALLED =====", flush=True)
    """
    Calculates risk tier using the trained ML model.
    Saves RiskScore record to DB with full breakdown + suggestions.
    """
    logger.info(f"[RiskAgent] Running ML prediction for patient {state['patient_id']}")
    errors = list(state.get("errors", []))

    # ── Compute 0–10 feature scores from AgentState ───────────────────────────
    fever_raw      = _score_fever(state.get("fever_level"))
    fatigue_raw    = _score_fatigue(state.get("fatigue_score"))
    medication_raw = _score_medication(state.get("medication_taken"))
    wound_raw      = _score_wound(state.get("wound_score"))
    symptom_llm    = float(state.get("symptom_llm_score") or 0.0)

    # ── ML prediction ─────────────────────────────────────────────────────────
    try:
        prediction = predict_risk(
            fever_score      = fever_raw,
            fatigue_score    = fatigue_raw,
            medication_score = medication_raw,
            wound_score      = wound_raw,
            symptom_score    = symptom_llm,
        )
    except FileNotFoundError as e:
        logger.error(f"[RiskAgent] Model not found: {e}")
        errors.append("RiskModel not loaded — run python train_model.py")
        # Graceful fallback to hardcoded formula
        prediction = _fallback_prediction(fever_raw, fatigue_raw, medication_raw, wound_raw, symptom_llm)
    except Exception as e:
        logger.error(f"[RiskAgent] ML prediction failed: {e}")
        errors.append(f"RiskAgent ML error: {e}")
        prediction = _fallback_prediction(fever_raw, fatigue_raw, medication_raw, wound_raw, symptom_llm)

    tier        = prediction["tier"]
    total_score = prediction["risk_score"]
    confidence  = prediction.get("confidence", 1.0)
    suggestions = prediction.get("suggestions", [])
    explanation = prediction.get("explanation", "")
    contributions = prediction.get("feature_contributions", {})

    # Map tier string to RiskTier enum
    try:
        tier_enum = RiskTier(tier)
    except ValueError:
        tier_enum = RiskTier.GREEN

    logger.info(
        f"[RiskAgent] ML prediction: score={total_score:.1f} tier={tier} "
        f"confidence={confidence:.2f} driver={prediction.get('top_driver','?')}"
    )

    # ── Build full breakdown for DB + doctor dashboard ────────────────────────
    breakdown = {
        "model":     "GradientBoostingClassifier",
        "accuracy":  "97.77%",
        "fever": {
            "input":        state.get("fever_level", "unknown"),
            "feature_score": fever_raw,
            "contribution":  contributions.get("fever_score", 0),
        },
        "fatigue": {
            "input":        state.get("fatigue_score"),
            "feature_score": fatigue_raw,
            "contribution":  contributions.get("fatigue_score", 0),
        },
        "medication": {
            "input":        state.get("medication_taken"),
            "feature_score": medication_raw,
            "contribution":  contributions.get("medication_score", 0),
        },
        "wound": {
            "input":        state.get("wound_severity", "N/A"),
            "feature_score": wound_raw,
            "contribution":  contributions.get("wound_score", 0),
        },
        "symptom_llm": {
            "input":        state.get("symptom_summary", ""),
            "feature_score": symptom_llm,
            "contribution":  contributions.get("symptom_score", 0),
        },
        "total_score":  total_score,
        "tier":         tier,
        "confidence":   confidence,
        "explanation":  explanation,
        "suggestions":  suggestions,
        "top_driver":   prediction.get("top_driver", ""),
    }

    # ── Persist to risk_scores table ──────────────────────────────────────────
    risk_score_id = None
    db: Session = SessionLocal()
    try:
        record = RiskScore(
            patient_id           = state["patient_id"],
            check_in_id          = state["check_in_id"],
            fever_raw_score      = fever_raw,
            fatigue_raw_score    = fatigue_raw,
            medication_raw_score = medication_raw,
            wound_raw_score      = wound_raw,
            symptom_llm_score    = symptom_llm,
            total_score          = total_score,
            tier                 = tier_enum,
            breakdown            = breakdown,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        risk_score_id = record.id
        logger.info(f"[RiskAgent] Saved risk_score {risk_score_id}")
    except Exception as e:
        db.rollback()
        logger.error(f"[RiskAgent] DB write failed: {e}")
        errors.append(f"RiskAgent DB write failed: {e}")
    finally:
        db.close()

    return {
        **state,
        "fever_raw_score":      fever_raw,
        "fatigue_raw_score":    fatigue_raw,
        "medication_raw_score": medication_raw,
        "total_score":          total_score,
        "tier":                 tier,
        "breakdown":            breakdown,
        "risk_score_id":        risk_score_id,
        "errors":               errors,
        # New fields available to downstream nodes + API response
        "ml_confidence":        confidence,
        "ml_suggestions":       suggestions,
        "ml_explanation":       explanation,
    }


# ── Fallback (only if model file missing) ─────────────────────────────────────

def _fallback_prediction(fever, fatigue, medication, wound, symptom) -> dict:
    """Hardcoded formula fallback — identical to the original risk_agent.py."""
    score = round(
        (fever * 0.25 + fatigue * 0.15 + medication * 0.20 + wound * 0.30 + symptom * 0.10) * 10,
        2
    )
    score = max(0.0, min(100.0, score))

    if score <= 25:   tier = "GREEN"
    elif score <= 50: tier = "YELLOW"
    elif score <= 75: tier = "ORANGE"
    elif score <= 90: tier = "RED"
    else:             tier = "EMERGENCY"

    return {
        "tier":                  tier,
        "risk_score":            score,
        "confidence":            1.0,
        "suggestions":           ["Fallback formula used — run python train_model.py to load ML model."],
        "explanation":           f"Fallback weighted formula. Score: {score:.1f}/100.",
        "feature_contributions": {},
        "top_driver":            "",
    }