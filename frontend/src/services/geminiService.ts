
import { GoogleGenAI } from "@google/genai";
import { db } from "./dbStore";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSafetyInsights = async (driverId: number) => {
  const driver = db.getDriver(driverId);
  const events = db.safetyEvents.filter(e => e.driver_id === driverId);
  
  if (!driver) return "Driver not found.";

  const prompt = `
    Analyze the safety performance of driver ${driver.first_name} ${driver.last_name}.
    They have had ${events.length} safety events recently.
    Events: ${JSON.stringify(events.map(e => ({ date: e.event_date, note: e.notes, score: e.bonus_score })))}
    
    Provide a professional summary (max 3 sentences) for a supervisor regarding their bonus eligibility and any coaching needs.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional fleet safety manager analyst.",
        temperature: 0.7
      }
    });
    return response.text || "No insights available at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unable to connect to AI insights. Please check API configuration.";
  }
};
