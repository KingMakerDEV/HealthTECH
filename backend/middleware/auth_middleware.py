from flask import jsonify,request
from functools import wraps
from utils.jwt_helper import verify_jwt_token

def token_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization')

        if not auth_header:
            return jsonify({'message': 'Token is invalid'}), 401
        try:
            token = auth_header.split(" ")[1]
        except IndexError:
            return jsonify({'message': 'Token is invalid'}), 401

        payload = verify_jwt_token(token)

        if not payload:
            return jsonify({'message': 'Token is invalid or expired'}), 401

        request.user_id = payload['user_id']
        request.role = payload['role']

        return f(*args, **kwargs)

    return wrapper
