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
  Plus,
  Receipt,
  BadgePercent,
  Coins,
  Sparkles
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
  onRequestDelete?: (medicine: Medicine) => void;
  onQuickAddStrips: (medicineId: string, strips: number) => void;
}

export const MedicineDetailModal: React.FC<MedicineDetailModalProps> = ({
  medicine,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onRequestDelete,
  onQuickAddStrips
}) => {
  if (!isOpen || !medicine) return null;

  const stockCalc = calculateRemainingStrips(medicine);

  // Price & Strip Calculations
  const tabletsPerStrip = medicine.stock.tabletsPerStrip || 10;
  const unitMrp = Number(medicine.mrp || 0);
  const unitPrice = Number(medicine.discountedPrice || medicine.mrp || 0);
  const stripMrp = unitMrp * tabletsPerStrip;
  const stripPrice = unitPrice * tabletsPerStrip;
  const totalStockPrice = (medicine.stock.totalUnits || 0) * unitPrice;
  const discountPercent =
    medicine.discountPercent ||
    (unitMrp > 0 && unitPrice < unitMrp ? Math.round(((unitMrp - unitPrice) / unitMrp) * 100) : 0);
  const hasPrice = unitMrp > 0 || unitPrice > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/80 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
              {medicine.imageUrl ? (
                <img
                  src={medicine.imageUrl}
                  alt={medicine.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <Pill className="w-7 h-7" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{medicine.name}</h3>
                {medicine.nameBn && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    ({medicine.nameBn})
                  </span>
                )}
                {medicine.strength && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {medicine.strength}
                  </span>
                )}
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  {medicine.dosageForm || "ট্যাবলেট"}
                </span>
              </div>
              {medicine.generic && (
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">{medicine.generic}</p>
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
          {/* Detailed Price Information Card (১ পাতা ও প্রতি পিসের মূল্য) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-indigo-500/5 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-900 border border-emerald-200 dark:border-emerald-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>বাজার দর ও পাতা হিসাব (Price Breakdown)</span>
              </span>

              {discountPercent > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[11px] flex items-center gap-1">
                  <BadgePercent className="w-3.5 h-3.5" />
                  {toBanglaNumber(discountPercent)}% ছাড়
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  ভেরিফাইড মূল্য
                </span>
              )}
            </div>

            {hasPrice ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. Price Per Strip (এক পাতার দাম) */}
                <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-emerald-100 dark:border-emerald-900/60 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ১ পাতার দাম ({toBanglaNumber(tabletsPerStrip)} টি {medicine.dosageForm || "ট্যাবলেট"}):
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 pt-0.5">
                    <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
                      ৳{toBanglaNumber(stripPrice.toFixed(2))}
                    </span>
                    {stripMrp > 0 && stripMrp !== stripPrice && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 line-through">
                        ৳{toBanglaNumber(stripMrp.toFixed(2))}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      / পাতা
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    প্রতি পাতায় {toBanglaNumber(tabletsPerStrip)} টি ইউনিট থাকে
                  </p>
                </div>

                {/* 2. Price Per Unit (১ টি ট্যাবলেটের দাম) */}
                <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-teal-100 dark:border-teal-900/60 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                    <span className="flex items-center gap-1">
                      <Pill className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      ১টি {medicine.dosageForm || "ট্যাবলেটের"} দাম:
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 pt-0.5">
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      ৳{toBanglaNumber(unitPrice.toFixed(2))}
                    </span>
                    {unitMrp > 0 && unitMrp !== unitPrice && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 line-through">
                        MRP ৳{toBanglaNumber(unitMrp.toFixed(2))}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      / পিস
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    খুচরা একক বিক্রয় মূল্য
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center space-y-1">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  এই ওষুধের সঠিক মূল্য সেট করা নেই।
                </p>
                <button
                  type="button"
                  onClick={() => onEdit(medicine)}
                  className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  মূল্য ও পাতা তথ্য যোগ করতে এডিট করুন →
                </button>
              </div>
            )}

            {/* Total Remaining Stock Value */}
            {hasPrice && medicine.stock.totalUnits > 0 && (
              <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  বর্তমান মজুদের আনুমানিক মূল্য ({toBanglaNumber(medicine.stock.totalUnits)}টি {medicine.dosageForm || "ট্যাবলেট"}):
                </span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  ৳{toBanglaNumber(totalStockPrice.toFixed(2))}
                </span>
              </div>
            )}
          </div>
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
              if (onRequestDelete) {
                onClose();
                onRequestDelete(medicine);
              } else {
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer transition-colors shadow-xs"
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
