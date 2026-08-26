import { NextResponse } from 'next/server';

export async function POST() {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY is missing in your .env.local" }, { status: 500 });
  }
  
  let roast = "Unable to generate roast at this time.";
  
  try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "qwen/qwen3.8-27b",
          messages: [{ role: "user", content: "Write a short, ruthless, funny roast of someone who spends too much money on useless things. Max 2 sentences." }],
          temperature: 0.9
        })
      });
      const data = await res.json();
      if (data.choices && data.choices[0]) {
        roast = data.choices[0].message.content;
      }
    } catch (e) {
      console.error(e);
    }

  return NextResponse.json({ roast });
}
