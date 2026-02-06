from flask import Blueprint, request, jsonify

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    return jsonify({
        "message": "User registered successfully"
    }), 200


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    return jsonify({
        "message": "Login successful"
    }), 200
