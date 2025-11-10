const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai')

// 1. SECURE FIX: The client automatically reads the GEMINI_API_KEY from process.env
// (You must use the 'dotenv' package in your main server file to load it)
const genAI = new GoogleGenAI({}); 

// Generate Summary
router.post('/summarize', async (req, res) => {
    try {
        const { text, length } = req.body;
        
        // 2. LOGIC FIX: Check for the actual text content, not its length
        if (!text || text.length === 0) {
            return res.status(400).json({ error: 'Text content is missing.' });
        }
        
        // CORRECTION: The prompt must include the actual 'text' variable, not 'text.length'
        const prompt = `Summarize the following text in a concise, professional way, limited to a maximum of ${length} sentences. TEXT: """${text}"""`;

        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: prompt,
        });

        res.json({ summary: response.text });
        
    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({ error: 'Failed to generate summary.' });
    }
});

module.exports = router;