import dotenv from 'dotenv';
dotenv.config();

async function testGemini() {
  console.log("Checking GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");
  
  if (!process.env.GEMINI_API_KEY) return;
  
  const modelName = 'gemini-3.1-flash-lite-preview';
  const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  
  const payload = {
    contents: [
      { role: "user", parts: [{ text: "Tampilkan mesin yang sedang downtime" }] }
    ],
    systemInstruction: {
      parts: [{ text: "You are a test router." }]
    },
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1
    }
  };

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    console.log("Gemini API Status:", response.status, response.statusText);
    const data = await response.text();
    console.log("Gemini Response Data:", data.substring(0, 500));
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

testGemini();
