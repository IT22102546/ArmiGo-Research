from sqlalchemy import Column, Integer, String, TIMESTAMP, text, BigInteger, JSON, ForeignKey, Index, DateTime, Enum, BIGINT
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid
from .db import Base


def generate_cuid():
    """Generate a cuid-like ID compatible with Prisma's default cuid() format."""
    return str(uuid.uuid4()).replace('-', '')[:25]


class Student(Base):
    """Student model - ID is String to match NestJS backend User IDs (cuid format).

    When integrating with the main backend, the 'id' should be the User's ID
    from the NestJS system to maintain referential integrity.
    """
    __tablename__ = "students"
    id = Column(String(30), primary_key=True, default=generate_cuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True)
    roll_number = Column(String(64), unique=True)
    # Optional: Link to main backend user ID for cross-system references
    backend_user_id = Column(String(30), unique=True, nullable=True, index=True)
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    embeddings = relationship("FaceEmbedding", back_populates="student", cascade="all, delete")
    images = relationship("FaceImage", back_populates="student", cascade="all, delete")
    attendances = relationship("Attendance", back_populates="student", cascade="all, delete")

class FaceEmbedding(Base):
    __tablename__ = "face_embeddings"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    student_id = Column(String(30), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    embedding = Column(JSON, nullable=False)
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    student = relationship("Student", back_populates="embeddings")

class FaceImage(Base):
    __tablename__ = "face_images"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    student_id = Column(String(30), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    image_path = Column(String(512), nullable=False)
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    student = relationship("Student", back_populates="images")

class Setting(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, autoincrement=True)
    setting_key = Column(String(128), unique=True, nullable=False)
    setting_value = Column(String(512))

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    student_id = Column(String(30), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    attended_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    class_name = Column(String(128))
    session_id = Column(String(64))

    student = relationship("Student", back_populates="attendances")

class ExamSessionStatus(str, enum.Enum):
    active = "active"
    locked = "locked"
    completed = "completed"
    aborted = "aborted"

class Exam(Base):
    __tablename__ = "exams"
    id = Column(String(30), primary_key=True, default=generate_cuid, index=True)
    # Optional: Link to main backend exam ID
    backend_exam_id = Column(String(30), unique=True, nullable=True, index=True)
    exam_code = Column(String(64), unique=True, nullable=False)
    title = Column(String(255))
    starts_at = Column(DateTime, nullable=True)
    ends_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ExamSession(Base):
    __tablename__ = "exam_sessions"
    id = Column(String(30), primary_key=True, default=generate_cuid, index=True)
    exam_id = Column(String(30), ForeignKey("exams.id"), nullable=False, index=True)
    student_id = Column(String(30), ForeignKey("students.id"), nullable=False, index=True)
    status = Column(String(16), default=ExamSessionStatus.active.value)
    reason_locked = Column(String(255), nullable=True)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)

    exam = relationship("Exam", backref="sessions")
    student = relationship("Student", backref="exam_sessions")

class ExamIncident(Base):
    __tablename__ = "exam_incidents"
    id = Column(String(30), primary_key=True, default=generate_cuid, index=True)
    session_id = Column(String(30), ForeignKey("exam_sessions.id"), nullable=False, index=True)
    incident_type = Column(String(64), nullable=False)
    details = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ExamSession", backref="incidents")

Index("idx_attendance_student", Attendance.student_id)
Index("idx_attendance_time", Attendance.attended_at)
