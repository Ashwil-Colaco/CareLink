import { GoogleGenerativeAI } from "@google/generative-ai";
import { AnalysisReport, AnalysisSynthesis } from "../types";

const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : (import.meta as any).env?.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

if (!apiKey && process.env.NODE_ENV === 'development') {
  console.warn("CareLink: GEMINI_API_KEY is not defined. AI features will be unavailable.");
}

function truncateData(data: string, maxChars: number = 15000): string {
  if (data.length <= maxChars) return data;
  return data.substring(0, maxChars) + "\n\n... [Note: Data truncated to ensure neural integrity] ...";
}

async function retryWithBackoff<T>(fn: () => Promise<T>, retries: number = 2): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.message?.includes("Rpc failed") || error.message?.includes("500") || error.message?.includes("429"))) {
      const waitTime = error.message?.includes("429") ? 3000 : 1500;
      console.warn(`Gemini API issue detected (possibly quota). Retrying with backoff... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return retryWithBackoff(fn, retries - 1);
    }
    throw error;
  }
}

// Internal helper to call the specific model
async function callGemini(prompt: string, isJson: boolean = false, useSearch: boolean = false) {
  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite-preview",
    generationConfig: isJson ? { responseMimeType: "application/json" } : undefined,
    tools: useSearch ? [{ googleSearchRetrieval: {} }] as any : undefined
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}


export async function directGlobalScanAndAnalyze(region: string = "Global", keywords: string[] = []): Promise<{ rawSummary: string, report: AnalysisReport }> {
  return retryWithBackoff(async () => {
    const keywordStr = keywords.length > 0 ? `\n      Focus specifically on these keywords/themes: ${keywords.join(', ')}.` : '';

    const prompt = `Perform a deep web scan for the ${region} region to detect emerging crises.${keywordStr}
      Focus on tracking:
      1. Recent medical supply chain failures or specialized equipment shortages.
      2. Infrastructure damage affecting humanitarian aid.
      3. Food insecurity, crop failures, or water contamination incidents.
      4. Emerging health threats or localized disease outbreaks.
      
      Output Structure (Strict JSON):
      {
        "rawSurveillanceSummary": "Write a detailed 3-paragraph summary of the specific news articles, NGO updates, and events you discovered.",
        "executiveSummary": "2-sentence impact-focused summary",
        "urgentNeeds": [
          {
            "priority": "Critical|High|Medium|Low",
            "location": "location name",
            "lat": 1.23,
            "lng": 4.56,
            "resourceRequired": "item/skill",
            "description": "brief context"
          }
        ],
        "resourceGaps": ["list of what is missing"],
        "potentialImpact": {
          "projection": "analysis of outcome if resources are allocated",
          "metrics": [{"label": "efficiency", "current": 0, "projected": 0}],
          "timeline": [{"period": "short-term", "expectedOutcome": "improvement description"}]
        },
        "actionPlan": ["immediate logistics steps"],
        "confidenceScore": 85,
        "volunteerOptimization": {
          "suggestedNGOs": ["relevant partners"],
          "volunteerMatchCount": 0,
          "skillsIdentified": ["medical", "logistics", "etc"]
        },
        "stakeholderViews": {
          "coordinator": "field perspective",
          "fieldDirector": "operational perspective",
          "donorRep": "funding/impact perspective"
        },
        "marketIntelligence": {
          "regionalTrends": ["str"],
          "demographicInsights": "str"
        },
        "strategicLevers": [
          {
            "name": "string",
            "description": "string",
            "min": 0,
            "max": 100,
            "current": 50,
            "unit": "string"
          }
        ],
        "chartTitle": "str",
        "chartData": [{"label": "str", "value": 10}]
      }`;

    const text = await callGemini(prompt, true, true);

    try {
      const parsed = JSON.parse(text);
      const rawSummary = parsed.rawSurveillanceSummary || "Global surveillance identified critical insights implicitly.";
      delete parsed.rawSurveillanceSummary;
      return { rawSummary, report: parsed as AnalysisReport };
    } catch (error) {
      console.error("Gemini Unified Scan Error:", error, text);
      throw new Error("Unified intelligence recon encountered a structural anomaly.");
    }
  });
}

export async function discoverRegionalIssues(region: string = "Global"): Promise<string> {
  return retryWithBackoff(async () => {
    const prompt = `Perform a deep web scan for the ${region} region. 
      Focus on tracking:
      1. Recent medical supply chain failures or specialized equipment shortages.
      2. Infrastructure damage affecting humanitarian aid (roads, bridges, temporary shelters).
      3. Community-reported food insecurity, crop failures, or water contamination incidents.
      4. Emerging health threats, localized disease outbreaks, or immunization gaps.
      
      Extract intelligence from recent news articles, NGO updates, and field reports.
      Format the findings as a detailed field intelligence summary that can be processed by our impact engine.`;

    return await callGemini(prompt, false, true);
  });
}

export async function analyzeData(rawData: string): Promise<AnalysisReport> {
  const truncatedData = truncateData(rawData, 12000);

  return retryWithBackoff(async () => {
    const prompt = `Analyze the following community field data for an NGO resource allocation platform.
      
      Data:
      ${truncatedData}
      
      Directives:
      1. Urgency Detection: Identify local crises, medical shortages, or food insecurity.
      2. Resource Optimization: Identify what resources are needed vs what's available.
      3. Precise Extraction: Ensure numerical data (e.g., number of people affected) is extracted for charts.
      
      Output Structure (Strict JSON):
      {
        "executiveSummary": "2-sentence impact-focused summary",
        "urgentNeeds": [
          {
            "priority": "Critical|High|Medium|Low",
            "location": "location name",
            "lat": 1.23,
            "lng": 4.56,
            "resourceRequired": "item/skill",
            "description": "brief context"
          }
        ],
        "resourceGaps": ["list of what is missing"],
        "potentialImpact": {
          "projection": "analysis of outcome if resources are allocated",
          "metrics": [{"label": "efficiency", "current": 0, "projected": 0}],
          "timeline": [{"period": "short-term", "expectedOutcome": "improvement description"}]
        },
        "actionPlan": ["immediate logistics steps"],
        "confidenceScore": 85,
        "volunteerOptimization": {
          "suggestedNGOs": ["relevant partners"],
          "volunteerMatchCount": 0,
          "skillsIdentified": ["medical", "logistics", "etc"]
        },
        "stakeholderViews": {
          "coordinator": "field perspective",
          "fieldDirector": "operational perspective",
          "donorRep": "funding/impact perspective"
        },
        "marketIntelligence": {
          "regionalTrends": ["str"],
          "demographicInsights": "str"
        },
        "strategicLevers": [
          {
            "name": "string",
            "description": "string",
            "min": 0,
            "max": 100,
            "current": 50,
            "unit": "string"
          }
        ],
        "chartTitle": "str",
        "chartData": [{"label": "str", "value": 10}]
      }`;

    const text = await callGemini(prompt, true, false);

    try {
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini Analysis Error:", error, text);
      throw new Error("Social impact synthesis encountered a structural anomaly. Please refine your field data.");
    }
  });
}

export async function chatWithAnalyst(report: AnalysisReport, userMessage: string, history: { role: string, content: string }[]): Promise<string> {
  const contextLimit = 10000;
  const historyLimit = 6;

  const reportContext = truncateData(JSON.stringify(report, null, 2), contextLimit);

  const marketIntelContext = report.marketIntelligence ? JSON.stringify(report.marketIntelligence, null, 2) : "Not available";
  const strategicLeversContext = report.strategicLevers ? JSON.stringify(report.strategicLevers, null, 2) : "Not available";

  const truncatedHistory = history.slice(-historyLimit).map(h => ({
    role: h.role,
    content: truncateData(h.content, 1000)
  }));

  return retryWithBackoff(async () => {
    const prompt = `You are the "CareLink" senior advisor for humanitarian resource allocation.
      
      Report Context:
      ${reportContext}
      
      Market Intelligence (Priority Context):
      ${marketIntelContext}
      
      Strategic Levers (Priority Context):
      ${strategicLeversContext}
      
      Interaction History (Latest):
      ${JSON.stringify(truncatedHistory, null, 2)}
      
      User Query:
      ${userMessage}
      
      Guidelines:
      1. Focus on humanitarian impact and resource efficiency.
      2. Be concise and operational.
      3. Use tools only if necessary for local regional insights.
      4. Explicitly consider the Market Intelligence and Strategic Levers in your response.`;

    return await callGemini(prompt, false, true);
  });
}

export async function analyzeWebsite(siteData: { url: string, title: string, content: string }): Promise<AnalysisReport> {
  const truncatedContent = truncateData(siteData.content, 10000);

  return retryWithBackoff(async () => {
    const prompt = `Regional Impact Audit for: ${siteData.url}
      
      Material:
      Title: ${siteData.title}
      Summary: ${truncatedContent}
      
      Directives:
      1. Social impact assessment.
      2. Urgent needs identification within the region.
      3. Use Search for regional socio-economic benchmarking.
      
      Output Structure (Strict JSON):
      {
        "executiveSummary": "summary",
        "urgentNeeds": [
          {
            "priority": "Critical|High|Medium|Low",
            "location": "location name",
            "lat": 1.23,
            "lng": 4.56,
            "resourceRequired": "item/skill",
            "description": "brief context"
          }
        ],
        "resourceGaps": ["list"],
        "potentialImpact": {
          "projection": "analysis description",
          "metrics": [{"label": "impact", "current": 0, "projected": 0}],
          "timeline": [{"period": "week 1", "expectedOutcome": "outcome"}]
        },
        "actionPlan": ["logistics steps"],
        "confidenceScore": 85,
        "volunteerOptimization": {
          "suggestedNGOs": ["relevant partners"],
          "volunteerMatchCount": 0,
          "skillsIdentified": ["medical", "logistics", "etc"]
        },
        "stakeholderViews": {
          "coordinator": "field perspective",
          "fieldDirector": "operational perspective",
          "donorRep": "funding/impact perspective"
        },
        "marketIntelligence": {
          "regionalTrends": ["str"],
          "demographicInsights": "str"
        },
        "strategicLevers": [
          {
            "name": "string",
            "description": "string",
            "min": 0,
            "max": 100,
            "current": 50,
            "unit": "string"
          }
        ],
        "chartTitle": "str",
        "chartData": [{"label": "str", "value": 10}]
      }`;

    const text = await callGemini(prompt, true, true);

    try {
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini Website Analysis Error:", error, text);
      throw new Error("Regional impact audit encountered a protocol error.");
    }
  });
}

export async function synthesizeReports(reports: AnalysisReport[]): Promise<AnalysisSynthesis> {
  const processedReports = reports.map(r => ({
    executiveSummary: r.executiveSummary?.substring(0, 150),
    urgentNeedsCount: r.urgentNeeds?.length || 0,
    confidenceScore: r.confidenceScore
  }));

  return retryWithBackoff(async () => {
    const prompt = `CareLink Regional Synthesis Hub.
      Data:
      ${JSON.stringify(processedReports, null, 2)}
      
      Directives:
      1. Identify overarching community patterns.
      2. Detect conflicting field reports or priority clashes.
      3. Suggest a unified regional action plan.
      
      Output Structure (Strict JSON):
      {
        "comparisonSummary": "summary text",
        "divergencePoints": ["list of priority conflicts or data gaps"],
        "commonTrends": ["consistent regional trends"],
        "unifiedActionPlan": ["unified logistics and response steps"],
        "combinedRiskScore": 85
      }`;

    const text = await callGemini(prompt, true, false);

    try {
      return JSON.parse(text);
    } catch (error) {
      console.error("Synthesis failed:", error, text);
      throw new Error("Neural hub synthesis failure.");
    }
  });
}
