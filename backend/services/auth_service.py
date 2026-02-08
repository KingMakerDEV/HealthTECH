from repositories.user_repo import get_doctor_by_email , create_doctor , get_patient_by_email , create_patient
from app.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from utils import jwt_helper
from utils.jwt_helper import create_jwt_token ,verify_jwt_token


def register_user(role , data):
    email = data["email"]
    password = data["password"]
    hashed_password = generate_password_hash(password)
    data["password"] = hashed_password
    if role =="doctor":

        if get_doctor_by_email(email):
            return {"error": "Email already registered"},400


        doctor=create_doctor(data)
        token=create_jwt_token(doctor.id ,role ,remember=False)

        return {
            "message": "Doctor created successfully",
            "token": token,
            "role": role ,
            "user": doctor.id
        },201
    elif role =="patient":
        if get_patient_by_email(email):
            return {"error": "Email already registered"}
        # hashed_password = generate_password_hash(password=data["password"])
        patient=create_patient(data)
        token=create_jwt_token(patient.id ,role ,remember=False)

        return {
            "message": "Patient created successfully",
            "token": token,
            "role": role ,
            "user": patient.id
        },201

    return {"error":"Invalid user role"},400


def login_user(role , data , remember=False):
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
    token = create_jwt_token(user.id ,role ,remember=remember)
    return {
        "message": "Login Successful",
        "token": token,
        "role": role ,
        "user": user.id
    },200


