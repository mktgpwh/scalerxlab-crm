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
    this.baseUrl = "https://api-smartflo.tatateleservices.com/v1";
  }

  /**
   * Triggers an outbound call using Click-to-Call (C2C)
   * Tata Smartflo Logic: Leg A (Agent) is dialed first. Upon answer, Leg B (Lead) is dialed.
   */
  async makeCall(payload: TataCallPayload) {
    const primaryUrl = `https://api-smartflo.tatateleservices.com/v1/click_to_call`;
    const secondaryUrl = `https://api.smartflo.tata-tele.com/v1/click-to-call`;
    
    const attemptFetch = async (targetUrl: string, isFallback: boolean = false) => {
      console.log(`[TATA_SMARTFLO] Dialing Tata URL (${isFallback ? 'FALLBACK' : 'PRIMARY'}): ${targetUrl}`);
      
      try {
        const response = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiToken}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          },
          body: JSON.stringify({
            agent_number: payload.agentId,
            destination_number: payload.to,
            caller_id: payload.from,
            virtual_number: payload.from, // Include both for cross-domain compatibility
            custom_identifier: payload.organizationId,
            uui: payload.uui,
            async: 1
          }),
        });

        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (pErr) {
          throw new Error(`Non-JSON Response: ${text.slice(0, 100)}`);
        }

        if (!response.ok) {
          const errorDetail = data.message || data.error || data.status || "Unknown Provider Error";
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
        const socketError = error.cause ? (typeof error.cause === 'object' ? JSON.stringify(error.cause) : String(error.cause)) : null;
        console.error(`[TATA_SMARTFLO_FETCH_ERROR] URL: ${targetUrl} | Message: ${error.message} | Cause: ${socketError}`);
        throw error; // Rethrow to trigger fallback or final catch
      }
    };

    try {
      // Primary Attempt
      return await attemptFetch(primaryUrl);
    } catch (primaryError: any) {
      console.warn(`[TATA_SMARTFLO_RETRY] Primary node failed, attempting fallback node...`);
      try {
        // Fallback Attempt
        return await attemptFetch(secondaryUrl, true);
      } catch (secondaryError: any) {
        const finalCause = secondaryError.cause ? (typeof secondaryError.cause === 'object' ? JSON.stringify(secondaryError.cause) : String(secondaryError.cause)) : "N/A";
        return {
          success: false,
          error: "Tata API Network Failure",
          details: `${secondaryError.message} (Cause: ${finalCause})`
        };
      }
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
