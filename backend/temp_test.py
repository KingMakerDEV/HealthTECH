"""
Test script — Simulates a full check‑in conversation.
Automatically picks the first patient with an ACTIVE MedicalCourse.
"""
import asyncio
import sys
import logging
from sqlalchemy.orm import Session

sys.path.insert(0, ".")

from app.database import SessionLocal
from app.models.models import PatientProfile, MedicalCourse
from app.nodes.caretaker_agent import start_conversation, process_answer
from app.agents.graph import run_agent_pipeline

# Configure logging so we see all agent output
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

ANSWERS = {
    "general_feeling": "Not great",
    "medication_adherence": "Didn't take any",
    "medication_reason": "Forgot to take it",
    "symptoms_today": "Feeling warm and tired",
    "temperature": "High fever — above 101°F",
    "chest_pain": "Some tightness or pressure",
    "pain_radiation": "only at chest",
    "breathing": "Breathing normally",
    "wound_status": "Some redness or mild soreness",
    "heartbeat": "No, heartbeat feels normal",
    "weight_gain": "No noticeable change",
    "wound_photo": "yes",
}

async def run_test():
    db: Session = SessionLocal()
    try:
        # Find a patient with an ACTIVE course
        course = db.query(MedicalCourse).filter(
            MedicalCourse.status == "ACTIVE"
        ).first()

        if not course:
            print("❌ No active MedicalCourse found in database.")
            print("   Please create a course for a patient via the doctor dashboard first.")
            return

        patient_profile = db.query(PatientProfile).filter(
            PatientProfile.id == course.patient_id
        ).first()

        if not patient_profile:
            print("❌ Patient not found for course.")
            return

        patient_id = str(patient_profile.id)
        course_id  = str(course.id)

        print(f"✅ Using patient {patient_id} with active course {course.course_name}\n")

        # Start conversation
        result = await start_conversation(patient_id, course_id, db)
        greeting = result["greeting"]
        first_q  = result["first_question"]
        state    = result["state"]

        print(f"GREETING: {greeting}")
        print(f"FIRST Q:  {first_q['question']}")

        question_id = first_q["id"]
        while True:
            answer_text = ANSWERS.get(question_id, "no")
            print(f"ANSWER:   {answer_text}")

            res = await process_answer(state, question_id, answer_text)
            state = res["state"]
            if res["should_submit"]:
                break
            next_q = res["next_question"]
            question_id = next_q["id"]
            print(f"NEXT Q:   {next_q['question']}")

        print("\n--- Conversation complete. Running agent pipeline ---\n")

        answers = state["answers"]
        raw_input = "\n".join([f"{a['question_id']}: {a['answer']}" for a in answers])

        final_state = await run_agent_pipeline(
            patient_id=patient_id,
            check_in_id="test-checkin-123",
            raw_input=raw_input,
            input_type="AGENT",
            course_id=course_id,
            has_wound_image=False,
            wound_image_path=None,
        )

        print("\n=== FINAL RESULT ===")
        print(f"Tier:        {final_state.get('tier')}")
        print(f"Total Score: {final_state.get('total_score')}")
        print(f"Confidence:  {final_state.get('ml_confidence')}")
        print(f"Explanation: {final_state.get('ml_explanation')}")
        print("Suggestions:")
        for s in final_state.get('ml_suggestions', []):
            print(f"  - {s}")
        if final_state.get("errors"):
            print("Errors:", final_state["errors"])

    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(run_test())