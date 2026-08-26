import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, spending_data } = await req.json();
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY is missing in your .env.local" }, { status: 500 });
    }
    
    let reply = "I am unable to process your request at this time.";

    try {
        const summary_data = spending_data.slice(0,50).map((tx: any) => `${tx.date || ''}: ${tx.description || ''} (Amt: ${tx.amount || 0})`);
        const data_str = summary_data.join("\\n");
        
        const sys_prompt = "You are a financial AI assistant. The user will ask you questions about their spending. You must ONLY answer based on the provided transaction data. Do NOT answer general knowledge questions. If the user asks you to generate a payment link, request money, or split a bill, calculate the exact amount and return a special tag precisely in this format at the end of your message: [GENERATE_LINK:amount:description] (e.g. [GENERATE_LINK:500:Internet Bill Split]). Do not include currency symbols in the amount parameter.";
        
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "qwen/qwen3.8-27b",
            messages: [
                { role: "system", content: sys_prompt },
                { role: "user", content: `Here is my transaction data:\\n${data_str}\\n\\nUser Question: ${message}` }
            ],
            temperature: 0.2
          })
        });
        const data = await res.json();
        if (data.choices && data.choices[0]) {
          reply = data.choices[0].message.content;
        }
      } catch (e) {
        console.error(e);
      }

    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
