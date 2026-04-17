import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const geminiService = {
  async analyzeLabReport(base64Image: string, mimeType: string) {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", // Using 1.5 flash for fast image processing
      contents: [
        {
          parts: [
            { inlineData: { data: base64Image, mimeType } },
            { text: "Analyze this lab report. Extract all biomarker values (name, value, unit, reference range). For each: determine status (normal/low/high), explain what it means in plain English, and give a lifestyle tip. Also provide a general summary, 3 lifestyle tips, and 3 questions for a doctor. Return in strict JSON format." }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            results: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  value: { type: Type.STRING },
                  unit: { type: Type.STRING },
                  range: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ["normal", "low", "high"] },
                  meaning: { type: Type.STRING },
                  tip: { type: Type.STRING }
                },
                required: ["name", "value", "unit", "range", "status", "meaning", "tip"]
              }
            },
            lifestyleTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            doctorQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "results", "lifestyleTips", "doctorQuestions"]
        }
      }
    });

    return JSON.parse(response.text);
  },

  async estimateCalories(input: string) {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Estimate calories and macros (protein, carbs, fat in grams) for: "${input}". Return as JSON. Object: { calories: number, protein: number, carbs: number, fat: number, breakdown: string }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
            breakdown: { type: Type.STRING }
          },
          required: ["calories", "protein", "carbs", "fat", "breakdown"]
        }
      }
    });
    return JSON.parse(response.text);
  },

  async chatWithContext(message: string, healthContext: any) {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      config: {
        systemInstruction: "You are 'Body Debugger AI', a helpful health assistant for Indian students. Use the provided health logs to explain why someone might be feeling a certain way. Be empathetic, use clear language, and avoid medical jargon. Always suggest seeing a doctor if things sound serious. Provided context: " + JSON.stringify(healthContext)
      },
      contents: message
    });
    return response.text;
  }
};
