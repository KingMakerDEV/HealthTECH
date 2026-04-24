from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User, PatientProfile, DoctorProfile, UserRole, generate_unique_uid
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RegisterResponse, UserMeResponse
from app.core.security import hash_password, verify_password, create_access_token
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    # Check duplicate email
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists"
        )

    # Create base user
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
    )

    # Assign unique_uid for patients (shareable ID like CNT-48291)
    if payload.role == UserRole.PATIENT:
        uid = generate_unique_uid()
        # Ensure uniqueness
        while db.query(User).filter(User.unique_uid == uid).first():
            uid = generate_unique_uid()
        user.unique_uid = uid

    db.add(user)
    db.flush()  # Get user.id before committing

    # Create role-specific profile
    if payload.role == UserRole.PATIENT:
        profile = PatientProfile(user_id=user.id)
        db.add(profile)
    elif payload.role == UserRole.DOCTOR:
        profile = DoctorProfile(user_id=user.id)
        db.add(profile)
    elif payload.role == UserRole.VOLUNTEER:
        from app.models.models import VolunteerProfile
        db.add(VolunteerProfile(
            user_id=user.id,
            phone=payload.phone,
            area_description=payload.area_description,
        ))

    db.commit()
    db.refresh(user)

    return RegisterResponse(
        message="Account created successfully. Please log in.",
        user_id=user.id
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    token = create_access_token(data={"sub": user.id, "role": user.role.value})

    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        unique_uid=user.unique_uid,
    )


@router.get("/me", response_model=UserMeResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns the currently authenticated user's info."""
    return current_user