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
  nameBn?: string;           // যেমন: নাপা ৫০০
  generic?: string;          // যেমন: Paracetamol + Caffeine
  strength?: string;         // যেমন: 500 mg + 65 mg
  dosageForm: string;        // 'ট্যাবলেট' | 'ক্যাপসুল' | 'সিরাপ' | 'ড্রপ' | 'ইনজেকশন' | 'মলম'
  company?: string;          // যেমন: Beximco Pharmaceuticals Ltd.
  mrp?: number;              // MRP মূল্য (e.g. 1.20)
  discountedPrice?: number;  // ডিসকাউন্টেড মূল্য (e.g. 1.08)
  discountPercent?: number;  // ডিসকাউন্ট % (e.g. 10)
  imageUrl?: string;         // ওষুধের ছবি / পোস্টার লিঙ্ক
  images?: string[];         // প্যাকেজিং বা পাতা ছবি গ্যালারি
  description?: string;      // বর্ণনা / সংক্ষেপ
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
  p_name: string;
  p_name_bn?: string;
  p_form?: string;
  p_strength?: string;
  p_generic_name?: string;
  p_brand_name?: string;
  pv_mrp?: number;
  pv_b2c_discounted_price?: number;
  pv_b2c_discount_percent?: number;
  POSTER?: string;
  attachedFiles_p_images?: Array<{ src: string; title?: string }> | string[];
  p_short_description?: string;
  unit_per_strip?: number;
  // Legacy / fallback fields
  brand_name?: string;
  generic_name?: string;
  strength?: string;
  dosage_form?: string;
  company_name?: string;
  price_per_unit?: number;
  source?: 'arogga' | 'medex' | 'parse' | 'local';
}

export interface BackupData {
  version: string;
  exportedAt: string;
  medicines: Medicine[];
  dailyLogs: DailyLog;
  prescriptions: Prescription[];
  theme?: "light" | "dark";
}

export interface AlertSettings {
  soundEnabled: boolean;
  voiceAlerts?: boolean;
  bannerNotifications?: boolean;
  reminderMinutesBefore?: number;
  theme?: "light" | "dark";
}

export interface IntakeLog {
  id: string;
  medicineId: string;
  medicineName: string;
  scheduledTime?: string;
  actualTime?: string;
  status: "taken" | "skipped" | "missed";
  date: string;
  slot?: TimeSlot;
  unitsTaken?: number;
  userId?: string;
  createdAt?: string;
}

export type PrescriptionRecord = Prescription;

export type CloudSyncStatus = "connected" | "syncing" | "synced" | "offline" | "error";

export const DEFAULT_SAMPLE_MEDICINES: Medicine[] = [];


