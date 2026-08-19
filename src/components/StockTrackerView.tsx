import React, { useState } from "react";
import {
  Layers,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  RefreshCw,
  Edit3,
  Calendar,
  Pill,
  ShoppingBag,
  TrendingDown,
  Info
} from "lucide-react";
import { Medicine } from "../types";
import {
  toBanglaNumber,
  calculateRemainingStrips,
  calculateDailyDose,
  getDoseDescriptionBangla
} from "../utils/banglaUtils";

interface StockTrackerViewProps {
  medicines: Medicine[];
  onUpdateStock: (
    medicineId: string,
    newStock: {
      stripsCount: number;
      looseTablets: number;
      tabletsPerStrip: number;
      lowStockThreshold: number;
    }
  ) => void;
  onQuickAddStrips: (medicineId: string, stripsCount: number) => void;
  onOpenMedicineDetails: (med: Medicine) => void;
  onOpenAddModal: () => void;
}

export const StockTrackerView: React.FC<StockTrackerViewProps> = ({
  medicines,
  onUpdateStock,
  onQuickAddStrips,
  onOpenMedicineDetails,
  onOpenAddModal
}) => {
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [editingStockMedId, setEditingStockMedId] = useState<string | null>(null);

  // Edit stock temporary form state
  const [editStrips, setEditStrips] = useState<number>(0);
  const [editLoose, setEditLoose] = useState<number>(0);
  const [editPerStrip, setEditPerStrip] = useState<number>(10);
  const [editThreshold, setEditThreshold] = useState<number>(5);

  const startEditStock = (med: Medicine) => {
    setEditingStockMedId(med.id);
    setEditStrips(med.stock.stripsCount);
    setEditLoose(med.stock.looseTablets);
    setEditPerStrip(med.stock.tabletsPerStrip || 10);
    setEditThreshold(med.stock.lowStockThreshold || 5);
  };

  const saveEditStock = (medId: string) => {
    onUpdateStock(medId, {
      stripsCount: Math.max(0, Number(editStrips) || 0),
      looseTablets: Math.max(0, Number(editLoose) || 0),
      tabletsPerStrip: Math.max(1, Number(editPerStrip) || 10),
      lowStockThreshold: Math.max(1, Number(editThreshold) || 5)
    });
    setEditingStockMedId(null);
  };

  // Stock calculations for all medicines
  const medicineStats = medicines.map((med) => {
    const calc = calculateRemainingStrips(med);
    const daily = calculateDailyDose(med);
    return {
      med,
      calc,
      daily
    };
  });

  const outOfStockCount = medicineStats.filter((m) => m.calc.isOutOfStock).length;
  const lowStockCount = medicineStats.filter((m) => m.calc.isLowStock).length;
  const healthyStockCount = medicineStats.filter((m) => !m.calc.isOutOfStock && !m.calc.isLowStock).length;

  const filteredStats = medicineStats.filter(({ calc }) => {
    if (filter === "out") return calc.isOutOfStock;
    if (filter === "low") return calc.isLowStock || calc.isOutOfStock;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div
          onClick={() => setFilter("all")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            filter === "all"
              ? "bg-slate-900 text-white border-slate-900 shadow-sm"
              : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold opacity-80">মোট ওষুধ</span>
            <Layers className="w-4 h-4 opacity-70" />
          </div>
          <p className="text-2xl font-bold mt-1.5">{toBanglaNumber(medicines.length)} টি</p>
          <p className="text-[11px] opacity-70 mt-0.5">সব ঔষধের মজুত</p>
        </div>

        <div
          onClick={() => setFilter("all")}
          className="p-3.5 rounded-2xl bg-white border border-emerald-200 text-slate-800 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">পর্যাপ্ত মজুত</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1.5">{toBanglaNumber(healthyStockCount)} টি</p>
          <p className="text-[11px] text-slate-500 mt-0.5">চিন্তাহীন মজুত</p>
        </div>

        <div
          onClick={() => setFilter("low")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            filter === "low"
              ? "bg-amber-600 text-white border-amber-600 shadow-sm"
              : "bg-white text-slate-800 border-amber-200 hover:border-amber-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">শেষ হওয়ার পথে</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-1.5">{toBanglaNumber(lowStockCount)} টি</p>
          <p className="text-[11px] text-amber-800/80 mt-0.5">রিফিল প্রয়োজন</p>
        </div>

        <div
          onClick={() => setFilter("out")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            filter === "out"
              ? "bg-rose-600 text-white border-rose-600 shadow-sm"
              : "bg-white text-slate-800 border-rose-200 hover:border-rose-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800">সম্পূর্ণ শেষ</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-1.5">{toBanglaNumber(outOfStockCount)} টি</p>
          <p className="text-[11px] text-rose-700/80 mt-0.5">জরুরি কিনতে হবে</p>
        </div>
      </div>

      {/* Filter Tabs & Action */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            id="filter-stock-all"
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filter === "all"
                ? "bg-teal-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            সব ওষুধ ({toBanglaNumber(medicines.length)})
          </button>
          <button
            id="filter-stock-low"
            type="button"
            onClick={() => setFilter("low")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filter === "low"
                ? "bg-amber-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            সতর্কতা / শেষ হওয়ার পথে ({toBanglaNumber(lowStockCount + outOfStockCount)})
          </button>
        </div>

        <button
          id="stock-add-medicine-btn"
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>নতুন ওষুধ যোগ</span>
        </button>
      </div>

      {/* Stock Cards List */}
      <div className="space-y-3">
        {filteredStats.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400 text-xs">
            এই ক্যাটাগরিতে কোনো ওষুধ পাওয়া যায়নি।
          </div>
        ) : (
          filteredStats.map(({ med, calc, daily }) => {
            const isEditing = editingStockMedId === med.id;

            return (
              <div
                key={med.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
                  calc.isOutOfStock
                    ? "border-rose-300 ring-1 ring-rose-200"
                    : calc.isLowStock
                    ? "border-amber-300 ring-1 ring-amber-100"
                    : "border-slate-200"
                }`}
              >
                {/* Main Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        calc.isOutOfStock
                          ? "bg-rose-100 text-rose-700"
                          : calc.isLowStock
                          ? "bg-amber-100 text-amber-700"
                          : "bg-teal-50 text-teal-700"
                      }`}
                    >
                      <Pill className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className="text-base sm:text-lg font-bold text-slate-900 cursor-pointer hover:text-teal-700"
                          onClick={() => onOpenMedicineDetails(med)}
                        >
                          {med.name}
                        </h3>
                        {med.strength && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {med.strength}
                          </span>
                        )}
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${calc.statusColor}`}
                        >
                          {calc.statusText}
                        </span>
                      </div>

                      {med.generic && (
                        <p className="text-xs text-slate-500 mt-0.5">{med.generic}</p>
                      )}

                      <p className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                        <span>
                          <strong>খাওয়ার নিয়ম:</strong> {getDoseDescriptionBangla(med)}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>
                          <strong>দৈনিক খরচ:</strong> {toBanglaNumber(daily)} টি
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Top Action Buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-start">
                    <button
                      id={`edit-stock-btn-${med.id}`}
                      type="button"
                      onClick={() =>
                        isEditing ? setEditingStockMedId(null) : startEditStock(med)
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditing ? "বাতিল" : "মজুত আপডেট"}</span>
                    </button>
                  </div>
                </div>

                {/* Stock Details & Calculation Box */}
                {!isEditing ? (
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/70 p-3 rounded-xl">
                    <div>
                      <span className="text-xs text-slate-500 font-medium">কয় পাতা বাকি:</span>
                      <p className="text-base font-bold text-slate-900 mt-0.5">
                        {calc.formattedBangla}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        (প্রতি পাতায় {toBanglaNumber(med.stock.tabletsPerStrip || 10)} টি ট্যাবলেট)
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 font-medium">আর কত দিন চলবে:</span>
                      <p
                        className={`text-base font-bold mt-0.5 ${
                          calc.daysRemaining <= 3 ? "text-rose-600 font-extrabold" : "text-emerald-700"
                        }`}
                      >
                        {calc.daysRemaining >= 999
                          ? "দীর্ঘদিন"
                          : calc.daysRemaining === 0
                          ? "আজই শেষ!"
                          : `আর ${toBanglaNumber(calc.daysRemaining)} দিন চলবে`}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        সতর্কবার্তা থ্রেশহোল্ড: {toBanglaNumber(med.stock.lowStockThreshold || 5)} টি
                      </p>
                    </div>

                    {/* Quick Refill Actions */}
                    <div className="flex flex-col justify-center">
                      <span className="text-xs text-slate-500 font-medium mb-1">দ্রুত পাতা যোগ করুন:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          id={`quick-add-1-strip-${med.id}`}
                          type="button"
                          onClick={() => onQuickAddStrips(med.id, 1)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-2xs active:scale-95"
                          title="১ পাতা যোগ করুন"
                        >
                          +১ পাতা
                        </button>
                        <button
                          id={`quick-add-2-strip-${med.id}`}
                          type="button"
                          onClick={() => onQuickAddStrips(med.id, 2)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors cursor-pointer shadow-2xs active:scale-95"
                          title="২ পাতা যোগ করুন"
                        >
                          +২ পাতা
                        </button>
                        <button
                          id={`quick-add-3-strip-${med.id}`}
                          type="button"
                          onClick={() => onQuickAddStrips(med.id, 3)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors cursor-pointer shadow-2xs active:scale-95"
                          title="৩ পাতা যোগ করুন"
                        >
                          +৩ পাতা
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Edit Stock Form */
                  <div className="mt-4 pt-3 border-t border-slate-100 bg-teal-50/50 p-4 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-teal-900 flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5 text-teal-600" /> মজুত ও পাতার সংখ্যা এডিট করুন
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          কয় পাতা আছে:
                        </label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => setEditStrips(Math.max(0, editStrips - 1))}
                            className="p-1.5 rounded-l-lg bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={editStrips}
                            onChange={(e) => setEditStrips(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full text-center py-1 bg-white border-y border-slate-200 text-xs font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => setEditStrips(editStrips + 1)}
                            className="p-1.5 rounded-r-lg bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          খুচরা কয়টি আছে:
                        </label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => setEditLoose(Math.max(0, editLoose - 1))}
                            className="p-1.5 rounded-l-lg bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={editLoose}
                            onChange={(e) => setEditLoose(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full text-center py-1 bg-white border-y border-slate-200 text-xs font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => setEditLoose(editLoose + 1)}
                            className="p-1.5 rounded-r-lg bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          প্রতি পাতায় কয়টি:
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={editPerStrip}
                          onChange={(e) => setEditPerStrip(Math.max(1, parseInt(e.target.value) || 10))}
                          className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          সতর্কবার্তা থ্রেশহোল্ড:
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={editThreshold}
                          onChange={(e) => setEditThreshold(Math.max(1, parseInt(e.target.value) || 5))}
                          className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        id={`cancel-edit-stock-${med.id}`}
                        type="button"
                        onClick={() => setEditingStockMedId(null)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                      >
                        বাতিল
                      </button>
                      <button
                        id={`save-edit-stock-${med.id}`}
                        type="button"
                        onClick={() => saveEditStock(med.id)}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs cursor-pointer"
                      >
                        সংরক্ষণ করুন
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
