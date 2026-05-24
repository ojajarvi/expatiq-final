import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize server-side Gemini client securely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("GEMINI_API_KEY environment variable is not defined. AI components will run in high-fidelity sandbox simulation mode.");
}

// AI tax residency insights route proxy
app.post("/api/gemini/insights", async (req, res) => {
  try {
    const { travelLogs, taxRules, currentCountryCode, simulatedCountry } = req.body;

    // Craft a highly clear, elegant contextual analysis prompt without exposing keys or infrastructure
    const logsDescription = travelLogs.map((log: any) => 
      `- Spent time in ${log.countryName} (${log.countryCode}) from ${log.entryDate} to ${log.exitDate || 'Present'} (${log.verifiedMethod})`
    ).join("\n");

    const rulesDescription = taxRules.map((rule: any) => 
      `- ${rule.countryName}: Limit is ${rule.maxDaysLimit} days, Warning trigger at threshold of ${rule.warningThresholdDays} days.${rule.minDaysRequired ? ` Requires minimum stay of ${rule.minDaysRequired} days.` : ''}`
    ).join("\n");

    const simulationContext = simulatedCountry 
      ? `\n*SIMULATION PREVIEW*: The user is considering staying an additional ${simulatedCountry.days} days in ${simulatedCountry.countryName} (${simulatedCountry.countryCode}) starting from ${simulatedCountry.startDate}.` 
      : "";

    const systemPrompt = `You are EXPATIQ's Elite Residency Intelligence Core, a highly intelligent global mobility and residency advisor for digital nomads, Monaco/Dubai residents, venture capital partners, and international athletes. 
Your goal is to provide meticulous, premium, and actionable strategic advice based on the user's travel timeline and custom residency rules. 
Be precise to the single day. Maintain a calm, professional, high-end, elegant editorial tone. Never declare legal finality, always append a premium disclaimer. Show numeric calculations of days spent, remaining buffer days before triggering tax residency automatically, and alert the user of dynamic consequences.`;

    const userPrompt = `Analyze this travel profile:
--- TRAVEL TIMELINE ---
${logsDescription || 'No travel records logged yet.'}

--- CORE TAX RESIDENCY RULES ---
${rulesDescription}
${simulationContext}

--- CURRENT LOCATION ---
User's active country: ${currentCountryCode || 'Unknown'}

Please compile:
1. Active Risk Matrix: Country-by-country breakdown of days remaining, current risk color (GREEN, YELLOW, RED), and warning triggers.
2. Immediate Action Recommendations: Concrete sequence of exits or entries needed to comply with specified thresholds.
3. Simulation Impact (if simulation context provided): Confirm whether the simulated stay triggers compliance alarms.
4. Professional Offshore Structuring Warning.

Keep the text beautifully structured, clear, and action-focused. Format your response cleanly as rich structured advice.`;

    if (!ai) {
      // Elegant return if API key is not yet configured (fallback mock output for visual previews)
      return res.json({
        success: true,
        text: `### ♛ EXPATIQ AI Residency Status Summary (DEMO MODE)

Your current parameters are calculated correctly.
- **Monaco**: spent: 45 days. Buffer remaining: **45 days** before minimum stay rule validation (Warning at 90 days).
- **Finland**: spent: 165 days. Warning status: **YELLOW**. Threshold limit (183 days) will be exceeded on September 14.
- **United Arab Emirates**: spent: 22 days. Status is **GREEN (Safe)**.

#### Recommended Action Plan
1. **Finland Stay Limit Avoidance**: plan departure by or before September 5 to maintain a comfortable safety margin of 10 days.
2. **Monaco Compliance**: ensure entry and physical presence for at least 45 more days to secure physical presence status.

*EXPATIQ disclaimer: Calculations are simulator results for compliance advisory estimation only. Consult certified advisors in each jurisdiction.*`
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
      }
    });

    res.json({
      success: true,
      text: response.text
    });

  } catch (error: any) {
    console.error("Gemini Compliance API error: ", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate compliance insights"
    });
  }
});

// Serve health status
app.get("/api/health", (req, res) => {
  res.json({ status: "system-nominal", timestamp: new Date().toISOString() });
});

// Setup dev server with Vite middleware OR serve static files
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static clean bundle in Production mode.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[NOMINAL] EXPATIQ server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
