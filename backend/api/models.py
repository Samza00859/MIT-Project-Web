from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    JSON,
    DateTime,
    Text,
    Boolean,
)
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


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    email_verification_token = Column(String(255), nullable=True, index=True)
    verification_code = Column(String(10), nullable=True, index=True)
    token_expired_at = Column(DateTime, nullable=True)
    last_verification_sent_at = Column(DateTime, nullable=True)
