from models.users import Doctor_user
from app.extensions import db

def get_user_by_email(email):
    return Doctor_user.query.filter_by(email=email).first()

def create_user(name,email,password,speciality,designation):
    user = Doctor_user(name=name,email=email,password=password,speciality=speciality,designation=designation)

    db.session.add(user)
    db.session.commit()
    return user
