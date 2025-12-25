# api/report_router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from database.database import get_db
from database.models import ReportResult, ExecutionHistory
from database.schemas import (
    ReportResultCreate,
    ReportResultResponse
)

router = APIRouter(
    prefix="/api/reports",
    tags=["reports"]
)

# =========================
# Create report (bind to execution)
# =========================
@router.post(
    "/{execution_id}",
    response_model=ReportResultResponse
)
async def create_report(
    execution_id: int,
    report: ReportResultCreate,
    db: AsyncSession = Depends(get_db)
):
    # ตรวจว่า execution history มีอยู่จริง
    stmt = select(ExecutionHistory).where(ExecutionHistory.id == execution_id)
    result = await db.execute(stmt)
    execution = result.scalar_one_or_none()

    if execution is None:
        raise HTTPException(
            status_code=404,
            detail="Execution history not found"
        )

    db_report = ReportResult(
        execution_id=execution_id,
        **report.model_dump()
    )

    db.add(db_report)
    await db.commit()
    await db.refresh(db_report)

    return db_report


# =========================
# Get all reports
# =========================
@router.get("/", response_model=List[ReportResultResponse])
async def get_all_reports(
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ReportResult).order_by(ReportResult.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


# =========================
# Get reports by execution_id
# =========================
@router.get(
    "/by-execution/{execution_id}",
    response_model=List[ReportResultResponse]
)
async def get_reports_by_execution(
    execution_id: int,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(ReportResult)
        .where(ReportResult.execution_id == execution_id)
        .order_by(ReportResult.created_at.desc())
    )
    result = await db.execute(stmt)
    reports = result.scalars().all()

    if not reports:
        raise HTTPException(
            status_code=404,
            detail="No reports found for this execution"
        )

    return reports