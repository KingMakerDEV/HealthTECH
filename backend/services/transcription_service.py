"""
Voice Transcription Service
Sends audio file to NVIDIA Whisper model and returns transcribed text.
Supports: mp3, mp4, wav, webm, m4a, ogg
"""
import os
import logging
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

WHISPER_URL = "https://integrate.api.nvidia.com/v1/audio/transcriptions"
SUPPORTED_FORMATS = {".mp3", ".mp4", ".wav", ".webm", ".m4a", ".ogg"}


async def transcribe_audio(file_path: str) -> str:
    """
    Sends audio file to NVIDIA Whisper large-v3 and returns transcript.
    Raises ValueError if file format not supported.
    Raises RuntimeError if API call fails.
    """
    ext = os.path.splitext(file_path)[1].lower()
    if ext not in SUPPORTED_FORMATS:
        raise ValueError(f"Unsupported audio format: {ext}. Supported: {SUPPORTED_FORMATS}")

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Audio file not found: {file_path}")

    logger.info(f"[Transcription] Transcribing {file_path}")

    try:
        with open(file_path, "rb") as audio_file:
            files = {"file": (os.path.basename(file_path), audio_file, "audio/mpeg")}
            data  = {"model": "nvidia/canary-1b"}   # NVIDIA free whisper-equivalent
            headers = {"Authorization": f"Bearer {settings.NVIDIA_API_KEY}"}

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    WHISPER_URL,
                    headers=headers,
                    files=files,
                    data=data,
                )

        if response.status_code != 200:
            logger.error(f"[Transcription] API error {response.status_code}: {response.text}")
            raise RuntimeError(f"Transcription API returned {response.status_code}")

        result = response.json()
        transcript = result.get("text", "").strip()
        logger.info(f"[Transcription] Done: '{transcript[:80]}...'")
        return transcript

    except httpx.TimeoutException:
        raise RuntimeError("Transcription timed out. Audio file may be too large.")
    except Exception as e:
        logger.error(f"[Transcription] Failed: {e}")
        raise RuntimeError(f"Transcription failed: {e}")