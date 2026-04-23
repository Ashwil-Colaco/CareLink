import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function list() {
  try {
    console.log("Testing model gemini-2.0-flash...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("test");
    console.log("Success! Response text:", result.response.text());
  } catch (e: any) {
    console.error("Error:", e.message);
    if (e.response) {
      console.error("Response data:", JSON.stringify(e.response.data, null, 2));
    }
  }
}

list();
