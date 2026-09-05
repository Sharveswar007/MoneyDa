import { NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const text = await file.text();
    
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    const transactions = parsed.data as any[];
    
    const rawTx = transactions.map((row: any) => {
       const keys = Object.keys(row);
       const dateKey = keys.find(k => k.toLowerCase().includes('date')) || keys[0];
       const descKey = keys.find(k => k.toLowerCase().includes('particular') || k.toLowerCase().includes('description')) || keys[1];
       const amtKey = keys.find(k => k.toLowerCase().includes('amount') || k.toLowerCase().includes('withdrawal')) || keys[2];
       
       let date = row[dateKey];
       let desc = String(row[descKey] || '');
       let amtStr = String(row[amtKey] || '0').replace(/,/g, '');
       let amt = parseFloat(amtStr);
       
       if (isNaN(amt)) amt = 0;
       
       // Handle HDFC style where withdrawal is separate from deposit
       const depositKey = keys.find(k => k.toLowerCase().includes('deposit'));
       if (depositKey && amt === 0) {
           let depStr = String(row[depositKey] || '0').replace(/,/g, '');
           let dep = parseFloat(depStr);
           if (!isNaN(dep) && dep > 0) amt = dep;
           else amt = -Math.abs(amt); // Force negative if it was a withdrawal
       } else {
           if (keys.find(k => k.toLowerCase().includes('withdrawal')) && amt > 0) {
               amt = -amt;
           }
       }
       
       return { date, description: desc, amount: amt };
    });
    
    const categorized = rawTx.map(tx => {
      const desc = String(tx.description || '').toLowerCase();
      let cat = 'Other';
      if (desc.includes('zomato') || desc.includes('swiggy') || desc.includes('kfc') || desc.includes('mcdonalds')) cat = 'Dining Out';
      else if (desc.includes('amazon') || desc.includes('flipkart') || desc.includes('myntra')) cat = 'Shopping';
      else if (desc.includes('uber') || desc.includes('ola')) cat = 'Transport';
      else if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('aws')) cat = 'Subscriptions';
      else if (desc.includes('d-mart') || desc.includes('grocery') || desc.includes('reliance')) cat = 'Groceries';
      else if (desc.includes('rent')) cat = 'Housing';
      else if (tx.amount > 0) cat = 'Income';
      
      const is_impulse = (cat === 'Dining Out' || cat === 'Shopping') && tx.amount < -500;
      const is_surge = (cat === 'Transport') && tx.amount < -400;
      
      return { ...tx, category: cat, is_impulse, is_surge };
    });
    
    let summary = "AI Summary unavailable: Missing or invalid API key.";
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (GROQ_API_KEY) {
      try {
        const top50 = categorized.slice(0,50).map(t => `${t.date}: ${t.description} (Amt: ${t.amount})`).join('\\n');
        const prompt = `Act as a brutal financial auditor. Review these transactions and write a 3-paragraph summary of the user's spending habits. Be highly analytical, point out leaks, and mention specific merchants if relevant.\\n\\nTransactions:\\n${top50}`;
        
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "qwen/qwen3.8-27b",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3
          })
        });
        const data = await res.json();
        if (data.choices && data.choices[0]) {
          summary = data.choices[0].message.content;
        } else if (data.error) {
          summary = `AI Summary Failed: ${data.error.message}`;
        }
      } catch (e: any) {
        summary = `AI Summary Failed: Network error.`;
      }
    }
    
    // Calc daily burn roughly
    let burn = 0;
    categorized.forEach(t => { if (t.amount < 0) burn += Math.abs(t.amount); });
    const daily_burn = categorized.length > 0 ? burn / 30 : 0; 
    
    // Calculate broke date assuming a dummy 50000 balance for demo
    const remainingDays = daily_burn > 0 ? Math.floor(50000 / daily_burn) : 999;
    const brokeDateObj = new Date();
    brokeDateObj.setDate(brokeDateObj.getDate() + remainingDays);
    const broke_date = brokeDateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    
    return NextResponse.json({
       status: "success",
       categorized,
       predictions: {
         daily_burn,
         broke_date
       },
       summary
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
