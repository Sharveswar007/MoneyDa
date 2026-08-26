import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { amount, description } = await req.json();

    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Razorpay API Keys are missing in .env.local" }, { status: 500 });
    }

    // Amount must be in paise for INR
    const amountInPaise = Math.round(parseFloat(amount) * 100);

    const authHeader = "Basic " + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

    const res = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        accept_partial: false,
        description: description || "MoneyDa AI Generated Link",
        customer: {
          name: "MoneyDa Split Buddy",
          contact: "+919999999999",
          email: "buddy@example.com"
        },
        notify: {
          sms: false,
          email: false
        },
        reminder_enable: false,
        notes: {
          policy_name: "MoneyDa Split Bill"
        }
      })
    });

    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.description || "Failed to generate link" }, { status: 500 });
    }

    return NextResponse.json({ short_url: data.short_url, id: data.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
