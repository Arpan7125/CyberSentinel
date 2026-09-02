import io
import os
import logging

import requests
from PIL import Image

logger = logging.getLogger(__name__)

# ── Local engine (EasyOCR) ───────────────────────────────────────────────────
# Best accuracy and keeps images on the server, but depends on PyTorch (~2 GB)
# and needs more RAM than a small free instance has. Optional — see
# requirements-ocr.txt.
_EASYOCR_READER = None
_EASYOCR_LOADED = False
try:
    import easyocr
    _EASYOCR_LOADED = True
except Exception as exc:  # noqa: BLE001 - see below
    # Deliberately broader than ImportError. EasyOCR pulls in PyTorch, which
    # fails at import time for reasons that are not missing-package errors: a
    # partial install, a CPU without the required instructions, or an OS policy
    # blocking the native .dll all raise OSError instead. Catching only
    # ImportError meant any of those took the entire backend down at startup —
    # every endpoint, not just the screenshot scanner. An optional dependency
    # must never be able to do that; the whole point of this module is to
    # degrade to the cloud backend, or to an honest "unavailable".
    logger.warning(
        "EasyOCR is unavailable (%s: %s) — the screenshot scanner will use the "
        "cloud OCR backend if OCR_SPACE_API_KEY is set, otherwise report OCR as "
        "unavailable instead of fabricating extracted text.",
        type(exc).__name__, exc,
    )

# ── Cloud engine (OCR.space) ─────────────────────────────────────────────────
# A lightweight HTTP call, so it works on hosts too small for EasyOCR (e.g. a
# free 512 MB instance). Trade-off: the uploaded screenshot leaves the server
# and is processed by ocr.space. Off unless OCR_SPACE_API_KEY is configured.
OCR_SPACE_API_KEY = os.getenv('OCR_SPACE_API_KEY', '').strip()
OCR_SPACE_URL = 'https://api.ocr.space/parse/image'
# The free OCR.space key rejects payloads over ~1 MB, so oversized screenshots
# are downscaled to fit rather than failing outright.
_CLOUD_MAX_BYTES = 1_000_000


def _read_raw(image_path_or_file):
    """Coerce any of the accepted input shapes to raw image bytes."""
    if isinstance(image_path_or_file, bytes):
        return image_path_or_file
    if isinstance(image_path_or_file, str):
        with open(image_path_or_file, 'rb') as fh:
            return fh.read()
    if hasattr(image_path_or_file, 'read'):
        try:
            image_path_or_file.seek(0)
        except Exception:
            pass
        data = image_path_or_file.read()
        try:
            image_path_or_file.seek(0)
        except Exception:
            pass
        return data
    # PIL-openable (e.g. a numpy-ish object) — re-encode to PNG bytes.
    buf = io.BytesIO()
    Image.open(image_path_or_file).save(buf, format='PNG')
    return buf.getvalue()


def _fit_cloud_limit(raw):
    """Keep the payload under the free-tier size cap by downscaling if needed."""
    if len(raw) <= _CLOUD_MAX_BYTES:
        return raw
    try:
        img = Image.open(io.BytesIO(raw))
        img.thumbnail((1600, 1600))  # preserves aspect ratio
        buf = io.BytesIO()
        img.convert('RGB').save(buf, format='JPEG', quality=85)
        shrunk = buf.getvalue()
        # Only use the shrunk copy if it actually helped.
        return shrunk if len(shrunk) < len(raw) else raw
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("Could not downscale image for cloud OCR: %s", exc)
        return raw


def _ocr_space(image_bytes):
    """Run OCR via ocr.space.

    Returns (text, engine_or_status, reached_api). `reached_api` is False only
    when the service could not be contacted at all — the one case where falling
    back to a local engine makes sense. A real "no text" or API error is an
    authoritative answer (reached_api=True) and must not be masked.
    """
    try:
        resp = requests.post(
            OCR_SPACE_URL,
            files={'file': ('image.png', _fit_cloud_limit(image_bytes))},
            data={
                'language': 'eng',
                'OCREngine': '2',            # 2 handles varied fonts/screenshots better
                'isOverlayRequired': 'false',
                'scale': 'true',
            },
            headers={'apikey': OCR_SPACE_API_KEY},
            timeout=30,
        )
    except requests.RequestException as exc:
        logger.warning("OCR.space unreachable: %s", exc.__class__.__name__)
        return "", "cloud OCR unreachable", False

    if resp.status_code != 200:
        logger.warning("OCR.space returned HTTP %s", resp.status_code)
        return "", f"cloud OCR error (HTTP {resp.status_code})", False

    try:
        data = resp.json()
    except ValueError:
        return "", "cloud OCR returned a non-JSON response", False

    if data.get('IsErroredOnProcessing'):
        msg = data.get('ErrorMessage')
        if isinstance(msg, list):
            msg = '; '.join(str(m) for m in msg)
        return "", f"cloud OCR failed: {msg or 'unknown error'}", True

    parsed = data.get('ParsedResults') or []
    text = (parsed[0].get('ParsedText') if parsed else '') or ''
    text = text.encode('utf-8', errors='ignore').decode('utf-8', errors='ignore').strip()
    if text:
        return text, "OCR.space (Cloud)", True
    return "", "No readable text found in this image", True


def extract_text_from_image(image_path_or_file):
    """Real OCR only. Returns (extracted_text, engine_used) — extracted_text is ''
    when OCR genuinely couldn't read the image; callers must treat that as a real
    failure state, never substitute canned text.

    Backend order: cloud (OCR.space) when a key is configured — because it works
    on instances too small for EasyOCR — then local EasyOCR if installed, then an
    honest "unavailable" result.
    """
    global _EASYOCR_READER

    # 1) Cloud OCR, when configured.
    if OCR_SPACE_API_KEY:
        try:
            image_bytes = _read_raw(image_path_or_file)
        except Exception as exc:
            logger.error("Could not read image for cloud OCR: %s", exc)
            image_bytes = None
        if image_bytes is not None:
            text, engine, reached = _ocr_space(image_bytes)
            if reached:
                return text, engine
            # Cloud unreachable — fall through to a local engine if we have one.

    # 2) Local EasyOCR.
    if _EASYOCR_LOADED:
        try:
            if _EASYOCR_READER is None:
                logger.info("Initializing EasyOCR reader...")
                _EASYOCR_READER = easyocr.Reader(['en'], gpu=False, verbose=False)

            if isinstance(image_path_or_file, str):
                image_input = image_path_or_file
            elif hasattr(image_path_or_file, 'read'):
                image_path_or_file.seek(0)
                image_input = image_path_or_file.read()
                image_path_or_file.seek(0)
            elif isinstance(image_path_or_file, bytes):
                image_input = image_path_or_file
            else:
                import numpy as np
                image_input = np.array(Image.open(image_path_or_file))

            results = _EASYOCR_READER.readtext(image_input, detail=0)
            raw_text = " ".join([str(r) for r in results]).strip()
            extracted_text = raw_text.encode('utf-8', errors='ignore').decode('utf-8', errors='ignore')
            if extracted_text:
                return extracted_text, "EasyOCR Engine (Local)"
            return "", "No readable text found in this image"
        except Exception as e:
            err_msg = str(e).encode('utf-8', errors='ignore').decode('utf-8', errors='ignore')
            logger.error(f"EasyOCR extraction failed: {err_msg}")
            return "", f"OCR failed: {err_msg}"

    # 3) No backend available.
    if OCR_SPACE_API_KEY:
        return "", "OCR unavailable (cloud OCR unreachable and no local engine installed)"
    return "", "OCR unavailable (no OCR backend configured on the server)"
