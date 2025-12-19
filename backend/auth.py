from datetime import datetime, timedelta
from typing import Optional
import uuid
import random
import string

from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt

from .config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, EMAIL_VERIFICATION_EXPIRE_HOURS, EMAIL_VERIFICATION_ENABLED

# Use a pure-Python scheme to avoid native bcrypt build issues on some platforms.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# --- User Models ---
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    hashed_password: str
    is_verified: bool = False
    created_at: datetime = datetime.utcnow()
    email_verification_token: Optional[str] = None
    verification_code: Optional[str] = None
    token_expired_at: Optional[datetime] = None
    last_verification_sent_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Token Models ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[EmailStr] = None

# --- Password Hashing ---
def get_password_hash(password: str) -> str:
    """
    Hash password using bcrypt.
    
    Note: bcrypt has a 72-byte limit for passwords.
    If password is longer, it will be truncated to 72 bytes.
    """
    # Convert to bytes and truncate if necessary (bcrypt limit is 72 bytes)
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    return pwd_context.hash(password_bytes.decode('utf-8', errors='ignore'))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password against hash.
    
    Note: bcrypt has a 72-byte limit for passwords.
    If password is longer, it will be truncated to 72 bytes for verification.
    """
    # Convert to bytes and truncate if necessary (bcrypt limit is 72 bytes)
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    truncated_password = password_bytes.decode('utf-8', errors='ignore')
    return pwd_context.verify(truncated_password, hashed_password)

# --- JWT Functions ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        return email
    except JWTError:
        return None


# --- In-memory "Database" (for demonstration purposes) ---
# In a real application, you would use a proper database (e.g., PostgreSQL, MongoDB).
# This dictionary simulates a user table.
fake_users_db: dict[str, UserInDB] = {}

async def get_user(email: str) -> Optional[UserInDB]:
    """Get user by email."""
    return fake_users_db.get(email)

async def get_user_by_verification_token(token: str) -> Optional[UserInDB]:
    """Get user by email verification token."""
    for user in fake_users_db.values():
        if user.email_verification_token == token:
            return user
    return None

def generate_email_verification_token() -> str:
    """Generate a secure random token for email verification."""
    # Use UUID4 for a secure random token
    return str(uuid.uuid4())

def generate_verification_code(length: int = 6) -> str:
    """Generate a numeric verification code."""
    return ''.join(random.choices(string.digits, k=length))

async def create_user(user: UserCreate, verification_token: Optional[str] = None, verification_code: Optional[str] = None, token_expires_at: Optional[datetime] = None) -> UserInDB:
    """
    Create a new user in the database.
    
    Args:
        user: User creation data
        verification_token: Optional email verification token (if None, will be generated)
        verification_code: Optional numeric code (if None, will be generated)
        token_expires_at: Optional token expiration datetime
        
    Returns:
        Created UserInDB instance
    """
    hashed_password = get_password_hash(user.password)
    
    # If email verification is enabled, default to generating a token + 6-digit code
    # and mark the user as unverified until they complete the flow.
    if EMAIL_VERIFICATION_ENABLED:
        if verification_token is None:
            verification_token = generate_email_verification_token()
        if verification_code is None:
            verification_code = generate_verification_code()
        if token_expires_at is None:
            token_expires_at = datetime.utcnow() + timedelta(hours=EMAIL_VERIFICATION_EXPIRE_HOURS)
        is_verified = False
        sent_at = datetime.utcnow()
    else:
        # Verification disabled -> create as verified and keep verification fields empty.
        verification_token = None
        verification_code = None
        token_expires_at = None
        is_verified = True
        sent_at = None
    
    db_user = UserInDB(
        email=user.email,
        hashed_password=hashed_password,
        is_verified=is_verified,
        email_verification_token=verification_token,
        verification_code=verification_code,
        token_expired_at=token_expires_at,
        last_verification_sent_at=sent_at,
    )
    fake_users_db[user.email] = db_user
    return db_user


async def refresh_email_verification(user: UserInDB) -> UserInDB:
    """
    Regenerate the email verification token + 6-digit code and extend expiry.

    This is used for "resend code" flows.
    """
    user.email_verification_token = generate_email_verification_token()
    user.verification_code = generate_verification_code()
    user.token_expired_at = datetime.utcnow() + timedelta(hours=EMAIL_VERIFICATION_EXPIRE_HOURS)
    user.last_verification_sent_at = datetime.utcnow()
    fake_users_db[user.email] = user
    return user

async def get_user_by_verification_code(code: str) -> Optional[UserInDB]:
    """Get user by numeric verification code."""
    for user in fake_users_db.values():
        if user.verification_code == code:
            return user
    return None

async def update_user(user: UserInDB) -> UserInDB:
    """Update user in database."""
    fake_users_db[user.email] = user
    return user

async def delete_user(email: str) -> bool:
    """Delete user from database."""
    if email in fake_users_db:
        del fake_users_db[email]
        return True
    return False

