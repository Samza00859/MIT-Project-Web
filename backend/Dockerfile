FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements or pyproject.toml
# Since the project uses uv or pip, I'll use pip with requirements.txt if available, 
# or just install the dependencies from pyproject.toml.
# I'll use pip to install the packages directly for simplicity in the Dockerfile.

COPY requirements_utf8.txt .
RUN pip install --no-cache-dir -r requirements_utf8.txt

# Manually install the new dependencies to be sure
RUN pip install --no-cache-dir sqlalchemy asyncpg psycopg2-binary fastapi uvicorn pydantic-settings

COPY . .

# Set environment variables
ENV PYTHONPATH=/app
ENV DATABASE_URL=postgresql+asyncpg://user:password@db:5432/trading_db

EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
