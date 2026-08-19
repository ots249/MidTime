import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Explicitly serve public files with correct Service-Worker-Allowed headers
app.use(express.static(path.join(process.cwd(), "public"), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith("sw.js")) {
      res.setHeader("Service-Worker-Allowed", "/");
      res.setHeader("Content-Type", "application/javascript");
    }
  }
}));

// Fallback Bangladeshi medicine database for instant search
const COMMON_BD_MEDICINES = [
  {
    brand_name: "Napa 500mg",
    generic_name: "Paracetamol",
    strength: "500 mg",
    dosage_form: "Tablet",
    company_name: "Beximco Pharmaceuticals Ltd.",
    unit_per_strip: 10,
    price_per_unit: 1.20
  },
  {
    brand_name: "Napa Extra",
    generic_name: "Paracetamol + Caffeine",
    strength: "500 mg + 65 mg",
    dosage_form: "Tablet",
    company_name: "Beximco Pharmaceuticals Ltd.",
    unit_per_strip: 10,
    price_per_unit: 2.50
  },
  {
    brand_name: "Napa Extend",
    generic_name: "Paracetamol (Extended Release)",
    strength: "665 mg",
    dosage_form: "Tablet",
    company_name: "Beximco Pharmaceuticals Ltd.",
    unit_per_strip: 10,
    price_per_unit: 2.00
  },
  {
    brand_name: "Ace 500mg",
    generic_name: "Paracetamol",
    strength: "500 mg",
    dosage_form: "Tablet",
    company_name: "Square Pharmaceuticals PLC",
    unit_per_strip: 10,
    price_per_unit: 1.20
  },
  {
    brand_name: "Ace Plus",
    generic_name: "Paracetamol + Caffeine",
    strength: "500 mg + 65 mg",
    dosage_form: "Tablet",
    company_name: "Square Pharmaceuticals PLC",
    unit_per_strip: 10,
    price_per_unit: 2.50
  },
  {
    brand_name: "Pantonix 20mg",
    generic_name: "Pantoprazole Sodium",
    strength: "20 mg",
    dosage_form: "Tablet",
    company_name: "Incepta Pharmaceuticals Ltd.",
    unit_per_strip: 14,
    price_per_unit: 7.00
  },
  {
    brand_name: "Pantonix 40mg",
    generic_name: "Pantoprazole Sodium",
    strength: "40 mg",
    dosage_form: "Tablet",
    company_name: "Incepta Pharmaceuticals Ltd.",
    unit_per_strip: 14,
    price_per_unit: 11.00
  },
  {
    brand_name: "Sergel 20mg",
    generic_name: "Esomeprazole Magnesium",
    strength: "20 mg",
    dosage_form: "Capsule",
    company_name: "Healthcare Pharmaceuticals Ltd.",
    unit_per_strip: 14,
    price_per_unit: 7.00
  },
  {
    brand_name: "Maxpro 20mg",
    generic_name: "Esomeprazole Magnesium",
    strength: "20 mg",
    dosage_form: "Capsule",
    company_name: "Square Pharmaceuticals PLC",
    unit_per_strip: 14,
    price_per_unit: 7.00
  },
  {
    brand_name: "Finix 20mg",
    generic_name: "Rabeprazole Sodium",
    strength: "20 mg",
    dosage_form: "Tablet",
    company_name: "Opsonin Pharma Ltd.",
    unit_per_strip: 10,
    price_per_unit: 6.00
  },
  {
    brand_name: "Seclo 20mg",
    generic_name: "Omeprazole",
    strength: "20 mg",
    dosage_form: "Capsule",
    company_name: "Square Pharmaceuticals PLC",
    unit_per_strip: 10,
    price_per_unit: 6.00
  },
  {
    brand_name: "Losectil 20mg",
    generic_name: "Omeprazole",
    strength: "20 mg",
    dosage_form: "Capsule",
    company_name: "SK+F (Eskayef Pharmaceuticals Ltd.)",
    unit_per_strip: 10,
    price_per_unit: 6.00
  },
  {
    brand_name: "Fexo 120mg",
    generic_name: "Fexofenadine Hydrochloride",
    strength: "120 mg",
    dosage_form: "Tablet",
    company_name: "Square Pharmaceuticals PLC",
    unit_per_strip: 10,
    price_per_unit: 9.00
  },
  {
    brand_name: "Fexo 180mg",
    generic_name: "Fexofenadine Hydrochloride",
    strength: "180 mg",
    dosage_form: "Tablet",
    company_name: "Square Pharmaceuticals PLC",
    unit_per_strip: 10,
    price_per_unit: 12.00
  },
  {
    brand_name: "Bilastin 20mg",
    generic_name: "Bilastine",
    strength: "20 mg",
    dosage_form: "Tablet",
    company_name: "Incepta Pharmaceuticals Ltd.",
    unit_per_strip: 10,
    price_per_unit: 15.00
  },
  {
    brand_name: "Alatrol 10mg",
    generic_name: "Cetirizine Dihydrochloride",
    strength: "10 mg",
    dosage_form: "Tablet",
    company_name: "Square Pharmaceuticals PLC",
    unit_per_strip: 10,
    price_per_unit: 3.50
  },
  {
    brand_name: "Histacin",
    generic_name: "Chlorpheniramine Maleate",
    strength: "4 mg",
    dosage_form: "Tablet",
    company_name: "Square Pharmaceuticals PLC",
    unit_per_strip: 20,
    price_per_unit: 0.50
  },
  {
    brand_name: "Monas 10mg",
    generic_name: "Montelukast Sodium",
    strength: "10 mg",
    dosage_form: "Tablet",
    company_name: "Acme Laboratories Ltd.",
    unit_per_strip: 15,
    price_per_unit: 17.00
  },
  {
    brand_name: "Montair 10mg",
    generic_name: "Montelukast Sodium",
    strength: "10 mg",
    dosage_form: "Tablet",
    company_name: "Square Pharmaceuticals PLC",
    unit_per_strip: 15,
    price_per_unit: 17.50
  },
  {
    brand_name: "Ceevit 250mg",
    generic_name: "Vitamin C (Ascorbic Acid)",
    strength: "250 mg",
    dosage_form: "Chewable Tablet",
    company_name: "Square Pharmaceuticals PLC",
    unit_per_strip: 10,
    price_per_unit: 2.00
  },
  {
    brand_name: "Filwel Gold",
    generic_name: "Multivitamin & Multimineral A-Z",
    strength: "Standard Formula",
    dosage_form: "Tablet",
    company_name: "Square Pharmaceuticals PLC",
    unit_per_strip: 15,
    price_per_unit: 6.00
  },
  {
    brand_name: "Bicozin",
    generic_name: "Vitamin B Complex + Zinc",
    strength: "Standard Formula",
    dosage_form: "Tablet",
    company_name: "Square Pharmaceuticals PLC",
    unit_per_strip: 15,
    price_per_unit: 4.00
  },
  {
    brand_name: "Coralcal-D",
    generic_name: "Calcium Carbonate (Coral) + Vitamin D3",
    strength: "500 mg + 200 IU",
    dosage_form: "Tablet",
    company_name: "Radiant Pharmaceuticals Ltd.",
    unit_per_strip: 15,
    price_per_unit: 12.00
  },
  {
    brand_name: "Calbo-D",
    generic_name: "Calcium Carbonate + Vitamin D3",
    strength: "500 mg + 200 IU",
    dosage_form: "Tablet",
    company_name: "Square Pharmaceuticals PLC",
    unit_per_strip: 15,
    price_per_unit: 7.00
  },
  {
    brand_name: "Zimax 500mg",
    generic_name: "Azithromycin",
    strength: "500 mg",
    dosage_form: "Tablet",
    company_name: "Square Pharmaceuticals PLC",
    unit_per_strip: 6,
    price_per_unit: 35.00
  },
  {
    brand_name: "Azithrocin 500mg",
    generic_name: "Azithromycin",
    strength: "500 mg",
    dosage_form: "Tablet",
    company_name: "Beximco Pharmaceuticals Ltd.",
    unit_per_strip: 6,
    price_per_unit: 35.00
  },
  {
    brand_name: "Moxacil 500mg",
    generic_name: "Amoxicillin Trihydrate",
    strength: "500 mg",
    dosage_form: "Capsule",
    company_name: "Square Pharmaceuticals PLC",
    unit_per_strip: 10,
    price_per_unit: 7.50
  },
  {
    brand_name: "Ciprocin 500mg",
    generic_name: "Ciprofloxacin",
    strength: "500 mg",
    dosage_form: "Tablet",
    company_name: "Square Pharmaceuticals PLC",
    unit_per_strip: 10,
    price_per_unit: 15.00
  },
  {
    brand_name: "Bizoran 5/20",
    generic_name: "Amlodipine + Olmesartan Medoxomil",
    strength: "5 mg + 20 mg",
    dosage_form: "Tablet",
    company_name: "Square Pharmaceuticals PLC",
    unit_per_strip: 14,
    price_per_unit: 12.00
  },
  {
    brand_name: "Compath 50/12.5",
    generic_name: "Losartan Potassium + Hydrochlorothiazide",
    strength: "50 mg + 12.5 mg",
    dosage_form: "Tablet",
    company_name: "Square Pharmaceuticals PLC",
    unit_per_strip: 10,
    price_per_unit: 10.00
  },
  {
    brand_name: "Gluconor 500mg",
    generic_name: "Metformin Hydrochloride",
    strength: "500 mg",
    dosage_form: "Tablet",
    company_name: "Square Pharmaceuticals PLC",
    unit_per_strip: 10,
    price_per_unit: 4.00
  },
  {
    brand_name: "Comet 500mg",
    generic_name: "Metformin Hydrochloride",
    strength: "500 mg",
    dosage_form: "Tablet",
    company_name: "Square Pharmaceuticals PLC",
    unit_per_strip: 10,
    price_per_unit: 4.00
  },
  {
    brand_name: "Galvus Met 50/500",
    generic_name: "Vildagliptin + Metformin",
    strength: "50 mg + 500 mg",
    dosage_form: "Tablet",
    company_name: "Novartis (Bangladesh) Ltd.",
    unit_per_strip: 10,
    price_per_unit: 26.00
  },
  {
    brand_name: "Neoflam 50mg",
    generic_name: "Diclofenac Sodium",
    strength: "50 mg",
    dosage_form: "Tablet",
    company_name: "Beximco Pharmaceuticals Ltd.",
    unit_per_strip: 10,
    price_per_unit: 3.50
  },
  {
    brand_name: "Clofenac 50mg",
    generic_name: "Diclofenac Sodium",
    strength: "50 mg",
    dosage_form: "Tablet",
    company_name: "Square Pharmaceuticals PLC",
    unit_per_strip: 10,
    price_per_unit: 3.50
  },
  {
    brand_name: "Torax 10mg",
    generic_name: "Ketorolac Tromethamine",
    strength: "10 mg",
    dosage_form: "Tablet",
    company_name: "Square Pharmaceuticals PLC",
    unit_per_strip: 10,
    price_per_unit: 12.00
  },
  {
    brand_name: "Entacyd Plus",
    generic_name: "Magaldrate + Simethicone",
    strength: "480 mg + 20 mg",
    dosage_form: "Suspension / Chewable",
    company_name: "Square Pharmaceuticals PLC",
    unit_per_strip: 10,
    price_per_unit: 3.00
  },
  {
    brand_name: "Gaviscon",
    generic_name: "Sodium Alginate + Sodium Bicarbonate + Calcium Carbonate",
    strength: "Standard Liquid",
    dosage_form: "Suspension",
    company_name: "Reckitt Benckiser",
    unit_per_strip: 1,
    price_per_unit: 260.00
  },
  {
    brand_name: "Neuro-B",
    generic_name: "Vitamin B1 + B6 + B12",
    strength: "100 mg + 200 mg + 200 mcg",
    dosage_form: "Tablet",
    company_name: "Square Pharmaceuticals PLC",
    unit_per_strip: 10,
    price_per_unit: 7.00
  },
  {
    brand_name: "E-Gel 400 IU",
    generic_name: "Vitamin E",
    strength: "400 IU",
    dosage_form: "Soft Capsule",
    company_name: "Square Pharmaceuticals PLC",
    unit_per_strip: 10,
    price_per_unit: 6.00
  }
];

// 1. Medicine Search API with Medex.com.bd + Fallbacks
app.get("/api/medicines/search", async (req, res) => {
  const query = ((req.query.query as string) || "").trim();
  if (!query) {
    return res.json({ results: COMMON_BD_MEDICINES.slice(0, 15) });
  }

  let apiResults: any[] = [];

  // 1. Try Medex search: https://medex.com.bd/ajax/search?searchtype=search&searchkey={name}
  try {
    const medexUrl = `https://medex.com.bd/ajax/search?searchtype=search&searchkey=${encodeURIComponent(query)}`;
    const medexRes = await fetch(medexUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json, text/javascript, text/html, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": "https://medex.com.bd/"
      }
    });

    if (medexRes.ok) {
      const contentType = medexRes.headers.get("content-type") || "";
      if (contentType.includes("json")) {
        const jsonData = await medexRes.json();
        if (Array.isArray(jsonData)) {
          apiResults = jsonData;
        } else if (jsonData && Array.isArray(jsonData.data)) {
          apiResults = jsonData.data;
        } else if (jsonData && Array.isArray(jsonData.results)) {
          apiResults = jsonData.results;
        } else if (jsonData && Array.isArray(jsonData.medicines)) {
          apiResults = jsonData.medicines;
        }
      } else {
        // If Medex returns HTML search markup, parse it
        const htmlText = await medexRes.text();
        const parsedHtmlMeds: any[] = [];

        // Match anchor tags or search rows
        const itemRegex = /<a[^>]*href="[^"]*(?:brands|generic|medicines)\/([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
        let match;

        while ((match = itemRegex.exec(htmlText)) !== null) {
          const innerHtml = match[2];
          // Strip HTML tags for clean text
          const cleanText = innerHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          if (cleanText) {
            // Check dosage form
            let form = "Tablet";
            if (/capsule/i.test(cleanText)) form = "Capsule";
            else if (/syrup|suspension/i.test(cleanText)) form = "Syrup";
            else if (/drop/i.test(cleanText)) form = "Drop";
            else if (/injection/i.test(cleanText)) form = "Injection";
            else if (/cream|ointment/i.test(cleanText)) form = "Ointment";

            // Extract strength like 500 mg, 20 mg, 10 mg
            const strengthMatch = cleanText.match(/\b\d+(?:\.\d+)?\s*(?:mg|ml|mcg|gm|iu|%)\b/i);
            const strength = strengthMatch ? strengthMatch[0] : "";

            parsedHtmlMeds.push({
              brand_name: cleanText.split(" - ")[0] || cleanText,
              generic_name: "",
              strength: strength,
              dosage_form: form,
              company_name: "বাংলাদেশি প্রস্তুতকারক",
              unit_per_strip: form === "Syrup" || form === "Drop" ? 1 : 10,
              price_per_unit: 0
            });
          }
        }

        if (parsedHtmlMeds.length > 0) {
          apiResults = parsedHtmlMeds;
        }
      }
    }
  } catch (medexErr) {
    console.warn("Medex search fetch error (falling back to parse.bot & local):", medexErr);
  }

  // 2. Secondary API Fallback: Parse.bot API
  if (apiResults.length === 0) {
    try {
      const apiKey = process.env.PARSE_API_KEY || "pmx_88b6be352cccb5a5674405093de421c2";
      const parseUrl = `https://api.parse.bot/scraper/6077263a-c666-469b-b93b-483335303c74/search_medicines?query=${encodeURIComponent(query)}`;
      const parseRes = await fetch(parseUrl, {
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
          "Accept": "application/json"
        }
      });

      if (parseRes.ok) {
        const data = await parseRes.json();
        if (Array.isArray(data)) {
          apiResults = data;
        } else if (data && Array.isArray(data.results)) {
          apiResults = data.results;
        } else if (data && Array.isArray(data.medicines)) {
          apiResults = data.medicines;
        } else if (data && typeof data === "object") {
          const values = Object.values(data);
          const firstArray = values.find((v) => Array.isArray(v));
          if (firstArray) apiResults = firstArray as any[];
        }
      }
    } catch (parseErr) {
      console.warn("Parse.bot scraper error (using local database):", parseErr);
    }
  }

  // 3. Filter local Bangladesh medicines database
  const lowerQ = query.toLowerCase();
  const localMatches = COMMON_BD_MEDICINES.filter(
    (m) =>
      m.brand_name.toLowerCase().includes(lowerQ) ||
      m.generic_name.toLowerCase().includes(lowerQ) ||
      m.company_name.toLowerCase().includes(lowerQ)
  );

  // Normalize API results to standard format
  const normalizedApi = apiResults.map((item: any) => {
    return {
      brand_name: item.brand_name || item.name || item.medicine_name || item.title || query,
      generic_name: item.generic_name || item.generic || item.composition || "",
      strength: item.strength || item.mg || "",
      dosage_form: item.dosage_form || item.form || item.type || "Tablet",
      company_name: item.company_name || item.company || item.manufacturer || "",
      unit_per_strip: item.unit_per_strip || item.pack_size || 10,
      price_per_unit: item.price_per_unit || item.unit_price || 0
    };
  });

  // Combine unique by brand_name
  const seen = new Set<string>();
  const combined: any[] = [];

  for (const item of [...normalizedApi, ...localMatches]) {
    const key = (item.brand_name || "").toLowerCase().trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      combined.push(item);
    }
  }

  // If no exact match, ensure search query can still be used as a custom medicine
  if (combined.length === 0) {
    combined.push({
      brand_name: query,
      generic_name: "",
      strength: "",
      dosage_form: "Tablet",
      company_name: "বাংলাদেশি ঔষধ",
      unit_per_strip: 10,
      price_per_unit: 0
    });
  }

  res.json({ results: combined });
});

// 2. Prescription AI OCR & Analysis endpoint
app.post("/api/prescription/analyze", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "No image data provided" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY environment variable is not configured."
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    const prompt = `You are an expert medical prescription reader and pharmacist specialized in South Asian / Bangladeshi doctors' prescriptions.
Carefully examine the uploaded prescription image. Extract:
1. Doctor Name (or Hospital/Clinic Name)
2. Prescription Date (YYYY-MM-DD or standard formatted date)
3. Patient Name or diagnosis notes if available
4. A list of prescribed medicines with detailed dosage schedule. For each medicine, extract:
   - name: Brand name or Generic name (e.g. Napa Extra, Pantonix 20, Sergel 20, Fexo 120, Monas 10, Ceevit, Azithrocin 500)
   - strength: e.g. "500 mg", "20 mg", "10 mg"
   - dosageForm: "tablet" | "capsule" | "syrup" | "drop" | "injection" | "ointment" | "other"
   - schedule:
     - morning: boolean (true if taken in morning e.g. 1+0+0, 1+0+1, 1+1+1)
     - morningDose: number (e.g. 1 or 0.5 or 2)
     - morningTiming: "after_meal" | "before_meal" | "empty_stomach" | "anytime"
     - afternoon: boolean (true if taken in afternoon/lunch e.g. 0+1+0, 1+1+1)
     - afternoonDose: number
     - afternoonTiming: "after_meal" | "before_meal" | "empty_stomach" | "anytime"
     - night: boolean (true if taken in night/dinner e.g. 0+0+1, 1+0+1, 1+1+1)
     - nightDose: number
     - nightTiming: "after_meal" | "before_meal" | "empty_stomach" | "anytime"
   - tabletsPerStrip: estimated standard strip count (typically 10 or 14 or 15)
   - stripsCount: estimated initial strips to buy (e.g. 1 or 2 or calculated from duration)
   - durationDays: total days prescribed (e.g. 5, 7, 14, 30 days; default 7 if not mentioned)
   - instructionsBangla: advice in Bangla (e.g. "জ্বর আসলে খাবেন", "খাওয়ার ২০ মিনিট আগে খাবেন", "৭ দিন খাবেন")

Respond in strict JSON adhering to the provided schema.`;

    const requestPayload = {
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            doctorName: { type: Type.STRING },
            hospitalName: { type: Type.STRING },
            prescriptionDate: { type: Type.STRING },
            patientName: { type: Type.STRING },
            diagnosis: { type: Type.STRING },
            summaryBangla: { type: Type.STRING },
            medicines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  generic: { type: Type.STRING },
                  strength: { type: Type.STRING },
                  dosageForm: { type: Type.STRING },
                  schedule: {
                    type: Type.OBJECT,
                    properties: {
                      morning: { type: Type.BOOLEAN },
                      morningDose: { type: Type.NUMBER },
                      morningTiming: { type: Type.STRING },
                      afternoon: { type: Type.BOOLEAN },
                      afternoonDose: { type: Type.NUMBER },
                      afternoonTiming: { type: Type.STRING },
                      night: { type: Type.BOOLEAN },
                      nightDose: { type: Type.NUMBER },
                      nightTiming: { type: Type.STRING }
                    },
                    required: ["morning", "afternoon", "night"]
                  },
                  tabletsPerStrip: { type: Type.INTEGER },
                  stripsCount: { type: Type.INTEGER },
                  durationDays: { type: Type.INTEGER },
                  instructionsBangla: { type: Type.STRING }
                },
                required: ["name", "schedule"]
              }
            }
          },
          required: ["medicines"]
        }
      }
    };

    // Retry with primary and fallback models in case of high demand (503 / 429)
    const candidateModels = ["gemini-3.7-flash", "gemini-2.5-flash"];
    let response: any = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          response = await ai.models.generateContent({
            ...requestPayload,
            model: modelName
          });
          if (response && response.text) {
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Attempt ${attempt} with model ${modelName} failed:`, err?.message || err);
          if (attempt < 2) {
            await new Promise((res) => setTimeout(res, 1200));
          }
        }
      }
      if (response && response.text) break;
    }

    if (!response || !response.text) {
      throw lastError || new Error("এআই মডেল থেকে প্রতিক্রিয়া পাওয়া যায়নি");
    }

    const jsonText = response.text;
    const parsedData = JSON.parse(jsonText);
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Prescription analysis error:", error);
    const msg =
      error?.status === 503 || error?.message?.includes("503") || error?.message?.includes("high demand")
        ? "মডেলটিতে অতিরিক্ত ট্রাফিক রয়েছে। অনুগ্রহ করে কয়েক সেকেন্ড পর পুনরায় চেষ্টা করুন।"
        : error?.message || "প্রেসক্রিপশন স্ক্যান করতে সমস্যা হয়েছে";
    res.status(500).json({
      error: msg
    });
  }
});

// Vite middleware for dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Medicine Tracker server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
