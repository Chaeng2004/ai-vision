import google.generativeai as genai
import os
import json
from dotenv import load_dotenv
from models.schemas import IngredientAnalysis

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

def classify_ingredients(ingredients_text: str, user_restrictions: list[str]) -> dict:
    """
    Sends extracted ingredient text to Gemini.
    Returns structured classification + ingredient list.
    """

    prompt = f"""
You are a supplement ingredient safety expert.

Analyze the following text extracted from a supplement label and do two things:

1. Extract the actual list of ingredients (ignore dosage info, brand names, warnings).
2. For each ingredient, classify it using this exact JSON structure.

User dietary restrictions: {', '.join(user_restrictions) if user_restrictions else 'none specified'}

Label text:
\"\"\"{ingredients_text}\"\"\"

Return ONLY a valid JSON object. No markdown, no explanation, no backticks.

Format:
{{
  "ingredients_detected": ["ingredient1", "ingredient2"],
  "analysis": [
    {{
      "ingredient": "gelatin",
      "classification": "porcine",
      "is_halal_concern": true,
      "is_vegan_concern": true,
      "allergen_flags": [],
      "notes": "Usually derived from pig skin unless specified bovine"
    }}
  ]
}}

Classification must be one of: porcine, bovine, animal_derived, plant, synthetic, unknown.
allergen_flags must only contain items from: nuts, gluten, dairy, soy, shellfish, eggs, fish.
If unsure, use "unknown" — do not guess.
"""

    response = model.generate_content(prompt)
    raw = response.text.strip()

    # Strip accidental markdown fences if Gemini adds them
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    parsed = json.loads(raw)
    return parsed