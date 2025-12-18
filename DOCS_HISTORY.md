# Execution History System Documentation

This document explains the implementation of the execution history system for the TradingAgents application.

## 1. Database Schema

The system uses a PostgreSQL database with a table named `execution_history`.

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer | Primary key, auto-incrementing |
| `timestamp` | DateTime | The UTC time when the record was created |
| `action_type` | String | Type of action (e.g., "analysis") |
| `input_params` | JSON | Parameters sent to the action |
| `output_result`| JSON | Result/Decision from the action |
| `status` | String | "success" or "error" |
| `error_message`| Text | Detailed error message if status is "error" |

## 2. API Endpoints

The backend provides the following REST API endpoints under `/api/history`:

### `GET /api/history/`
Fetches all execution history records, ordered by latest first.
- **Response**: List of mapping objects containing schema fields.

### `GET /api/history/{id}`
Fetches a single history record by its ID.
- **Response**: A single mapping object.

### `POST /api/history/`
Saves a new execution history record. (Used internally by the analysis engine).

## 3. UI Implementation

The "History" section is accessible via the sidebar. It features:
- A list of all past runs with their status and timestamp.
- A detailed view for each run showing both input parameters and the final output results (or error messages).
- Clear indicators for success/failure status.

## 4. How to Run

The entire system is containerized using Docker and Docker Compose.

### Prerequisites
- Docker and Docker Compose installed.
- Environment variables set in a `.env` file (API keys for LLMs).

### Starting the System
Run the following command in the project root:

```bash
docker-compose up -d
```

This will start:
1.  **db**: PostgreSQL database on port 5432.
2.  **backend**: FastAPI server on port 8000.
3.  **frontend**: Next.js application on port 3000.

### Database Initialization
The backend automatically initializes the database schema on startup using SQLAlchemy's `create_all`.
