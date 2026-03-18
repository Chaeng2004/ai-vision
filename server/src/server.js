const express = require('express');
const cors = require('cors');
const Fuse = require('fuse.js');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
app.use(cors());
app.use(express.json());


let allergenDB = [];
let porkDerivativesDB = [];

// Helper function to read CSVs cleanly using Promises
function loadCSV(filePath, processRow) {
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => processRow(row))
            .on('end', resolve)
            .on('error', reject);
    });
}

console.log("Loading datasets into memory. Please wait...");

// Load both datasets simultaneously
Promise.all([
    // 1. Load Allergens Database
    loadCSV('./data/allergens.csv', (row) => {
        if (row.ingredient) {
            allergenDB.push({
                name: row.ingredient.trim(),
                status: "No-Go",
                message: `Flagged as an allergen category: ${row.allergens}`
            });
        }
    }),
    
    // 2. Load Pork/Halal Database
    loadCSV('./data/porkderive.csv', (row) => {
        // The 'sneaky_found' column sometimes has multiple words (e.g., "bacon, pork"). 
        // We split them by comma so the AI checks them individually!
        if (row.sneaky_found) {
            const badWords = row.sneaky_found.split(',');
            badWords.forEach(word => {
                const cleanWord = word.trim();
                // Avoid adding duplicate words to keep the AI fast
                if (!porkDerivativesDB.some(item => item.name === cleanWord)) {
                    porkDerivativesDB.push({
                        name: cleanWord,
                        status: "No-Go",
                        message: `Flagged as Non-Halal / Pork Derivative: ${cleanWord}`
                    });
                }
            });
        }
    })
]).then(() => {
    console.log(`✅ Loaded ${allergenDB.length} allergens!`);
    console.log(`✅ Loaded ${porkDerivativesDB.length} unique non-halal triggers!`);
    console.log("Initializing AI Fuzzy Matching...");

    // Initialize Fuse.js ONLY AFTER the data is fully loaded
    const fuseOptions = { keys: ['name'], threshold: 0.3, includeScore: true };
    const allergenMatcher = new Fuse(allergenDB, fuseOptions);
    const porkMatcher = new Fuse(porkDerivativesDB, fuseOptions);

    // --- THE API ENDPOINT ---
    app.post('/verify-ingredients', (req, res) => {
        const { extracted_text, user_allergens } = req.body;
        
        if (!extracted_text || !Array.isArray(extracted_text)) {
            return res.status(400).json({ error: "Missing 'extracted_text' array." });
        }

        let safetyProfile = { overall_status: "Go", alerts: [] };

        // Check every single word found by your Python OCR
        extracted_text.forEach(word => {
            
            // 1. Halal / Pork Check
            const porkMatch = porkMatcher.search(word);
            if (porkMatch.length > 0 && porkMatch[0].score < 0.4) {
                const ingredientInfo = porkMatch[0].item;
                safetyProfile.alerts.push({
                    found_text: word,
                    matched_ingredient: ingredientInfo.name,
                    issue: "Non-Halal / Animal Derivative",
                    message: ingredientInfo.message,
                    status: ingredientInfo.status
                });
                safetyProfile.overall_status = "No-Go";
            }

            // 2. Allergen Check (Only if user has allergens enabled)
            if (user_allergens && user_allergens.length > 0) {
                const allergenMatch = allergenMatcher.search(word);
                if (allergenMatch.length > 0 && allergenMatch[0].score < 0.4) {
                    const allergenInfo = allergenMatch[0].item;
                    
                    // We check if the matched allergen category (e.g., "['tree nuts']") 
                    // matches anything the user specifically flagged.
                    const userHasAllergen = user_allergens.some(userAlg => 
                        allergenInfo.message.toLowerCase().includes(userAlg.toLowerCase())
                    );

                    if (userHasAllergen) {
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

    // Start the server
    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`🚀 KitaVita Node.js Brain is running on http://localhost:${PORT}`);
    });

}).catch(err => {
    console.error("Failed to load datasets:", err);
});