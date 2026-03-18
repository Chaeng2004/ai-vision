from fastapi.responses import JSONResponse
from fastapi import UploadFile
from services.ocr_service import extract_text_from_image
from services.gemini_service import classify_ingredients
from services.safety_service import evaluate_safety
from models.schemas import UserProfile, IngredientAnalysis
import json

def _normalize_classification(value: object) -> str:
    v = (value or "unknown")
    if not isinstance(v, str):
        return "unknown"
    v = v.strip().lower()
    v = v.replace("-", "_").replace(" ", "_")
    mapping = {
        "allegen": "allergen",
        "allergn": "allergen",
        "allergan": "allergen",
        "animalderived": "animal_derived",
        "animal_derivative": "animal_derived",
    }
    return mapping.get(v, v)

def _normalize_analysis_items(items: object) -> list[dict]:
    if not isinstance(items, list):
        return []
    out: list[dict] = []
    for it in items:
        if not isinstance(it, dict):
            continue
        it2 = dict(it)
        it2["classification"] = _normalize_classification(it2.get("classification"))
        out.append(it2)
    return out

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
        normalized_items = _normalize_analysis_items(gemini_result.get("analysis"))
        analysis = [IngredientAnalysis(**item) for item in normalized_items]

        # Step 4: Safety decision
        result = evaluate_safety(
            analysis=analysis,
            user_restrictions=profile.restrictions,
            extracted_text=ocr_data["full_text"]
        )

        return JSONResponse(content={
            "status": "success",
            "ingredients_detected": gemini_result.get("ingredients_detected") or result.ingredients_detected,
            "report": gemini_result.get("report"),
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