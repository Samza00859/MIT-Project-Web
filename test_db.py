import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.api.database import AsyncSessionLocal
from sqlalchemy import text

async def test_db():
    try:
        async with AsyncSessionLocal() as session:
            # Test basic connection
            result = await session.execute(text('SELECT version()'))
            version = result.scalar()
            print('✅ Database connected successfully!')
            print('PostgreSQL version:', version[:50] + '...')

            # Check if tables exist
            result = await session.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            tables = result.fetchall()
            print('Tables in database:', [table[0] for table in tables])

            # Check if execution_history table exists and has data
            result = await session.execute(text("SELECT COUNT(*) FROM execution_history"))
            count = result.scalar()
            print(f'Execution history records: {count}')

    except Exception as e:
        print('❌ Database connection failed:', str(e))
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_db())
























