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
  Sparkles
} from "lucide-react";
import { Medicine } from "../types";
import {
  toBanglaNumber,
  calculateRemainingStrips,
  formatMealTimingBangla
} from "../utils/banglaUtils";

interface MedicineListViewProps {
  medicines: Medicine[];
  onOpenAddModal: () => void;
  onEditMedicine: (medicine: Medicine) => void;
  onDeleteMedicine: (medicineId: string) => void;
  onOpenDetails: (medicine: Medicine) => void;
  onQuickAddStrips: (medicineId: string, strips: number) => void;
}

export const MedicineListView: React.FC<MedicineListViewProps> = ({
  medicines,
  onOpenAddModal,
  onEditMedicine,
  onDeleteMedicine,
  onOpenDetails,
  onQuickAddStrips
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSlot, setFilterSlot] = useState<"all" | "morning" | "afternoon" | "night" | "low_stock">("all");
  const [deletingMed, setDeletingMed] = useState<Medicine | null>(null);

  // Filter and search logic
  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      // Search match
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = m.name.toLowerCase().includes(q);
      const genericMatch = m.generic ? m.generic.toLowerCase().includes(q) : false;
      const companyMatch = m.company ? m.company.toLowerCase().includes(q) : false;
      const matchesSearch = !q || nameMatch || genericMatch || companyMatch;

      if (!matchesSearch) return false;

      // Filter match
      if (filterSlot === "morning") return m.schedule.morning;
      if (filterSlot === "afternoon") return m.schedule.afternoon;
      if (filterSlot === "night") return m.schedule.night;
      if (filterSlot === "low_stock") {
        const calc = calculateRemainingStrips(m);
        return calc.isLowStock;
      }

      return true;
    });
  }, [medicines, searchQuery, filterSlot]);

  const confirmDelete = () => {
    if (deletingMed) {
      onDeleteMedicine(deletingMed.id);
      setDeletingMed(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      {/* Header Banner with Add Button */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Pill className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>ওষুধের তালিকা ও ব্যবস্থাপনা ({toBanglaNumber(medicines.length)} টি)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              এখান থেকে আপনার সকল ওষুধের তালিকা দেখতে পারেন, নতুন ওষুধ যুক্ত করতে পারেন অথবা যেকোনো ওষুধ এডিট ও ডিলিট করতে পারেন।
            </p>
          </div>

          <button
            id="btn-add-medicine-from-list"
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ওষুধ যুক্ত করুন</span>
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              id="search-medicine-list"
              type="text"
              placeholder="ওষুধের নাম, উপাদান বা কোম্পানি দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                মুছুন
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setFilterSlot("all")}
              className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
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
              className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                filterSlot === "morning"
                  ? "bg-amber-500 text-white"
                  : "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60"
              }`}
            >
              <Sunrise className="w-3.5 h-3.5" />
              <span>সকাল</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterSlot("afternoon")}
              className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                filterSlot === "afternoon"
                  ? "bg-sky-500 text-white"
                  : "bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60"
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>দুপুর</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterSlot("night")}
              className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                filterSlot === "night"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>রাত</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterSlot("low_stock")}
              className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                filterSlot === "low_stock"
                  ? "bg-rose-600 text-white"
                  : "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>মজুত কম</span>
            </button>
          </div>
        </div>
      </div>

      {/* Medicines Grid / List */}
      {filteredMedicines.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-3 transition-colors">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">কোনো ওষুধ পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {searchQuery ? `"${searchQuery}" নামের সাথে কোনো ওষুধ মেলেনি।` : "আপনার তালিকায় এখনো কোনো ওষুধ যুক্ত করা নেই।"}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ওষুধ যুক্ত করুন</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMedicines.map((med) => {
            const stockCalc = calculateRemainingStrips(med);

            return (
              <div
                key={med.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between space-y-3 group"
              >
                <div>
                  {/* Top Row: Name, Form & Stock Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                        {med.imageUrl ? (
                          <img
                            src={med.imageUrl}
                            alt={med.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain p-0.5"
                          />
                        ) : (
                          <Pill className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{med.name}</h3>
                          {med.nameBn && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              ({med.nameBn})
                            </span>
                          )}
                          {med.strength && (
                            <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {med.strength}
                            </span>
                          )}
                          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {med.dosageForm || "ট্যাবলেট"}
                          </span>
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

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold block ${stockCalc.statusColor}`}
                      >
                        {stockCalc.statusText}
                      </span>
                      {med.mrp !== undefined && med.mrp > 0 && (
                        <div className="mt-1 text-right">
                          <div className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                            ৳{toBanglaNumber(((med.discountedPrice || med.mrp) * (med.stock.tabletsPerStrip || 10)).toFixed(2))}
                            <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400"> / পাতা</span>
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">
                            (৳{toBanglaNumber((med.discountedPrice || med.mrp).toFixed(2))} / পিস)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Schedule Pills (সকাল / দুপুর / রাত) */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-slate-400 dark:text-slate-500 font-semibold mr-1">খাওয়ার সূচি:</span>

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
                      <span className="text-slate-400 dark:text-slate-500 italic">কোনো সূচি নির্ধারণ করা নেই</span>
                    )}
                  </div>

                  {/* Stock Info strip */}
                  <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs transition-colors">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <Layers className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>মজুত: <strong>{stockCalc.formattedBangla}</strong></span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onQuickAddStrips(med.id, 1)}
                      className="px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/80 hover:bg-teal-100 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-300 font-bold text-[11px] border border-teal-200 dark:border-teal-800 cursor-pointer transition-colors"
                      title="১ পাতা স্টক যোগ করুন"
                    >
                      +১ পাতা রিফিল
                    </button>
                  </div>
                </div>

                {/* Bottom Action Buttons: View, Edit, Delete */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onOpenDetails(med)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>বিস্তারিত দেখুন</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      id={`btn-edit-med-${med.id}`}
                      type="button"
                      onClick={() => onEditMedicine(med)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                      <span>এডিট</span>
                    </button>

                    <button
                      id={`btn-delete-med-${med.id}`}
                      type="button"
                      onClick={() => setDeletingMed(med)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
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
      )}

      {/* Delete Confirmation Modal */}
      {deletingMed && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">ওষুধ মুছে ফেলতে চান?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                আপনি কি নিশ্চিত যে আপনার তালিকা থেকে <strong className="text-slate-800 dark:text-slate-200">"{deletingMed.name}"</strong> মুছে ফেলতে চান?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingMed(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex-1"
              >
                বাতিল
              </button>

              <button
                id="btn-confirm-delete-med"
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex-1"
              >
                হ্যাঁ, মুছুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
