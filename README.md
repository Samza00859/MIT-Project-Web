# 🤖 TradingAgents - Multi-Agent LLM Financial Trading Platform

<p align="center">
  <img src="frontend/public/Logo.png" alt="TradingAgents Logo" width="120" height="120">
</p>

<p align="center">
  <strong>AI-Powered Stock Analysis with Multi-Agent System Architecture</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker" alt="Docker">
  <img src="https://img.shields.io/badge/LLM-Google%20Gemini-4285F4?style=flat-square&logo=google" alt="LLM">
</p>

---

## 📖 Overview

TradingAgents is a sophisticated financial analysis platform that leverages **Multi-Agent Large Language Model (LLM)** architecture to provide comprehensive stock analysis and trading recommendations. The system simulates a professional trading team with specialized AI agents working collaboratively.

### 🎯 Key Features

- **🔍 Multi-Agent Analysis System**
  - Market Analyst - Technical analysis and market trends
  - News Analyst - Financial news sentiment analysis
  - Social Media Analyst - Reddit, Twitter sentiment tracking
  - Fundamentals Analyst - Company financials and valuation

- **📊 Research & Debate Framework**
  - Bull Researcher - Identifies bullish opportunities
  - Bear Researcher - Identifies risks and concerns
  - Research Manager - Synthesizes research into investment thesis

- **⚖️ Risk Management Team**
  - Conservative Analyst - Capital preservation focus
  - Aggressive Analyst - Growth opportunity focus
  - Neutral Analyst - Balanced risk assessment

- **💼 Portfolio Management**
  - Final trade decision synthesis
  - Position sizing recommendations
  - Entry/exit strategy generation

- **🔔 Real-time Updates**
  - WebSocket-based live analysis progress
  - Telegram notification integration
  - Execution history tracking

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Generate   │  │   History   │  │   Contact   │              │
│  │    Page     │  │    Page     │  │    Page     │              │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘              │
│         │                │                                       │
│         └───────┬────────┘                                       │
│                 ▼                                                │
│         ┌─────────────┐                                          │
│         │  WebSocket  │────────────────────────────────────────┐ │
│         │   Client    │                                        │ │
│         └─────────────┘                                        │ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Backend (FastAPI)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WebSocket  │  │  REST API   │  │  Database   │              │
│  │   Handler   │  │  Endpoints  │  │    Layer    │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └───────┬────────┴────────────────┘                      │
│                 ▼                                                │
│      ┌─────────────────────────────────────┐                     │
│      │      TradingAgentsGraph (LangGraph) │                     │
│      │  ┌─────────┐  ┌─────────┐  ┌─────┐ │                     │
│      │  │ Analysts│  │Research │  │Risk │ │                     │
│      │  │  Team   │  │  Team   │  │Team │ │                     │
│      │  └─────────┘  └─────────┘  └─────┘ │                     │
│      └─────────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                         │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │ExecutionHistory │    │  ReportResult   │                     │
│  └─────────────────┘    └─────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | React framework with App Router |
| TypeScript | 5.x | Type safety |
| TailwindCSS | 3.x | Styling (via classes) |
| jsPDF | 3.x | PDF export functionality |
| lucide-react | Latest | Icon library |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| FastAPI | 0.100+ | REST API & WebSocket |
| SQLAlchemy | 2.x | Database ORM (async) |
| LangGraph | Latest | Multi-agent orchestration |
| yfinance | Latest | Market data fetching |
| Python | 3.12+ | Runtime |

### Infrastructure
| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 16 | Primary database |
| Docker | Latest | Containerization |
| PgAdmin | 4 | Database management UI |

### LLM Providers (Configurable)
- **Google Gemini** (Default: gemini-2.5-flash)
- DeepSeek (deepseek-reasoner)

---

## 📋 Prerequisites

- **Node.js** 20.x or higher
- **Python** 3.12 or higher
- **PostgreSQL** 16 or higher (or Docker)
- **Docker & Docker Compose** (optional, for containerized deployment)
- **LLM API Key** (Google, OpenAI, DeepSeek, or Anthropic)

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/Samza00859/MIT-Project-Web
cd MIT-Project-Web

# Create backend environment file
cp backend/env.example backend/.env
# Edit backend/.env with your API keys

# Start all services
docker-compose up -d --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# PgAdmin: http://localhost:5050
```

### Option 2: Local Development

#### Backend Setup

1. **Navigate to Backend Directory**
   Move into the backend folder where the application logic resides.
   ```bash
   cd backend
   ```

2. **Create Virtual Environment**
   Create an isolated Python environment (`.venv`) to manage dependencies without affecting your system.
   ```bash
   py -3.12 -m venv .venv
   ```

3. **Activate Environment**
   Switch to the virtual environment context. You should see `(.venv)` in your terminal.
   ```bash
   # Windows:
   .venv\Scripts\activate
   
   # Linux/macOS:
   source .venv/bin/activate
   ```

4. **Install Dependencies**
   Download and install all necessary libraries (FastAPI, SQLAlchemy, etc.) listed in the requirements file.
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure Environment Variables**
   Set up your secure keys and database connection strings by copying the example file.
   ```bash
   cp env.example .env
   # IMPORTANT: Open .env and add your API keys (Google, OpenAI, Database URL)
   ```

6. **Start the Server**
   Launch the backend API with hot-reload enabled.
   ```bash
   # Optional: Check database connection first
   # python check_database.py
   
   uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
   ```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Access: http://localhost:3000
```

---

## ⚙️ Configuration

### Backend Environment Variables

Create `backend/.env` with the following variables:

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/trading_db

#key to get datasource
ALPHA_VANTAGE_API_KEY=""
TWELVEDATA_API_KEY=""
FINNHUB_API_KEY=""
REDDIT_ID=""
REDDIT_SECRET=""
REDDIT_USER_AGENT="news-fetcher:v1 (by u/yourname)"
TV_USERNAME=""
TV_PASSWORD=""
BSKY_HANDLE=""
BSKY_APP_PW=""
MASTODON_BASE_URL="https://mastodon.social"
MASTODON_TOKEN=""

#key to use model
GOOGLE_API_KEY=""
OPENAI_API_KEY=""
TYPHOON_API_KEY=""

#key to sent telegram
TELEGRAM_TOKEN=""
TELEGRAM_CHAT_ID=
```

### Frontend Environment Variables (Optional)

The frontend uses **dynamic URL detection** by default, which works for most deployments. For custom configurations:

```env
# Frontend/.env.local (optional)
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
NEXT_PUBLIC_WS_URL=wss://your-backend-domain.com/ws
```

---

## 📁 Project Structure

```
MIT-Project-Web/
├── backend/
│   ├── api/
│   │   └── main.py           # FastAPI application
│   ├── database/
│   │   ├── database.py       # Database connection
│   │   └── models.py         # SQLAlchemy models
│   ├── tradingagents/
│   │   ├── graph/            # LangGraph agent definitions
│   │   ├── agents/           # Individual agent implementations
│   │   ├── dataflows/        # Data fetching logic
│   │   └── default_config.py # LLM configuration
│   ├── alembic/              # Database migrations
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx          # Main generate page
│   │   ├── history/          # History page
│   │   ├── contact/          # Contact page
│   │   ├── introduction/     # Landing page
│   │   └── Auth/             # Authentication pages
│   ├── components/
│   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   ├── DebugPanel.tsx    # Debug information
│   │   └── RenderContent.tsx # Report rendering
│   ├── context/
│   │   └── GenerationContext.tsx  # Global state management
│   ├── lib/
│   │   ├── api.ts            # API URL utilities
│   │   ├── constants.ts      # App constants
│   │   └── helpers.ts        # Helper functions
│   ├── public/
│   │   └── fonts/            # PDF export fonts
│   ├── next.config.ts
│   └── Dockerfile
│
├── docker-compose.yml
├── ENV_EXAMPLE.md
└── README.md
```

---

## 📡 API Endpoints

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/history/` | Get all execution history |
| GET | `/api/history/{id}/reports` | Get reports for execution |
| GET | `/quote/{ticker}` | Get stock quote data |
| GET | `/api/search` | Search tickers |
| GET | `/api/tickers` | Get ticker list by market |
| POST | `/api/telegram/connect` | Connect Telegram |
| GET | `/api/telegram/status` | Get Telegram status |

### WebSocket

| Endpoint | Description |
|----------|-------------|
| `/ws` | Real-time analysis updates |

#### WebSocket Message Types

```javascript
// Incoming messages
{ "type": "agent_status", "data": { "agent": "Market Analyst", "status": "working" } }
{ "type": "report", "data": { "key": "market_report", "content": {...} } }
{ "type": "progress", "data": { "step": "analyst", "completed": 2, "total": 4 } }
{ "type": "complete", "data": { "decision": "BUY", "execution_id": 123 } }
{ "type": "error", "data": { "message": "Error description" } }
```

---

## 🖥️ Usage

### 1. Generate Analysis

1. Enter a stock ticker (e.g., AAPL, MSFT, NVDA)
2. Select analysis date
3. Choose research depth (Shallow/Medium/Deep)
4. Click "Generate" to start analysis
5. Watch real-time progress as agents work
6. View final recommendation and detailed reports

### 2. History

- View all past analyses
- Download PDF reports
- Switch between summary and full report views

### 3. Telegram Integration

1. Click "Connect Telegram" in sidebar
2. Open the Telegram bot link
3. Press "Start" in Telegram
4. System will auto-detect and connect

---

## 🐳 Docker Deployment

### Production Build

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Next.js application |
| Backend | 8000 | FastAPI server |
| PostgreSQL | 5432 | Database |
| PgAdmin | 5050 | Database management |

---

## 🔧 Development

### Running Tests

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm run test
```

### Linting

```bash
# Frontend
cd frontend
npm run lint
```

### Building for Production

```bash
# Frontend
cd frontend
npm run build

# Check bundle size
npm run analyze
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary software developed for MIT Research purposes.

---

## 👥 Team

- **MIT Research Team** - Development & Architecture

---

## 📞 Support

For support and inquiries:
- Create an issue in the repository
- Contact via the Contact page in the application

---

<p align="center">
  <strong>Built with ❤️ using Multi-Agent AI Technology</strong>
</p>
