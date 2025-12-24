FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Copy และให้สิทธิ์ entrypoint script
# COPY entrypoint.sh /entrypoint.sh
# RUN chmod +x /entrypoint.sh

ENV PYTHONPATH=/app
ENV DATABASE_URL=postgresql+asyncpg://user:password@db:5432/trading_db

EXPOSE 8000

CMD ["sh", "-c", "echo 'Running database migrations...' && alembic upgrade head && echo 'Starting application...' && uvicorn api.main:app --host 0.0.0.0 --port 8000"]