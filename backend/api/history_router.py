from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
from .database import get_db
from .models import ExecutionHistory, ReportResult
from .schemas import ExecutionHistoryCreate, ExecutionHistoryResponse

router = APIRouter(prefix="/api/history", tags=["history"])

@router.post("/", response_model=ExecutionHistoryResponse)
async def save_history(history: ExecutionHistoryCreate, db: AsyncSession = Depends(get_db)):
    db_history = ExecutionHistory(**history.dict())
    db.add(db_history)
    await db.commit()
    await db.refresh(db_history)
    return db_history

@router.get("/", response_model=List[ExecutionHistoryResponse])
async def get_all_history(db: AsyncSession = Depends(get_db)):
    # Use selectinload to eagerly load reports
    stmt = select(ExecutionHistory).options(selectinload(ExecutionHistory.reports)).order_by(ExecutionHistory.timestamp.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{history_id}", response_model=ExecutionHistoryResponse)
async def get_history_by_id(history_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(ExecutionHistory).options(selectinload(ExecutionHistory.reports)).where(ExecutionHistory.id == history_id)
    result = await db.execute(stmt)
    db_history = result.scalar_one_or_none()
    if db_history is None:
        raise HTTPException(status_code=404, detail="History record not found")
    return db_history
