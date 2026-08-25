import React, { useState, useEffect } from "react";
import {
  Sun,
  Sunrise,
  Moon,
  CheckCircle2,
  Circle,
  Clock,
  Pill,
  Check,
  AlertTriangle,
  Sparkles,
  Info,
  CalendarDays,
  Plus,
  Filter,
  CheckCheck,
  Zap,
  BellRing
} from "lucide-react";
import { Medicine, TimeSlot, MealTiming } from "../types";
import {
  toBanglaNumber,
  formatMealTimingBangla,
  calculateRemainingStrips,
  getCurrentTimeSlot,
  CurrentTimeSlotInfo
} from "../utils/banglaUtils";

interface ScheduleViewProps {
  medicines: Medicine[];
  dateKey: string;
  logs: Record<string, { morning?: boolean; afternoon?: boolean; night?: boolean }>;
  onToggleTaken: (medicineId: string, slot: TimeSlot) => void;
  onOpenMedicineDetails: (med: Medicine) => void;
  onOpenAddModal: () => void;
  onOpenPrescriptionTab: () => void;
  initialSlot?: "auto" | "all" | TimeSlot;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  medicines,
  dateKey,
  logs,
  onToggleTaken,
  onOpenMedicineDetails,
  onOpenAddModal,
  onOpenPrescriptionTab,
  initialSlot = "auto"
}) => {
  const [selectedSlot, setSelectedSlot] = useState<"auto" | "all" | TimeSlot>(initialSlot);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Keep time updated every 10 seconds to auto-detect morning, afternoon, night transitions
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const currentSlotInfo = getCurrentTimeSlot(currentTime);

  // Time slot configurations
  const timeSlots: {
    id: TimeSlot;
    title: string;
    icon: any;
    timeRange: string;
    color: string;
    accentColor: string;
    bgClass: string;
    borderClass: string;
    badgeBg: string;
  }[] = [
    {
      id: "morning",
      title: "সকাল",
      icon: Sunrise,
      timeRange: "সকাল ৭:০০ - ১০:০০",
      color: "text-amber-600 dark:text-amber-400",
      accentColor: "from-amber-500 to-orange-500",
      bgClass: "bg-amber-50/40 dark:bg-amber-950/20",
      borderClass: "border-amber-200/80 dark:border-amber-900/60",
      badgeBg: "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300"
    },
    {
      id: "afternoon",
      title: "দুপুর",
      icon: Sun,
      timeRange: "দুপুর ১:০০ - ৩:০০",
      color: "text-sky-600 dark:text-sky-400",
      accentColor: "from-sky-500 to-blue-500",
      bgClass: "bg-sky-50/40 dark:bg-sky-950/20",
      borderClass: "border-sky-200/80 dark:border-sky-900/60",
      badgeBg: "bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300"
    },
    {
      id: "night",
      title: "রাত",
      icon: Moon,
      timeRange: "রাত ৮:০০ - ১০:৩০",
      color: "text-indigo-600 dark:text-indigo-400",
      accentColor: "from-indigo-600 to-purple-600",
      bgClass: "bg-indigo-50/40 dark:bg-indigo-950/20",
      borderClass: "border-indigo-200/80 dark:border-indigo-900/60",
      badgeBg: "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300"
    }
  ];

  // Helper to test if a medicine is scheduled for a slot
  const isScheduled = (med: Medicine, slot: TimeSlot): boolean => {
    return !!med.schedule[slot];
  };

  const getDoseForSlot = (med: Medicine, slot: TimeSlot): number => {
    if (slot === "morning") return med.schedule.morningDose || 1;
    if (slot === "afternoon") return med.schedule.afternoonDose || 1;
    if (slot === "night") return med.schedule.nightDose || 1;
    return 1;
  };

  const getTimingForSlot = (med: Medicine, slot: TimeSlot): MealTiming => {
    if (slot === "morning") return med.schedule.morningTiming || "after_meal";
    if (slot === "afternoon") return med.schedule.afternoonTiming || "after_meal";
    if (slot === "night") return med.schedule.nightTiming || "after_meal";
    return "after_meal";
  };

  const isTaken = (medId: string, slot: TimeSlot): boolean => {
    return !!logs[medId]?.[slot];
  };

  // Calculate overall progress for today
  let totalTasks = 0;
  let takenTasks = 0;

  medicines.forEach((med) => {
    if (med.schedule.morning) {
      totalTasks++;
      if (isTaken(med.id, "morning")) takenTasks++;
    }
    if (med.schedule.afternoon) {
      totalTasks++;
      if (isTaken(med.id, "afternoon")) takenTasks++;
    }
    if (med.schedule.night) {
      totalTasks++;
      if (isTaken(med.id, "night")) takenTasks++;
    }
  });

  const progressPercentage = totalTasks > 0 ? Math.round((takenTasks / totalTasks) * 100) : 0;

  // Active slots to display: if "auto", display current slot; if "all", all slots; else specific slot
  const activeSlots =
    selectedSlot === "auto"
      ? timeSlots.filter((s) => s.id === currentSlotInfo.slot)
      : selectedSlot === "all"
      ? timeSlots
      : timeSlots.filter((s) => s.id === selectedSlot);

  // Current slot pending tasks count
  const currentSlotMeds = medicines.filter((m) => isScheduled(m, currentSlotInfo.slot));
  const currentSlotTakenCount = currentSlotMeds.filter((m) => isTaken(m.id, currentSlotInfo.slot)).length;
  const currentSlotPendingCount = Math.max(0, currentSlotMeds.length - currentSlotTakenCount);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Daily Progress Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-900/50">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  আজকের ওষুধ সেবন সূচি
                </h2>
                {progressPercentage === 100 && totalTasks > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-900">
                    <Sparkles className="w-3.5 h-3.5" /> আজকের সব ওষুধ সম্পন্ন!
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                    {toBanglaNumber(progressPercentage)}% সম্পন্ন
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                আজকের মোট {toBanglaNumber(totalTasks)} টি ডোজের মধ্যে {toBanglaNumber(takenTasks)} টি গ্রহণ করা হয়েছে ({toBanglaNumber(totalTasks - takenTasks)} টি বাকি)।
              </p>
            </div>
          </div>

          {/* Slot filter chips with Auto-Time detection */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none text-xs">
            {/* Auto Slot (Based on Current Time) */}
            <button
              id="filter-slot-auto"
              type="button"
              onClick={() => setSelectedSlot("auto")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedSlot === "auto"
                  ? "bg-teal-600 text-white shadow-md shadow-teal-600/20 ring-2 ring-teal-400/40"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
              title="বর্তমান সময়ের স্লট (সকাল/দুপুর/রাত) স্বয়ংক্রিয়ভাবে দেখাবে"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <Zap className="w-3.5 h-3.5" />
              <span>অটো: {currentSlotInfo.labelBn}বেলা</span>
            </button>

            <button
              id="filter-slot-all"
              type="button"
              onClick={() => setSelectedSlot("all")}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedSlot === "all"
                  ? "bg-slate-900 dark:bg-slate-700 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              সব সময় ({toBanglaNumber(totalTasks)})
            </button>

            {timeSlots.map((slot) => {
              const count = medicines.filter((m) => isScheduled(m, slot.id)).length;
              const Icon = slot.icon;
              const isCurrent = slot.id === currentSlotInfo.slot;
              return (
                <button
                  key={slot.id}
                  id={`filter-slot-${slot.id}`}
                  type="button"
                  onClick={() => setSelectedSlot(slot.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedSlot === slot.id
                      ? "bg-teal-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{slot.title}</span>
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  )}
                  <span className="text-[10px] opacity-80">({toBanglaNumber(count)})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800/90 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              progressPercentage === 100 ? "bg-emerald-500" : "bg-teal-600"
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Empty State if no medicines exist */}
      {medicines.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200/80 dark:border-slate-800 text-center space-y-4 transition-colors shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto border border-teal-100 dark:border-teal-900">
            <Pill className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">কোনো ওষুধ যোগ করা নেই</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              প্রেসক্রিপশন স্ক্যান করে বা সরাসরি নাম লিখে আপনার প্রেসক্রাইব করা ওষুধের তালিকা ও সময়সূচি যুক্ত করুন।
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              id="empty-add-medicine-btn"
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-4 h-4" /> ওষুধ যোগ করুন
            </button>
            <button
              id="empty-upload-prescription-btn"
              type="button"
              onClick={onOpenPrescriptionTab}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              প্রেসক্রিপশন আপলোড
            </button>
          </div>
        </div>
      )}

      {/* Time Slot Sections */}
      <div className="space-y-4">
        {activeSlots.map((slot) => {
          const Icon = slot.icon;
          const slotMeds = medicines.filter((m) => isScheduled(m, slot.id));
          const slotCompletedCount = slotMeds.filter((m) => isTaken(m.id, slot.id)).length;
          const isAllSlotDone = slotMeds.length > 0 && slotCompletedCount === slotMeds.length;
          const isCurrentActiveSlot = slot.id === currentSlotInfo.slot;
          const pendingInThisSlot = Math.max(0, slotMeds.length - slotCompletedCount);

          return (
            <div
              key={slot.id}
              className={`rounded-3xl border bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-all ${
                isCurrentActiveSlot
                  ? "border-teal-400 dark:border-teal-700 ring-2 ring-teal-500/20 shadow-md"
                  : slot.borderClass
              }`}
            >
              {/* Slot Header */}
              <div
                className={`p-3.5 sm:p-4.5 ${
                  isCurrentActiveSlot
                    ? "bg-teal-50/50 dark:bg-teal-950/30"
                    : slot.bgClass
                } border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl bg-gradient-to-r ${slot.accentColor} text-white flex items-center justify-center shadow-xs shrink-0`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {slot.title} এর ওষুধ
                      </h3>

                      {/* Current Active Time Slot Badge */}
                      {isCurrentActiveSlot && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-600 text-white text-[11px] font-extrabold shadow-2xs">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-200 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                          </span>
                          বর্তমান সক্রিয় সময়
                        </span>
                      )}

                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${slot.badgeBg}`}>
                        {toBanglaNumber(slotCompletedCount)} / {toBanglaNumber(slotMeds.length)} গৃহীত
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {slot.timeRange}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isCurrentActiveSlot && pendingInThisSlot > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-100/90 dark:bg-rose-950 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-900 animate-pulse">
                      <BellRing className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      {toBanglaNumber(pendingInThisSlot)} টি ওষুধ খাওয়া বাকি!
                    </span>
                  )}

                  {isAllSlotDone && slotMeds.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-900">
                      <CheckCircle2 className="w-3.5 h-3.5" /> সম্পন্ন
                    </span>
                  )}
                </div>
              </div>

              {/* Medicines in this slot */}
              <div className="p-3 sm:p-4 divide-y divide-slate-100 dark:divide-slate-800/80">
                {slotMeds.length === 0 ? (
                  <div className="py-7 text-center text-xs text-slate-400 dark:text-slate-500">
                    {slot.title}বেলায় খাওয়ার জন্য কোনো ওষুধ নির্ধারিত নেই
                  </div>
                ) : (
                  slotMeds.map((med) => {
                    const taken = isTaken(med.id, slot.id);
                    const dose = getDoseForSlot(med, slot.id);
                    const timing = getTimingForSlot(med, slot.id);
                    const timingFormat = formatMealTimingBangla(timing);
                    const stockCalc = calculateRemainingStrips(med);

                    return (
                      <div
                        key={med.id}
                        className={`py-3.5 first:pt-0.5 last:pb-0.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all ${
                          taken ? "opacity-70" : ""
                        }`}
                      >
                        {/* Medicine Info */}
                        <div
                          className="flex items-start gap-3 cursor-pointer group flex-1 min-w-0"
                          onClick={() => onOpenMedicineDetails(med)}
                        >
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 border overflow-hidden shadow-2xs transition-colors ${
                              taken
                                ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900"
                                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 group-hover:border-teal-500 group-hover:text-teal-600"
                            }`}
                          >
                            {med.imageUrl ? (
                              <img
                                src={med.imageUrl}
                                alt={med.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <Pill className="w-5 h-5" />
                            )}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h4
                                className={`text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors ${
                                  taken ? "line-through text-slate-500 dark:text-slate-500" : ""
                                }`}
                              >
                                {med.name}
                              </h4>
                              {med.nameBn && (
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  ({med.nameBn})
                                </span>
                              )}
                              {med.strength && (
                                <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {med.strength}
                                </span>
                              )}
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${timingFormat.badgeClass}`}
                              >
                                {timingFormat.text}
                              </span>
                            </div>

                            {med.generic && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-sm">
                                {med.generic}
                              </p>
                            )}

                            {/* Stock Indicator Banner */}
                            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                ডোজ: {toBanglaNumber(dose)} টি {med.dosageForm || "ট্যাবলেট"}
                              </span>
                              <span className="text-slate-300 dark:text-slate-600">•</span>
                              <span
                                className={`px-2 py-0.5 rounded-md border font-medium ${stockCalc.statusColor}`}
                              >
                                {stockCalc.formattedBangla}
                              </span>
                              {stockCalc.daysRemaining < 999 && !stockCalc.isOutOfStock && (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                  (আর {toBanglaNumber(stockCalc.daysRemaining)} দিন চলবে)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action: Mark as Taken Button */}
                        <div className="flex items-center justify-end gap-2 pt-1 sm:pt-0 shrink-0">
                          <button
                            id={`toggle-taken-${slot.id}-${med.id}`}
                            type="button"
                            onClick={() => onToggleTaken(med.id, slot.id)}
                            title={taken ? "পুনরায় গ্রহণ না করা হিসেবে চিহ্নিত করুন" : "ওষুধ গ্রহণ সম্পন্ন চিহ্নিত করুন"}
                            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95 shadow-xs ${
                              taken
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md shadow-teal-600/20 hover:scale-[1.02]"
                            }`}
                          >
                            {taken ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-100" />
                                <span>খাওয়া হয়েছে</span>
                              </>
                            ) : (
                              <>
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                </span>
                                <span>ওষুধ গ্রহণ করুন</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

