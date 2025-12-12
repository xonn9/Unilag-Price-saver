import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# ------------------------------
# Load environment variables
# ------------------------------
load_dotenv()  # Reads from .env automatically

DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "postgres")
DATABASE_URL = os.getenv("DATABASE_URL", f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

# Echo SQL statements if needed
DATABASE_ECHO = os.getenv("DATABASE_ECHO", "false").lower() == "true"

# ------------------------------
# Create engine
# ------------------------------
# Use SQLite locally if DATABASE_URL points to sqlite
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False}, echo=DATABASE_ECHO)
else:
    # PostgreSQL (Supabase or any production)
    engine = create_engine(
        DATABASE_URL,
        echo=DATABASE_ECHO,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_timeout=30
    )

# ------------------------------
# ORM Session and Base
# ------------------------------
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ------------------------------
# Initialize Database
# ------------------------------
def init_db():
    """Create all tables in the database."""
    Base.metadata.create_all(bind=engine)
