"""
NVIDIA NIM Client
NVIDIA's API is fully OpenAI-compatible so we use the openai library.
One client for LLM, one for vision — same base URL, same key.
"""
from openai import AsyncOpenAI
from app.config import settings

# ── Text LLM — meta/llama-3.1-70b-instruct ──────────────────────
llm_client = AsyncOpenAI(
    base_url=settings.NVIDIA_BASE_URL,
    api_key=settings.NVIDIA_API_KEY,
)

# ── Vision LLM — nvidia/llama-3.2-11b-vision-instruct ───────────
vision_client = AsyncOpenAI(
    base_url=settings.NVIDIA_BASE_URL,
    api_key=settings.NVIDIA_API_KEY,
)

LLM_MODEL    = "meta/llama-3.1-70b-instruct"
VISION_MODEL = "nvidia/llama-3.2-11b-vision-instruct"