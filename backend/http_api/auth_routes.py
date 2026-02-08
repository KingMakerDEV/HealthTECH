from flask import Blueprint, jsonify, request
from services.auth_service import register_user, login_user
from middleware.auth_middleware import token_required

auth_bp = Blueprint('auth', __name__)


# --------------------------------
# LOGIN
# --------------------------------
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json

    role = data.get("role")
    if not role:
        return  jsonify({"error": "role required"}), 400

    response, status = login_user(role, data)

    return jsonify(response), status


# --------------------------------
# REGISTER
# --------------------------------
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json

    role = data.get("role")
    if not role:
        return jsonify({"error": "role required"}), 400

    response, status = register_user(role, data)

    return jsonify(response), status

@auth_bp.route("/profile", methods=["GET"])
@token_required
def profile():

    return jsonify({
        "message": "Access granted",
        "user_id": request.user_id,
        "role": request.role
    })
