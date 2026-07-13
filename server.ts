import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { createRequire } from "module";
const localRequire = typeof require !== "undefined" ? require : createRequire(import.meta.url);
const pdf = localRequire("pdf-parse");
import mammoth from "mammoth";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment variables. Please configure it in your Secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// JSON Schema for structured response
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    score: { 
      type: Type.INTEGER, 
      description: "A fitness score from 0 to 100 based on fit with the JD requirements." 
    },
    decision: { 
      type: Type.STRING, 
      description: "Must be exactly 'ADVANCE' or 'REJECT'." 
    },
    decisionReason: { 
      type: Type.STRING, 
      description: "Short, highly specific reason explaining the decision." 
    },
    mustHavesMet: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          requirement: { type: Type.STRING, description: "The must-have requirement text extracted from the JD." },
          met: { type: Type.BOOLEAN },
          details: { type: Type.STRING, description: "Specific evidence/details from candidate CV supporting this." }
        },
        required: ["requirement", "met", "details"]
      }
    },
    mustHavesMissing: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          requirement: { type: Type.STRING, description: "The must-have requirement text from JD that is missing or not met." },
          details: { type: Type.STRING, description: "Explanation of why this is missing or insufficient in their CV." }
        },
        required: ["requirement", "details"]
      }
    },
    niceToHavesMet: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          requirement: { type: Type.STRING, description: "The nice-to-have requirement from the JD." },
          met: { type: Type.BOOLEAN },
          details: { type: Type.STRING, description: "Evidence from candidate CV supporting this if met, or brief mention if partially met." }
        },
        required: ["requirement", "met", "details"]
      }
    },
    flags: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          issue: { type: Type.STRING, description: "The name of the potential concern, e.g. Job-hopping, Gaps, Location mismatch, Overqualified/Salary expectation mismatch." },
          severity: { type: Type.STRING, description: "Can be 'low', 'medium', or 'high'." },
          details: { type: Type.STRING, description: "Specific details from the CV and reason for flagging." }
        },
        required: ["issue", "severity", "details"]
      }
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 2-4 key standout strengths of the candidate."
    },
    rejectionNote: {
      type: Type.STRING,
      description: "A short, professional, empathetic rejection email template personalized with candidate details if decision is REJECT. Otherwise leave empty or blank."
    },
    script: {
      type: Type.OBJECT,
      description: "The full personalized Phone Screening Script (only populated if decision is ADVANCE). Leave empty/null if REJECT.",
      properties: {
        opening: { 
          type: Type.STRING, 
          description: "Section A: Opening (30-45 sec). Welcome candidate, introduce yourself as Odin's TA, confirm role, build rapport. Personalize using their CV details." 
        },
        context: { 
          type: Type.STRING, 
          description: "Section B: Set the Context (20 sec). Outline the call structure: basic requirements check, motivation/fit, career journey, and next steps." 
        },
        section1Basic: { 
          type: Type.STRING, 
          description: "Section C: Basic Requirements (2-3 min). Ask about notice period, current salary / expectation, and working hours (confirm 9am-6pm / relevant time zones if expat team)." 
        },
        section2Motivation: { 
          type: Type.STRING, 
          description: "Section D: Motivation & Role Fit (2-4 min). Tailor the 'what attracted you' and 'what excites you' questions to this specific role and the candidate's actual background." 
        },
        section3History: { 
          type: Type.STRING, 
          description: "Section E: Job History & Accountability (4-6 min). Ask tailored behavioral questions referencing specific previous roles, companies, or projects directly from their CV." 
        },
        section4Communication: { 
          type: Type.STRING, 
          description: "Section F: Communication Skills (Assessment notes). Guidelines for the interviewer on how to evaluate clarity, listening, and flow." 
        },
        close: { 
          type: Type.STRING, 
          description: "Section G: Final Check + Close (1-2 min). Prompt for any questions they have, detail next steps (Hiring Manager, technical, etc.), and outline timeline." 
        },
        probes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "2-3 highly specific, candidate-specific follow-up probes to be ready to use in Section E, addressing gaps or highlights in their CV."
        }
      }
    }
  },
  required: [
    "score",
    "decision",
    "decisionReason",
    "mustHavesMet",
    "mustHavesMissing",
    "niceToHavesMet",
    "flags",
    "strengths"
  ]
};

// Parse PDF / DOCX endpoint
app.post("/api/parse-cv", async (req, res) => {
  try {
    const { base64, fileName, mimeType } = req.body;
    if (!base64) {
      return res.status(400).json({ error: "No file content provided." });
    }

    const buffer = Buffer.from(base64, "base64");
    let text = "";

    if (mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) {
      let extracted = "";
      let parsedOk = false;
      
      try {
        if (pdf && pdf.PDFParse) {
          const parser = new pdf.PDFParse(new Uint8Array(buffer));
          const result = await parser.getText();
          extracted = result?.text || "";
          parsedOk = true;
        }
      } catch (err: any) {
        console.warn("Attempt to parse with PDFParse class failed, trying standard function:", err);
      }

      if (!parsedOk) {
        // Fallback to standard legacy function call
        let parseFunc = typeof pdf === "function" ? pdf : (pdf && pdf.default);
        if (typeof parseFunc !== "function" && pdf && pdf.default) {
          parseFunc = pdf.default;
        }
        if (typeof parseFunc === "function") {
          const parsed = await parseFunc(buffer);
          extracted = parsed.text || "";
        } else {
          throw new Error("Could not find a valid PDF parsing function in the loaded pdf-parse module.");
        }
      }
      
      text = extracted;
    } else if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
      fileName.toLowerCase().endsWith(".docx")
    ) {
      const parsed = await mammoth.extractRawText({ buffer });
      text = parsed.value;
    } else if (
      mimeType === "application/msword" ||
      fileName.toLowerCase().endsWith(".doc")
    ) {
      // Direct raw text or simple extract. Since mammoth only supports docx, 
      // let's try a fallback or try treating as plain text. 
      // Some old doc files might fail, but let's notify the user or try extraction.
      const parsed = await mammoth.extractRawText({ buffer }).catch(() => null);
      if (parsed) {
        text = parsed.value;
      } else {
        text = buffer.toString("utf8").replace(/[^\x20-\x7E\r\n\t]/g, " ");
      }
    } else {
      // Treat as plain text
      text = buffer.toString("utf8");
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "No readable text could be extracted from the file. Please copy-paste the text directly or verify the file is not corrupted or empty." });
    }

    return res.json({ text });
  } catch (error: any) {
    console.error("File parsing error:", error);
    return res.status(500).json({ 
      error: `Failed to parse file: ${error.message || error}. For protected, scanned, or complex files, please copy and paste the text directly.` 
    });
  }
});

app.post("/api/screen", async (req, res) => {
  try {
    const { cv, jd, coreValues } = req.body;

    if (!cv || !jd) {
      return res.status(400).json({ error: "Both Candidate CV and Job Description are required." });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are an expert Talent Acquisition (TA) Partner at Odin Mortgage, a premier international mortgage brokerage for Australian expats.
You must screen the candidate's CV against the provided Job Description (JD) and Odin Core Values, strictly adhering to the candidate screening Standard Operating Procedure (SOP).

Odin's Candidate Screening SOP Guidelines:
1. CV Review & Scoring: Give a score out of 100 based on actual skill and experience match. 
2. Match Must-Haves: Extract exact requirements listed as 'must-have', 'required', 'minimum experience' or core responsibilities from the JD. Mark them as met (with evidence from CV) or missing (why they aren't met).
3. Match Nice-to-Haves: Identify any preferred, highly regarded, or nice-to-have criteria from the JD and check if met.
4. Flag Concerns: Honestly detect any concerns like job-hopping (multiple short stints under 1 year), unexplained resume gaps, location or relocation mismatch, or overqualification where they might quickly exit.
5. Identify Strengths: List standout highlights that make them a strong contender.
6. Decision: Decide ADVANCE TO PHONE SCREEN if they meet the core essentials and align with Odin, or REJECT if there is a clear mismatch in minimum requirements or severe red flags.
7. If REJECT, write a short, specific, highly professional, polite, and personalized rejection email template.
8. If ADVANCE, generate a full, highly personalized Phone Screening Script.
   The script must follow these sections:
   - A. Opening (30-45 sec): Friendly greeting, welcome, confirm candidate's identity, specify the role at Odin, ask how they are.
   - B. Set Context (20 sec): Briefly state the agenda (basics, motivation, career highlights, next steps).
   - C. Section 1 - Basic Requirements (2-3 min): Script questions to verify: current notice period, salary expectations, and working hours/location requirements.
   - D. Section 2 - Motivation & Role Fit (2-4 min): Craft questions that explicitly tie their unique background to this specific JD and what drew them to Odin Mortgage.
   - E. Section 3 - Job History & Accountability (4-6 min): Craft deep-dive, accountability-focused questions referencing specific roles, projects, or employers from their CV.
   - F. Section 4 - Communication Skills: Write guidelines and rubrics for the TA to evaluate their clarity, tone, and active listening.
   - G. Final Check + Close (1-2 min): Invite their questions, clearly state next steps, and express gratitude.
   - Probes: List 2-3 precise follow-up probes for Section E to dig into potential CV gaps, career pivots, or key achievements.

Return the response in structured JSON that conforms EXACTLY to the requested schema.`;

    const userPrompt = `=== CANDIDATE CV ===
${cv}

=== JOB DESCRIPTION ===
${jd}

=== ODIN CORE VALUES ===
${coreValues || "Default Odin Values: Client-Centric Excellence, Extreme Ownership & Accountability, Integrity & Trust, Speed & Efficiency"}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2, // Low temperature for consistent, objective analysis
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response received from Gemini API.");
    }

    const jsonResult = JSON.parse(text.trim());
    return res.json(jsonResult);

  } catch (error: any) {
    console.error("Screening error:", error);
    return res.status(500).json({ 
      error: error.message || "An unexpected error occurred during screening." 
    });
  }
});

async function startServer() {
  // Integrate Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Odin TA Assistant running on http://localhost:${PORT}`);
  });
}

startServer();
