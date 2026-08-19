export type MealTiming = 'before_meal' | 'after_meal' | 'empty_stomach' | 'anytime';

export type TimeSlot = 'morning' | 'afternoon' | 'night';

export interface MedicineSchedule {
  morning: boolean;
  morningDose: number;
  morningTiming: MealTiming;
  morningTimeStr?: string; // e.g. "08:00 AM"

  afternoon: boolean;
  afternoonDose: number;
  afternoonTiming: MealTiming;
  afternoonTimeStr?: string; // e.g. "02:00 PM"

  night: boolean;
  nightDose: number;
  nightTiming: MealTiming;
  nightTimeStr?: string; // e.g. "09:30 PM"
}

export interface MedicineStock {
  tabletsPerStrip: number; // প্রতি পাতায় কয়টি ট্যাবলেট/ক্যাপসুল (e.g. 10, 14, 15)
  stripsCount: number;     // কয় পাতা আছে
  looseTablets: number;    // পাতার বাইরে অতিরিক্ত খুচরা ট্যাবলেট
  totalUnits: number;      // totalUnits = stripsCount * tabletsPerStrip + looseTablets
  lowStockThreshold: number; // কয়টি ট্যাবলেট বা পাতা নিচে নামলে অ্যালার্ট দেবে (e.g. 5 tablets or 1 strip)
}

export interface Medicine {
  id: string;
  name: string;             // যেমন: Napa Extra
  generic?: string;          // যেমন: Paracetamol + Caffeine
  strength?: string;         // যেমন: 500 mg + 65 mg
  dosageForm: string;        // 'ট্যাবলেট' | 'ক্যাপসুল' | 'সিরাপ' | 'ড্রপ' | 'ইনজেকশন' | 'মলম'
  company?: string;          // যেমন: Beximco Pharmaceuticals Ltd.
  schedule: MedicineSchedule;
  stock: MedicineStock;
  notes?: string;            // ডাক্তারের নির্দেশ / পরামর্শ
  startDate: string;         // YYYY-MM-DD
  durationDays?: number;     // কয়দিন খাবেন (e.g. 7 days, 15 days, 30 days)
  prescriptionId?: string;   // প্রেসক্রিপশন আইডি (যদি থাকে)
  color?: string;            // কালার ট্যাগ
  createdAt: number;
}

export interface DailyLog {
  [dateKey: string]: {
    // dateKey: 'YYYY-MM-DD'
    [medicineId: string]: {
      morning?: boolean;
      afternoon?: boolean;
      night?: boolean;
      takenAt?: {
        morning?: string;
        afternoon?: string;
        night?: string;
      };
    };
  };
}

export interface Prescription {
  id: string;
  title: string;
  doctorName?: string;
  hospitalName?: string;
  patientName?: string;
  date: string;
  imageUrl: string;
  notes?: string;
  extractedMedicines?: Array<{
    name: string;
    generic?: string;
    strength?: string;
    dosageForm?: string;
    schedule: MedicineSchedule;
    tabletsPerStrip?: number;
    stripsCount?: number;
    durationDays?: number;
    instructionsBangla?: string;
  }>;
  createdAt: number;
}

export interface SearchMedicineResult {
  brand_name: string;
  generic_name?: string;
  strength?: string;
  dosage_form?: string;
  company_name?: string;
  unit_per_strip?: number;
  price_per_unit?: number;
}

export const DEFAULT_SAMPLE_MEDICINES: Medicine[] = [
  {
    id: "med-1",
    name: "Napa Extra",
    generic: "Paracetamol + Caffeine",
    strength: "500mg + 65mg",
    dosageForm: "ট্যাবলেট",
    company: "Beximco Pharmaceuticals Ltd.",
    schedule: {
      morning: true,
      morningDose: 1,
      morningTiming: "after_meal",
      morningTimeStr: "০৮:৩০ সকাল",
      afternoon: true,
      afternoonDose: 1,
      afternoonTiming: "after_meal",
      afternoonTimeStr: "০২:০০ দুপুর",
      night: true,
      nightDose: 1,
      nightTiming: "after_meal",
      nightTimeStr: "১০:০০ রাত"
    },
    stock: {
      tabletsPerStrip: 10,
      stripsCount: 1,
      looseTablets: 4,
      totalUnits: 14,
      lowStockThreshold: 6
    },
    notes: "খাবার পর প্রচুর পানি দিয়ে খাবেন। জ্বর ও মাথাব্যথার জন্য।",
    startDate: new Date().toISOString().split("T")[0],
    durationDays: 7,
    color: "rose",
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: "med-2",
    name: "Pantonix 20",
    generic: "Pantoprazole Sodium",
    strength: "20 mg",
    dosageForm: "ট্যাবলেট",
    company: "Incepta Pharmaceuticals Ltd.",
    schedule: {
      morning: true,
      morningDose: 1,
      morningTiming: "before_meal",
      morningTimeStr: "০৭:৩০ সকাল",
      afternoon: false,
      afternoonDose: 0,
      afternoonTiming: "before_meal",
      night: true,
      nightDose: 1,
      nightTiming: "before_meal",
      nightTimeStr: "০৯:০০ রাত"
    },
    stock: {
      tabletsPerStrip: 14,
      stripsCount: 0,
      looseTablets: 3,
      totalUnits: 3,
      lowStockThreshold: 5
    },
    notes: "খাবারের ২০-৩০ মিনিট আগে খেতে হবে। গ্যাস্ট্রিক ও অ্যাসিডিটির জন্য।",
    startDate: new Date().toISOString().split("T")[0],
    durationDays: 14,
    color: "amber",
    createdAt: Date.now() - 86400000 * 5
  },
  {
    id: "med-3",
    name: "Filwel Gold",
    generic: "Multivitamin & Multimineral A-Z",
    strength: "Standard",
    dosageForm: "ট্যাবলেট",
    company: "Square Pharmaceuticals PLC",
    schedule: {
      morning: false,
      morningDose: 0,
      morningTiming: "after_meal",
      afternoon: true,
      afternoonDose: 1,
      afternoonTiming: "after_meal",
      afternoonTimeStr: "০২:৩০ দুপুর",
      night: false,
      nightDose: 0,
      nightTiming: "after_meal"
    },
    stock: {
      tabletsPerStrip: 15,
      stripsCount: 2,
      looseTablets: 8,
      totalUnits: 38,
      lowStockThreshold: 8
    },
    notes: "দুপুরের ভারী খাবারের পর প্রতিদিন একটি করে।",
    startDate: new Date().toISOString().split("T")[0],
    durationDays: 30,
    color: "emerald",
    createdAt: Date.now() - 86400000 * 1
  }
];
