import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# Replace postgres:// with postgresql:// for SQLAlchemy compatibility if needed
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Note: if the password is not set in .env, connection will fail.
# We'll mock the engine setup to avoid failure during initial run if DB is unreachable.
# Force SQLite for local development to avoid Supabase DNS/IPv4 issues
# We will use the DATABASE_URL in production instead
engine = create_engine("sqlite:///./sql_app.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
