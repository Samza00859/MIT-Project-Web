"""
Script to check database connection and initialize tables.
Run this to verify your database setup before starting the API server.
"""
import asyncio
import os
import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT))

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@localhost:5432/trading_db")

async def check_database():
    """Check database connection and create tables if needed."""
    print("🔍 Checking database connection...")
    print(f"📊 DATABASE_URL: {DATABASE_URL.split('@')[0]}@***")  # Hide password
    
    try:
        engine = create_async_engine(DATABASE_URL, echo=False)
        
        # Test connection
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            print("✅ Database connection successful!")
            
            # Check if database exists
            await conn.execute(text("SELECT current_database()"))
            print("✅ Database exists!")
            
            # Initialize tables
            print("\n📦 Initializing database tables...")
            from backend.api.database import Base
            from backend.api.models import User, ExecutionHistory
            
            await conn.run_sync(Base.metadata.create_all)
            print("✅ Database tables created/verified!")
            
        await engine.dispose()
        print("\n🎉 Database setup complete! You can now start the API server.")
        return True
        
    except Exception as e:
        error_msg = str(e)
        print(f"\n❌ Database error: {error_msg}")
        
        if "connection" in error_msg.lower() or "could not connect" in error_msg.lower():
            print("\n💡 Possible solutions:")
            print("1. Make sure PostgreSQL is running")
            print("2. Check your DATABASE_URL in .env file")
            print("3. Verify database credentials (username, password)")
            print("4. Ensure database 'trading_db' exists")
            print("\n📝 To create database:")
            print("   psql -U postgres")
            print("   CREATE DATABASE trading_db;")
        elif "authentication" in error_msg.lower() or "password" in error_msg.lower():
            print("\n💡 Possible solutions:")
            print("1. Check your database username and password in DATABASE_URL")
            print("2. Verify PostgreSQL user has proper permissions")
        elif "does not exist" in error_msg.lower():
            print("\n💡 Possible solutions:")
            print("1. Create the database:")
            print("   psql -U postgres")
            print("   CREATE DATABASE trading_db;")
        else:
            print("\n💡 Check backend logs for more details")
        
        return False

if __name__ == "__main__":
    success = asyncio.run(check_database())
    sys.exit(0 if success else 1)


