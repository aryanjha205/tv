from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# The user provided Neon DB URL
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_wJW7XuZ5oUAh@ep-curly-thunder-aouzefz0.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
