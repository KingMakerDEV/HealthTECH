from repositories.user_repo import get_doctor_by_email , create_doctor , get_patient_by_email , create_patient
from app.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash


def register_user(role , data):
    email = data["email"]
    password = data["password"]
    hashed_password = generate_password_hash(password)
    data["password"] = hashed_password
    if role =="doctor":

        if get_doctor_by_email(email):
            return {"error": "Email already registered"},400


        doctor=create_doctor(data)

        return {
            "message": "Doctor created successfully",
            "user": doctor.id
        },201
    elif role =="patient":
        if get_patient_by_email(email):
            return {"error": "Email already registered"}
        # hashed_password = generate_password_hash(password=data["password"])
        patient=create_patient(data)

        return {
            "message": "Patient created successfully",
            "user": patient.id
        },201

    return {"error":"Invalid user role"},400


def login_user(role , data):
    email = data["email"]
    password = data["password"]
    if role =="doctor":
        user=get_doctor_by_email(email)
    elif role =="patient":
        user=get_patient_by_email(email)

    else:
        return {"error":"Invalid user role"},400

    if not user or not check_password_hash(user.password, password):
        return {"error": "Invalid credentials"},400

    return {
        "message": "Login successful",
        "user": user.id,
        "role": role
    },200

