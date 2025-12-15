from fastapi import APIRouter, HTTPException, status, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User
from datetime import datetime, timedelta
from typing import Optional
import os
import json
from dotenv import load_dotenv

# --- Workaround / monkeypatch for passlib <-> bcrypt version mismatch ---
# If your environment installs bcrypt>=4.x, passlib may try to read bcrypt.__about__.__version__
# which doesn't exist in some bcrypt releases. This small shim avoids that crash.
try:
    import bcrypt as _bcrypt
    if not hasattr(_bcrypt, "__about__"):
        class _About:
            pass
        _about = _About()
        # bcrypt might expose __version__; if not, fallback to a sensible default string
        _about.__version__ = getattr(_bcrypt, "__version__", "3.2.2")
        _bcrypt.__about__ = _about
except Exception:
    # If bcrypt import fails here, passlib will still error later; we'll still surface a clear error.
    pass

# Now import passlib after the monkeypatch
from passlib.context import CryptContext

# You may choose a JWT library explicitly; this code assumes 'pyjwt' or 'python-jose' interface.
# If you're using python-jose DO: from jose import jwt, JWTError, ExpiredSignatureError
import jwt

load_dotenv()

router = APIRouter(prefix="/auth", tags=["authentication"])

# Security Configuration
# Keep bcrypt as scheme; we'll pre-hash with sha256 to avoid 72-byte limit.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

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


# -------------------------------
# Password helpers (fixed)
# -------------------------------
import hashlib

def _prehash_password_bytes(password: str) -> bytes:
    """
    Convert the incoming password string into a fixed-length binary digest (SHA-256).
    This removes bcrypt's 72-byte limit and is safe when combined with bcrypt.
    """
    if isinstance(password, str):
        password = password.encode("utf-8")
    # returns raw 32-byte digest
    return hashlib.sha256(password).digest()


def hash_password(password: str) -> str:
    """
    Hash password using: bcrypt( SHA256(password) )
    Returns the passlib-managed bcrypt hash (string).
    """
    digest = _prehash_password_bytes(password)
    # passlib will accept bytes for hashing
    return pwd_context.hash(digest)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify the provided plain password against the stored hash.
    Strategy:
      1. Try new scheme: bcrypt( sha256(plain_password) )
      2. Fallback: bcrypt(plain_password)  <-- handles existing users that used old scheme
    """
    digest = _prehash_password_bytes(plain_password)

    # 1) Try new pre-hash verify first
    try:
        if pwd_context.verify(digest, hashed_password):
            return True
    except Exception:
        # ignore and try fallback
        pass

    # 2) Fallback: older users who may have had their plain password string passed to bcrypt
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


# -------------------------------
# JWT helpers (unchanged, but keep an eye on library)
# -------------------------------
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except Exception:
        # Broad catch here; adjust if you use a specific JWT lib with specific exception classes
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current user from JWT token"""
    token = credentials.credentials
    payload = decode_access_token(token)

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user


async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Verify current user is admin"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# Schemas
class UserRegisterRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None


class UserLoginRequest(BaseModel):
    username: str
    password: str


class AdminLoginRequest(BaseModel):
    username: str
    admin_key: str


class LoginResponse(BaseModel):
    success: bool
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    admin_id: Optional[str] = None
    admin_name: Optional[str] = None
    user_role: str
    access_token: str
    token_type: str = "bearer"
    message: str


# Endpoints
@router.post("/register", response_model=LoginResponse)
async def register_user(request: UserRegisterRequest, db: Session = Depends(get_db)):
    """Register new user with bcrypt password hashing"""

    # Validation
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

    # Check existing user
    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists"
        )

    # Create user with bcrypt hashed password (we pre-hash inside hash_password)
    password_hash = hash_password(request.password)
    new_user = User(
        username=request.username,
        password_hash=password_hash,
        email=request.email,
        display_name=request.username,
        role="user",
        created_at=datetime.utcnow()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create access token
    access_token = create_access_token(
        data={"sub": str(new_user.id), "role": "user"}
    )

    return LoginResponse(
        success=True,
        user_id=new_user.id,
        user_name=new_user.username,
        user_role="user",
        access_token=access_token,
        token_type="bearer",
        message=f"User {request.username} registered successfully!"
    )


@router.post("/login", response_model=LoginResponse)
async def login_user(request: UserLoginRequest, db: Session = Depends(get_db)):
    """Login user with bcrypt password verification"""

    if not request.username or not request.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required"
        )

    # Find user
    user = db.query(User).filter(User.username == request.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    # Verify password with prioritized new scheme
    # We will detect if fallback was used so we can re-hash the stored password
    used_fallback = False
    digest = _prehash_password_bytes(request.password)

    try:
        if pwd_context.verify(digest, user.password_hash):
            verified = True
        else:
            # fallback
            if pwd_context.verify(request.password, user.password_hash):
                verified = True
                used_fallback = True
            else:
                verified = False
    except Exception:
        # try fallback robustly
        try:
            verified = pwd_context.verify(request.password, user.password_hash)
            if verified:
                used_fallback = True
        except Exception:
            verified = False

    if not verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    # If the user was verified using the old scheme (fallback), upgrade their stored hash
    if used_fallback:
        try:
            user.password_hash = hash_password(request.password)
            db.add(user)
            db.commit()
        except Exception:
            # do not fail login if re-hash/update fails; but log in real app
            pass

    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role}
    )

    return LoginResponse(
        success=True,
        user_id=user.id,
        user_name=user.username,
        user_role=user.role,
        access_token=access_token,
        token_type="bearer",
        message=f"Welcome back, {user.username}!"
    )


@router.post("/admin", response_model=LoginResponse)
async def login_admin(request: AdminLoginRequest, db: Session = Depends(get_db)):
    """Admin login with API key verification"""

    if not request.username or not request.admin_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and admin key are required"
        )

    # Verify admin username
    if request.username not in ADMIN_USERNAMES:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin username"
        )

    # Verify admin key
    if request.admin_key != ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin key"
        )

    # Get or create admin user
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

    # Ensure user has admin role
    if admin_user.role != "admin":
        admin_user.role = "admin"
        db.commit()

    # Create access token
    access_token = create_access_token(
        data={"sub": str(admin_user.id), "role": "admin"}
    )

    admin_name = request.username.replace("_", " ").title()

    return LoginResponse(
        success=True,
        admin_id=str(admin_user.id),
        admin_name=admin_name,
        user_role="admin",
        access_token=access_token,
        token_type="bearer",
        message=f"Welcome back, Administrator {admin_name}!"
    )


@router.post("/logout")
async def logout():
    """Logout (client should delete token)"""
    return {
        "success": True,
        "message": "Logged out successfully! Please delete your token."
    }


@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "display_name": current_user.display_name,
        "role": current_user.role,
        "balance": current_user.balance,
        "created_at": current_user.created_at
    }


@router.post("/validate-token")
async def validate_token(current_user: User = Depends(get_current_user)):
    """Validate JWT token"""
    return {
        "valid": True,
        "user_id": current_user.id,
        "username": current_user.username,
        "role": current_user.role
    }


@router.post("/refresh")
async def refresh_token(current_user: User = Depends(get_current_user)):
    """Refresh access token"""
    new_token = create_access_token(
        data={"sub": str(current_user.id), "role": current_user.role}
    )

    return {
        "access_token": new_token,
        "token_type": "bearer"
    }
