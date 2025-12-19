"""
FastAPI backend for TradingAgents web interface.
Provides WebSocket support for real-time updates.
"""
import asyncio
import json
import os
import datetime
from datetime import timedelta
import logging
import base64
import hashlib
import hmac
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from backend.auth import (
    UserCreate,
    UserInDB,
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
    fake_users_db,
    get_user,
    update_user,
    create_user,
    get_user_by_verification_token,
    delete_user,
    refresh_email_verification,
)
from backend.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    EMAIL_SENDING,
    EMAIL_VERIFICATION_ENABLED,
    EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS,
    VERIFICATION_TOKEN_SECRET,
)
from backend.email_service import send_verification_email

# Configure logging first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure internal modules (like `tradingagents` and `cli`) are importable.
# They live under `backend/` but are imported as top-level modules in this file.
# When running from the repo root, Python can import `backend.*` but not `tradingagents`
# unless `backend/` is on sys.path.
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

# Load environment variables
# Suppress dotenv parse warnings (e.g., comments with colons in .env file)
# These warnings are harmless - dotenv will still load valid variables
import warnings
with warnings.catch_warnings():
    warnings.filterwarnings("ignore", category=UserWarning, module="dotenv")
    warnings.filterwarnings("ignore", message=".*python-dotenv.*")
    try:
        load_dotenv(verbose=False)
    except Exception as e:
        logger.warning(f"Error loading .env file: {e}")

# Create FastAPI app
app = FastAPI(title="TradingAgents API", version="1.0.0")

# Port is logged on startup so engineers can quickly confirm which host:port is
# exposed. Defaults to 8000 for local development.
API_PORT = int(os.getenv("PORT", "8000"))

# Configure CORS (must be registered before any routers/endpoints)
# The frontend (Next.js) runs on :3000 during development, so we explicitly allow
# that origin and still keep a small whitelist for local variations. Credentials
# are enabled only when needed; current frontend uses bearer tokens (no cookies),
# so credentials remain disabled to simplify local CORS.
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_url,
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.middleware("http")
async def log_requests(request, call_next):
    """Log incoming requests to help debug frontend/backend connectivity."""
    logger.info("➡️ %s %s", request.method, request.url.path)
    response = await call_next(request)
    logger.info("⬅️ %s %s %s", request.method, request.url.path, response.status_code)
    return response


class Token(BaseModel):
    access_token: str
    token_type: str

try:
    import yfinance as yf
except ImportError as e:  # pragma: no cover - optional dependency
    yf = None
    logger.warning("yfinance not available; /quote endpoints will be disabled (%s)", e)

try:
    from tradingagents.graph.trading_graph import TradingAgentsGraph
    from tradingagents.default_config import DEFAULT_CONFIG
    logger.info("Successfully imported TradingAgents modules")
except ImportError as e:  # pragma: no cover - optional dependency
    TradingAgentsGraph = None
    DEFAULT_CONFIG = None
    logger.warning("TradingAgents modules not available; analysis endpoints will be disabled (%s)", e)

# Get the project root directory (parent of api directory)
PROJECT_ROOT = Path(__file__).parent.parent
WEB_DIR = PROJECT_ROOT / "web"

logger.info(f"Project root: {PROJECT_ROOT}")
logger.info(f"Web directory: {WEB_DIR} (exists: {WEB_DIR.exists()})")

# Active WebSocket connections
active_connections: List[WebSocket] = []

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


@app.on_event("startup")
async def log_startup() -> None:
    """Log port and catch misconfiguration early."""
    try:
        logger.info(f"🚀 TradingAgents API starting on http://0.0.0.0:{API_PORT}")
        logger.info(f"📧 Email Sending: {'ENABLED' if EMAIL_SENDING else 'DISABLED'}")
        if EMAIL_SENDING:
            from backend.config import RESEND_FROM_EMAIL
            logger.info(f"📧 Resend From Email: {RESEND_FROM_EMAIL}")
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.error(f"Failed to log startup details: {exc}")

# --- Auth Endpoints ---

@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    """
    Register a new user.

    Email verification is disabled in this project build, so accounts are created as verified
    and no emails are sent.
    """
    try:
        # Check if email already exists
        existing_user = await get_user(user.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user (if verification is enabled, user will be created unverified with a token + 6-digit code)
        new_user = await create_user(user)
        await update_user(new_user)

        # If verification is enabled, optionally email the link/code (if email sending is enabled).
        # For local development (EMAIL_SENDING=false) we still return dev fields so the UI can be tested.
        verification_required = EMAIL_VERIFICATION_ENABLED and not new_user.is_verified
        verification_link = None
        email_sent = False
        email_error = None
        if verification_required:
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
            verification_link = f"{frontend_url}/Auth/verify-code?email={new_user.email}"
            if EMAIL_SENDING:
                try:
                    email_sent = await send_verification_email(
                        recipient_email=new_user.email,
                        verification_link=verification_link,
                        verification_code=new_user.verification_code,
                    )
                    if email_sent:
                        logger.info(f"✅ Verification email sent successfully to {new_user.email}")
                    else:
                        logger.warning(f"❌ Failed to send verification email to {new_user.email} (email service returned False)")
                        email_error = "Email service configuration issue. Please check server logs."
                except Exception as exc:
                    logger.error(f"❌ Exception while sending verification email to {new_user.email}: {exc}", exc_info=True)
                    email_error = str(exc)
            else:
                logger.info(f"📧 Email sending disabled. Verification code for {new_user.email}: {new_user.verification_code}")

        response = {
            "message": "User registered successfully.",
            "email": new_user.email,
            "is_verified": new_user.is_verified,
            "verification_required": verification_required,
            "email_sent": email_sent,
            # Dev-only helpers: when we aren't sending emails, surface the code so you can test the OTP UI.
            # DO NOT rely on this in production.
            "dev_verification_code": new_user.verification_code if (verification_required and not EMAIL_SENDING) else None,
            "dev_verification_link": verification_link if (verification_required and not EMAIL_SENDING) else None,
        }
        
        if email_error:
            response["email_error"] = email_error
        
        return response
    except HTTPException:
        # Re-raise HTTP-specific errors unchanged
        raise
    except Exception as exc:
        logger.exception("Failed to register user")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while registering user."
        ) from exc

@app.get("/api/auth/verify-email")
async def verify_email(token: str):
    if not EMAIL_VERIFICATION_ENABLED:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Email verification is disabled on this server.")

    user = await get_user_by_verification_token(token)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification token.")
    if user.is_verified:
        return {"message": "Email already verified.", "email": user.email, "is_verified": True}
    if user.token_expired_at and datetime.datetime.utcnow() > user.token_expired_at:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Verification token expired. Please resend the code.")

    user.is_verified = True
    user.email_verification_token = None
    user.verification_code = None
    user.token_expired_at = None
    await update_user(user)
    return {"message": "Email verified successfully.", "email": user.email, "is_verified": True}

class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str

@app.post("/api/auth/verify-code")
async def verify_code(data: VerifyCodeRequest):
    if not EMAIL_VERIFICATION_ENABLED:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Email verification is disabled on this server.")

    user = await get_user(data.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if user.is_verified:
        return {"message": "Email already verified.", "email": user.email, "is_verified": True}

    if user.token_expired_at and datetime.datetime.utcnow() > user.token_expired_at:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Verification code expired. Please resend the code.")

    # Basic validation: must be exactly 6 digits
    code = (data.code or "").strip()
    if not code.isdigit() or len(code) != 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid code format.")

    if not user.verification_code or user.verification_code != code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect verification code.")

    user.is_verified = True
    user.email_verification_token = None
    user.verification_code = None
    user.token_expired_at = None
    await update_user(user)
    return {"message": "Email verified successfully.", "email": user.email, "is_verified": True}


class ResendVerificationCodeRequest(BaseModel):
    email: EmailStr


@app.post("/api/auth/resend-verification-code")
async def resend_verification_code(data: ResendVerificationCodeRequest):
    if not EMAIL_VERIFICATION_ENABLED:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Email verification is disabled on this server.")

    user = await get_user(data.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    if user.is_verified:
        return {"message": "Email already verified.", "email": user.email, "is_verified": True}

    now = datetime.datetime.utcnow()
    if user.last_verification_sent_at:
        seconds_since = (now - user.last_verification_sent_at).total_seconds()
        if seconds_since < EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS:
            retry_after = int(EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS - seconds_since)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {retry_after}s before requesting a new code.",
                headers={"Retry-After": str(retry_after)},
            )

    user = await refresh_email_verification(user)
    await update_user(user)

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    verification_link = f"{frontend_url}/Auth/verify-code?email={user.email}"
    email_sent = False
    email_error = None
    
    if EMAIL_SENDING:
        try:
            email_sent = await send_verification_email(
                recipient_email=user.email,
                verification_link=verification_link,
                verification_code=user.verification_code,
            )
            if email_sent:
                logger.info(f"✅ Verification email sent successfully to {user.email}")
            else:
                logger.warning(f"❌ Failed to send verification email to {user.email} (email service returned False)")
                email_error = "Email service configuration issue. Please check server logs."
        except Exception as exc:
            logger.error(f"❌ Exception while sending verification email to {user.email}: {exc}", exc_info=True)
            email_error = str(exc)
    else:
        logger.info(f"📧 Email sending disabled. Verification code for {user.email}: {user.verification_code}")

    response = {
        "message": "Verification code resent.",
        "email": user.email,
        "email_sent": email_sent,
        "dev_verification_code": user.verification_code if not EMAIL_SENDING else None,
        "dev_verification_link": verification_link if not EMAIL_SENDING else None,
    }
    
    if email_error:
        response["email_error"] = email_error
    
    return response


class VerifyEmailTokenRequest(BaseModel):
    email: EmailStr
    token: str


def _b64url_decode(data: str) -> bytes:
    # Add base64 padding if needed
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode((data + padding).encode("utf-8"))


def _verify_node_token(token: str) -> str:
    """
    Legacy (unused): verify token generated by a removed Node email verification service using HMAC-SHA256.

    Token format: base64url(payload_json) + "." + base64url(hmac_sha256(secret, payload_b64))
    Returns the email from the payload if valid, otherwise raises HTTPException.
    """
    if not token or "." not in token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token format")

    payload_b64, sig_b64 = token.split(".", 1)
    expected_sig = hmac.new(
        VERIFICATION_TOKEN_SECRET.encode("utf-8"),
        payload_b64.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).decode("utf-8").rstrip("=")

    if not hmac.compare_digest(expected_sig_b64, sig_b64):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token signature")

    try:
        payload_raw = _b64url_decode(payload_b64)
        payload = json.loads(payload_raw.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token payload")

    email = payload.get("email")
    exp = payload.get("exp")  # epoch seconds
    now = int(datetime.datetime.utcnow().timestamp())
    if not email or not isinstance(email, str):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token missing email")
    if not exp or not isinstance(exp, int):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token missing exp")
    if now > exp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token expired")

    return email


@app.post("/api/auth/verify-email-token")
async def verify_email_token(data: VerifyEmailTokenRequest):
    if not EMAIL_VERIFICATION_ENABLED:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Email verification is disabled on this server.")

    # This endpoint exists for a legacy Node token format. If you still use it, it verifies the token
    # and marks the user as verified. Otherwise, prefer /api/auth/verify-email (token in query) or /api/auth/verify-code.
    email_from_token = _verify_node_token(data.token)
    if email_from_token != data.email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token email does not match request email.")

    user = await get_user(data.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user.is_verified = True
    user.email_verification_token = None
    user.verification_code = None
    user.token_expired_at = None
    await update_user(user)
    return {"message": "Email verified successfully.", "email": user.email, "is_verified": True}

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@app.post("/api/auth/login", response_model=Token)
async def login_for_access_token(login_data: LoginRequest):
    """
    Login endpoint that accepts JSON body with email and password.
    Email verification is disabled, so all registered users can login.
    """
    user = await get_user(login_data.email)
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if EMAIL_VERIFICATION_ENABLED and not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email before logging in.",
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    email = decode_access_token(token)
    if email is None:
        raise credentials_exception
    user = await get_user(email)
    if user is None:
        raise credentials_exception
    return user

@app.get("/api/users/me", response_model=UserInDB)
async def read_users_me(current_user: UserInDB = Depends(get_current_user)):
    return current_user

@app.delete("/api/users/me")
async def delete_my_account(current_user: UserInDB = Depends(get_current_user)):
    """
    Delete the currently logged-in user's account and send a confirmation email.
    """
    email = current_user.email
    success = await delete_user(email)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account"
        )
    
    return {"message": "Account successfully deleted"}

class DeleteAccountRequest(BaseModel):
    email: EmailStr

@app.post("/api/auth/delete-account")
async def admin_delete_account(data: DeleteAccountRequest):
    """
    Delete an account by email and send a confirmation email.
    In a real app, this should be restricted to administrators.
    """
    user = await get_user(data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    success = await delete_user(data.email)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account"
        )
    
    return {"message": f"Account {data.email} successfully deleted"}


active_connections: List[WebSocket] = []





class AnalysisRequest(BaseModel):
    """Request model for starting an analysis."""
    ticker: str
    analysis_date: str
    analysts: List[str]  # List of analyst types: ["market", "social", "news", "fundamentals"]
    research_depth: int  # 1, 3, or 5
    llm_provider: str  # "openai", "anthropic", "google", etc.
    backend_url: str
    shallow_thinker: str
    deep_thinker: str
    report_length: Optional[str] = "summary"


def extract_content_string(content):
    """Extract string content from various message formats."""
    if isinstance(content, str):
        return content
    elif isinstance(content, list):
        text_parts = []
        for item in content:
            if isinstance(item, dict):
                if item.get('type') == 'text':
                    text_parts.append(item.get('text', ''))
                elif item.get('type') == 'tool_use':
                    text_parts.append(f"[Tool: {item.get('name', 'unknown')}]")
            else:
                text_parts.append(str(item))
        return ' '.join(text_parts)
    else:
        return str(content)


async def send_update(websocket: WebSocket, update_type: str, data: Dict[str, Any]):
    """Send an update to the WebSocket client."""
    try:
        await websocket.send_json({
            "type": update_type,
            "data": data,
            "timestamp": datetime.datetime.now().isoformat()
        })
    except Exception as e:
        print(f"Error sending update: {e}")


async def run_analysis_stream(websocket: WebSocket, request: AnalysisRequest):
    """Run the trading analysis and stream updates via WebSocket."""
    try:
        if TradingAgentsGraph is None or DEFAULT_CONFIG is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Trading engine not available on this server (missing TradingAgents dependencies).",
            )
        # Create config
        config = DEFAULT_CONFIG.copy()
        config["max_debate_rounds"] = request.research_depth
        config["max_risk_discuss_rounds"] = request.research_depth
        config["quick_think_llm"] = request.shallow_thinker
        config["deep_think_llm"] = request.deep_thinker
        config["backend_url"] = request.backend_url
        config["llm_provider"] = request.llm_provider.lower()

        # Validate analysts list before using
        if request.analysts is None:
            await send_update(websocket, "error", {"message": "Analysts list cannot be None"})
            return
        
        if not isinstance(request.analysts, list) or len(request.analysts) == 0:
            await send_update(websocket, "error", {"message": "Analysts must be a non-empty list"})
            return

        # Initialize the graph
        graph = TradingAgentsGraph(
            request.analysts,
            config=config,
            debug=True
        )

        # Create result directory
        results_base = Path(config.get("results_dir", "./results"))
        if not results_base.is_absolute():
            # Make it relative to project root
            results_base = PROJECT_ROOT / results_base
        results_dir = results_base / request.ticker / request.analysis_date
        results_dir.mkdir(parents=True, exist_ok=True)
        report_dir = results_dir / "reports"
        report_dir.mkdir(parents=True, exist_ok=True)

        # Initialize state
        init_agent_state = graph.propagator.create_initial_state(
            request.ticker, request.analysis_date
        )
        args = graph.propagator.get_graph_args()

        # Initialize agent statuses
        agent_status = {
            "Market Analyst": "pending",
            "Social Analyst": "pending",
            "News Analyst": "pending",
            "Fundamentals Analyst": "pending",
            "Bull Researcher": "pending",
            "Bear Researcher": "pending",
            "Research Manager": "pending",
            "Trader": "pending",
            "Risky Analyst": "pending",
            "Neutral Analyst": "pending",
            "Safe Analyst": "pending",
            "Portfolio Manager": "pending",
        }

        # Send initial status
        await send_update(websocket, "status", {
            "message": f"Starting analysis for {request.ticker} on {request.analysis_date}",
            "agents": agent_status
        })

        # Track report sections
        report_sections = {
            "market_report": None,
            "sentiment_report": None,
            "news_report": None,
            "fundamentals_report": None,
            "investment_plan": None,
            "trader_investment_plan": None,
            "final_trade_decision": None,
        }

        # Stream the analysis
        trace = []
        buffered_reports = []  # Buffer for reports

        async for chunk in graph.graph.astream(init_agent_state, **args):
            if len(chunk.get("messages", [])) > 0:
                # Get the last message from the chunk
                last_message = chunk["messages"][-1]

                # Extract message content
                if hasattr(last_message, "content"):
                    content = extract_content_string(last_message.content)
                    msg_type = "Reasoning"
                else:
                    content = str(last_message)
                    msg_type = "System"

                # Send message update
                await send_update(websocket, "message", {
                    "type": msg_type,
                    "content": content
                })

                # Handle tool calls
                if hasattr(last_message, "tool_calls"):
                    for tool_call in last_message.tool_calls:
                        if isinstance(tool_call, dict):
                            tool_name = tool_call.get("name", "unknown")
                            tool_args = tool_call.get("args", {})
                        else:
                            tool_name = tool_call.name
                            tool_args = tool_call.args

                        await send_update(websocket, "tool_call", {
                            "name": tool_name,
                            "args": tool_args
                        })

                # Update agent statuses and reports based on chunk content
                # Analyst Team Reports
                if "market_report" in chunk and chunk["market_report"]:
                    report_sections["market_report"] = chunk["market_report"]
                    agent_status["Market Analyst"] = "completed"
                    # Save report
                    with open(report_dir / "market_report.md", "w", encoding="utf-8") as f:
                        f.write(chunk["market_report"])
                    
                    # Buffer report instead of sending
                    buffered_reports.append({
                        "section": "market_report",
                        "label": "Market Analysis",
                        "content": chunk["market_report"]
                    })
                    
                    if request.analysts and "social" in request.analysts:
                        agent_status["Social Analyst"] = "in_progress"
                    await send_update(websocket, "status", {"agents": agent_status})

                if "sentiment_report" in chunk and chunk["sentiment_report"]:
                    report_sections["sentiment_report"] = chunk["sentiment_report"]
                    agent_status["Social Analyst"] = "completed"
                    # Save report
                    with open(report_dir / "sentiment_report.md", "w", encoding="utf-8") as f:
                        f.write(chunk["sentiment_report"])
                    
                    buffered_reports.append({
                        "section": "sentiment_report",
                        "label": "Social Sentiment",
                        "content": chunk["sentiment_report"]
                    })
                    
                    if request.analysts and "news" in request.analysts:
                        agent_status["News Analyst"] = "in_progress"
                    await send_update(websocket, "status", {"agents": agent_status})

                if "news_report" in chunk and chunk["news_report"]:
                    report_sections["news_report"] = chunk["news_report"]
                    agent_status["News Analyst"] = "completed"
                    # Save report
                    with open(report_dir / "news_report.md", "w", encoding="utf-8") as f:
                        f.write(chunk["news_report"])
                    
                    buffered_reports.append({
                        "section": "news_report",
                        "label": "News Analysis",
                        "content": chunk["news_report"]
                    })
                    
                    if request.analysts and "fundamentals" in request.analysts:
                        agent_status["Fundamentals Analyst"] = "in_progress"
                    await send_update(websocket, "status", {"agents": agent_status})

                if "fundamentals_report" in chunk and chunk["fundamentals_report"]:
                    report_sections["fundamentals_report"] = chunk["fundamentals_report"]
                    agent_status["Fundamentals Analyst"] = "completed"
                    # Save report
                    with open(report_dir / "fundamentals_report.md", "w", encoding="utf-8") as f:
                        f.write(chunk["fundamentals_report"])
                    
                    buffered_reports.append({
                        "section": "fundamentals_report",
                        "label": "Fundamentals Review",
                        "content": chunk["fundamentals_report"]
                    })
                    
                    # Start research team
                    agent_status["Bull Researcher"] = "in_progress"
                    agent_status["Bear Researcher"] = "in_progress"
                    agent_status["Research Manager"] = "in_progress"
                    await send_update(websocket, "status", {"agents": agent_status})

                # Research Team - Handle Investment Debate State
                if "investment_debate_state" in chunk and chunk["investment_debate_state"] is not None:
                    debate_state = chunk["investment_debate_state"]
                    
                    # Safety check: ensure debate_state is a dict
                    if not isinstance(debate_state, dict):
                        debate_state = {}

                    # Update Bull Researcher status and report
                    if debate_state and "bull_history" in debate_state and debate_state.get("bull_history"):
                        agent_status["Bull Researcher"] = "in_progress"
                        agent_status["Bear Researcher"] = "in_progress"
                        agent_status["Research Manager"] = "in_progress"
                        await send_update(websocket, "status", {"agents": agent_status})
                        
                        # Extract latest bull response
                        bull_responses = debate_state["bull_history"].split("\n")
                        latest_bull = bull_responses[-1] if bull_responses else ""
                        if latest_bull:
                            await send_update(websocket, "message", {
                                "type": "Reasoning",
                                "content": latest_bull
                            })
                            
                            # Update research report with bull's latest analysis
                            current_plan = report_sections.get("investment_plan") or ""
                            if "Bull Researcher Analysis" not in current_plan:
                                report_sections["investment_plan"] = f"### Bull Researcher Analysis\n{latest_bull}"
                            else:
                                # Update existing bull section
                                parts = current_plan.split("### Bear Researcher Analysis")
                                report_sections["investment_plan"] = f"{parts[0].split('### Bull Researcher Analysis')[0]}### Bull Researcher Analysis\n{latest_bull}" + (f"\n\n### Bear Researcher Analysis{parts[1]}" if len(parts) > 1 else "")
                            
                            # We don't buffer intermediate partial updates for investment plan, 
                            # we wait for the final decision or just update internally.
                            # BUT the frontend might expect updates to see "what's happening".
                            # However, "Report" sections usually are static text. 
                            # Let's buffer the LATEST version of investment plan only when it's final?
                            # The original code sent 'report' updates here.
                            # If we want "show only when finished", we should probably suppress these interim report updates
                            # and only send the final consolidated one.

                    # Update Bear Researcher status and report
                    if debate_state and "bear_history" in debate_state and debate_state.get("bear_history"):
                        agent_status["Bull Researcher"] = "in_progress"
                        agent_status["Bear Researcher"] = "in_progress"
                        agent_status["Research Manager"] = "in_progress"
                        await send_update(websocket, "status", {"agents": agent_status})
                        
                        # Extract latest bear response
                        bear_responses = debate_state["bear_history"].split("\n")
                        latest_bear = bear_responses[-1] if bear_responses else ""
                        if latest_bear:
                            await send_update(websocket, "message", {
                                "type": "Reasoning",
                                "content": latest_bear
                            })
                            
                            # Update research report with bear's latest analysis
                            current_plan = report_sections.get("investment_plan") or ""
                            if "Bear Researcher Analysis" not in current_plan:
                                report_sections["investment_plan"] = f"{current_plan}\n\n### Bear Researcher Analysis\n{latest_bear}"
                            else:
                                # Update existing bear section
                                parts = current_plan.split("### Bear Researcher Analysis")
                                report_sections["investment_plan"] = parts[0] + f"\n\n### Bear Researcher Analysis\n{latest_bear}"
                            
                            # Suppress interim report update

                    # Update Research Manager status and final decision
                    if debate_state and "judge_decision" in debate_state and debate_state.get("judge_decision"):
                        agent_status["Bull Researcher"] = "completed"
                        agent_status["Bear Researcher"] = "completed"
                        agent_status["Research Manager"] = "completed"
                        
                        # Append judge decision to investment plan
                        current_plan = report_sections.get("investment_plan") or ""
                        report_sections["investment_plan"] = f"{current_plan}\n\n### Research Manager Decision\n{debate_state['judge_decision']}"
                        
                        # Save report
                        with open(report_dir / "investment_plan.md", "w", encoding="utf-8") as f:
                            f.write(report_sections["investment_plan"])
                        
                        buffered_reports.append({
                            "section": "investment_plan",
                            "label": "Research Team Decision",
                            "content": report_sections["investment_plan"]
                        })
                        
                        await send_update(websocket, "message", {
                            "type": "Reasoning",
                            "content": f"Research Manager: {debate_state['judge_decision']}"
                        })
                        
                        agent_status["Trader"] = "in_progress"
                        await send_update(websocket, "status", {"agents": agent_status})

                # Trading Team
                if "trader_investment_plan" in chunk and chunk["trader_investment_plan"]:
                    report_sections["trader_investment_plan"] = chunk["trader_investment_plan"]
                    agent_status["Trader"] = "completed"
                    # Save report
                    with open(report_dir / "trader_investment_plan.md", "w", encoding="utf-8") as f:
                        f.write(chunk["trader_investment_plan"])
                    
                    buffered_reports.append({
                        "section": "trader_investment_plan",
                        "label": "Trader Investment Plan",
                        "content": chunk["trader_investment_plan"]
                    })
                    
                    agent_status["Risky Analyst"] = "in_progress"
                    await send_update(websocket, "status", {"agents": agent_status})

                # Risk Management Team
                if "risk_debate_state" in chunk and chunk["risk_debate_state"] is not None:
                    risk_state = chunk["risk_debate_state"]
                    
                    # Safety check: ensure risk_state is a dict
                    if not isinstance(risk_state, dict):
                        risk_state = {}

                    if risk_state and "current_risky_response" in risk_state and risk_state.get("current_risky_response"):
                        agent_status["Risky Analyst"] = "in_progress"
                        await send_update(websocket, "status", {"agents": agent_status})
                        await send_update(websocket, "message", {
                            "type": "Reasoning",
                            "content": f"Risky Analyst: {risk_state['current_risky_response']}"
                        })

                    if risk_state and "current_safe_response" in risk_state and risk_state.get("current_safe_response"):
                        agent_status["Safe Analyst"] = "in_progress"
                        await send_update(websocket, "status", {"agents": agent_status})
                        await send_update(websocket, "message", {
                            "type": "Reasoning",
                            "content": f"Safe Analyst: {risk_state['current_safe_response']}"
                        })

                    if risk_state and "current_neutral_response" in risk_state and risk_state.get("current_neutral_response"):
                        agent_status["Neutral Analyst"] = "in_progress"
                        await send_update(websocket, "status", {"agents": agent_status})
                        await send_update(websocket, "message", {
                            "type": "Reasoning",
                            "content": f"Neutral Analyst: {risk_state['current_neutral_response']}"
                        })

                    if risk_state and "judge_decision" in risk_state and risk_state.get("judge_decision"):
                        agent_status["Risky Analyst"] = "completed"
                        agent_status["Safe Analyst"] = "completed"
                        agent_status["Neutral Analyst"] = "completed"
                        agent_status["Portfolio Manager"] = "completed"
                        
                        # Build final decision report with all risk analysis
                        current_decision = report_sections.get("final_trade_decision") or ""
                        if "Portfolio Manager Decision" not in current_decision:
                            report_sections["final_trade_decision"] = f"{current_decision}\n\n### Portfolio Manager Decision\n{risk_state['judge_decision']}"
                        else:
                            # Update existing decision
                            parts = current_decision.split("### Portfolio Manager Decision")
                            report_sections["final_trade_decision"] = parts[0] + f"\n\n### Portfolio Manager Decision\n{risk_state['judge_decision']}"
                        
                        # Save report
                        with open(report_dir / "final_trade_decision.md", "w", encoding="utf-8") as f:
                            f.write(report_sections["final_trade_decision"])
                        
                        buffered_reports.append({
                            "section": "final_trade_decision",
                            "label": "Portfolio Management Decision",
                            "content": report_sections["final_trade_decision"]
                        })
                        
                        await send_update(websocket, "message", {
                            "type": "Reasoning",
                            "content": f"Portfolio Manager: {risk_state['judge_decision']}"
                        })
                        
                        await send_update(websocket, "status", {"agents": agent_status})

            trace.append(chunk)

        # Send all buffered reports now
        for report in buffered_reports:
            await send_update(websocket, "report", report)
            await asyncio.sleep(0.05)

        # Get final state from trace
        final_state_graph = trace[-1]

        # --- Summarization & Output Logic (Replicating propagate) ---
        try:
            # Import agents here to avoid potential top-level circular dependencies
            from tradingagents.agents import (
                create_summarizer_fundamental,
                create_summarizer_market,
                create_summarizer_social,
                create_summarizer_news,
                create_summarizer_conservative,
                create_summarizer_aggressive,
                create_summarizer_neutral,
                create_summarizer_research_manager,
                create_summarizer_risk_manager,
                create_summarizer_bull_researcher,
                create_summarizer_bear_researcher,
                create_summarizer_trader
            )

            # Create summarizers
            summarizers = {
                "Summarize_fundamentals_report": create_summarizer_fundamental(),
                "Summarize_market_report": create_summarizer_market(),
                "Summarize_social_report": create_summarizer_social(),
                "Summarize_news_report": create_summarizer_news(),
                "Summarize_conservative_report": create_summarizer_conservative(),
                "Summarize_aggressive_report": create_summarizer_aggressive(),
                "Summarize_neutral_report": create_summarizer_neutral(),
                "Summarize_investment_plan_report": create_summarizer_research_manager(),
                "Summarize_final_trade_decision_report": create_summarizer_risk_manager(),
                "bull_researcher_summarizer": create_summarizer_bull_researcher(),
                "bear_researcher_summarizer": create_summarizer_bear_researcher(),
                "trader_summarizer": create_summarizer_trader()
            }

            # Prepare directories
            output_dir = PROJECT_ROOT / "output"
            sum_dir = output_dir / "sum"
            full_dir = output_dir / "full"
            sum_dir.mkdir(parents=True, exist_ok=True)
            full_dir.mkdir(parents=True, exist_ok=True)

            # Run summarizers and update state
            logger.info("📝 Running Summarizers...")
            for key, summarizer_func in summarizers.items():
                try:
                    update_dict = summarizer_func(final_state_graph)
                    if update_dict:
                        final_state_graph.update(update_dict)
                except Exception as e:
                     logger.error(f"Error running summarizer {key}: {e}")

            # Define file mappings (Key in State -> (Sum Filename, Full Filename, Full Key in State))
            file_mappings = [
                ("Summarize_fundamentals_report", "sum_funda.txt", "full_funda.json", "fundamentals_report"),
                ("Summarize_market_report", "sum_market.txt", "full_market.json", "market_report"),
                ("Summarize_social_report", "sum_social.txt", "full_social.json", "sentiment_report"),
                ("Summarize_news_report", "sum_news.txt", "full_news.json", "news_report"),
                ("bull_researcher_summarizer", "sum_bull.txt", "full_bull.json", "investment_debate_state"),
                ("bear_researcher_summarizer", "sum_bear.txt", "full_bear.json", "investment_debate_state"),
                ("Summarize_conservative_report", "sum_conservative.txt", "full_conservative.json", "risk_debate_state"),
                ("Summarize_aggressive_report", "sum_aggressive.txt", "full_aggressive.json", "risk_debate_state"),
                ("Summarize_neutral_report", "sum_neutral.txt", "full_neutral.json", "risk_debate_state"),
                ("trader_summarizer", "sum_trader.txt", "full_trader.json", "trader_investment_plan"),
                ("Summarize_investment_plan_report", "sum_investment_plan.txt", "investment_plan.txt", "investment_plan"),
                ("Summarize_final_trade_decision_report", "sum_final_decision.txt", "final_decision.json", "final_trade_decision"),
            ]

            for sum_key, sum_file, full_file, full_key in file_mappings:
                # Write Summary
                sum_content = final_state_graph.get(sum_key)
                if sum_content:
                    with open(sum_dir / sum_file, 'w', encoding='utf-8') as f:
                        f.write(str(sum_content))
                
                # Write Full
                full_content = final_state_graph.get(full_key)
                if full_content:
                    with open(full_dir / full_file, 'w', encoding='utf-8') as f:
                        # If the content is a dict or list, dump as JSON. If string, write as is (or check ext)
                        if full_file.endswith(".json") and not isinstance(full_content, str):
                             json.dump(full_content, f, ensure_ascii=False, indent=4)
                        elif full_file.endswith(".json") and isinstance(full_content, str):
                            # Try to pretty print json string if possible
                            try:
                                json_obj = json.loads(full_content)
                                json.dump(json_obj, f, ensure_ascii=False, indent=4)
                            except:
                                f.write(full_content)
                        else:
                             f.write(str(full_content))

            logger.info("✅ Summaries generated and saved directly to backend/output")

        except Exception as e:
            logger.error(f"❌ Failed to run summarization logic: {e}")
            import traceback
            traceback.print_exc()

        
        decision = graph.process_signal(final_state_graph.get("final_trade_decision", ""))

        # Prepare final state to send to frontend (include summaries)
        frontend_final_state = {
            # Original Keys (Now using raw state for Full Reports where applicable)
            "market_report": final_state_graph.get("market_report"),
            "sentiment_report": final_state_graph.get("sentiment_report"),
            "news_report": final_state_graph.get("news_report"),
            "fundamentals_report": final_state_graph.get("fundamentals_report"),
            "investment_plan": final_state_graph.get("investment_debate_state"), # Send Dict for JSON printing
            "trader_investment_plan": final_state_graph.get("trader_investment_plan"),
            "final_trade_decision": final_state_graph.get("risk_debate_state"), # Send Dict for JSON printing

            # Summary Keys
            "Summarize_market_report": final_state_graph.get("Summarize_market_report"),
            "Summarize_social_report": final_state_graph.get("Summarize_social_report"),
            "Summarize_news_report": final_state_graph.get("Summarize_news_report"),
            "Summarize_fundamentals_report": final_state_graph.get("Summarize_fundamentals_report"),
            "Summarize_investment_plan_report": final_state_graph.get("Summarize_investment_plan_report"),
            "Summarize_final_trade_decision_report": final_state_graph.get("Summarize_final_trade_decision_report"),
            "Summarize_conservative_report": final_state_graph.get("Summarize_conservative_report"),
            "Summarize_aggressive_report": final_state_graph.get("Summarize_aggressive_report"),
            "Summarize_neutral_report": final_state_graph.get("Summarize_neutral_report"),
            "bull_researcher_summarizer": final_state_graph.get("bull_researcher_summarizer"),
            "bear_researcher_summarizer": final_state_graph.get("bear_researcher_summarizer"),
            "trader_summarizer": final_state_graph.get("trader_summarizer"),
        }

        # Send completion
        await send_update(websocket, "complete", {
            "decision": decision,
            "final_state": frontend_final_state
        })

    except asyncio.CancelledError:
        logger.info(f"🛑 Analysis for {request.ticker} was cancelled.")
        await send_update(websocket, "status", {"message": "Analysis cancelled."})
        raise

    except Exception as e:
        await send_update(websocket, "error", {
            "message": str(e)
        })
        raise



# Create FastAPI app

# Mount static files for web interface
if WEB_DIR.exists():
    app.mount("/web", StaticFiles(directory=str(WEB_DIR), html=True), name="web")


@app.get("/")
async def root():
    """Redirect to web interface."""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/web/")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time analysis updates."""
    await websocket.accept()
    active_connections.append(websocket)
    
    analysis_task: Optional[asyncio.Task] = None

    try:
        while True:
            # Wait for any message
            data = await websocket.receive_json()
            
            action = data.get("action")
            
            if action == "start_analysis":
                # Cancel existing task if running
                if analysis_task and not analysis_task.done():
                    analysis_task.cancel()
                    try:
                        await analysis_task
                    except asyncio.CancelledError:
                        pass
                
                request_data = data.get("request")
                if not request_data:
                    await send_update(websocket, "error", {"message": "Missing request data"})
                    continue
                
                # Create request model
                try:
                    request = AnalysisRequest(**request_data)
                except Exception as e:
                    await send_update(websocket, "error", {"message": f"Invalid request: {str(e)}"})
                    continue
                
                # Run analysis in background task
                analysis_task = asyncio.create_task(run_analysis_stream(websocket, request))
                
            elif action == "stop":
                if analysis_task and not analysis_task.done():
                    analysis_task.cancel()
                    try:
                        await analysis_task
                    except asyncio.CancelledError:
                        pass
                    analysis_task = None
                    await send_update(websocket, "status", {"message": "Analysis stopped. System ready."})
                    logger.info("🛑 Analysis stopped by user. System reset and ready.")
                
            elif action == "ping":
                await send_update(websocket, "pong", {})
                
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
        if analysis_task and not analysis_task.done():
            analysis_task.cancel()
        if websocket in active_connections:
            active_connections.remove(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if analysis_task and not analysis_task.done():
            analysis_task.cancel()
        if websocket in active_connections:
            active_connections.remove(websocket)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/api/test")
async def test_endpoint():
    """Test endpoint to verify API is working."""
    try:
        if TradingAgentsGraph is None or DEFAULT_CONFIG is None:
            return {
                "status": "ok",
                "message": "API is working correctly (trading modules unavailable)",
                "tradingagents_imported": False,
                "config_loaded": False,
            }
        return {
            "status": "ok",
            "message": "API is working correctly",
            "tradingagents_imported": True,
            "config_loaded": True
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "error_type": type(e).__name__
        }




class TelegramConnectRequest(BaseModel):
    chat_id: str

class TelegramDetectRequest(BaseModel):
     start_time: Optional[float] = None

@app.post("/api/telegram/connect")
async def connect_telegram(request: TelegramConnectRequest):
    """
    Connect Telegram account by setting the chat_id in environment.
    """
    try:
        # Update current process environment
        os.environ["TELEGRAM_CHAT_ID"] = request.chat_id
        
        # Update .env file for persistence
        # PROJECT_ROOT is defined as Path(__file__).parent.parent which is 'backend'
        env_path = PROJECT_ROOT / ".env"
        
        # Simple .env writer to avoid extra dependencies if possible, 
        # but using python-dotenv feature if available is better.
        # Check if dotenv.set_key is available or just append/replace string.
        
        # We will try to read the file and replace the line or append if not found.
        if env_path.exists():
            with open(env_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
            
            new_lines = []
            found = False
            for line in lines:
                if line.strip().startswith("TELEGRAM_CHAT_ID="):
                    new_lines.append(f"TELEGRAM_CHAT_ID={request.chat_id}\n")
                    found = True
                else:
                    new_lines.append(line)
            
            if not found:
                if new_lines and not new_lines[-1].endswith("\n"):
                    new_lines[-1] += "\n"
                new_lines.append(f"TELEGRAM_CHAT_ID={request.chat_id}\n")
                
            with open(env_path, "w", encoding="utf-8") as f:
                f.writelines(new_lines)
        else:
            # Create new .env
            with open(env_path, "w", encoding="utf-8") as f:
                f.write(f"TELEGRAM_CHAT_ID={request.chat_id}\n")
        
        return {"status": "success", "message": "Telegram connected successfully"}
    except Exception as e:
        logger.error(f"Failed to connect telegram: {e}")


@app.post("/api/telegram/detect")
async def detect_latest_chat_id(request: Optional[TelegramDetectRequest] = None):
    """
    Check the latest update from the Telegram bot.
    If a user has interacted recently, capture their Chat ID.
    """
    token = os.getenv("TELEGRAM_TOKEN")
    if not token:
        raise HTTPException(status_code=400, detail="Telegram token not configured")
    
    try:
        import requests
        # Get updates (allowed to be empty)
        url = f"https://api.telegram.org/bot{token}/getUpdates?limit=5&offset=-5" # Get last 5 updates to find the right one
        resp = requests.get(url, timeout=10)
        
        if resp.status_code != 200:
             raise HTTPException(status_code=502, detail="Failed to reach Telegram API")
             
        data = resp.json()
        if not data.get("ok"):
             raise HTTPException(status_code=502, detail=f"Telegram Error: {data.get('description')}")
             
        results = data.get("result", [])
        if not results:
             return {"found": False, "message": "No messages found. Please send a message to the bot first."}
        
        # Iterate backwards to find the most recent valid message
        valid_message = None
        
        # Determine strict time filter (default 120s if not provided by frontend)
        import time
        current_time = time.time()
        start_time_limit = request.start_time if request and request.start_time else (current_time - 120)
        
        for update in reversed(results):
            message = update.get("message") or update.get("my_chat_member") or update.get("channel_post")
            if not message: continue
            
            msg_date = message.get("date")
            if msg_date:
                # Check if message is newer than the start_time (when user clicked connect)
                if msg_date >= start_time_limit:
                    valid_message = message
                    break # Found the most recent valid one
        
        if not valid_message:
             return {"found": False, "message": "No new messages found since you clicked connect."}
             
        message = valid_message
        chat = message.get("chat") or message.get("from") # my_chat_member has 'chat'
        
        if not chat:
             return {"found": False, "message": "Could not identify chat details."}
             
        chat_id = str(chat["id"])
        first_name = chat.get("first_name", "User")
        username = chat.get("username", "")



        request = TelegramConnectRequest(chat_id=chat_id)
        os.environ["TELEGRAM_CHAT_ID"] = chat_id
        env_path = PROJECT_ROOT / ".env"
        
        if env_path.exists():
            with open(env_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
            new_lines = []
            found = False
            for line in lines:
                if line.strip().startswith("TELEGRAM_CHAT_ID="):
                    new_lines.append(f"TELEGRAM_CHAT_ID={chat_id}\n")
                    found = True
                else:
                    new_lines.append(line)
            if not found:
                if new_lines and not new_lines[-1].endswith("\n"):
                    new_lines[-1] += "\n"
                new_lines.append(f"TELEGRAM_CHAT_ID={chat_id}\n")
            with open(env_path, "w", encoding="utf-8") as f:
                f.writelines(new_lines)
        else:
            with open(env_path, "w", encoding="utf-8") as f:
                f.write(f"TELEGRAM_CHAT_ID={chat_id}\n")
        
        # Send Welcome Message
        try:
            requests.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                json={
                    "chat_id": chat_id, 
                    "text": "✅ *Connection Successful!*\n\nYou have successfully connected your Telegram account to the Trading Agent.\nYou will now receive real-time trading notifications here.",
                    "parse_mode": "Markdown"
                },
                timeout=5
            )
        except Exception as e:
            logger.error(f"Failed to send welcome message: {e}")

        return {
            "found": True, 
            "chat_id": chat_id, 
            "username": username or first_name,
            "message": "Successfully detected and connected!"
        }
        
    except Exception as e:
        logger.error(f"Detection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/telegram/status")
async def get_telegram_status():
    """
    Get current Telegram connection status and bot info.
    """
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    token = os.getenv("TELEGRAM_TOKEN")
    
    bot_name = None
    if token:
        try:
            # Simple synchronous call to avoid adding async http client for now, or use httpx if available.
            # Since requests is used elsewhere, we can use it, but preferably async.
            # using requests (synch) inside async fastAPI could block, but for low traffic ok.
            import requests
            url = f"https://api.telegram.org/bot{token}/getMe"
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("ok"):
                    bot_name = data["result"]["username"]
        except Exception as e:
            logger.error(f"Failed to fetch bot info: {e}")

    return {
        "connected": bool(chat_id),
        "chat_id": chat_id,
        "bot_name": bot_name 
    }



@app.get("/quote/{ticker}")
async def get_quote(ticker: str):
    """Fetch real-time quote data for a ticker."""
    try:
        if yf is None:
            raise HTTPException(status_code=503, detail="yfinance not installed on this server")
        t = yf.Ticker(ticker)
        
        # Get fast price data
        # Try intraday 5m data first for "Live" feel
        hist = t.history(period="1d", interval="5m")
        
        if hist.empty or len(hist) < 2:
            # Fallback to 5d hourly if 1d is empty or too short (e.g. pre-market or just opened)
            hist = t.history(period="5d", interval="60m")
        
        if hist.empty:
             raise HTTPException(status_code=404, detail="Ticker not found or no data available")

        current_price = hist["Close"].iloc[-1]
        
        # Get metadata (slower, but useful)
        try:
            info = t.info
        except:
            info = {}
        
        # Calculate change if possible
        previous_close = info.get("previousClose")
        if not previous_close and len(hist) > 1:
             previous_close = hist["Close"].iloc[-2]
        
        if not previous_close:
             previous_close = current_price # Fallback
             
        change = current_price - previous_close
        percent_change = (change / previous_close) * 100

        # Attempt to get logo
        logo_url = info.get("logo_url", "")
        if not logo_url and info.get("website"):
            try:
                from urllib.parse import urlparse
                domain = urlparse(info.get("website")).netloc
                if domain.startswith("www."):
                    domain = domain[4:]
                if domain:
                     logo_url = f"https://logo.clearbit.com/{domain}"
            except:
                pass
        
        # Prepare Sparkline Data (last 30 points or available duration)
        # Drop NaNs to prevent frontend rendering issues
        clean_hist = hist["Close"].dropna()
        sparkline = clean_hist.tolist()
        
        # Downsample if too many points to keep payload small, e.g. take last 50
        if len(sparkline) > 50:
            sparkline = sparkline[-50:]
        
        return {
            "symbol": ticker.upper(),
            "shortName": info.get("shortName", ticker.upper()),
            "price": round(current_price, 2),
            "change": round(change, 2),
            "percentChange": round(percent_change, 2),
            "volume": info.get("volume", hist["Volume"].iloc[-1]),
            "sector": info.get("sector", "Unknown"),
            "logo_url": logo_url,
            "website": info.get("website", ""),
            "sparkline": sparkline
        }
    except Exception as e:
        logger.error(f"Error fetching quote for {ticker}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=API_PORT)

