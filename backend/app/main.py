import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine, check_db_connection
from app.api import users, expenses, insights, alerts, webhook, copilot

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("VEXA API starting — env=%s v=%s", settings.ENVIRONMENT, settings.APP_VERSION)
    Base.metadata.create_all(bind=engine)
    if check_db_connection():
        logger.info("Database: connected ✓")
    else:
        logger.error("Database: FAILED — check DATABASE_URL")
    yield
    logger.info("VEXA API shutdown.")


app = FastAPI(
    title="VEXA API",
    version=settings.APP_VERSION,
    # Disable docs in production
    docs_url=None if settings.ENVIRONMENT == "production" else "/docs",
    redoc_url=None if settings.ENVIRONMENT == "production" else "/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    expose_headers=["X-Request-ID"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(users.router,    prefix="/v1")
app.include_router(expenses.router, prefix="/v1")
app.include_router(insights.router, prefix="/v1")
app.include_router(alerts.router,   prefix="/v1")
app.include_router(webhook.router,  prefix="/v1")
app.include_router(copilot.router,  prefix="/v1")


@app.get("/health", tags=["system"])
def health():
    return {
        "status": "ok",
        "environment": settings.ENVIRONMENT,
        "version": settings.APP_VERSION,
    }

@app.get("/", tags=["system"])
def root():
    return {"app": "VEXA API", "version": settings.APP_VERSION}
