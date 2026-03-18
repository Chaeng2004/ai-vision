const express = require('express');
const cors = require('cors');
const Fuse = require('fuse.js');

const app = express();
app.use(cors());
app.use(express.json());

const porkDerivativesDB = [
    { name: "Gelatin", status: "No-Go", message: "Highly likely to be porcine (pork) derived." },
    { name: "Collagen", status: "Warning", message: "Can be derived from bovine, marine, or porcine sources. Check for Halal certification." },
    { name: "Magnesium Stearate", status: "Warning", message: "Stearic acid can be animal or plant-based. Requires verification." }
];

const allergenDB = [
    { name: "Milk", status: "No-Go", message: "Contains Dairy." },
    { name: "Soy", status: "No-Go", message: "Contains Soy." },
    { name: "Fish", status: "No-Go", message: "Contains Fish/Marine ingredients." }
];


const fuseOptions = { keys: ['name'], threshold: 0.3, includeScore: true };
const porkMatcher = new Fuse(porkDerivativesDB, fuseOptions);
const allergenMatcher = new Fuse(allergenDB, fuseOptions);


app.post('/verify-ingredients', (req, res) => {
    const { extracted_text, user_allergens } = req.body;

    if (!extracted_text || !Array.isArray(extracted_text)) {
        return res.status(400).json({ error: "Missing or invalid 'extracted_text' array." });
    }

    let safetyProfile = {
        overall_status: "Go", 
        alerts: []
    };

    extracted_text.forEach(word => {
      
        const porkMatch = porkMatcher.search(word);
        if (porkMatch.length > 0 && porkMatch[0].score < 0.4) {
            const ingredientInfo = porkMatch[0].item;
            safetyProfile.alerts.push({
                found_text: word,
                matched_ingredient: ingredientInfo.name,
                issue: "Animal Derivative / Halal",
                message: ingredientInfo.message,
                status: ingredientInfo.status
            });
            
           
            if (ingredientInfo.status === "No-Go") safetyProfile.overall_status = "No-Go";
          
            else if (ingredientInfo.status === "Warning" && safetyProfile.overall_status !== "No-Go") {
                safetyProfile.overall_status = "Warning";
            }
        }

        if (user_allergens && user_allergens.length > 0) {
            const allergenMatch = allergenMatcher.search(word);
            if (allergenMatch.length > 0 && allergenMatch[0].score < 0.4) {
                const allergenInfo = allergenMatch[0].item;
                
                if (user_allergens.includes(allergenInfo.name)) {
                    safetyProfile.alerts.push({
                        found_text: word,
                        matched_ingredient: allergenInfo.name,
                        issue: "Allergen",
                        message: allergenInfo.message,
                        status: "No-Go"
                    });
                    safetyProfile.overall_status = "No-Go";
                }
            }
        }
    });

    return res.json(safetyProfile);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`AI Node.js Brain is running on http://localhost:${PORT}`);
});