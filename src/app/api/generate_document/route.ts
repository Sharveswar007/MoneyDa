import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { action, description, amount } = await req.json();
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY is missing in your .env.local" }, { status: 500 });
    }
    
    let doc = "Unable to generate document at this time.";

    try {
        const prompt = action === "dispute"
          ? `Write a short, formal 3-sentence email to a bank disputing a charge of ${amount} for '${description}'. State it was unauthorized.`
          : `Write a short 3-sentence call script to customer service to negotiate a lower rate for a bill from '${description}' currently costing ${amount}.`;
        
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "qwen/qwen3.8-27b",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.4
          })
        });
        const data = await res.json();
        if (data.choices && data.choices[0]) {
          doc = data.choices[0].message.content;
        }
      } catch (e) {
        console.error(e);
      }

    return NextResponse.json({ document: doc });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
