from repositories.user_repo import get_user_by_email, create_user
from app.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash

def register_user(email, password,name,speciality,designation):
    if get_user_by_email(email):
        return {"error": "Email already registered"}

    hashed_password = generate_password_hash(password)

    user=create_user(email,name,speciality,designation,hashed_password)

    return {
        "message": "User created successfully",
        "user": user.id
    },201

def login_user(email,password):
    user=get_user_by_email(email)

    if not user:
        return {"error": "User does not exist"}
    if not check_password_hash(user.password, password):
        return {"error": "Wrong password bitch"}

    return {
        "message": "Login successful",
        "user": user.id

    },200