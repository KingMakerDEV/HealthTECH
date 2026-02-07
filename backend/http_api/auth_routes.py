from flask import Blueprint, request, jsonify
from repositories.user_repo import (
    create_doctor,
    create_patient,
    get_doctor_by_email,
    get_patient_by_email
)

auth_bp = Blueprint("auth", __name__)


# ================= REGISTER =================

@auth_bp.route("/register", methods=["POST", "OPTIONS"])
def register():

    # ✅ handle preflight
    if request.method == "OPTIONS":
        return jsonify({"status": "OK"}), 200

    data = request.get_json()

    role = data.get("role")

    if role == "doctor":

        if get_doctor_by_email(data.get("email")):
            return jsonify({"error": "Doctor already exists"}), 400

        doctor_data = {
            "name": data.get("name"),
            "email": data.get("email"),
            "password": data.get("password"),
            "speciality": data.get("speciality", "General"),
            "designation": data.get("designation", "Doctor"),
        }

        create_doctor(doctor_data)

        return jsonify({"message": "Doctor registered successfully"}), 201


    elif role == "patient":

        if get_patient_by_email(data.get("email")):
            return jsonify({"error": "Patient already exists"}), 400

        patient_data = {
            "name": data.get("name"),
            "email": data.get("email"),
            "password": data.get("password"),
            "age": int(data.get("age") or 0),
        }

        create_patient(patient_data)

        return jsonify({"message": "Patient registered successfully"}), 201


    return jsonify({"error": "Invalid role"}), 400


# ================= LOGIN =================

@auth_bp.route("/login", methods=["POST", "OPTIONS"])
def login():

    # ✅ handle preflight
    if request.method == "OPTIONS":
        return jsonify({"status": "OK"}), 200

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    if role == "doctor":

        doctor = get_doctor_by_email(email)

        if not doctor:
            return jsonify({"error": "Doctor not found"}), 404

        if doctor.password != password:
            return jsonify({"error": "Invalid password"}), 401

        return jsonify({
            "message": "Doctor login successful",
            "user": {
                "id": doctor.id,
                "name": doctor.name,
                "email": doctor.email
            }
        }), 200


    elif role == "patient":

        patient = get_patient_by_email(email)

        if not patient:
            return jsonify({"error": "Patient not found"}), 404

        if patient.password != password:
            return jsonify({"error": "Invalid password"}), 401

        return jsonify({
            "message": "Patient login successful",
            "user": {
                "id": patient.id,
                "name": patient.name,
                "email": patient.email
            }
        }), 200


    return jsonify({"error": "Invalid role"}), 400
