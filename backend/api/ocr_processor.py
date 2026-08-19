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
        # Clean unicode characters safely so string operations on Windows never fail with charmap codec error
        extracted_text = raw_text.encode('utf-8', errors='ignore').decode('utf-8', errors='ignore')
        if extracted_text:
            return extracted_text, "EasyOCR Engine (Local)"
        return "", "No readable text found in this image"
    except Exception as e:
        err_msg = str(e).encode('utf-8', errors='ignore').decode('utf-8', errors='ignore')
        logger.error(f"EasyOCR extraction failed: {err_msg}")
        return "", f"OCR failed: {err_msg}"
