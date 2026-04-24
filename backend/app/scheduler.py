"""
Background Monitoring Scheduler
Runs every 5 minutes and checks if any patient is overdue for a check-in.
If overdue → creates a pending agent session + sends nudge email/SMS.

Integrated into FastAPI lifecycle via startup/shutdown events.
"""
import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.models import (
    MonitoringSchedule, PatientProfile, AgentSession,
    User, MedicalCourse, Alert, AlertType, AlertStatus,
)
from app.services.alert_service import send_email_alert, send_sms_alert

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="UTC")


async def check_overdue_patients():
    """
    Runs every 5 minutes.
    Finds patients whose next_check_in_at is in the past.
    Creates a pending agent session so when they open the app
    the question window pops automatically.
    Also sends email/SMS nudge.
    """
    logger.info("[Scheduler] Running overdue patient check...")
    now = datetime.now(timezone.utc)

    db: Session = SessionLocal()
    try:
        overdue_schedules = db.query(MonitoringSchedule).filter(
            MonitoringSchedule.next_check_in_at != None,
            MonitoringSchedule.next_check_in_at <= now,
        ).all()

        if not overdue_schedules:
            logger.info("[Scheduler] No overdue patients found")
            return

        logger.info(f"[Scheduler] Found {len(overdue_schedules)} overdue patient(s)")

        for schedule in overdue_schedules:
            patient_id = schedule.patient_id

            # Check if there's already an active pending session
            existing = db.query(AgentSession).filter(
                AgentSession.patient_id == patient_id,
                AgentSession.status     == "active",
            ).first()
            if existing:
                logger.info(f"[Scheduler] Patient {patient_id} already has active session — skip")
                continue

            # Get patient info
            patient_profile = db.query(PatientProfile).filter(
                PatientProfile.id == patient_id
            ).first()
            if not patient_profile:
                continue

            patient_user = db.query(User).filter(
                User.id == patient_profile.user_id
            ).first()
            if not patient_user:
                continue

            # Check for active course
            active_course = db.query(MedicalCourse).filter(
                MedicalCourse.patient_id == patient_id,
                MedicalCourse.status     == "ACTIVE",
            ).first()
            if not active_course:
                logger.info(f"[Scheduler] Patient {patient_id} has no active course — skip")
                continue

            # ── Create pending agent session ──────────────────────
            session = AgentSession(
                patient_id       = patient_id,
                status           = "active",
                trigger          = "agent_triggered",
                pending_question = "Time for your daily check-in! How are you feeling today?",
                pending_options  = [
                    "Feeling good",
                    "Some discomfort",
                    "Not doing well",
                    "I need help",
                ],
                conversation = [{
                    "role":    "agent",
                    "content": "Time for your daily check-in! How are you feeling today?",
                    "options": ["Feeling good", "Some discomfort", "Not doing well", "I need help"],
                    "time":    now.isoformat(),
                }],
            )
            db.add(session)

            # ── Create NUDGE alert ────────────────────────────────
            alert = Alert(
                patient_id       = patient_id,
                alert_type       = AlertType.NUDGE,
                status           = AlertStatus.PENDING,
                message          = f"Automated check-in reminder sent to {patient_user.full_name}",
                risk_score_value = None,
            )
            db.add(alert)
            db.commit()

            logger.info(f"[Scheduler] Created check-in session for {patient_user.full_name}")

            # ── Send email nudge ──────────────────────────────────
            try:
                await send_email_alert(
                    to_email = patient_user.email,
                    to_name  = patient_user.full_name,
                    subject  = "CARENETRA — Time for your daily check-in",
                    body     = (
                        f"Hi {patient_user.full_name},\n\n"
                        f"Your health monitoring system is ready for your daily check-in. "
                        f"Please log in to CARENETRA to update your health status.\n\n"
                        f"It only takes 2 minutes and helps your doctor monitor your recovery."
                    ),
                )
                logger.info(f"[Scheduler] Nudge email sent to {patient_user.email}")
            except Exception as e:
                logger.error(f"[Scheduler] Email nudge failed for {patient_user.email}: {e}")

            # ── Send SMS nudge if emergency contact has phone ─────
            if patient_profile.emergency_contact_phone:
                try:
                    await send_sms_alert(
                        to_phone = patient_profile.emergency_contact_phone,
                        body     = (
                            f"[CARENETRA] Hi, this is a reminder that "
                            f"{patient_user.full_name} has a health check-in due. "
                            f"Please remind them to log in to CARENETRA."
                        ),
                    )
                except Exception as e:
                    logger.error(f"[Scheduler] SMS nudge failed: {e}")

            # ── Push next check-in time out by interval ───────────
            from datetime import timedelta
            schedule.next_check_in_at = now + timedelta(
                hours=schedule.check_in_interval_hours
            )
            schedule.updated_at = now
            db.commit()

    except Exception as e:
        db.rollback()
        logger.error(f"[Scheduler] Unexpected error: {e}")
    finally:
        db.close()


def start_scheduler():
    scheduler.add_job(
        check_overdue_patients,
        trigger  = IntervalTrigger(minutes=5),
        id       = "overdue_check",
        name     = "Check overdue patient check-ins",
        replace_existing = True,
    )
    scheduler.start()
    logger.info("[Scheduler] Background scheduler started — checking every 5 minutes")


def stop_scheduler():
    scheduler.shutdown(wait=False)
    logger.info("[Scheduler] Background scheduler stopped")