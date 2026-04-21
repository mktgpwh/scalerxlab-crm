const Groq = require("groq-sdk");
require("dotenv").config();

async function testGroq() {
    console.log("📡 Testing Groq Connectivity...");
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
        console.error("❌ GROQ_API_KEY is missing in .env");
        return;
    }

    const groq = new Groq({ apiKey });

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a test assistant. Return JSON: { \"status\": \"ok\" }" },
                { role: "user", content: "ping" }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        console.log("✅ Groq Response:", completion.choices[0].message.content);
    } catch (error) {
        console.error("💥 Groq API Error:", error.message);
        if (error.status) console.error("Status Code:", error.status);
    }
}

testGroq();
