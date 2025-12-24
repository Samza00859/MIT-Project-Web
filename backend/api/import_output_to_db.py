"""
Script to import existing output files into the database
Run this from the backend directory: python -m api.import_output_to_db
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime

# Import database components
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from database.database import AsyncSessionLocal, init_db
from database.models import ExecutionHistory, ReportResult

# Paths
BACKEND_ROOT = Path(__file__).parent.parent
SUM_DIR = BACKEND_ROOT / "output" / "sum"
FULL_DIR = BACKEND_ROOT / "output" / "full"

# File mappings
SUM_FILES = [
    ("sum_funda.txt", "sum_report", "Fundamentals Review"),
    ("sum_market.txt", "sum_report", "Market Analysis"),
    ("sum_social.txt", "sum_report", "Social Sentiment"),
    ("sum_news.txt", "sum_report", "News Analysis"),
    ("sum_bull.txt", "sum_report", "Bull Case"),
    ("sum_bear.txt", "sum_report", "Bear Case"),
    ("sum_conservative.txt", "sum_report", "Risk: Conservative"),
    ("sum_aggressive.txt", "sum_report", "Risk: Aggressive"),
    ("sum_neutral.txt", "sum_report", "Risk: Neutral"),
    ("sum_trader.txt", "sum_report", "Trader Plan"),
    ("sum_investment_plan.txt", "sum_report", "Research Team Decision"),
    ("sum_final_decision.txt", "sum_report", "Portfolio Management Decision"),
]

FULL_FILES = [
    ("full_funda.json", "full_report", "Fundamentals Review"),
    ("full_market.json", "full_report", "Market Analysis"),
    ("full_social.json", "full_report", "Social Sentiment"),
    ("full_news.json", "full_report", "News Analysis"),
    ("full_bull.json", "full_report", "Bull Case"),
    ("full_bear.json", "full_report", "Bear Case"),
    ("full_conservative.json", "full_report", "Risk: Conservative"),
    ("full_aggressive.json", "full_report", "Risk: Aggressive"),
    ("full_neutral.json", "full_report", "Risk: Neutral"),
    ("full_trader.json", "full_report", "Trader Plan"),
    ("investment_plan.txt", "full_report", "Research Team Decision"),
    ("final_decision.json", "full_report", "Portfolio Management Decision"),
]


async def import_output_to_db():
    """Import output files to database"""
    print("🚀 Starting import process...")
    
    # Initialize database tables
    print("📊 Initializing database tables...")
    await init_db()
    
    async with AsyncSessionLocal() as db:
        # 1. Create ExecutionHistory record
        print("📝 Creating ExecutionHistory record...")
        history = ExecutionHistory(
            ticker="IMPORTED",  # Can be changed
            analysis_date=datetime.now().strftime("%Y-%m-%d"),
            status="success",
            error_message=None
        )
        db.add(history)
        await db.commit()
        await db.refresh(history)
        execution_id = history.id
        print(f"✅ Created ExecutionHistory with ID: {execution_id}")
        
        reports_added = 0
        
        # 2. Read and save summary reports
        print("\n📂 Processing summary reports...")
        for filename, report_type, title in SUM_FILES:
            filepath = SUM_DIR / filename
            if filepath.exists():
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    if content.strip():
                        report = ReportResult(
                            execution_id=execution_id,
                            report_type=report_type,
                            title=title,
                            content={"text": content}
                        )
                        db.add(report)
                        reports_added += 1
                        print(f"  ✅ Added: {title}")
                except Exception as e:
                    print(f"  ❌ Failed to read {filename}: {e}")
            else:
                print(f"  ⚠️ File not found: {filename}")
        
        # 3. Read and save full reports
        print("\n📂 Processing full reports...")
        for filename, report_type, title in FULL_FILES:
            filepath = FULL_DIR / filename
            if filepath.exists():
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        raw_content = f.read()
                    
                    if raw_content.strip():
                        # Parse JSON files
                        if filename.endswith('.json'):
                            try:
                                content = json.loads(raw_content)
                            except json.JSONDecodeError:
                                content = {"text": raw_content}
                        else:
                            content = {"text": raw_content}
                        
                        report = ReportResult(
                            execution_id=execution_id,
                            report_type=report_type,
                            title=title,
                            content=content
                        )
                        db.add(report)
                        reports_added += 1
                        print(f"  ✅ Added: {title}")
                except Exception as e:
                    print(f"  ❌ Failed to read {filename}: {e}")
            else:
                print(f"  ⚠️ File not found: {filename}")
        
        # 4. Commit all reports
        await db.commit()
        print(f"\n🎉 Import complete! Added {reports_added} reports to execution ID {execution_id}")
        print(f"📌 Go to History page and select the record with ticker 'IMPORTED' to see the reports.")


if __name__ == "__main__":
    asyncio.run(import_output_to_db())
