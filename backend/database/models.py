# database/models.py
from datetime import datetime
from sqlalchemy import Column, Integer, String, JSON, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class ExecutionHistory(Base):
    __tablename__ = "execution_history"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    ticker = Column(String, index=True)
    analysis_date = Column(String)
    status = Column(String)  # success / error
    error_message = Column(Text, nullable=True)
    
    # Relationship to reports
    reports = relationship("ReportResult", back_populates="execution", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat(),
            "ticker": self.ticker,
            "analysis_date": self.analysis_date,
            "status": self.status,
            "error_message": self.error_message,
            "reports": [report.to_dict() for report in self.reports]
        }

class ReportResult(Base):
    __tablename__ = "report_results"
    
    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(Integer, ForeignKey("execution_history.id"))
    report_type = Column(String)  # full_report / sum_report
    title = Column(String, nullable=True)
    content = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to execution history
    execution = relationship("ExecutionHistory", back_populates="reports")
    
    def to_dict(self):
        return {
            "id": self.id,
            "execution_id": self.execution_id,
            "report_type": self.report_type,
            "title": self.title,
            "content": self.content,
            "created_at": self.created_at.isoformat()
        }

