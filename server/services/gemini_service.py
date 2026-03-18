import os
import json
from dotenv import load_dotenv
from models.schemas import IngredientAnalysis

load_dotenv()

from google import genai

_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if not _api_key:
    raise RuntimeError("Missing GEMINI_API_KEY (or GOOGLE_API_KEY) in environment.")

client = genai.Client(api_key=_api_key)
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


def _extract_json(text: str) -> str:
    """
    Extract a JSON object from a model response.
    Handles accidental markdown fences and trailing prose.
    """
    t = (text or "").strip()
    if not t:
        raise ValueError("No text response received from Gemini.")

    # Handle fenced blocks: ```json { ... } ```
    if "```" in t:
        parts = t.split("```")
        # pick the biggest chunk that contains a JSON object
        candidates = [p.strip() for p in parts if "{" in p and "}" in p]
        if candidates:
            t = max(candidates, key=len)
            if t.lower().startswith("json"):
                t = t[4:].strip()

    # Best-effort: slice from first { to last }
    start = t.find("{")
    end = t.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("No JSON object found in Gemini response.")
    return t[start : end + 1]

def classify_ingredients(ingredients_text: str, user_restrictions: list[str]) -> dict:
    """
    Sends extracted ingredient text to Gemini.
    Returns structured classification + ingredient list.
    """

    prompt = f"""
You are a supplement ingredient safety expert. Your job is to produce a clear, consumer-friendly safety report.

User dietary restrictions: {', '.join(user_restrictions) if user_restrictions else 'none specified'}

Label text (OCR, may contain errors):
\"\"\"{ingredients_text}\"\"\"

Return ONLY valid JSON. No markdown, no explanations.

Rules:
- If unsure, use \"unknown\" and set confidence \"low\".
- Use short, plain language in report text (avoid jargon).
- Keep items feasible: only claim what can be inferred from the label text.

Output JSON schema:
{{
  "ingredients_detected": ["..."],
  "report": {{
    "summary": "1-2 sentences. Overall safety summary for the user's profile.",
    "highlights": ["3-6 bullets, short"],
    "next_steps": ["2-5 actionable steps the user can take"],
    "limitations": ["1-3 bullets about OCR/model uncertainty"]
  }},
  "analysis": [
    {{
      "ingredient": "as written on label",
      "normalized": "normalized/common name",
      "classification": "porcine|bovine|animal_derived|allergen|plant|synthetic|unknown",
      "confidence": "high|medium|low",
      "evidence": {{
        "matched_text": "substring from label that triggered this (or empty string)"
      }},
      "is_halal_concern": true|false,
      "is_vegan_concern": true|false,
      "allergen_flags": ["nuts|gluten|dairy|soy|shellfish|eggs|fish"],
      "why_flagged": "short reason tied to user restrictions (or empty string)",
      "notes": "plain-language helpful context (optional)"
    }}
  ]
}}
"""

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
    )

    raw_text = getattr(response, "text", None) or ""
    json_text = _extract_json(raw_text)
    return json.loads(json_text)