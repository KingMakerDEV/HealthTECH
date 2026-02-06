from flask import Blueprint, jsonify, request
from services.auth_service import register_user, login_user

auth_bp = Blueprint('auth', __name__)


# --------------------------------
# LOGIN
# --------------------------------
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json

    role = data.get("role")

    response, status = login_user(role, data)

    return jsonify(response), status


# --------------------------------
# REGISTER
# --------------------------------
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json

    role = data.get("role")

    response, status = register_user(role, data)

    return jsonify(response), status
