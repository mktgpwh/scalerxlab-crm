/**
 * Tata Smartflo Cloud Telephony Client
 * Pattern-based implementation for ScalerX Hub integration.
 * In a production environment, swap placeholders with actual TATA API endpoints and credentials.
 */

export interface TataCallPayload {
  to: string;
  from: string;
  agentId?: string;
  organizationId: string;
  uui?: string; // User-to-User Information for context passing
}

export class TataSmartfloClient {
  private apiToken: string;
  private baseUrl: string;

  constructor() {
    this.apiToken = process.env.TATA_API_TOKEN || "PLACEHOLDER_TOKEN";
    this.baseUrl = "https://api.smartflo.tata-tele.com/v1";
  }

  /**
   * Triggers an outbound call using Click-to-Call (C2C)
   * Tata Smartflo Logic: Leg A (Agent) is dialed first. Upon answer, Leg B (Lead) is dialed.
   */
  async makeCall(payload: TataCallPayload) {
    const targetUrl = `${this.baseUrl}/click-to-call`;
    console.log(`[TATA_SMARTFLO] Dialing Tata URL: ${targetUrl}`);
    console.log(`[TATA_SMARTFLO] Payload: ${JSON.stringify({ agent: payload.agentId, to: payload.to })}`);
    
    try {
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_number: payload.agentId,
          destination_number: payload.to,
          virtual_number: payload.from,
          custom_identifier: payload.organizationId,
          uui: payload.uui
        }),
      });

      // Handle the case where the response might not be JSON
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (pErr) {
        throw new Error(`Non-JSON Response: ${text.slice(0, 100)}`);
      }

      if (!response.ok) {
        const errorDetail = data.message || data.error || data.status || "Unknown Provider Error";
        console.error(`[TATA_SMARTFLO_API_ERROR] ${response.status}: ${errorDetail}`);
        return {
          success: false,
          error: "Tata API Rejection",
          details: errorDetail
        };
      }

      return {
        success: true,
        callId: data.call_id || `tata_${Math.random().toString(36).substr(2, 9)}`,
        message: "Call bridge initiated successfully"
      };
    } catch (error: any) {
      console.error("[TATA_SMARTFLO_NETWORK_FATAL]", error.message);
      return {
        success: false,
        error: "Tata API Network Failure",
        details: error.message || "An unexpected error occurred during the handshake."
      };
    }
  }

  /**
   * Processes incoming webhook payloads (CDR) from Tata Smartflo
   */
  parseWebhook(payload: any) {
    // CDR attributes: call_id, direction, caller_number, destination_number, duration, recording_url, status
    return {
      callId: payload.call_id,
      tataCallId: payload.call_id,
      direction: payload.direction?.toUpperCase() === "INBOUND" ? "INBOUND" : "OUTBOUND",
      from: payload.caller_number,
      to: payload.destination_number,
      status: this.mapStatus(payload.status || payload.disposition),
      duration: parseInt(payload.duration || "0"),
      recordingUrl: payload.recording_url || payload.recording_path,
      startTime: payload.start_time,
      endTime: payload.end_time,
      metadata: payload // Store raw payload for audit
    };
  }

  private mapStatus(tataStatus: string = ""): any {
    const s = tataStatus.toLowerCase();
    if (s.includes("answered") || s.includes("success")) return "CONNECTED";
    if (s.includes("missed") || s.includes("no-answer")) return "MISSED";
    if (s.includes("busy")) return "BUSY";
    if (s.includes("rejected") || s.includes("declined")) return "REJECTED";
    if (s.includes("failed")) return "FAILED";
    if (s.includes("cancel")) return "CANCELLED";
    return "MISSED";
  }
}

export const tataClient = new TataSmartfloClient();
