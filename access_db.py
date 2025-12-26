import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.api.database import AsyncSessionLocal
from sqlalchemy import text

async def access_database():
    """Access and explore the database"""
    try:
        async with AsyncSessionLocal() as session:
            print("✅ Connected to database successfully!")
            print("=" * 50)

            # Get database version
            result = await session.execute(text("SELECT version()"))
            version = result.scalar()
            print(f"PostgreSQL Version: {version[:50]}...")

            # List all tables
            result = await session.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'"))
            tables = result.fetchall()
            print(f"\nTables in database: {len(tables)}")
            for table in tables:
                print(f"  - {table[0]}")

            # Check execution_history table specifically
            if 'execution_history' in [t[0] for t in tables]:
                print("\n📊 Execution History Table:")

                # Count records
                result = await session.execute(text("SELECT COUNT(*) FROM execution_history"))
                count = result.scalar()
                print(f"  Total records: {count}")

                if count > 0:
                    # Show recent records
                    result = await session.execute(text("""
                        SELECT id, action_type, status, timestamp
                        FROM execution_history
                        ORDER BY timestamp DESC
                        LIMIT 5
                    """))
                    records = result.fetchall()

                    print("  Recent records:")
                    for record in records:
                        print(f"    ID: {record[0]} | Action: {record[1]} | Status: {record[2]} | Time: {record[3]}")

                    # Show table structure
                    result = await session.execute(text("""
                        SELECT column_name, data_type, is_nullable
                        FROM information_schema.columns
                        WHERE table_name = 'execution_history'
                        ORDER BY ordinal_position
                    """))
                    columns = result.fetchall()

                    print("  Table structure:")
                    for col in columns:
                        print(f"    {col[0]}: {col[1]} {'(nullable)' if col[2] == 'YES' else '(not null)'}")

            print("\n" + "=" * 50)
            print("✅ Database access completed successfully!")

    except Exception as e:
        print(f"❌ Database access failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(access_database())

















