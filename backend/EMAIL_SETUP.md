# Email Setup Guide

This guide explains how to configure email sending for the TradingAgents authentication system.

## Overview

The email service uses Gmail SMTP to send verification emails to users. It requires a Gmail App Password (not your regular Gmail password) for authentication.

## Prerequisites

- A Gmail account
- 2-Step Verification enabled on your Google Account

## Step-by-Step Setup

### 1. Enable 2-Step Verification

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **2-Step Verification**
3. Follow the prompts to enable 2-Step Verification

### 2. Generate Gmail App Password

1. Go back to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **App passwords**
3. You may need to sign in again
4. Select:
   - **App**: Mail
   - **Device**: Other (Custom name)
   - Enter a name like "TradingAgents Email Service"
5. Click **Generate**
6. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)
   - **Important**: Remove spaces when copying to `.env` file

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and update the email settings:
   ```env
   EMAIL_USERNAME=your_email@gmail.com
   EMAIL_PASSWORD=abcdefghijklmnop  # Your 16-character app password (no spaces)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   FRONTEND_URL=http://localhost:3000  # Your frontend URL
   ```

### 4. Test Email Configuration

The email service will automatically validate the configuration when sending emails. If there are any issues, check the logs for error messages.

## Email Service Features

- ✅ **HTML Email Support**: Sends beautifully formatted HTML emails
- ✅ **Plain Text Fallback**: Includes plain text version for email clients that don't support HTML
- ✅ **Error Handling**: Comprehensive error handling with detailed logging
- ✅ **Gmail SMTP**: Uses Gmail's SMTP server with TLS encryption
- ✅ **App Password Authentication**: Secure authentication using Gmail App Passwords

## Troubleshooting

### "SMTP Authentication failed"

- Make sure you're using a Gmail App Password, not your regular Gmail password
- Verify that 2-Step Verification is enabled
- Check that the password has no spaces
- Ensure the email address matches the one used to generate the app password

### "Email credentials not configured"

- Check that `EMAIL_USERNAME` and `EMAIL_PASSWORD` are set in your `.env` file
- Make sure the `.env` file is in the correct location (backend directory)
- Restart the server after updating `.env`

### "Failed to send email"

- Check your internet connection
- Verify Gmail SMTP settings (smtp.gmail.com, port 587)
- Check firewall settings that might block SMTP connections
- Review server logs for detailed error messages

## Security Notes

- **Never commit `.env` file** to version control
- **Use App Passwords** instead of your main Gmail password
- **Rotate App Passwords** periodically for better security
- **Keep SECRET_KEY secure** - use a strong random string in production

## Email Templates

The email service currently supports:
- **Verification Email**: Sent when users register to verify their email address

Future email types can be easily added to `email_service.py`.

