# database/database.py
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

# Database URL from environment variables
raw_database_url = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://user:password@localhost:5432/trading_db",
)

# Safety: บังคับให้ใช้ asyncpg เสมอ แม้ .env จะตั้งเป็น postgresql:// หรือ psycopg2
if raw_database_url.startswith("postgres://"):
    raw_database_url = "postgresql+asyncpg://" + raw_database_url[len("postgres://") :]
elif raw_database_url.startswith("postgresql://"):
    raw_database_url = "postgresql+asyncpg://" + raw_database_url[len("postgresql://") :]
elif "+psycopg2" in raw_database_url:
    raw_database_url = raw_database_url.replace("+psycopg2", "+asyncpg")

DATABASE_URL = raw_database_url

engine = create_async_engine(DATABASE_URL, echo=True)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    """Create all tables if they don't exist"""
    from database.models import Base as ModelsBase
    async with engine.begin() as conn:
        await conn.run_sync(ModelsBase.metadata.create_all)
    print("✅ Database tables created/verified")