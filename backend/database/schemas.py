# database/schemas.py
from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime


# =========================
# ReportResult Schemas
# =========================

class ReportResultBase(BaseModel):
    report_type: str           # full_report / sum_report
    title: Optional[str] = None
    content: Any               # JSON


class ReportResultCreate(ReportResultBase):
    pass


class ReportResultResponse(ReportResultBase):
    id: int
    execution_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# =========================
# ExecutionHistory Schemas
# =========================

class ExecutionHistoryBase(BaseModel):
    ticker: str
    analysis_date: str
    status: str
    error_message: Optional[str] = None


class ExecutionHistoryCreate(ExecutionHistoryBase):
    pass


class ExecutionHistoryResponse(ExecutionHistoryBase):
    id: int
    timestamp: datetime
    reports: List[ReportResultResponse] = []

    class Config:
        from_attributes = True