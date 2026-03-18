from fastapi import APIRouter, UploadFile, File
from controllers.vision_controller import process_label_controller

router = APIRouter()

@router.post("/process-label")
async def process_label(file: UploadFile = File(...)):
    return await process_label_controller(file)


# future routes
# @router.post("/analyze-ingredients")
# @router.get("/health-profile")
# @router.post("/translate")