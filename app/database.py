import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# ------------------------------
# Database configuration from secrets
# ------------------------------
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "postgres")

# Build DATABASE_URL dynamically
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?sslmode=require"

# ------------------------------
# Configure engine
# ------------------------------
# Fallback to SQLite for local development if DATABASE_URL not set
if DB_HOST in ["localhost", "127.0.0.1"] or os.getenv("USE_SQLITE", "0") == "1":
    DATABASE_URL = "sqlite:///./data.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

# ------------------------------
# Session and Base
# ------------------------------
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ------------------------------
# Initialize DB
# ------------------------------
def init_db():
    Base.metadata.create_all(bind=engine)
