import easyocr
import os
import shutil

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

print("Loading EasyOCR Language Models...")
reader = easyocr.Reader(['en'], gpu=False)
print("EasyOCR loaded successfully!")

def process_image(file):

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    ocr_results = reader.readtext(file_path)

    extracted_words = [result[1] for result in ocr_results]

    return {
        "filename": file.filename,
        "word_count": len(extracted_words),
        "extracted_text": extracted_words
    }