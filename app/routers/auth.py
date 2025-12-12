from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User
from datetime import datetime
import secrets
import hashlib
import os
import json
from dotenv import load_dotenv


load_dotenv()

router = APIRouter(prefix="/auth", tags=["authentication"])

# Load environment variables
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY")
ADMIN_USERNAMES_STR = os.getenv("ADMIN_USERNAMES", '["admin"]')

try:
    ADMIN_USERNAMES = json.loads(ADMIN_USERNAMES_STR)
except:
    ADMIN_USERNAMES = ["admin"]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_password(password: str) -> str:
    """Hash password using SHA256 (use bcrypt/argon2 in production)"""
    return hashlib.sha256(password.encode()).hexdigest()


def generate_token() -> str:
    """Generate a secure token"""
    return secrets.token_urlsafe(32)


class UserRegisterRequest(BaseModel):
    username: str
    password: str


class UserLoginRequest(BaseModel):
    username: str
    password: str


class AdminLoginRequest(BaseModel):
    username: str
    admin_key: str


class LoginResponse(BaseModel):
    success: bool
    user_id: int | None = None
    user_name: str | None = None
    admin_id: str | None = None
    admin_name: str | None = None
    user_role: str
    login_token: str
    message: str


@router.post("/register", response_model=LoginResponse)
async def register_user(request: UserRegisterRequest, db: Session = Depends(get_db)):
    if not request.username or not request.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required"
        )

    if len(request.password) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 4 characters"
        )

    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists"
        )

    password_hash = hash_password(request.password)
    new_user = User(
        username=request.username,
        password_hash=password_hash,
        display_name=request.username,
        role="user",
        created_at=datetime.utcnow()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = generate_token()

    return LoginResponse(
        success=True,
        user_id=new_user.id,
        user_name=new_user.username,
        user_role="user",
        login_token=token,
        message=f"User {request.username} registered successfully!"
    )


@router.post("/login", response_model=LoginResponse)
async def login_user(request: UserLoginRequest, db: Session = Depends(get_db)):
    if not request.username or not request.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required"
        )

    user = db.query(User).filter(User.username == request.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    if user.password_hash != hash_password(request.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    token = generate_token()

    return LoginResponse(
        success=True,
        user_id=user.id,
        user_name=user.username,
        user_role="user",
        login_token=token,
        message=f"Welcome back, {user.username}!"
    )


@router.post("/admin", response_model=LoginResponse)
async def login_admin(request: AdminLoginRequest, db: Session = Depends(get_db)):
    if not request.username or not request.admin_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and admin key are required"
        )

    if request.username not in ADMIN_USERNAMES:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin username"
        )

    if request.admin_key != ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin key"
        )

    admin_user = db.query(User).filter(User.username == request.username).first()
    if not admin_user:
        admin_user = User(
            username=request.username,
            display_name=request.username.replace("_", " ").title(),
            role="admin",
            created_at=datetime.utcnow()
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

    token = generate_token()
    admin_name = request.username.replace("_", " ").title()

    return LoginResponse(
        success=True,
        admin_id=str(admin_user.id),
        admin_name=admin_name,
        user_role="admin",
        login_token=token,
        message=f"Welcome back, Administrator {admin_name}!"
    )


@router.post("/logout")
async def logout():
    return {
        "success": True,
        "message": "Logged out successfully!"
    }


@router.get("/validate-token")
async def validate_token(token: str):
    if not token or len(token) < 10:
        return {"valid": False, "message": "Invalid token"}
    return {"valid": True, "message": "Token is valid"}
