import { Medicine, MealTiming } from "../types";

export const toBanglaNumber = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return "০";
  const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return num
    .toString()
    .replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
};

export const getBanglaDate = (date: Date = new Date()): string => {
  const days = [
    "রবিবার",
    "সোমবার",
    "মঙ্গলবার",
    "বুধবার",
    "বৃহস্পতিবার",
    "শুক্রবার",
    "শনিবার"
  ];
  const months = [
    "জানুয়ারি",
    "ফেব্রুয়ারি",
    "মার্চ",
    "এপ্রিল",
    "মে",
    "জুন",
    "জুলাই",
    "আগস্ট",
    "সেপ্টেম্বর",
    "অক্টোবর",
    "নভেম্বর",
    "ডিসেম্বর"
  ];

  const dayName = days[date.getDay()];
  const day = toBanglaNumber(date.getDate());
  const month = months[date.getMonth()];
  const year = toBanglaNumber(date.getFullYear());

  return `${dayName}, ${day} ${month} ${year}`;
};

export const formatMealTimingBangla = (timing: MealTiming): { text: string; badgeClass: string } => {
  switch (timing) {
    case "before_meal":
      return {
        text: "খাওয়ার আগে",
        badgeClass: "bg-amber-100 text-amber-800 border-amber-300"
      };
    case "after_meal":
      return {
        text: "খাওয়ার পরে",
        badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300"
      };
    case "empty_stomach":
      return {
        text: "খালি পেটে",
        badgeClass: "bg-purple-100 text-purple-800 border-purple-300"
      };
    case "anytime":
    default:
      return {
        text: "যেকোনো সময়",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-300"
      };
  }
};

export const calculateDailyDose = (med: Medicine): number => {
  let count = 0;
  if (med.schedule.morning) count += med.schedule.morningDose || 1;
  if (med.schedule.afternoon) count += med.schedule.afternoonDose || 1;
  if (med.schedule.night) count += med.schedule.nightDose || 1;
  return count;
};

export const calculateRemainingStrips = (med: Medicine): {
  strips: number;
  loose: number;
  totalUnits: number;
  daysRemaining: number;
  formattedBangla: string;
  isLowStock: boolean;
  isOutOfStock: boolean;
  statusText: string;
  statusColor: string;
} => {
  const totalUnits = Math.max(0, med.stock.totalUnits);
  const perStrip = med.stock.tabletsPerStrip || 10;
  const strips = Math.floor(totalUnits / perStrip);
  const loose = totalUnits % perStrip;

  const dailyDose = calculateDailyDose(med);
  const daysRemaining = dailyDose > 0 ? Math.floor(totalUnits / dailyDose) : 999;

  const isOutOfStock = totalUnits === 0;
  const isLowStock = !isOutOfStock && (totalUnits <= med.stock.lowStockThreshold || daysRemaining <= 3);

  let formattedBangla = "";
  if (totalUnits === 0) {
    formattedBangla = "সম্পূর্ণ শেষ (০ টি)";
  } else if (strips === 0) {
    formattedBangla = `${toBanglaNumber(loose)} টি খুচরা বাকি`;
  } else if (loose === 0) {
    formattedBangla = `${toBanglaNumber(strips)} পাতা বাকি (${toBanglaNumber(totalUnits)} টি)`;
  } else {
    formattedBangla = `${toBanglaNumber(strips)} পাতা ${toBanglaNumber(loose)} টি বাকি (${toBanglaNumber(totalUnits)} টি)`;
  }

  let statusText = "পর্যাপ্ত মজুত";
  let statusColor = "text-emerald-700 bg-emerald-50 border-emerald-200";

  if (isOutOfStock) {
    statusText = "মজুত শেষ! দ্রুত কিনুন";
    statusColor = "text-rose-700 bg-rose-50 border-rose-200 animate-pulse";
  } else if (isLowStock) {
    statusText = "মজুত কম! শেষ হতে চলেছে";
    statusColor = "text-amber-700 bg-amber-50 border-amber-200";
  }

  return {
    strips,
    loose,
    totalUnits,
    daysRemaining,
    formattedBangla,
    isLowStock,
    isOutOfStock,
    statusText,
    statusColor
  };
};

export const getDoseDescriptionBangla = (med: Medicine): string => {
  const parts: string[] = [];
  if (med.schedule.morning) {
    parts.push(`সকাল (${toBanglaNumber(med.schedule.morningDose || 1)}টি)`);
  }
  if (med.schedule.afternoon) {
    parts.push(`দুপুর (${toBanglaNumber(med.schedule.afternoonDose || 1)}টি)`);
  }
  if (med.schedule.night) {
    parts.push(`রাত (${toBanglaNumber(med.schedule.nightDose || 1)}টি)`);
  }
  return parts.length > 0 ? parts.join(" + ") : "কোনো নিয়মিত সূচি নেই";
};

export interface CurrentTimeSlotInfo {
  slot: "morning" | "afternoon" | "night";
  labelBn: string;
  timeRangeBn: string;
  iconName: "sunrise" | "sun" | "moon";
}

/**
 * Returns the active time slot based on the current hour:
 * - 05:00 - 11:59 : সকাল (Morning)
 * - 12:00 - 17:59 : দুপুর (Afternoon)
 * - 18:00 - 04:59 : রাত (Night)
 */
export const getCurrentTimeSlot = (date: Date = new Date()): CurrentTimeSlotInfo => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) {
    return {
      slot: "morning",
      labelBn: "সকাল",
      timeRangeBn: "সকাল ৭:০০ - ১০:০০",
      iconName: "sunrise"
    };
  } else if (hour >= 12 && hour < 18) {
    return {
      slot: "afternoon",
      labelBn: "দুপুর",
      timeRangeBn: "দুপুর ১:০০ - ৩:০০",
      iconName: "sun"
    };
  } else {
    return {
      slot: "night",
      labelBn: "রাত",
      timeRangeBn: "রাত ৮:০০ - ১০:৩০",
      iconName: "moon"
    };
  }
};

