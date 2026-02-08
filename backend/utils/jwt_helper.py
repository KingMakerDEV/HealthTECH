import jwt
from datetime import datetime, timedelta
from app.config import Config


def create_jwt_token(user_id, role, remember=False):

    if remember:
        expire_time = datetime.utcnow() + timedelta(days=7)
    else:
        expire_time = datetime.utcnow() + timedelta(hours=1)

    payload = {
        "user_id": user_id,
        "role": role,
        "exp": expire_time,
        "iat": datetime.utcnow()
    }

    token = jwt.encode(payload, Config.SECRET_KEY, algorithm="HS256")

    return token


def verify_jwt_token(token):
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
