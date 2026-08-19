import React from "react";
import { AlertCircle, AlertTriangle, ArrowRight, PlusCircle, CheckCircle2 } from "lucide-react";
import { Medicine } from "../types";
import { calculateRemainingStrips, toBanglaNumber } from "../utils/banglaUtils";

interface LowStockBannerProps {
  medicines: Medicine[];
  onOpenStockTab: () => void;
  onQuickRefill: (medId: string, stripsToAdd: number) => void;
}

export const LowStockBanner: React.FC<LowStockBannerProps> = ({
  medicines,
  onOpenStockTab,
  onQuickRefill
}) => {
  const alertedMedicines = medicines
    .map((med) => ({
      med,
      calc: calculateRemainingStrips(med)
    }))
    .filter(({ calc }) => calc.isLowStock || calc.isOutOfStock);

  if (alertedMedicines.length === 0) {
    return null;
  }

  const outOfStockList = alertedMedicines.filter(({ calc }) => calc.isOutOfStock);
  const lowStockList = alertedMedicines.filter(({ calc }) => calc.isLowStock);

  return (
    <section aria-label="মজুত সতর্কতা" className="max-w-5xl mx-auto px-3 sm:px-6 pt-3">
      <div className="rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50/90 via-amber-50/90 to-orange-50/90 p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-rose-900 flex items-center gap-1.5">
                <span>মজুত সতর্কতা:</span>
                {outOfStockList.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-600 text-white">
                    {toBanglaNumber(outOfStockList.length)} টি সম্পূর্ণ শেষ!
                  </span>
                )}
                {lowStockList.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-600 text-white">
                    {toBanglaNumber(lowStockList.length)} টি শেষ হওয়ার পথে
                  </span>
                )}
              </h2>
              <p className="text-xs text-rose-800/80 mt-0.5">
                নিয়মিত ওষুধ গ্রহণ নিশ্চিত করতে ফার্মেসি থেকে নতুন পাতা সংগ্রহ করুন।
              </p>
            </div>
          </div>

          <button
            id="view-all-stock-button"
            type="button"
            onClick={onOpenStockTab}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-900 bg-white/80 hover:bg-white px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors shrink-0 cursor-pointer"
          >
            <span>সব মজুত হিসাব</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Refill List */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {alertedMedicines.map(({ med, calc }) => (
            <div
              key={med.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-rose-100 shadow-2xs"
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      calc.isOutOfStock ? "bg-rose-600 animate-ping" : "bg-amber-500"
                    }`}
                  />
                  <p className="text-xs font-bold text-slate-900 truncate">{med.name}</p>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  বাকি: <strong className="text-rose-600 font-semibold">{calc.formattedBangla}</strong>
                  {calc.daysRemaining < 999 && !calc.isOutOfStock && (
                    <span className="text-slate-400"> (আর {toBanglaNumber(calc.daysRemaining)} দিন)</span>
                  )}
                </p>
              </div>

              <button
                id={`quick-refill-${med.id}`}
                type="button"
                onClick={() => onQuickRefill(med.id, 1)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-lg transition-colors shrink-0 cursor-pointer"
                title="১ পাতা মজুত যোগ করুন"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>+১ পাতা</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
