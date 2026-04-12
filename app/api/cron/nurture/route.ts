import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";
import { sendMetaMessage, sendWhatsAppMessage } from "@/lib/ai/dispatch";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Indian Standard Time (IST) Quiet Hours configuration
const QUIET_HOURS_START = 22; // 10 PM
const QUIET_HOURS_END = 8;    // 8 AM

export async function GET(req: NextRequest) {
    // 1. Security Handshake
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 2. Quiet Hours Check (IST)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + istOffset);
        const hours = istTime.getUTCHours();

        const isQuietHours = hours >= QUIET_HOURS_START || hours < QUIET_HOURS_END;

        if (isQuietHours) {
            console.log(`[NURTURE_CRON] Currently in IST Quiet Hours (${hours}:00). Skipping dispatch.`);
            return NextResponse.json({ status: "skipped", reason: "quiet_hours" });
        }

        // 3. Meta-Safe Query (20-22 hour inactivity)
        // We find leads where AgentX is active and status is RAW/CONTACTED
        const twentyHoursAgo = new Date(now.getTime() - 22 * 60 * 60 * 1000);
        const twentyTwoHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000);

        const leadsToNurture = await prisma.lead.findMany({
            where: {
                aiChatStatus: 'AGENTX_ACTIVE',
                status: { in: ['RAW', 'CONTACTED'] },
                activityLogs: {
                    some: {
                        createdAt: {
                            gte: twentyHoursAgo,
                            lte: twentyTwoHoursAgo
                        }
                    }
                },
                // Ensure we haven't followed up yet
                NOT: {
                    metadata: {
                        path: ['followUpSent'],
                        equals: true
                    }
                }
            },
            include: {
                activityLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        console.log(`[NURTURE_CRON] Identified ${leadsToNurture.length} leads in the Meta-Safe window.`);

        const results = [];

        // 4. Processing Loop
        for (const lead of leadsToNurture) {
            const lastLog = lead.activityLogs[0];
            const lastMessage = lastLog?.description || "";
            const category = lead.category || "Clinical Consultation";

            // AI Generation: Context-Aware & Language Mirroring
            const systemPrompt = `You are AgentX at Pahlajani's Women's Hospital. 
            The patient was interested in ${category}. They haven't replied in 20 hours.
            Draft a warm, 1-sentence follow-up NUDGE.
            MIRROR their language and script based on: "${lastMessage}".
            Stay professional, empathetic, and guide them to book an appointment. 
            Do NOT give medical advice.`;

            const completion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: "Generate the follow-up nudge." }
                ],
                model: "llama-3.3-70b-versatile",
            });

            const nudge = completion.choices[0]?.message?.content || "Hi, just checking in if you had any more questions regarding your treatment?";

            // 5. Omnichannel Dispatch
            const source = lead.source;
            let dispatchResult;

            const dispatchParams = {
                leadId: lead.id,
                text: nudge,
                platform: source === 'WHATSAPP' ? 'whatsapp' : (source === 'INSTAGRAM_ADS' ? 'instagram' : 'facebook') as any,
                recipientId: (lead.metadata as any)?.senderId || lead.whatsappNumber || lead.id
            };

            if (source === 'WHATSAPP') {
                dispatchResult = await sendWhatsAppMessage(dispatchParams);
            } else {
                dispatchResult = await sendMetaMessage(dispatchParams);
            }

            // 6. Persistence & Logging
            if (dispatchResult.success) {
                await prisma.lead.update({
                    where: { id: lead.id },
                    data: {
                        metadata: {
                            ...(lead.metadata as any || {}),
                            followUpSent: true,
                            followUpId: dispatchResult.messageId
                        }
                    }
                });

                await prisma.activityLog.create({
                    data: {
                        leadId: lead.id,
                        action: "AI_FOLLOWUP_SENT",
                        description: nudge,
                        metadata: {
                            platform: source,
                            timestamp: new Date().toISOString()
                        }
                    }
                });

                results.push({ leadId: lead.id, status: "sent" });
            }
        }

        return NextResponse.json({ status: "success", processed: results.length, details: results });

    } catch (error) {
        console.error("[NURTURE_CRON] Critical Failure:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
