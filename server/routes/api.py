from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.params import Form
from controllers.vision_controller import process_label_controller
from models.schemas import UserProfile
import json

router = APIRouter()

@router.post("/process-label")
async def process_label(
    file: UploadFile = File(...),
    restrictions: str = Form(default="[]")  # JSON string from React Native
):
    restriction_list = json.loads(restrictions)
    profile = UserProfile(restrictions=restriction_list)
    return await process_label_controller(file, profile)