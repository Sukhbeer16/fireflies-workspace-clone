import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.database import Base, engine
from app.routers import meetings
from app.seed import seed_database

Base.metadata.create_all(bind=engine)
seed_database()

app = FastAPI(
    title="Fireflies Clone API",
    version="1.0.0",
)

allowed_origins = ["http://localhost:3000"]

frontend_origin = os.getenv("FRONTEND_ORIGIN")

if frontend_origin:
    allowed_origins.append(frontend_origin.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meetings.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}