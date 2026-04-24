"""
CARENETRA — ML Risk Model
Loads the trained GradientBoostingClassifier at startup and exposes
a single predict_risk() function used by risk_agent.py.

The model outputs:
  tier        — GREEN | YELLOW | ORANGE | RED | EMERGENCY
  risk_score  — 0–100 float
  confidence  — 0–1 float (model's certainty about predicted tier)
  suggestions — list of 2–4 clinical suggestion strings
  explanation — one-sentence plain-English explanation for the patient's doctor
  feature_contributions — which inputs drove the prediction most
"""
import os
import pickle
import json
import logging
from pathlib import Path
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

# ── Paths ─────────────────────────────────────────────────────────────────────
_BASE        = Path(__file__).resolve().parent.parent.parent  # backend root
MODEL_PATH   = _BASE / "models" / "risk_classifier.pkl"
INFO_PATH    = _BASE / "models" / "risk_model_info.json"

TIER_NAMES   = ["GREEN", "YELLOW", "ORANGE", "RED", "EMERGENCY"]
FEATURE_NAMES = ["fever_score", "fatigue_score", "medication_score", "wound_score", "symptom_score"]

# ── Singleton model (loaded once at import) ────────────────────────────────────
_model      = None
_model_info = None


def _load_model():
    global _model, _model_info
    if _model is not None:
        return

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Risk model not found at {MODEL_PATH}. "
            "Run: python train_model.py from the backend root directory."
        )

    with open(MODEL_PATH, "rb") as f:
        _model = pickle.load(f)

    if INFO_PATH.exists():
        with open(INFO_PATH) as f:
            _model_info = json.load(f)

    acc = _model_info.get("test_accuracy", "?") if _model_info else "?"
    logger.info(f"[RiskModel] Loaded GradientBoostingClassifier — accuracy={acc}")


# ── Clinical suggestion library ───────────────────────────────────────────────
# Keyed by tier, then by the top contributing feature.
# Used to generate human-readable, actionable suggestions for the doctor.

_SUGGESTIONS = {
    "GREEN": {
        "default": [
            "Patient is stable. No immediate action required.",
            "Continue current medication schedule as prescribed.",
            "Next scheduled check-in is on track.",
        ]
    },
    "YELLOW": {
        "fever_score": [
            "Mild fever detected. Monitor temperature every 4 hours.",
            "Ensure adequate hydration and rest.",
            "If temperature rises above 101°F, escalate immediately.",
        ],
        "fatigue_score": [
            "Elevated fatigue reported. Assess whether this is post-exertion or systemic.",
            "Advise patient to avoid strenuous activity today.",
            "Monitor fatigue trend over next 24 hours.",
        ],
        "medication_score": [
            "Medication adherence concern flagged. Remind patient of dosage schedule.",
            "Consider whether a missed dose requires compensatory action.",
            "Follow up at next check-in to confirm adherence.",
        ],
        "wound_score": [
            "Mild wound concern. Request photo update within 12 hours.",
            "Monitor for early signs of infection: redness, warmth, or swelling.",
        ],
        "default": [
            "Mild risk indicators present. Increase check-in frequency to 12 hours.",
            "No immediate intervention required, but continue monitoring.",
        ],
    },
    "ORANGE": {
        "fever_score": [
            "High fever detected — potential infection risk. Consider prescribing antipyretics.",
            "Rule out post-surgical infection or rejection (for transplant patients).",
            "Blood work recommended if fever persists beyond 24 hours.",
        ],
        "medication_score": [
            "Significant medication non-adherence. Contact patient directly.",
            "Assess whether symptoms are exacerbated by missed medications.",
            "Review prescription schedule and simplify if needed.",
        ],
        "wound_score": [
            "Wound analysis indicates moderate concern. Review uploaded photos.",
            "Consider scheduling an in-person wound inspection within 48 hours.",
            "Prescribe wound care instructions if not already provided.",
        ],
        "default": [
            "Moderate risk level. Review patient's latest check-in data.",
            "Consider adjusting treatment protocol based on recent trends.",
            "Check-in interval reduced to every 6 hours automatically.",
        ],
    },
    "RED": {
        "fever_score": [
            "CRITICAL: High fever with multiple co-occurring risk factors.",
            "Immediate evaluation recommended — potential systemic infection.",
            "Consider hospital admission if fever exceeds 103°F / 39.4°C.",
        ],
        "wound_score": [
            "CRITICAL: Severe wound findings detected via AI image analysis.",
            "Urgent wound inspection required — possible wound dehiscence or infection.",
            "Patient may require emergency wound care or surgical review.",
        ],
        "medication_score": [
            "CRITICAL: Complete medication non-adherence combined with high risk indicators.",
            "Patient's condition may be directly impacted by missed medications.",
            "Immediate phone or video consultation recommended.",
        ],
        "default": [
            "HIGH RISK: Multiple clinical indicators are elevated simultaneously.",
            "Patient and emergency contact have been notified via SMS.",
            "Recommend immediate physician review or telemedicine consultation.",
            "Check-in monitoring escalated to every 3 hours.",
        ],
    },
    "EMERGENCY": {
        "default": [
            "EMERGENCY: All major risk indicators at critical levels.",
            "Ambulance dispatch is pending your confirmation — review immediately.",
            "Patient has been instructed to not be alone and to call emergency services if needed.",
            "All clinical indicators suggest immediate medical intervention is necessary.",
        ],
    },
}


def _get_suggestions(tier: str, top_feature: str) -> list[str]:
    """Returns the most relevant suggestion list for the given tier and top driver."""
    tier_bank = _SUGGESTIONS.get(tier, _SUGGESTIONS["GREEN"])
    # Try feature-specific first, fall back to default
    return tier_bank.get(top_feature, tier_bank.get("default", []))


def _build_explanation(tier: str, top_feature: str, score: float, contributions: dict) -> str:
    """
    Builds a one-sentence plain-English explanation of WHY this tier was assigned.
    Suitable for display in the doctor dashboard next to the risk score.
    """
    feature_labels = {
        "fever_score":      "elevated temperature",
        "fatigue_score":    "reported fatigue level",
        "medication_score": "medication adherence",
        "wound_score":      "wound analysis findings",
        "symptom_score":    "reported symptoms",
    }

    top_label   = feature_labels.get(top_feature, top_feature.replace("_", " "))
    second_feat = sorted(contributions.items(), key=lambda x: -x[1])[1][0] if len(contributions) > 1 else None
    second_label = feature_labels.get(second_feat, "") if second_feat else ""

    if tier == "GREEN":
        return f"All clinical indicators within normal range. Risk score: {score:.1f}/100."

    if second_label:
        return (
            f"Risk tier {tier} assigned primarily due to {top_label} "
            f"and {second_label}. Score: {score:.1f}/100."
        )
    return f"Risk tier {tier} assigned primarily due to {top_label}. Score: {score:.1f}/100."


# ── Public API ────────────────────────────────────────────────────────────────

def predict_risk(
    fever_score:      float,
    fatigue_score:    float,
    medication_score: float,
    wound_score:      float,
    symptom_score:    float,
) -> dict:
    """
    Main prediction function called by risk_agent.py.

    Args (all 0.0–10.0):
        fever_score       — 0=normal, 10=critical
        fatigue_score     — 0=full energy, 10=exhausted
        medication_score  — 0=all taken, 10=all missed
        wound_score       — 0=clean, 10=severe infection
        symptom_score     — 0=no symptoms, 10=critical symptoms

    Returns:
        {
          tier:                 str   GREEN|YELLOW|ORANGE|RED|EMERGENCY
          risk_score:           float 0–100
          confidence:           float 0–1
          suggestions:          list[str]
          explanation:          str
          feature_contributions: dict {feature: contribution_0_to_1}
        }
    """
    _load_model()

    import pandas as pd
    features = pd.DataFrame([{
        "fever_score":      fever_score,
        "fatigue_score":    fatigue_score,
        "medication_score": medication_score,
        "wound_score":      wound_score,
        "symptom_score":    symptom_score,
    }])

    # Predict tier
    tier_idx    = int(_model.predict(features)[0])
    proba       = _model.predict_proba(features)[0]
    confidence  = float(proba[tier_idx])
    tier        = TIER_NAMES[tier_idx]

    # Risk score — weighted sum (same as risk_agent.py for consistency)
    risk_score = round(
        (fever_score * 0.25 + fatigue_score * 0.15 +
         medication_score * 0.20 + wound_score * 0.30 +
         symptom_score * 0.10) * 10,
        2
    )
    risk_score = max(0.0, min(100.0, risk_score))

    # Feature contributions — from model's feature importances × feature values
    importances = _model.feature_importances_
    raw_contribs = {
        name: round(float(imp * val / 10.0), 4)
        for name, imp, val in zip(FEATURE_NAMES, importances,
                                  [fever_score, fatigue_score, medication_score,
                                   wound_score, symptom_score])
    }
    # Normalise to sum to 1
    total = sum(raw_contribs.values()) or 1.0
    feature_contributions = {k: round(v / total, 4) for k, v in raw_contribs.items()}

    # Top driver (highest contribution)
    top_feature = max(feature_contributions, key=feature_contributions.get)

    suggestions = _get_suggestions(tier, top_feature)
    explanation = _build_explanation(tier, top_feature, risk_score, feature_contributions)

    return {
        "tier":                   tier,
        "risk_score":             risk_score,
        "confidence":             round(confidence, 4),
        "suggestions":            suggestions,
        "explanation":            explanation,
        "feature_contributions":  feature_contributions,
        "top_driver":             top_feature.replace("_score", ""),
    }


def get_model_info() -> dict:
    """Returns metadata about the loaded model (accuracy, training date, etc.)"""
    _load_model()
    return _model_info or {}