"""
Node 3 — Risk Assessment Agent
Applies the transparent weighted scoring formula.
All component scores are 0–10. Final score is 0–100.

Formula weights:
  Fever       → 25%
  Fatigue     → 15%
  Medication  → 20%
  Wound       → 30%
  Symptom LLM → 10%

Tier thresholds:
  0–25   → GREEN
  26–50  → YELLOW
  51–75  → ORANGE
  76–90  → RED
  91–100 → EMERGENCY
"""
import logging
from sqlalchemy.orm import Session

from app.agents.state import AgentState
from app.database import SessionLocal
from app.models.models import RiskScore, RiskTier

logger = logging.getLogger(__name__)

# ── Weight constants ──────────────────────────────────────────────
WEIGHT_FEVER      = 0.25
WEIGHT_FATIGUE    = 0.15
WEIGHT_MEDICATION = 0.20
WEIGHT_WOUND      = 0.30
WEIGHT_SYMPTOM    = 0.10


# ── Component scoring functions ───────────────────────────────────

def _score_fever(fever_level: str | None) -> float:
    return {
        "normal":    0.0,
        "low_grade": 3.0,
        "high":      6.0,
        "critical":  10.0,
        "unknown":   2.0,  # slight penalty for unknown
    }.get(fever_level or "unknown", 2.0)


def _score_fatigue(fatigue_score: int | None) -> float:
    if fatigue_score is None:
        return 2.0  # slight penalty for missing data
    if fatigue_score <= 3:
        return 2.0
    if fatigue_score <= 6:
        return 5.0
    if fatigue_score <= 8:
        return 7.5
    return 10.0


def _score_medication(medication_taken: bool | None) -> float:
    if medication_taken is True:
        return 0.0
    if medication_taken is False:
        return 10.0
    return 5.0  # unknown — moderate penalty


def _score_wound(wound_score: float | None) -> float:
    # wound_score already 0–10 from Vision Agent
    return wound_score if wound_score is not None else 0.0


def _determine_tier(total: float) -> RiskTier:
    if total <= 25:
        return RiskTier.GREEN
    if total <= 50:
        return RiskTier.YELLOW
    if total <= 75:
        return RiskTier.ORANGE
    if total <= 90:
        return RiskTier.RED
    return RiskTier.EMERGENCY


async def risk_agent_node(state: AgentState) -> AgentState:
    """
    Calculates final risk score from all component inputs.
    Saves RiskScore record to DB.
    """
    logger.info(f"[RiskAgent] Calculating score for patient {state['patient_id']}")
    errors = list(state.get("errors", []))

    # ── Compute component raw scores (each 0–10) ──────────────────
    fever_raw      = _score_fever(state.get("fever_level"))
    fatigue_raw    = _score_fatigue(state.get("fatigue_score"))
    medication_raw = _score_medication(state.get("medication_taken"))
    wound_raw      = _score_wound(state.get("wound_score"))
    symptom_llm    = float(state.get("symptom_llm_score") or 0.0)

    # ── Apply weighted formula → 0–100 ───────────────────────────
    total_score = round(
        (
            fever_raw      * WEIGHT_FEVER      +
            fatigue_raw    * WEIGHT_FATIGUE    +
            medication_raw * WEIGHT_MEDICATION +
            wound_raw      * WEIGHT_WOUND      +
            symptom_llm    * WEIGHT_SYMPTOM
        ) * 10,
        2
    )
    total_score = max(0.0, min(100.0, total_score))  # clamp to 0–100

    tier = _determine_tier(total_score)

    # ── Build transparency breakdown (readable by clinicians) ─────
    breakdown = {
        "fever": {
            "input":    state.get("fever_level", "unknown"),
            "raw":      fever_raw,
            "weight":   WEIGHT_FEVER,
            "weighted": round(fever_raw * WEIGHT_FEVER * 10, 2),
        },
        "fatigue": {
            "input":    state.get("fatigue_score"),
            "raw":      fatigue_raw,
            "weight":   WEIGHT_FATIGUE,
            "weighted": round(fatigue_raw * WEIGHT_FATIGUE * 10, 2),
        },
        "medication": {
            "input":    state.get("medication_taken"),
            "raw":      medication_raw,
            "weight":   WEIGHT_MEDICATION,
            "weighted": round(medication_raw * WEIGHT_MEDICATION * 10, 2),
        },
        "wound": {
            "input":    state.get("wound_severity", "N/A"),
            "raw":      wound_raw,
            "weight":   WEIGHT_WOUND,
            "weighted": round(wound_raw * WEIGHT_WOUND * 10, 2),
        },
        "symptom_llm": {
            "input":    state.get("symptom_summary", ""),
            "raw":      symptom_llm,
            "weight":   WEIGHT_SYMPTOM,
            "weighted": round(symptom_llm * WEIGHT_SYMPTOM * 10, 2),
        },
        "total_score": total_score,
        "tier":        tier.value,
    }

    logger.info(
        f"[RiskAgent] Score={total_score} Tier={tier.value} | "
        f"fever={fever_raw} fatigue={fatigue_raw} "
        f"medication={medication_raw} wound={wound_raw} symptom={symptom_llm}"
    )

    # ── Save to risk_scores table ─────────────────────────────────
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
            tier                 = tier,
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
        "tier":                 tier.value,
        "breakdown":            breakdown,
        "risk_score_id":        risk_score_id,
        "errors":               errors,
    }