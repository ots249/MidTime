import React, { useState, useMemo } from "react";
import {
  Pill,
  Search,
  Plus,
  Trash2,
  Edit3,
  Eye,
  AlertTriangle,
  Sunrise,
  Sun,
  Moon,
  Layers,
  Building2,
  Calendar,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  LayoutGrid,
  List,
  ArrowUpDown,
  X
} from "lucide-react";
import { Medicine } from "../types";
import {
  toBanglaNumber,
  calculateRemainingStrips,
  formatMealTimingBangla
} from "../utils/banglaUtils";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

interface MedicineListViewProps {
  medicines: Medicine[];
  onOpenAddModal: () => void;
  onEditMedicine: (medicine: Medicine) => void;
  onDeleteMedicine: (medicineId: string) => void;
  onRequestDelete?: (medicine: Medicine) => void;
  onOpenDetails: (medicine: Medicine) => void;
  onQuickAddStrips: (medicineId: string, strips: number) => void;
}

export const MedicineListView: React.FC<MedicineListViewProps> = ({
  medicines,
  onOpenAddModal,
  onEditMedicine,
  onDeleteMedicine,
  onRequestDelete,
  onOpenDetails,
  onQuickAddStrips
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSlot, setFilterSlot] = useState<"all" | "morning" | "afternoon" | "night" | "low_stock">("all");
  const [sortBy, setSortBy] = useState<"default" | "name" | "stock_low" | "price">("default");
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");
  const [deletingMed, setDeletingMed] = useState<Medicine | null>(null);

  // Filter and search logic
  const filteredMedicines = useMemo(() => {
    let list = medicines.filter((m) => {
      // Search match
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = m.name.toLowerCase().includes(q);
      const nameBnMatch = m.nameBn ? m.nameBn.toLowerCase().includes(q) : false;
      const genericMatch = m.generic ? m.generic.toLowerCase().includes(q) : false;
      const companyMatch = m.company ? m.company.toLowerCase().includes(q) : false;
      const matchesSearch = !q || nameMatch || nameBnMatch || genericMatch || companyMatch;

      if (!matchesSearch) return false;

      // Filter match
      if (filterSlot === "morning") return m.schedule.morning;
      if (filterSlot === "afternoon") return m.schedule.afternoon;
      if (filterSlot === "night") return m.schedule.night;
      if (filterSlot === "low_stock") {
        const calc = calculateRemainingStrips(m);
        return calc.isLowStock || calc.isOutOfStock;
      }

      return true;
    });

    // Sorting
    if (sortBy === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "stock_low") {
      list = [...list].sort((a, b) => (a.stock.totalUnits || 0) - (b.stock.totalUnits || 0));
    } else if (sortBy === "price") {
      list = [...list].sort((a, b) => {
        const priceA = a.discountedPrice || a.mrp || 0;
        const priceB = b.discountedPrice || b.mrp || 0;
        return priceB - priceA;
      });
    }

    return list;
  }, [medicines, searchQuery, filterSlot, sortBy]);

  const handleDeleteClick = (med: Medicine) => {
    if (onRequestDelete) {
      onRequestDelete(med);
    } else {
      setDeletingMed(med);
    }
  };

  const handleConfirmDelete = (medicineId: string) => {
    onDeleteMedicine(medicineId);
    setDeletingMed(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Top Banner / Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-900/50">
                <Pill className="w-4 h-4" />
              </span>
              <span>ঔষধ তালিকা ও ব্যবস্থাপনা</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                {toBanglaNumber(medicines.length)} টি
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              আপনার সমস্ত ওষুধের তালিকা, দাম, প্রতি পাতার হিসাব ও সময়সূচি সহজে দেখুন এবং পরিবর্তন করুন।
            </p>
          </div>

          <button
            id="btn-add-medicine-from-list"
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ওষুধ যোগ করুন</span>
          </button>
        </div>

        {/* Search, Sort & View Mode Controls */}
        <div className="mt-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                id="search-medicine-list"
                type="text"
                placeholder="ওষুধের নাম, উপাদান (Generic) বা কোম্পানি দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 outline-none transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  title="মুছুন"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <div className="relative shrink-0">
                <select
                  id="select-sort-medicines"
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="appearance-none pl-8 pr-7 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:border-teal-600 outline-none cursor-pointer"
                >
                  <option value="default">সাজান: সাধারণ</option>
                  <option value="name">নাম অনুযায়ী (A-Z)</option>
                  <option value="stock_low">কম মজুত আগে</option>
                  <option value="price">মূল্য অনুযায়ী</option>
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
              </div>

              {/* View Mode Toggle (Grid vs Compact) */}
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  title="কার্ড ভিউ"
                  className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("compact")}
                  title="কম্প্যাক্ট তালিকা ভিউ"
                  className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                    viewMode === "compact"
                      ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setFilterSlot("all")}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                filterSlot === "all"
                  ? "bg-slate-900 dark:bg-slate-700 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              সকল ({toBanglaNumber(medicines.length)})
            </button>

            <button
              type="button"
              onClick={() => setFilterSlot("morning")}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterSlot === "morning"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60"
              }`}
            >
              <Sunrise className="w-3.5 h-3.5" />
              <span>সকাল</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterSlot("afternoon")}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterSlot === "afternoon"
                  ? "bg-sky-500 text-white shadow-xs"
                  : "bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60"
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>দুপুর</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterSlot("night")}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterSlot === "night"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>রাত</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterSlot("low_stock")}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterSlot === "low_stock"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>মজুত কম / শেষ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Medicines Grid / Compact List */}
      {filteredMedicines.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200 dark:border-slate-800 text-center space-y-3 transition-colors shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
            <Search className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">কোনো ওষুধ পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery ? `"${searchQuery}" এর সাথে মিলে এমন কোনো ওষুধ নেই। ফিল্টার পরিবর্তন করে দেখতে পারেন।` : "আপনার তালিকায় এখনো কোনো ওষুধ যুক্ত করা নেই।"}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ওষুধ যুক্ত করুন</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMedicines.map((med) => {
            const stockCalc = calculateRemainingStrips(med);
            const unitPrice = med.discountedPrice || med.mrp || 0;
            const stripPrice = unitPrice * (med.stock.tabletsPerStrip || 10);

            return (
              <div
                key={med.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/90 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-teal-500/40 dark:hover:border-teal-500/40 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div>
                  {/* Top Row: Thumbnail, Name, Strength & Price */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden shadow-2xs">
                        {med.imageUrl ? (
                          <img
                            src={med.imageUrl}
                            alt={med.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <Pill className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3
                            className="text-base font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                            onClick={() => onOpenDetails(med)}
                          >
                            {med.name}
                          </h3>
                          {med.nameBn && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              ({med.nameBn})
                            </span>
                          )}
                          {med.strength && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {med.strength}
                            </span>
                          )}
                        </div>

                        {med.generic && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{med.generic}</p>
                        )}
                        {med.company && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                            <Building2 className="w-3 h-3 shrink-0" />
                            <span className="truncate">{med.company}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stock Status Badge & Strip Pricing */}
                    <div className="text-right shrink-0">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold block shadow-2xs ${stockCalc.statusColor}`}
                      >
                        {stockCalc.statusText}
                      </span>
                      {unitPrice > 0 && (
                        <div className="mt-1 text-right">
                          <div className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                            ৳{toBanglaNumber(stripPrice.toFixed(2))}
                            <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400"> / পাতা</span>
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">
                            (৳{toBanglaNumber(unitPrice.toFixed(2))} / পিস)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Schedule Pills (সকাল / দুপুর / রাত) */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-slate-400 dark:text-slate-500 font-semibold mr-1">খাওয়ার সময়:</span>

                    {med.schedule.morning ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 font-bold">
                        <Sunrise className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>সকাল ({toBanglaNumber(med.schedule.morningDose || 1)}টি)</span>
                      </span>
                    ) : null}

                    {med.schedule.afternoon ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-900/60 font-bold">
                        <Sun className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                        <span>দুপুর ({toBanglaNumber(med.schedule.afternoonDose || 1)}টি)</span>
                      </span>
                    ) : null}

                    {med.schedule.night ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60 font-bold">
                        <Moon className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        <span>রাত ({toBanglaNumber(med.schedule.nightDose || 1)}টি)</span>
                      </span>
                    ) : null}

                    {!med.schedule.morning && !med.schedule.afternoon && !med.schedule.night && (
                      <span className="text-slate-400 dark:text-slate-500 italic">কোনো সময়সূচি নেই</span>
                    )}
                  </div>

                  {/* Stock Info strip */}
                  <div className="mt-2.5 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs transition-colors">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <Layers className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>মজুত: <strong>{stockCalc.formattedBangla}</strong></span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onQuickAddStrips(med.id, 1)}
                      className="px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/80 hover:bg-teal-100 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-300 font-bold text-[11px] border border-teal-200 dark:border-teal-800 cursor-pointer transition-colors"
                      title="১ পাতা স্টক যোগ করুন"
                    >
                      +১ পাতা রিফিল
                    </button>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onOpenDetails(med)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>বিস্তারিত দেখুন</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      id={`btn-edit-med-${med.id}`}
                      type="button"
                      onClick={() => onEditMedicine(med)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                      <span>এডিট</span>
                    </button>

                    <button
                      id={`btn-delete-med-${med.id}`}
                      type="button"
                      onClick={() => handleDeleteClick(med)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
                      title="ওষুধ ডিলিট করুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ডিলিট</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Compact List View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
          {filteredMedicines.map((med) => {
            const stockCalc = calculateRemainingStrips(med);
            const unitPrice = med.discountedPrice || med.mrp || 0;
            const stripPrice = unitPrice * (med.stock.tabletsPerStrip || 10);

            return (
              <div
                key={med.id}
                className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div
                  className="flex items-center gap-3 cursor-pointer min-w-0"
                  onClick={() => onOpenDetails(med)}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                    {med.imageUrl ? (
                      <img
                        src={med.imageUrl}
                        alt={med.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain p-0.5"
                      />
                    ) : (
                      <Pill className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {med.name}
                      </h4>
                      {med.strength && (
                        <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {med.strength}
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${stockCalc.statusColor}`}>
                        {stockCalc.formattedBangla}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {med.generic && <span className="truncate max-w-xs">{med.generic}</span>}
                      {stripPrice > 0 && (
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                          • ৳{toBanglaNumber(stripPrice.toFixed(2))} / পাতা
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onQuickAddStrips(med.id, 1)}
                    className="px-2.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/80 hover:bg-teal-100 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800 transition-colors"
                    title="১ পাতা রিফিল করুন"
                  >
                    +১ পাতা
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenDetails(med)}
                    className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="বিস্তারিত দেখুন"
                  >
                    <Eye className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditMedicine(med)}
                    className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="এডিট করুন"
                  >
                    <Edit3 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteClick(med)}
                    className="p-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950 transition-colors"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Internal Delete Confirmation Dialog if not handled by root */}
      {!onRequestDelete && (
        <DeleteConfirmModal
          medicine={deletingMed}
          isOpen={!!deletingMed}
          onClose={() => setDeletingMed(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};
