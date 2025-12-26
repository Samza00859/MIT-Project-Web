# Email Registration with SMTP - User Guide

## Overview

The registration system now sends 6-digit verification codes via **SMTP (Gmail)** automatically when users register.

## How It Works

1. **User Registers** → Frontend sends POST to `/api/auth/register`
2. **Backend Creates User** → Generates 6-digit code, saves to database
3. **Email Sent** → System sends verification email with code via SMTP
4. **User Enters Code** → Frontend sends POST to `/api/auth/verify-code`
5. **Account Verified** → User can now login

## Configuration

### Step 1: Get Gmail App Password

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (required)
3. Go to **App Passwords**
4. Generate new password:
   - App: **Mail**
   - Device: **Other** (name it "TradingAgents")
5. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)

### Step 2: Configure `.env` File

Create/edit `backend/.env`:

```env
# SMTP Configuration (Gmail)
EMAIL_SENDING=true
EMAIL_USERNAME=javvvy67@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/trading_db

# JWT
SECRET_KEY=your-secret-key-change-this-in-production

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email Verification Settings
EMAIL_VERIFICATION_ENABLED=true
EMAIL_VERIFICATION_EXPIRE_HOURS=24
EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS=60
```

**Replace:**
- `javvvy67@gmail.com` with your Gmail address
- `abcd efgh ijkl mnop` with your 16-char App Password
- Database and other settings as needed

### Step 3: Test SMTP

Test your SMTP configuration:

```bash
cd backend
python test_smtp_otp.py javvvy67@gmail.com
```

You should receive a test email with a 6-digit code.

### Step 4: Start the Application

```bash
# Terminal 1: Start backend
cd backend
uvicorn api.main:app --reload --port 8000

# Terminal 2: Start frontend
cd frontend
npm run dev
```

## Testing the Full Flow

1. Go to `http://localhost:3000/Auth/register`
2. Fill in registration form (email, password)
3. Click Register
4. Check your email inbox (or spam folder)
5. You'll receive an email with:
   - Subject: "Verify Your Email for TradingAgents"
   - 6-digit verification code (e.g., `123456`)
6. Copy the code
7. Enter it on the verification page
8. Click Verify
9. Redirected to login page
10. Login with your credentials

## Troubleshooting

### Email Not Received

1. **Check Spam/Promotions folder**
2. **Verify SMTP settings** in `.env`:
   - EMAIL_USERNAME matches Gmail address
   - EMAIL_PASSWORD is the 16-char App Password (not regular password)
   - EMAIL_SENDING=true
3. **Check backend logs** for error messages
4. **Test SMTP directly**: `python test_smtp_otp.py your@email.com`

### SMTP Authentication Error

```
SMTPAuthenticationError: (535, b'5.7.8 Username and Password not accepted')
```

**Solution:**
- Make sure you're using Gmail **App Password**, not regular password
- Enable 2-Step Verification first
- Generate new App Password if needed
- Remove any spaces from the App Password in `.env`

### Code Expired

```
Error: Verification code expired. Please resend the code.
```

**Solution:**
- Codes expire after 24 hours (configurable via EMAIL_VERIFICATION_EXPIRE_HOURS)
- Click "Re-Send Now" on the verification page
- Check email for new code

### Dev Mode (No Email Sending)

If `EMAIL_SENDING=false`, the system will:
- NOT send emails
- Return `dev_verification_code` in API response
- Display code in backend logs
- Use this for testing without email setup

## Email Template

Users receive a nicely formatted HTML email containing:

```
┌────────────────────────────────────┐
│   Welcome to TradingAgents!        │
├────────────────────────────────────┤
│                                    │
│  Your Verification Code:           │
│                                    │
│       ╔════════╗                   │
│       ║ 123456 ║                   │
│       ╚════════╝                   │
│                                    │
│  Or click the button below:        │
│  [Verify Email Address]            │
│                                    │
│  This code expires in 24 hours     │
└────────────────────────────────────┘
```

## API Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "User registered successfully.",
  "email": "user@example.com",
  "is_verified": false,
  "verification_required": true,
  "email_sent": true
}
```

### Verify Code
```http
POST /api/auth/verify-code
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "message": "Email verified successfully.",
  "email": "user@example.com",
  "is_verified": true
}
```

### Resend Code
```http
POST /api/auth/resend-verification-code
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Verification code resent.",
  "email": "user@example.com",
  "email_sent": true
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

## Technical Details

### Email Priority

1. **SMTP** (primary) - if configured in `.env`
2. **Resend API** (fallback) - if SMTP fails or not configured

### Security Features

- Passwords hashed with PBKDF2-SHA256
- JWT tokens for authentication
- 6-digit codes randomly generated
- Codes expire after configurable time
- Resend cooldown prevents spam
- Email addresses must be unique

### Database Schema

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    email_verification_token VARCHAR(255),
    verification_code VARCHAR(10),
    token_expired_at TIMESTAMP,
    last_verification_sent_at TIMESTAMP
);
```

## Support

If you encounter issues:

1. Check backend logs: `uvicorn api.main:app --reload --log-level debug`
2. Test SMTP: `python test_smtp_otp.py <email>`
3. Verify `.env` configuration
4. Check Gmail settings (2-Step Verification, App Password)

---

**Last Updated:** December 2024













