from datetime import datetime
from sqlalchemy import Column, Integer, String, JSON, DateTime, Text
from .database import Base

class ExecutionHistory(Base):
    __tablename__ = "execution_history"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    action_type = Column(String, index=True)
    input_params = Column(JSON)
    output_result = Column(JSON, nullable=True)
    status = Column(String)  # success / error
    error_message = Column(Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat(),
            "action_type": self.action_type,
            "input_params": self.input_params,
            "output_result": self.output_result,
            "status": self.status,
            "error_message": self.error_message
        }
