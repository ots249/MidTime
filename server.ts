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

// 1. Medicine Search API with Arogga as Main API + Fallback Chain (Medex, Parse.bot, Local BD DB)
app.get("/api/medicines/search", async (req, res) => {
  const query = ((req.query.query as string) || (req.query._search as string) || "").trim();
  if (!query) {
    const formattedDefault = COMMON_BD_MEDICINES.slice(0, 15).map((m) => ({
      p_name: m.brand_name,
      p_form: m.dosage_form,
      p_strength: m.strength,
      p_generic_name: m.generic_name,
      p_brand_name: m.company_name,
      pv_mrp: m.price_per_unit,
      pv_b2c_discounted_price: m.price_per_unit,
      pv_b2c_discount_percent: 0,
      POSTER: "",
      attachedFiles_p_images: [],
      unit_per_strip: m.unit_per_strip,
      brand_name: m.brand_name,
      generic_name: m.generic_name,
      strength: m.strength,
      dosage_form: m.dosage_form,
      company_name: m.company_name,
      price_per_unit: m.price_per_unit,
      source: "local" as const
    }));
    return res.json({ results: formattedDefault });
  }

  let aroggaResults: any[] = [];

  // ==========================================
  // 1. NEW MAIN API: Arogga Search API
  // https://api.arogga.com/general/v3/search?_search={medicine-name}
  // ==========================================
  try {
    const aroggaUrl = `https://api.arogga.com/general/v3/search?_search=${encodeURIComponent(query)}`;
    const aroggaRes = await fetch(aroggaUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json"
      }
    });

    if (aroggaRes.ok) {
      const aroggaData = await aroggaRes.json();
      const rawList = Array.isArray(aroggaData?.data) ? aroggaData.data : [];

      if (rawList.length > 0) {
        aroggaResults = rawList.map((item: any) => {
          const p_name = item.p_name || item.brand_name || query;
          const p_name_bn = item.p_name_bn || "";
          const p_form = item.p_form || "Tablet";
          const p_strength = item.p_strength || "";
          const p_generic_name = (item.p_generic_name || "").trim();
          const p_brand_name = item.p_brand_name || item.p_brand || item.p_manufacturer || "";

          // Price parsing from pv (product variants)
          const primaryPv = Array.isArray(item.pv) && item.pv.length > 0 ? item.pv[0] : null;
          const pv_mrp = Number(primaryPv?.pv_mrp ?? primaryPv?.pv_b2c_mrp ?? 0);
          const pv_b2c_discounted_price = Number(
            primaryPv?.pv_b2c_discounted_price ?? primaryPv?.pv_b2c_price ?? pv_mrp
          );
          const pv_b2c_discount_percent = Number(primaryPv?.pv_b2c_discount_percent ?? 0);

          // Clean image URLs (fixing escaped forward slashes)
          let poster = item.POSTER ? String(item.POSTER).replace(/\\\//g, "/") : "";
          const attachedFiles = Array.isArray(item.attachedFiles_p_images)
            ? item.attachedFiles_p_images
                .map((img: any) => ({
                  src: typeof img === "string" ? img.replace(/\\\//g, "/") : (img?.src || "").replace(/\\\//g, "/"),
                  title: img?.title || ""
                }))
                .filter((img: any) => Boolean(img.src))
            : [];

          if (!poster && attachedFiles.length > 0) {
            poster = attachedFiles[0].src;
          }

          // Compute multiplier / tablets per strip
          let unit_per_strip = 10;
          if (Array.isArray(item.pu)) {
            const stripUnit = item.pu.find((u: any) => /strip|পাতা/i.test(u.pu_label || ""));
            if (stripUnit && stripUnit.pu_multiplier) {
              unit_per_strip = Number(stripUnit.pu_multiplier) || 10;
            } else if (/syrup|suspension|drop|injection|ointment|cream|gel|lotion/i.test(p_form)) {
              unit_per_strip = 1;
            }
          } else if (/syrup|suspension|drop|injection|ointment|cream|gel|lotion/i.test(p_form)) {
            unit_per_strip = 1;
          }

          return {
            p_name,
            p_name_bn,
            p_form,
            p_strength,
            p_generic_name,
            p_brand_name,
            pv_mrp,
            pv_b2c_discounted_price,
            pv_b2c_discount_percent,
            POSTER: poster,
            attachedFiles_p_images: attachedFiles,
            p_short_description: item.p_short_description || "",
            unit_per_strip,
            // Legacy backwards-compatible fields
            brand_name: p_name,
            generic_name: p_generic_name,
            strength: p_strength,
            dosage_form: p_form,
            company_name: p_brand_name,
            price_per_unit: pv_b2c_discounted_price || pv_mrp,
            source: "arogga" as const
          };
        });
      }
    }
  } catch (aroggaErr) {
    console.warn("Arogga main search API failed (switching to backup sources):", aroggaErr);
  }

  // If Arogga returned matches, return them
  if (aroggaResults.length > 0) {
    return res.json({ results: aroggaResults, source: "arogga" });
  }

  // ==========================================
  // 2. BACKUP 1: Medex search
  // ==========================================
  let backupResults: any[] = [];
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
          backupResults = jsonData;
        } else if (jsonData && Array.isArray(jsonData.data)) {
          backupResults = jsonData.data;
        } else if (jsonData && Array.isArray(jsonData.results)) {
          backupResults = jsonData.results;
        }
      }
    }
  } catch (medexErr) {
    console.warn("Backup 1 (Medex) error:", medexErr);
  }

  // ==========================================
  // 3. BACKUP 2: Parse.bot API
  // ==========================================
  if (backupResults.length === 0) {
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
          backupResults = data;
        } else if (data && Array.isArray(data.results)) {
          backupResults = data.results;
        } else if (data && Array.isArray(data.medicines)) {
          backupResults = data.medicines;
        }
      }
    } catch (parseErr) {
      console.warn("Backup 2 (Parse.bot) error:", parseErr);
    }
  }

  // ==========================================
  // 4. BACKUP 3: Local Bangladesh Medicines DB
  // ==========================================
  const lowerQ = query.toLowerCase();
  const localMatches = COMMON_BD_MEDICINES.filter(
    (m) =>
      m.brand_name.toLowerCase().includes(lowerQ) ||
      m.generic_name.toLowerCase().includes(lowerQ) ||
      m.company_name.toLowerCase().includes(lowerQ)
  );

  // Normalize fallback items to unified format
  const normalizedBackup = backupResults.map((item: any) => {
    const brand = item.brand_name || item.name || item.medicine_name || item.title || query;
    const generic = item.generic_name || item.generic || item.composition || "";
    const strength = item.strength || item.mg || "";
    const form = item.dosage_form || item.form || item.type || "Tablet";
    const company = item.company_name || item.company || item.manufacturer || "";
    const unitPerStrip = item.unit_per_strip || item.pack_size || 10;
    const price = item.price_per_unit || item.unit_price || 0;

    return {
      p_name: brand,
      p_form: form,
      p_strength: strength,
      p_generic_name: generic,
      p_brand_name: company,
      pv_mrp: price,
      pv_b2c_discounted_price: price,
      pv_b2c_discount_percent: 0,
      POSTER: item.POSTER || item.image || item.imageUrl || "",
      attachedFiles_p_images: [],
      unit_per_strip: unitPerStrip,
      brand_name: brand,
      generic_name: generic,
      strength: strength,
      dosage_form: form,
      company_name: company,
      price_per_unit: price,
      source: "medex" as const
    };
  });

  const normalizedLocal = localMatches.map((m) => ({
    p_name: m.brand_name,
    p_form: m.dosage_form,
    p_strength: m.strength,
    p_generic_name: m.generic_name,
    p_brand_name: m.company_name,
    pv_mrp: m.price_per_unit,
    pv_b2c_discounted_price: m.price_per_unit,
    pv_b2c_discount_percent: 0,
    POSTER: "",
    attachedFiles_p_images: [],
    unit_per_strip: m.unit_per_strip,
    brand_name: m.brand_name,
    generic_name: m.generic_name,
    strength: m.strength,
    dosage_form: m.dosage_form,
    company_name: m.company_name,
    price_per_unit: m.price_per_unit,
    source: "local" as const
  }));

  // Combine unique by p_name
  const seen = new Set<string>();
  const combined: any[] = [];

  for (const item of [...normalizedBackup, ...normalizedLocal]) {
    const key = (item.p_name || "").toLowerCase().trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      combined.push(item);
    }
  }

  // If no match found, supply the user typed query as custom fallback
  if (combined.length === 0) {
    combined.push({
      p_name: query,
      p_form: "Tablet",
      p_strength: "",
      p_generic_name: "",
      p_brand_name: "বাংলাদেশি ঔষধ",
      pv_mrp: 0,
      pv_b2c_discounted_price: 0,
      pv_b2c_discount_percent: 0,
      POSTER: "",
      attachedFiles_p_images: [],
      unit_per_strip: 10,
      brand_name: query,
      generic_name: "",
      strength: "",
      dosage_form: "Tablet",
      company_name: "বাংলাদেশি ঔষধ",
      price_per_unit: 0,
      source: "local" as const
    });
  }

  res.json({ results: combined, source: "backup" });
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

    // Robust model fallback sequence compliant with @google/genai SDK
    // Primary: gemini-3.7-flash, Fallbacks: gemini-flash-latest, gemini-3.1-flash-lite
    const candidateModels = ["gemini-3.7-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
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
          const errMsg = err?.message || String(err);
          const isRateLimitOrDemand =
            err?.status === 503 ||
            err?.code === 503 ||
            err?.status === 429 ||
            errMsg.includes("503") ||
            errMsg.includes("high demand") ||
            errMsg.includes("RESOURCE_EXHAUSTED") ||
            errMsg.includes("UNAVAILABLE");

          console.warn(
            `Model ${modelName} (attempt ${attempt}) encountered ${
              isRateLimitOrDemand ? "temporary high demand / 503" : "error"
            }:`,
            errMsg
          );

          if (isRateLimitOrDemand) {
            // If it's a 503 high demand on attempt 1, try next model or wait briefly
            if (attempt < 2) {
              await new Promise((res) => setTimeout(res, 800 * attempt));
            }
          } else {
            // Other errors, wait 500ms before retry
            if (attempt < 2) {
              await new Promise((res) => setTimeout(res, 500));
            }
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
    const errMsg = error?.message || String(error);
    const isDemandError =
      error?.status === 503 ||
      error?.code === 503 ||
      errMsg.includes("503") ||
      errMsg.includes("high demand") ||
      errMsg.includes("UNAVAILABLE");

    const userMessage = isDemandError
      ? "এআই সার্ভারে সাময়িক অতিরিক্ত ট্রাফিক রয়েছে। অনুগ্রহ করে কয়েক সেকেন্ড পর পুনরায় 'এআই দিয়ে স্ক্যান করুন' বোতামে চাপুন।"
      : errMsg || "প্রেসক্রিপশন স্ক্যান করতে সমস্যা হয়েছে";

    res.status(500).json({
      error: userMessage
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
