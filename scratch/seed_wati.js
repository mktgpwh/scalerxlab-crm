const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedWati() {
  const credentials = {
    isActive: true,
    endpoint: "https://live-mt-server.wati.io/1046844",
    accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6Im1rdGdwd2hAZ21haWwuY29tIiwibmFtZWlkIjoibWt0Z3B3aEBnbWFpbC5jb20iLCJlbWFpbCI6Im1rdGdwd2hAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMDQvMTMvMjAyNiAxMDo1OTowNCIsInRlbmFudF9pZCI6IjEwNDY4NDQiLCJkYl9uYW1lIjoibXQtcHJvZC1UZW5hbnRzIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiQURNSU5JU1RSQVRPUiIsImV4cCI6MjUzNDAyMzAwODAwLCJpc3MiOiJDbGFyZV9BSSIsImF1ZCI6IkNsYXJlX0FJIn0.GfXv818DpzXHXUwb-KtxLJn4T6-ld7Xi8Tw_4hFAmIQ",
    channelPhoneNumber: "9109114894" // Pahlajani WABA Number
  };

  const settings = await prisma.systemSettings.findFirst({ where: { id: "singleton" } });
  
  if (settings) {
    const integrations = (settings.integrations as any) || {};
    await prisma.systemSettings.update({
        where: { id: "singleton" },
        data: {
            integrations: {
                ...integrations,
                wati: credentials
            }
        }
    });
    console.log("✅ WATI_CREDENTIALS_PERSISTED");
  }
}

seedWati();
