import React from "react";
import {
  X,
  Pill,
  Clock,
  Layers,
  Calendar,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Sunrise,
  Sun,
  Moon,
  Plus
} from "lucide-react";
import { Medicine } from "../types";
import {
  toBanglaNumber,
  calculateRemainingStrips,
  formatMealTimingBangla,
  getDoseDescriptionBangla
} from "../utils/banglaUtils";

interface MedicineDetailModalProps {
  medicine: Medicine | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (medicine: Medicine) => void;
  onDelete: (medicineId: string) => void;
  onQuickAddStrips: (medicineId: string, strips: number) => void;
}

export const MedicineDetailModal: React.FC<MedicineDetailModalProps> = ({
  medicine,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onQuickAddStrips
}) => {
  if (!isOpen || !medicine) return null;

  const stockCalc = calculateRemainingStrips(medicine);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/80 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{medicine.name}</h3>
                {medicine.strength && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {medicine.strength}
                  </span>
                )}
              </div>
              {medicine.generic && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{medicine.generic}</p>
              )}
              {medicine.company && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3 h-3" /> {medicine.company}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Stock Alert Status */}
          <div className={`p-3.5 rounded-2xl border ${stockCalc.statusColor} flex items-center justify-between`}>
            <div>
              <span className="font-bold text-sm block">মজুত অবস্থা: {stockCalc.statusText}</span>
              <p className="text-xs mt-0.5">
                বাকি: <strong>{stockCalc.formattedBangla}</strong>
                {stockCalc.daysRemaining < 999 && (
                  <span> (আর {toBanglaNumber(stockCalc.daysRemaining)} দিন চলবে)</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onQuickAddStrips(medicine.id, 1)}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
              >
                +১ পাতা
              </button>
            </div>
          </div>

          {/* Schedule Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 uppercase">
              <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>খাওয়ার সময় ও নিয়মাবলী</span>
            </h4>

            <div className="grid grid-cols-3 gap-2">
              {/* Morning */}
              <div
                className={`p-2.5 rounded-xl border text-center ${
                  medicine.schedule.morning
                    ? "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-300"
                    : "bg-slate-100/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600"
                }`}
              >
                <div className="flex items-center justify-center gap-1 font-bold">
                  <Sunrise className="w-3.5 h-3.5" />
                  <span>সকাল</span>
                </div>
                {medicine.schedule.morning ? (
                  <div className="mt-1 space-y-0.5">
                    <p className="font-bold">{toBanglaNumber(medicine.schedule.morningDose || 1)} টি</p>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400">
                      {formatMealTimingBangla(medicine.schedule.morningTiming).text}
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] mt-1">প্রযোজ্য নয়</p>
                )}
              </div>

              {/* Afternoon */}
              <div
                className={`p-2.5 rounded-xl border text-center ${
                  medicine.schedule.afternoon
                    ? "bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-900/60 text-sky-900 dark:text-sky-300"
                    : "bg-slate-100/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600"
                }`}
              >
                <div className="flex items-center justify-center gap-1 font-bold">
                  <Sun className="w-3.5 h-3.5" />
                  <span>দুপুর</span>
                </div>
                {medicine.schedule.afternoon ? (
                  <div className="mt-1 space-y-0.5">
                    <p className="font-bold">{toBanglaNumber(medicine.schedule.afternoonDose || 1)} টি</p>
                    <p className="text-[10px] text-sky-700 dark:text-sky-400">
                      {formatMealTimingBangla(medicine.schedule.afternoonTiming).text}
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] mt-1">প্রযোজ্য নয়</p>
                )}
              </div>

              {/* Night */}
              <div
                className={`p-2.5 rounded-xl border text-center ${
                  medicine.schedule.night
                    ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900/60 text-indigo-900 dark:text-indigo-300"
                    : "bg-slate-100/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600"
                }`}
              >
                <div className="flex items-center justify-center gap-1 font-bold">
                  <Moon className="w-3.5 h-3.5" />
                  <span>রাত</span>
                </div>
                {medicine.schedule.night ? (
                  <div className="mt-1 space-y-0.5">
                    <p className="font-bold">{toBanglaNumber(medicine.schedule.nightDose || 1)} টি</p>
                    <p className="text-[10px] text-indigo-700 dark:text-indigo-400">
                      {formatMealTimingBangla(medicine.schedule.nightTiming).text}
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] mt-1">প্রযোজ্য নয়</p>
                )}
              </div>
            </div>

            {medicine.notes && (
              <div className="mt-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">নির্দেশনা ও পরামর্শ:</span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{medicine.notes}</p>
              </div>
            )}
          </div>

          {/* Stock & Strips Technical Info */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">প্রতি পাতায় ট্যাবলেট:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {toBanglaNumber(medicine.stock.tabletsPerStrip || 10)} টি
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">বর্তমান পূর্ণ পাতা:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {toBanglaNumber(medicine.stock.stripsCount || 0)} পাতা
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">খুচরা ট্যাবলেট:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {toBanglaNumber(medicine.stock.looseTablets || 0)} টি
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1.5">
              <span className="text-slate-700 dark:text-slate-300 font-semibold">সর্বমোট ট্যাবলেট সংখ্যা:</span>
              <span className="font-bold text-teal-700 dark:text-teal-400">
                {toBanglaNumber(medicine.stock.totalUnits || 0)} টি
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 transition-colors">
          <button
            id={`delete-med-btn-${medicine.id}`}
            type="button"
            onClick={() => {
              if (window.confirm(`আপনি কি নিশ্চিত যে "${medicine.name}" তালিকা থেকে মুছতে চান?`)) {
                onDelete(medicine.id);
                onClose();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-100/60 dark:hover:bg-rose-950/60 font-semibold cursor-pointer transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>মুছে ফেলুন</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              id={`edit-med-btn-${medicine.id}`}
              type="button"
              onClick={() => {
                onClose();
                onEdit(medicine);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>এডিট করুন</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
