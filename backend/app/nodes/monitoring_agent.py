"""
Node 5 — Adaptive Monitoring Agent
Adjusts how often the system checks in on the patient.
Updates monitoring_schedules table.

Tier → Interval mapping:
  GREEN     → 24 hours (stable, back off)
  YELLOW    → 12 hours (watch more closely)
  ORANGE    → 6  hours (monitor closely)
  RED       → 3  hours (urgent monitoring)
  EMERGENCY → 1  hour  (continuous watch)
"""
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.agents.state import AgentState
from app.database import SessionLocal
from app.models.models import MonitoringSchedule

logger = logging.getLogger(__name__)

TIER_INTERVALS = {
    "GREEN":     24,
    "YELLOW":    12,
    "ORANGE":    6,
    "RED":       3,
    "EMERGENCY": 1,
}

TIER_REASONS = {
    "GREEN":     "Patient is stable. Standard 24-hour monitoring.",
    "YELLOW":    "Mild concern detected. Increased to 12-hour check-ins.",
    "ORANGE":    "Moderate risk detected. Monitoring every 6 hours.",
    "RED":       "High risk detected. Monitoring every 3 hours.",
    "EMERGENCY": "Emergency level detected. Monitoring every hour.",
}


async def monitoring_agent_node(state: AgentState) -> AgentState:
    """
    Updates monitoring_schedules for the patient.
    Creates a new schedule row if one doesn't exist yet.
    """
    logger.info(f"[MonitoringAgent] Adjusting schedule for patient {state['patient_id']}")
    errors = list(state.get("errors", []))

    tier               = state.get("tier", "GREEN")
    new_interval_hours = TIER_INTERVALS.get(tier, 24)
    interval_reason    = TIER_REASONS.get(tier, "Standard monitoring.")

    now          = datetime.now(timezone.utc)
    next_checkin = now + timedelta(hours=new_interval_hours)

    db: Session = SessionLocal()
    try:
        schedule = db.query(MonitoringSchedule).filter(
            MonitoringSchedule.patient_id == state["patient_id"]
        ).first()

        if schedule:
            old_interval = schedule.check_in_interval_hours
            schedule.check_in_interval_hours = new_interval_hours
            schedule.last_check_in_at        = now
            schedule.next_check_in_at        = next_checkin
            schedule.interval_reason         = interval_reason
            schedule.updated_at              = now
            logger.info(
                f"[MonitoringAgent] Updated schedule: {old_interval}h → {new_interval_hours}h"
            )
        else:
            # First check-in ever — create the schedule row
            schedule = MonitoringSchedule(
                patient_id              = state["patient_id"],
                check_in_interval_hours = new_interval_hours,
                last_check_in_at        = now,
                next_check_in_at        = next_checkin,
                interval_reason         = interval_reason,
            )
            db.add(schedule)
            logger.info(f"[MonitoringAgent] Created new schedule: {new_interval_hours}h interval")

        db.commit()
        logger.info(f"[MonitoringAgent] Next check-in at {next_checkin.isoformat()}")

    except Exception as e:
        db.rollback()
        logger.error(f"[MonitoringAgent] DB write failed: {e}")
        errors.append(f"MonitoringAgent DB write failed: {e}")
    finally:
        db.close()

    return {
        **state,
        "new_interval_hours": new_interval_hours,
        "interval_reason":    interval_reason,
        "errors":             errors,
    }