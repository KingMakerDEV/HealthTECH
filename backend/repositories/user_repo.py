from app.extensions import db
from models.users import Doctor_user, Patient_user


# -------------------------
# DOCTOR
# -------------------------
def get_doctor_by_email(email):
    return Doctor_user.query.filter_by(email=email).first()


def create_doctor(data):
    doctor = Doctor_user(
        email=data["email"],
        password=data["password"],
        name=data["name"],
        speciality=data["speciality"],
        designation=data["designation"]
    )

    db.session.add(doctor)
    db.session.commit()

    return doctor


# -------------------------
# PATIENT
# -------------------------
def get_patient_by_email(email):
    return Patient_user.query.filter_by(email=email).first()


def create_patient(data):
    patient = Patient_user(
        email=data["email"],
        password=data["password"],
        name=data["name"],
        age=data["age"]
    )

    db.session.add(patient)
    db.session.commit()

    return patient
