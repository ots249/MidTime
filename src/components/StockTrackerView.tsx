import React, { useState, useMemo } from "react";
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
  Info,
  Receipt,
  Coins,
  Search,
  Check,
  X
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
  const [searchQuery, setSearchQuery] = useState("");
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
  const medicineStats = useMemo(() => {
    return medicines.map((med) => {
      const calc = calculateRemainingStrips(med);
      const daily = calculateDailyDose(med);
      return {
        med,
        calc,
        daily
      };
    });
  }, [medicines]);

  const outOfStockCount = medicineStats.filter((m) => m.calc.isOutOfStock).length;
  const lowStockCount = medicineStats.filter((m) => m.calc.isLowStock).length;
  const healthyStockCount = medicineStats.filter((m) => !m.calc.isOutOfStock && !m.calc.isLowStock).length;

  const filteredStats = useMemo(() => {
    return medicineStats.filter(({ med, calc }) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        med.name.toLowerCase().includes(q) ||
        (med.nameBn && med.nameBn.toLowerCase().includes(q)) ||
        (med.generic && med.generic.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (filter === "out") return calc.isOutOfStock;
      if (filter === "low") return calc.isLowStock || calc.isOutOfStock;
      return true;
    });
  }, [medicineStats, filter, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Summary KPI Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div
          onClick={() => setFilter("all")}
          className={`p-4 rounded-3xl border transition-all cursor-pointer shadow-xs ${
            filter === "all"
              ? "bg-slate-900 dark:bg-slate-800 text-white border-slate-900 dark:border-teal-500 shadow-sm"
              : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold opacity-80">মোট ওষুধ</span>
            <Layers className="w-4 h-4 opacity-70" />
          </div>
          <p className="text-2xl font-bold mt-1.5">{toBanglaNumber(medicines.length)} টি</p>
          <p className="text-[11px] opacity-70 mt-0.5">সব ঔষধের তালিকা</p>
        </div>

        <div
          onClick={() => setFilter("all")}
          className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 text-slate-800 dark:text-slate-200 shadow-xs cursor-pointer hover:border-emerald-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">পর্যাপ্ত মজুত</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1.5">{toBanglaNumber(healthyStockCount)} টি</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">চিন্তাহীন মজুত</p>
        </div>

        <div
          onClick={() => setFilter("low")}
          className={`p-4 rounded-3xl border transition-all cursor-pointer shadow-xs ${
            filter === "low"
              ? "bg-amber-600 dark:bg-amber-700 text-white border-amber-600 shadow-sm"
              : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-amber-200 dark:border-amber-900/60 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">শেষ হওয়ার পথে</span>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1.5">{toBanglaNumber(lowStockCount)} টি</p>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">রিফিল প্রয়োজন</p>
        </div>

        <div
          onClick={() => setFilter("out")}
          className={`p-4 rounded-3xl border transition-all cursor-pointer shadow-xs ${
            filter === "out"
              ? "bg-rose-600 dark:bg-rose-700 text-white border-rose-600 shadow-sm"
              : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-rose-200 dark:border-rose-900/60 hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">সম্পূর্ণ শেষ</span>
            <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-700 dark:text-rose-400 mt-1.5">{toBanglaNumber(outOfStockCount)} টি</p>
          <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80 mt-0.5">জরুরি কিনতে হবে</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 shadow-xs space-y-3 transition-colors">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="ওষুধের নাম দিয়ে ফিল্টার..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:border-teal-600 outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              id="filter-stock-all"
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filter === "all"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              সব ওষুধ ({toBanglaNumber(medicines.length)})
            </button>
            <button
              id="filter-stock-low"
              type="button"
              onClick={() => setFilter("low")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filter === "low"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              সতর্কতা ({toBanglaNumber(lowStockCount + outOfStockCount)})
            </button>
            <button
              id="filter-stock-out"
              type="button"
              onClick={() => setFilter("out")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filter === "out"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              সম্পূর্ণ শেষ ({toBanglaNumber(outOfStockCount)})
            </button>
          </div>

          <button
            id="stock-add-medicine-btn"
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন ওষুধ যোগ</span>
          </button>
        </div>
      </div>

      {/* Stock Cards List */}
      <div className="space-y-3">
        {filteredStats.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200/80 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-xs transition-colors shadow-xs">
            এই ফিল্টারে কোনো ওষুধ পাওয়া যায়নি।
          </div>
        ) : (
          filteredStats.map(({ med, calc, daily }) => {
            const isEditing = editingStockMedId === med.id;
            const unitPrice = med.discountedPrice || med.mrp || 0;
            const stripPrice = unitPrice * (med.stock.tabletsPerStrip || 10);

            return (
              <div
                key={med.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl border p-4 sm:p-5 transition-all shadow-xs ${
                  calc.isOutOfStock
                    ? "border-rose-300 dark:border-rose-900/80 ring-1 ring-rose-200/70 dark:ring-rose-950"
                    : calc.isLowStock
                    ? "border-amber-300 dark:border-amber-900/80 ring-1 ring-amber-100/70 dark:ring-amber-950"
                    : "border-slate-200/80 dark:border-slate-800/90"
                }`}
              >
                {/* Main Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden shadow-2xs ${
                        calc.isOutOfStock
                          ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400"
                          : calc.isLowStock
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400"
                          : "bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400"
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

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className="text-base sm:text-lg font-bold text-slate-900 dark:text-white cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                          onClick={() => onOpenMedicineDetails(med)}
                        >
                          {med.name}
                        </h3>
                        {med.nameBn && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            ({med.nameBn})
                          </span>
                        )}
                        {med.strength && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
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
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{med.generic}</p>
                      )}

                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                        <span>
                          <strong className="text-slate-700 dark:text-slate-300">খাওয়ার নিয়ম:</strong> {getDoseDescriptionBangla(med)}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span>
                          <strong className="text-slate-700 dark:text-slate-300">দৈনিক খরচ:</strong> {toBanglaNumber(daily)} টি
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Top Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                    <button
                      id={`edit-stock-btn-${med.id}`}
                      type="button"
                      onClick={() =>
                        isEditing ? setEditingStockMedId(null) : startEditStock(med)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditing ? "বাতিল" : "মজুত আপডেট"}</span>
                    </button>
                  </div>
                </div>

                {/* Stock Details & Calculation Grid */}
                {!isEditing ? (
                  <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-2xl transition-colors">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">কয় পাতা বাকি:</span>
                      <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        {calc.formattedBangla}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        (প্রতি পাতায় {toBanglaNumber(med.stock.tabletsPerStrip || 10)} টি ট্যাবলেট)
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">আর কত দিন চলবে:</span>
                      <p
                        className={`text-base font-bold mt-0.5 ${
                          calc.daysRemaining <= 3 ? "text-rose-600 dark:text-rose-400 font-extrabold" : "text-emerald-700 dark:text-emerald-400"
                        }`}
                      >
                        {calc.daysRemaining >= 999
                          ? "দীর্ঘদিন"
                          : calc.daysRemaining === 0
                          ? "আজই শেষ!"
                          : `আর ${toBanglaNumber(calc.daysRemaining)} দিন চলবে`}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        সতর্কবার্তা থ্রেশহোল্ড: {toBanglaNumber(med.stock.lowStockThreshold || 5)} টি
                      </p>
                    </div>

                    {/* Strip Price */}
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">১ পাতার মূল্য:</span>
                      {unitPrice > 0 ? (
                        <div className="mt-0.5">
                          <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                            ৳{toBanglaNumber(stripPrice.toFixed(2))}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            (৳{toBanglaNumber(unitPrice.toFixed(2))} / পিস)
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 italic">
                          মূল্য সেট করা নেই
                        </p>
                      )}
                    </div>

                    {/* Quick Refill Actions */}
                    <div className="flex flex-col justify-center">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">দ্রুত পাতা রিফিল:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          id={`quick-add-1-strip-${med.id}`}
                          type="button"
                          onClick={() => onQuickAddStrips(med.id, 1)}
                          className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-all cursor-pointer shadow-xs active:scale-95 flex-1 text-center"
                          title="১ পাতা যোগ করুন"
                        >
                          +১ পাতা
                        </button>
                        <button
                          id={`quick-add-2-strip-${med.id}`}
                          type="button"
                          onClick={() => onQuickAddStrips(med.id, 2)}
                          className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-teal-50 dark:bg-teal-950/80 hover:bg-teal-100 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 transition-all cursor-pointer shadow-xs active:scale-95 flex-1 text-center"
                          title="২ পাতা যোগ করুন"
                        >
                          +২ পাতা
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Edit Stock Form */
                  <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 bg-teal-50/50 dark:bg-teal-950/40 p-4 sm:p-5 rounded-2xl space-y-3.5 transition-colors">
                    <h4 className="text-xs font-bold text-teal-900 dark:text-teal-300 flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span>মজুত ও পাতার সংখ্যা এডিট করুন</span>
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          কয় পাতা আছে:
                        </label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => setEditStrips(Math.max(0, editStrips - 1))}
                            className="p-2 rounded-l-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={editStrips}
                            onChange={(e) => setEditStrips(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full text-center py-1.5 bg-white dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setEditStrips(editStrips + 1)}
                            className="p-2 rounded-r-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          খুচরা কয়টি আছে:
                        </label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => setEditLoose(Math.max(0, editLoose - 1))}
                            className="p-2 rounded-l-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={editLoose}
                            onChange={(e) => setEditLoose(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full text-center py-1.5 bg-white dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setEditLoose(editLoose + 1)}
                            className="p-2 rounded-r-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          প্রতি পাতায় কয়টি:
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={editPerStrip}
                          onChange={(e) => setEditPerStrip(Math.max(1, parseInt(e.target.value) || 10))}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white text-center outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          সতর্কবার্তা থ্রেশহোল্ড:
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={editThreshold}
                          onChange={(e) => setEditThreshold(Math.max(1, parseInt(e.target.value) || 5))}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white text-center outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        id={`cancel-edit-stock-${med.id}`}
                        type="button"
                        onClick={() => setEditingStockMedId(null)}
                        className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
                      >
                        বাতিল
                      </button>
                      <button
                        id={`save-edit-stock-${med.id}`}
                        type="button"
                        onClick={() => saveEditStock(med.id)}
                        className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs cursor-pointer transition-colors"
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
