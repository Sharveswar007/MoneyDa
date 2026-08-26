import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY is missing. Please add it to your .env.local file." }, { status: 500 });
    }

    try {
      // Ensure the image string starts with the proper data URL prefix if it doesn't already
      let base64Url = image;
      if (!base64Url.startsWith('data:image')) {
          base64Url = `data:image/jpeg;base64,${base64Url}`;
      }

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "qwen/qwen3.8-27b",
          messages: [
            {
              role: "user",
              content: [
                { 
                  type: "text", 
                  text: "Analyze this receipt image. Extract the Merchant name, the total Amount paid (as a number), the Date, and the Currency code (e.g., USD, INR, EUR, GBP). Return ONLY a pure JSON object in this exact format: {\"merchant\": \"Merchant Name\", \"amount\": 12.34, \"date\": \"YYYY-MM-DD\", \"currency\": \"USD\"}. Do not include any markdown formatting, backticks, or other text." 
                },
                { 
                  type: "image_url", 
                  image_url: { url: base64Url } 
                }
              ]
            }
          ],
          temperature: 0.1
        })
      });

      const data = await res.json();

      if (data.error) {
         console.error("Groq Error:", data.error);
         return NextResponse.json({ error: data.error.message || "Failed to process image with Groq Vision API" }, { status: 500 });
      }

      if (data.choices && data.choices[0]) {
        let content = data.choices[0].message.content.trim();
        // Sometimes the LLM might still wrap in markdown despite instructions
        if (content.startsWith('```json')) {
            content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        }
        const parsed = JSON.parse(content);
        return NextResponse.json(parsed);
      }
      
      return NextResponse.json({ error: "No response from AI." }, { status: 500 });

    } catch (e: any) {
      console.error(e);
      return NextResponse.json({ error: e.message || "Failed to parse receipt." }, { status: 500 });
    }

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
