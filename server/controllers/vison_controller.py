from fastapi.responses import JSONResponse
from services.ocr_service import process_image

async def process_label_controller(file):

    try:
        result = process_image(file)

        return JSONResponse(content={
            "status": "success",
            "message": "Image successfully read by EasyOCR!",
            **result
        })

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Processing failed: {str(e)}"
            }
        )