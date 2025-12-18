from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

class ExecutionHistoryBase(BaseModel):
    action_type: str
    input_params: Dict[str, Any]
    output_result: Optional[Dict[str, Any]] = None
    status: str
    error_message: Optional[str] = None

class ExecutionHistoryCreate(ExecutionHistoryBase):
    pass

class ExecutionHistoryResponse(ExecutionHistoryBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True
