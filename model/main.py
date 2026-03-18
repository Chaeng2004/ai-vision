from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import shutil
import os
import easyocr

app = FastAPI(title="AI Vision Service")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

print("Loading EasyOCR Language Models... (This might take a minute on the first run)")

reader = easyocr.Reader(['en'], gpu=False) 
print("EasyOCR loaded successfully! Ready for images.")

@app.get("/")
def health_check():
    return {"status": "Online", "message": "AI Vision (EasyOCR) is running!"}

@app.post("/process-label/")
async def process_label(file: UploadFile = File(...)):
    try:
       
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
      
        print(f"Reading text from {file.filename}...")
        
      
        ocr_results = reader.readtext(file_path)
        
    
        extracted_words = [result[1] for result in ocr_results]
        
        return JSONResponse(content={
            "status": "success",
            "filename": file.filename,
            "message": "Image successfully read by EasyOCR!",
            "word_count": len(extracted_words),
            "extracted_text": extracted_words 
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=500, 
            content={"status": "error", "message": f"Processing failed: {str(e)}"}
        )