import easyocr
import os
import shutil
import re

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

print("Loading EasyOCR...")
reader = easyocr.Reader(['en'], gpu=False)
print("EasyOCR ready.")

def extract_text_from_image(file) -> dict:
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    ocr_results = reader.readtext(file_path)
    extracted_words = [result[1] for result in ocr_results]
    full_text = " ".join(extracted_words)

    # Try to isolate the ingredients section
    ingredients_text = _extract_ingredients_block(full_text)

    return {
        "filename": file.filename,
        "full_text": extracted_words,
        "ingredients_raw": ingredients_text
    }

def _extract_ingredients_block(text: str) -> str:
    """
    Attempts to pull just the ingredients list from raw OCR text.
    Falls back to the full text if no ingredients header found.
    """
    lower = text.lower()
    match = re.search(r'ingredient[s]?\s*[:\-]?\s*(.*)', lower)
    if match:
        return text[match.start():]
    return text