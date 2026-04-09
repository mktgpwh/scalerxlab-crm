import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { leadName, intent, score, notes, organizationName } = await req.json();

    if (!leadName) {
      return NextResponse.json({ error: "Missing lead name" }, { status: 400 });
    }

    const prompt = `
      You are a high-performance Sales Assistant for ${organizationName || "a Hospital/School"}.
      Draft a personalized WhatsApp message for a lead named ${leadName}.
      
      Lead Context:
      - AI Intent Category: ${intent}
      - Priority Score: ${score}/100
      - System Notes: ${notes || "New inquiry"}
      
      Requirements:
      1. Professional yet warm tone.
      2. Keep it under 250 characters.
      3. Use appropriate emojis for healthcare/education context.
      4. End with a soft call to action.
      5. Do not include placeholders like [Your Name]. Use the brand name ${organizationName}.
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You draft high-conversion WhatsApp messages for sales leads." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content;

    return NextResponse.json({ reply });

  } catch (error) {
    console.error("[AI_DRAFT_REPLY_ERROR]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to generate reply" }, { status: 500 });
  }
}
