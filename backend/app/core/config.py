from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── App ───────────────────────────────────────────────────────────────────
    APP_NAME: str = "VEXA"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "production"
    LOG_LEVEL: str = "INFO"

    # ── Database (Supabase PostgreSQL) ────────────────────────────────────────
    DATABASE_URL: str

    # ── Redis (Railway injects REDIS_URL automatically when plugin is added) ──
    REDIS_URL: str

    # ── Supabase ──────────────────────────────────────────────────────────────
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str   # Project Settings → API → JWT Secret

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Comma-separated, no trailing slash: "https://vexa.vercel.app,https://vexa.app"
    CORS_ORIGINS: str

    @property
    def allowed_origins(self) -> List[str]:
        origins = [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
        if self.ENVIRONMENT == "development":
            origins += ["http://localhost:3000", "http://localhost:3001"]
        return origins

    # ── AI ────────────────────────────────────────────────────────────────────
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    # ── WhatsApp (optional) ───────────────────────────────────────────────────
    EVOLUTION_API_URL: str = ""
    EVOLUTION_API_KEY: str = ""
    EVOLUTION_INSTANCE: str = "vexa"
    WHATSAPP_SECRET: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
