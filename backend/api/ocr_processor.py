import os
import logging
from PIL import Image

logger = logging.getLogger(__name__)

# Cache reader instance to avoid reloading it on every request
_EASYOCR_READER = None
_EASYOCR_LOADED = False

try:
    import easyocr
    _EASYOCR_LOADED = True
except ImportError:
    logger.warning("EasyOCR is not installed — the screenshot scanner will report OCR as unavailable instead of fabricating extracted text.")

def extract_text_from_image(image_path_or_file):
    """Real OCR only. Returns (extracted_text, engine_used) — extracted_text is ''
    when OCR genuinely couldn't read the image; callers must treat that as a real
    failure state, never substitute canned text."""
    global _EASYOCR_READER

    if not _EASYOCR_LOADED:
        return "", "OCR unavailable (EasyOCR not installed on the server)"

    try:
        if _EASYOCR_READER is None:
            logger.info("Initializing EasyOCR reader...")
            _EASYOCR_READER = easyocr.Reader(['en'], gpu=False)

        results = _EASYOCR_READER.readtext(image_path_or_file, detail=0)
        extracted_text = " ".join(results).strip()
        if extracted_text:
            return extracted_text, "EasyOCR Engine (Local)"
        return "", "No readable text found in this image"
    except Exception as e:
        logger.error(f"EasyOCR extraction failed: {str(e)}")
        return "", f"OCR failed: {str(e)}"
