from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os

# Try to use SQLite-enabled config first for easy testing
try:
    from .config_sqlite import DATABASE_URL
except ImportError:
    from .config import DATABASE_URL

class Base(DeclarativeBase):
    pass

# For SQLite, we need to set check_same_thread to False
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=3600)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
