import React, { useState } from "react";
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
  Plus
} from "lucide-react";
import { Medicine, TimeSlot, MealTiming } from "../types";
import {
  toBanglaNumber,
  formatMealTimingBangla,
  calculateRemainingStrips
} from "../utils/banglaUtils";

interface ScheduleViewProps {
  medicines: Medicine[];
  dateKey: string;
  logs: Record<string, { morning?: boolean; afternoon?: boolean; night?: boolean }>;
  onToggleTaken: (medicineId: string, slot: TimeSlot) => void;
  onOpenMedicineDetails: (med: Medicine) => void;
  onOpenAddModal: () => void;
  onOpenPrescriptionTab: () => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  medicines,
  dateKey,
  logs,
  onToggleTaken,
  onOpenMedicineDetails,
  onOpenAddModal,
  onOpenPrescriptionTab
}) => {
  const [selectedSlot, setSelectedSlot] = useState<"all" | TimeSlot>("all");
  const [filterRemainingOnly, setFilterRemainingOnly] = useState(false);

  // Time slot configurations
  const timeSlots: {
    id: TimeSlot;
    title: string;
    icon: any;
    timeRange: string;
    color: string;
    bgClass: string;
    borderClass: string;
    headerBg: string;
  }[] = [
    {
      id: "morning",
      title: "সকাল",
      icon: Sunrise,
      timeRange: "সকাল ৭:০০ - ১০:০০",
      color: "text-amber-600",
      bgClass: "bg-amber-50/50",
      borderClass: "border-amber-200",
      headerBg: "bg-gradient-to-r from-amber-500 to-orange-500"
    },
    {
      id: "afternoon",
      title: "দুপুর",
      icon: Sun,
      timeRange: "দুপুর ১:০০ - ৩:০০",
      color: "text-sky-600",
      bgClass: "bg-sky-50/50",
      borderClass: "border-sky-200",
      headerBg: "bg-gradient-to-r from-sky-500 to-blue-500"
    },
    {
      id: "night",
      title: "রাত",
      icon: Moon,
      timeRange: "রাত ৮:০০ - ১০:৩০",
      color: "text-indigo-600",
      bgClass: "bg-indigo-50/50",
      borderClass: "border-indigo-200",
      headerBg: "bg-gradient-to-r from-indigo-600 to-purple-600"
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

  // Filter slots to display
  const activeSlots = selectedSlot === "all" ? timeSlots : timeSlots.filter((s) => s.id === selectedSlot);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Progress & Today Stats */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h2 className="text-base font-bold text-slate-800 dark:text-white">আজকের ওষুধের অগ্রগতি</h2>
              {progressPercentage === 100 && totalTasks > 0 && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold">
                  <Sparkles className="w-3 h-3" /> সব ওষুধ গ্রহণ সম্পন্ন!
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              মোট {toBanglaNumber(totalTasks)} টি ডোজের মধ্যে {toBanglaNumber(takenTasks)} টি গ্রহণ করা হয়েছে ({toBanglaNumber(progressPercentage)}%)
            </p>
          </div>

          {/* Quick slot filter chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              id="filter-slot-all"
              type="button"
              onClick={() => setSelectedSlot("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedSlot === "all"
                  ? "bg-slate-900 dark:bg-teal-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              সব সময় ({toBanglaNumber(totalTasks)})
            </button>
            {timeSlots.map((slot) => {
              const count = medicines.filter((m) => isScheduled(m, slot.id)).length;
              const Icon = slot.icon;
              return (
                <button
                  key={slot.id}
                  id={`filter-slot-${slot.id}`}
                  type="button"
                  onClick={() => setSelectedSlot(slot.id)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedSlot === slot.id
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{slot.title}</span>
                  <span className="text-[10px] opacity-80">({toBanglaNumber(count)})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-4 transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
            <Pill className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">কোনো ওষুধ যোগ করা নেই</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              প্রেসক্রিপশন আপলোড করে সহজেই ওষুধ যুক্ত করুন অথবা সরাসরি নাম লিখে ওষুধ ও তার খাওয়ার সূচি সেট করুন।
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              id="empty-add-medicine-btn"
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> ওষুধ যোগ করুন
            </button>
            <button
              id="empty-upload-prescription-btn"
              type="button"
              onClick={onOpenPrescriptionTab}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              প্রেসক্রিপশন আপলোড
            </button>
          </div>
        </div>
      )}

      {/* Segmented Slot Cards */}
      <div className="space-y-5">
        {activeSlots.map((slot) => {
          const Icon = slot.icon;
          const slotMeds = medicines.filter((m) => isScheduled(m, slot.id));
          const filteredSlotMeds = filterRemainingOnly
            ? slotMeds.filter((m) => !isTaken(m.id, slot.id))
            : slotMeds;

          const slotCompletedCount = slotMeds.filter((m) => isTaken(m.id, slot.id)).length;

          return (
            <div
              key={slot.id}
              className={`rounded-2xl border ${slot.borderClass} dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-colors`}
            >
              {/* Slot Header */}
              <div className="p-3.5 sm:p-4 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl ${slot.headerBg} text-white flex items-center justify-center shadow-xs`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{slot.title} এর ওষুধ</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                        {toBanglaNumber(slotCompletedCount)} / {toBanglaNumber(slotMeds.length)} গৃহীত
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {slot.timeRange}
                    </p>
                  </div>
                </div>

                {slotMeds.length > 0 && slotCompletedCount === slotMeds.length && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> সম্পন্ন
                  </span>
                )}
              </div>

              {/* Medicines List in this Slot */}
              <div className="p-3 sm:p-4 divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSlotMeds.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    {slotMeds.length === 0
                      ? `${slot.title}বেলায় কোনো ওষুধ নির্ধারিত নেই`
                      : "এই সময়ের সব ওষুধ নেওয়া সম্পন্ন হয়েছে!"}
                  </div>
                ) : (
                  filteredSlotMeds.map((med) => {
                    const taken = isTaken(med.id, slot.id);
                    const dose = getDoseForSlot(med, slot.id);
                    const timing = getTimingForSlot(med, slot.id);
                    const timingFormat = formatMealTimingBangla(timing);
                    const stockCalc = calculateRemainingStrips(med);

                    return (
                      <div
                        key={med.id}
                        className={`py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                          taken ? "opacity-75" : ""
                        }`}
                      >
                        {/* Medicine Info */}
                        <div
                          className="flex items-start gap-3 cursor-pointer group"
                          onClick={() => onOpenMedicineDetails(med)}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              taken
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-teal-50 dark:group-hover:bg-teal-950 group-hover:text-teal-600"
                            }`}
                          >
                            <Pill className="w-5 h-5" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h4
                                className={`text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400 ${
                                  taken ? "line-through text-slate-500 dark:text-slate-500" : ""
                                }`}
                              >
                                {med.name}
                              </h4>
                              {med.strength && (
                                <span className="text-[11px] font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {med.strength}
                                </span>
                              )}
                              <span
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${timingFormat.badgeClass}`}
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
                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                ডোজ: {toBanglaNumber(dose)} টি {med.dosageForm || "ট্যাবলেট"}
                              </span>
                              <span className="text-slate-300 dark:text-slate-600">•</span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-md border font-medium ${stockCalc.statusColor}`}
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
                        <div className="flex items-center justify-end gap-2 pt-1 sm:pt-0">
                          <button
                            id={`toggle-taken-${slot.id}-${med.id}`}
                            type="button"
                            onClick={() => onToggleTaken(med.id, slot.id)}
                            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-2xs active:scale-95 ${
                              taken
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                            }`}
                          >
                            {taken ? (
                              <>
                                <Check className="w-4 h-4" />
                                <span>খাওয়া হয়েছে</span>
                              </>
                            ) : (
                              <>
                                <Circle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                <span>ওষুধ খেয়েছি</span>
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
