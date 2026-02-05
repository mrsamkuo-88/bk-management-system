import { GoogleGenAI, Type } from "@google/genai";
import { Order, Vendor, VendorRole } from "../types";

// Safe initialization
const apiKey = process.env.API_KEY || (import.meta as any).env?.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.warn("Gemini API Key is missing. AI features will be disabled.");
}

// System instruction for the "Ops Brain"
const DASHBOARD_SYSTEM_PROMPT = `
You are the central intelligence (Antigravity) for 'BLOCK& Catering'. 
Your job is to analyze order status and identify risks.
Focus on:
1. Vendors who haven't confirmed within T-1 days (Emergency).
2. Vendors with low reliability scores assigned to high-value orders.
3. Inconsistencies between order requirements and vendor capabilities.
Provide a concise, bulleted risk report in Traditional Chinese (繁體中文).
Tone: Professional, Alert, Operational.
`;

// System instruction for the "Vendor Task Generator"
const TASK_SYSTEM_PROMPT = `
You are an operational assistant creating execution checklists for catering vendors.
Read the full order details and extract ONLY the relevant information for the specific vendor role.
Highlight Critical Critical Control Points (HACCP/Safety/Timing).
Keep it under 80 words. Tone: Professional, Urgent, Precise.
Output language: Traditional Chinese (繁體中文).
`;

export const GeminiService = {
  /**
   * Generates a specific task summary for a vendor based on the master order.
   */
  async generateVendorTaskSummary(order: Order, vendorRole: string): Promise<string> {
    try {
      const prompt = `
        Role: ${vendorRole}
        Event: ${order.eventName} (${order.eventDate})
        Guests: ${order.guestCount}
        Location: ${order.location}
        Notes: ${order.specialRequests}
        
        Generate the execution summary for this vendor in Traditional Chinese.
      `;

      if (!ai) return "AI 尚未設定 (API Key Missing)";

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: TASK_SYSTEM_PROMPT,
          thinkingConfig: { thinkingBudget: 0 } // Speed over deep thought for this
        }
      });

      return response.text || "無法取得摘要。";
    } catch (error) {
      console.error("Gemini Task Gen Error:", error);
      return "嚴重：請人工查閱系統完整訂單細節。";
    }
  },

  /**
   * Analyzes the current dashboard state to give Ops a "Morning Briefing".
   */
  async getDashboardRiskAnalysis(tasks: any[], orders: any[]): Promise<string> {
    try {
      // Light preprocessing to save tokens
      const urgentTasks = tasks.filter((t: any) => t.status === 'EMERGENCY' || t.status === 'WARNING');
      const context = JSON.stringify({
        urgentCount: urgentTasks.length,
        urgentDetails: urgentTasks.map((t: any) => ({
          id: t.id,
          vendor: t.vendorId,
          status: t.status,
          reminded: t.lastRemindedAt
        })),
        totalOrders: orders.length
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Current System State: ${context}. Provide a risk assessment summary for the operations manager in Traditional Chinese.`,
        config: {
          systemInstruction: DASHBOARD_SYSTEM_PROMPT,
          thinkingConfig: { thinkingBudget: 1024 } // Allow some reasoning for risk assessment
        }
      });

      return response.text || "系統狀態正常。";
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      return "AI 風險分析暫時離線。請人工檢查紅色警示項目。";
    }
  }
};