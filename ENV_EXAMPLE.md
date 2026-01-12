# ===========================================
# TradingAgents Deployment Environment Example
# ===========================================
# Copy this file to the respective directories:
# - Frontend: frontend/.env.local
# - Backend: backend/.env

# ===========================================
# FRONTEND Configuration (frontend/.env.local)
# ===========================================

# API URL for backend connection
# For local development: http://localhost:8000
# For production: https://your-backend-domain.com
NEXT_PUBLIC_API_URL=http://localhost:8000

# WebSocket URL for real-time updates (optional)
# If not set, will be derived from NEXT_PUBLIC_API_URL
# For production with different ws endpoint: wss://your-websocket-domain.com/ws
# NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws

# ===========================================
# BACKEND Configuration (backend/.env)
# ===========================================

# Database Connection
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/trading_db

# LLM API Keys (required for analysis)
# Choose one or more providers:
# OPENAI_API_KEY=your-openai-api-key
# GOOGLE_API_KEY=your-google-api-key
# DEEPSEEK_API_KEY=your-deepseek-api-key
# ANTHROPIC_API_KEY=your-anthropic-api-key

# Telegram Notification
# TELEGRAM_TOKEN=your-telegram-bot-token
# TELEGRAM_CHAT_ID=your-telegram-chat-id

# ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
# TWELVEDATA_API_KEY=twelve-data-key
# FINNHUB_API_KEYfinhub-key
# REDDIT_ID=client id
# REDDIT_SECRET=client secret
# REDDIT_USER_AGENT="news-fetcher:v1 (by u/yourname)"
# TV_USERNAME=user-name-tradingview
# TV_PASSWORD=password-tradingview
# BSKY_HANDLE=handle-name
# BSKY_APP_PW=app-password(setting -> privacy -> app password)
# MASTODON_BASE_URL="https://mastodon.social"
# MASTODON_TOKEN=mastodon-token

# ===========================================
# DOCKER Configuration (docker-compose.yml)
# ===========================================

# PostgreSQL Database
# POSTGRES_USER=user
# POSTGRES_PASSWORD=password  # CHANGE IN PRODUCTION!
# POSTGRES_DB=trading_db

# PgAdmin (optional, for database management UI)
# PGADMIN_DEFAULT_EMAIL=admin@email.com
# PGADMIN_DEFAULT_PASSWORD=admin123  # CHANGE IN PRODUCTION!
