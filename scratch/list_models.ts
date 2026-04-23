import axios from "axios";
import "dotenv/config";

const apiKey = process.env.GEMINI_API_KEY || "";

async function list() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    console.log("Fetching models from:", url.replace(apiKey, "REDACTED"));
    const response = await axios.get(url);
    console.log("Available models:");
    response.data.models.forEach((m: any) => console.log(`- ${m.name}`));
  } catch (e: any) {
    console.error("Error:", e.message);
    if (e.response) {
      console.error("Response data:", JSON.stringify(e.response.data, null, 2));
    }
  }
}

list();
