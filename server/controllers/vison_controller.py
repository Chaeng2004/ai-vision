from fastapi.responses import JSONResponse
from fastapi import UploadFile
from services.ocr_service import extract_text_from_image
from services.gemini_service import classify_ingredients
from services.safety_service import evaluate_safety
from models.schemas import UserProfile, IngredientAnalysis
import json

async def process_label_controller(file: UploadFile, profile: UserProfile):
    try:
        # Step 1: OCR
        ocr_data = extract_text_from_image(file)

        # Step 2: Gemini classification
        gemini_result = classify_ingredients(
            ingredients_text=ocr_data["ingredients_raw"],
            user_restrictions=profile.restrictions
        )

        # Step 3: Parse Gemini output into typed models
        analysis = [IngredientAnalysis(**item) for item in gemini_result["analysis"]]

        # Step 4: Safety decision
        result = evaluate_safety(
            analysis=analysis,
            user_restrictions=profile.restrictions,
            extracted_text=ocr_data["full_text"]
        )

        return JSONResponse(content={
            "status": "success",
            **result.model_dump()
        })

    except json.JSONDecodeError:
        return JSONResponse(status_code=422, content={
            "status": "error",
            "message": "Gemini returned unparseable JSON. Try again."
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "status": "error",
            "message": str(e)
        })