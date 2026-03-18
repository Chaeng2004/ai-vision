from models.schemas import IngredientAnalysis, ScanResult

RESTRICTION_RULES = {
    "halal": {
        "blocked_classifications": ["porcine"],
        "reason": "Contains porcine (pork-derived) ingredients"
    },
    "halal_strict": {
        "blocked_classifications": ["porcine", "bovine"],
        "reason": "Contains animal-derived ingredients requiring halal certification"
    },
    "vegan": {
        "blocked_classifications": ["porcine", "bovine", "animal_derived"],
        "reason": "Contains animal-derived ingredients"
    },
    "vegetarian": {
        "blocked_classifications": ["porcine", "bovine"],
        "reason": "Contains meat-derived ingredients"
    },
}

ALLERGEN_RESTRICTION_MAP = {
    "nut_allergy": "nuts",
    "gluten_free": "gluten",
    "dairy_free": "dairy",
    "soy_free": "soy",
    "shellfish_allergy": "shellfish",
    "egg_free": "eggs",
    "fish_allergy": "fish",
}

def evaluate_safety(
    analysis: list[IngredientAnalysis],
    user_restrictions: list[str],
    extracted_text: list[str]
) -> ScanResult:

    flagged = []
    reasons = []

    for item in analysis:
        for restriction in user_restrictions:
            # Check classification-based rules
            if restriction in RESTRICTION_RULES:
                rule = RESTRICTION_RULES[restriction]
                if item.classification in rule["blocked_classifications"]:
                    flagged.append(item.ingredient)
                    reasons.append(f"{item.ingredient}: {rule['reason']}")

            # Check allergen-based rules
            if restriction in ALLERGEN_RESTRICTION_MAP:
                allergen = ALLERGEN_RESTRICTION_MAP[restriction]
                if allergen in item.allergen_flags:
                    flagged.append(item.ingredient)
                    reasons.append(f"{item.ingredient}: contains {allergen}")

    # Check for unknowns — worth surfacing as CAUTION
    unknowns = [i.ingredient for i in analysis if i.classification == "unknown"]

    if flagged:
        status = "NO_GO"
        verdict_reason = "; ".join(set(reasons))
        recommendation = (
            f"This supplement is NOT suitable for your profile. "
            f"Flagged: {', '.join(set(flagged))}. "
            f"Look for alternatives without these ingredients."
        )
    elif unknowns:
        status = "CAUTION"
        verdict_reason = f"Some ingredients could not be fully classified: {', '.join(unknowns)}"
        recommendation = (
            f"Proceed with caution. The following ingredients are unrecognized: "
            f"{', '.join(unknowns)}. Consult a pharmacist or the manufacturer."
        )
    else:
        status = "GO"
        verdict_reason = "All ingredients are compatible with your dietary profile."
        recommendation = "This supplement appears safe based on your dietary restrictions."

    return ScanResult(
        status_result=status,
        verdict_reason=verdict_reason,
        extracted_text=extracted_text,
        ingredients_detected=[i.ingredient for i in analysis],
        analysis=analysis,
        flagged_ingredients=list(set(flagged)),
        recommendation=recommendation
    )