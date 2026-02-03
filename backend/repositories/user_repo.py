from models.users import Doctor_user, Patient_user
from app.extensions import db

def get_doctor_by_email(email):
    return Doctor_user.query.filter_by(email=email).first()

def create_doctor(data):
    doctor = Doctor_user(**data)

    db.session.add(doctor)
    db.session.commit()
    # return user


def get_patient_by_email(email):
    return Patient_user.query.filter_by(email=email).first()

def create_patient(data):
    patient = Patient_user(**data)
    db.session.add(patient)
    db.session.commit()