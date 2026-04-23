import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReceptionTodayPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Today's Appointments</h1>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800 ai-glass">
        <CardHeader>
          <CardTitle className="text-zinc-400 font-medium">Reception Console</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-zinc-500 italic">
            Patient check-in module initializing... Waiting for scheduled appointments.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
