# api/history_router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List

from database.database import get_db
from database.models import ExecutionHistory
from database.schemas import (
    ExecutionHistoryCreate,
    ExecutionHistoryResponse
)

router = APIRouter(
    prefix="/api/history",
    tags=["history"]
)

# =========================
# Create execution history
# =========================
@router.post("/", response_model=ExecutionHistoryResponse)
async def create_history(
    history: ExecutionHistoryCreate,
    db: AsyncSession = Depends(get_db)
):
    db_history = ExecutionHistory(**history.model_dump())
    db.add(db_history)
    await db.commit()
    await db.refresh(db_history)
    return db_history


# =========================
# Get all histories
# =========================
@router.get("/", response_model=List[ExecutionHistoryResponse])
async def get_all_histories(
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(ExecutionHistory)
        .options(selectinload(ExecutionHistory.reports))
        .order_by(ExecutionHistory.timestamp.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


# =========================
# Get history by id
# =========================
@router.get("/{history_id}", response_model=ExecutionHistoryResponse)
async def get_history_by_id(
    history_id: int,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(ExecutionHistory)
        .options(selectinload(ExecutionHistory.reports))
        .where(ExecutionHistory.id == history_id)
    )
    result = await db.execute(stmt)
    history = result.scalar_one_or_none()

    if history is None:
        raise HTTPException(status_code=404, detail="History not found")

    return history