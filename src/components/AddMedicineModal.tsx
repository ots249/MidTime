import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Search,
  Pill,
  Clock,
  Layers,
  AlertTriangle,
  Sunrise,
  Sun,
  Moon,
  Plus,
  Minus,
  Check,
  Building2,
  Sparkles,
  Loader2
} from "lucide-react";
import { Medicine, MedicineSchedule, MealTiming, SearchMedicineResult } from "../types";
import { toBanglaNumber } from "../utils/banglaUtils";

interface AddMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMedicine: (medicine: Medicine) => void;
  initialMedicine?: Medicine | null;
}

export const AddMedicineModal: React.FC<AddMedicineModalProps> = ({
  isOpen,
  onClose,
  onAddMedicine,
  initialMedicine
}) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchMedicineResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [generic, setGeneric] = useState("");
  const [strength, setStrength] = useState("");
  const [dosageForm, setDosageForm] = useState("ট্যাবলেট");
  const [company, setCompany] = useState("");

  // Schedule Fields
  const [morning, setMorning] = useState(true);
  const [morningDose, setMorningDose] = useState(1);
  const [morningTiming, setMorningTiming] = useState<MealTiming>("after_meal");

  const [afternoon, setAfternoon] = useState(false);
  const [afternoonDose, setAfternoonDose] = useState(1);
  const [afternoonTiming, setAfternoonTiming] = useState<MealTiming>("after_meal");

  const [night, setNight] = useState(true);
  const [nightDose, setNightDose] = useState(1);
  const [nightTiming, setNightTiming] = useState<MealTiming>("after_meal");

  // Stock Fields
  const [tabletsPerStrip, setTabletsPerStrip] = useState(10);
  const [stripsCount, setStripsCount] = useState(1);
  const [looseTablets, setLooseTablets] = useState(0);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  // Notes & Duration
  const [durationDays, setDurationDays] = useState(7);
  const [notes, setNotes] = useState("");

  const searchDebounceRef = useRef<any>(null);

  // Init when modal opens or initialMedicine changes
  useEffect(() => {
    if (initialMedicine) {
      setName(initialMedicine.name);
      setGeneric(initialMedicine.generic || "");
      setStrength(initialMedicine.strength || "");
      setDosageForm(initialMedicine.dosageForm || "ট্যাবলেট");
      setCompany(initialMedicine.company || "");

      setMorning(initialMedicine.schedule.morning);
      setMorningDose(initialMedicine.schedule.morningDose || 1);
      setMorningTiming(initialMedicine.schedule.morningTiming || "after_meal");

      setAfternoon(initialMedicine.schedule.afternoon);
      setAfternoonDose(initialMedicine.schedule.afternoonDose || 1);
      setAfternoonTiming(initialMedicine.schedule.afternoonTiming || "after_meal");

      setNight(initialMedicine.schedule.night);
      setNightDose(initialMedicine.schedule.nightDose || 1);
      setNightTiming(initialMedicine.schedule.nightTiming || "after_meal");

      setTabletsPerStrip(initialMedicine.stock.tabletsPerStrip || 10);
      setStripsCount(initialMedicine.stock.stripsCount || 0);
      setLooseTablets(initialMedicine.stock.looseTablets || 0);
      setLowStockThreshold(initialMedicine.stock.lowStockThreshold || 5);
      setDurationDays(initialMedicine.durationDays || 7);
      setNotes(initialMedicine.notes || "");
    } else {
      resetForm();
    }
  }, [initialMedicine, isOpen]);

  const resetForm = () => {
    setName("");
    setGeneric("");
    setStrength("");
    setDosageForm("ট্যাবলেট");
    setCompany("");
    setMorning(true);
    setMorningDose(1);
    setMorningTiming("after_meal");
    setAfternoon(false);
    setAfternoonDose(1);
    setAfternoonTiming("after_meal");
    setNight(true);
    setNightDose(1);
    setNightTiming("after_meal");
    setTabletsPerStrip(10);
    setStripsCount(1);
    setLooseTablets(0);
    setLowStockThreshold(5);
    setDurationDays(7);
    setNotes("");
    setSearchQuery("");
    setSearchResults([]);
  };

  // Medicine Search with API call debounce
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setName(q);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!q.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/medicines/search?query=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (err) {
        console.error("Search fetch error", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  };

  const handleSelectSearchResult = (item: SearchMedicineResult) => {
    setName(item.brand_name || "");
    setGeneric(item.generic_name || "");
    setStrength(item.strength || "");
    setDosageForm(
      item.dosage_form === "Capsule"
        ? "ক্যাপসুল"
        : item.dosage_form === "Syrup"
        ? "সিরাপ"
        : "ট্যাবলেট"
    );
    setCompany(item.company_name || "");
    if (item.unit_per_strip) {
      setTabletsPerStrip(item.unit_per_strip);
    }
    setShowDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const totalUnits = stripsCount * tabletsPerStrip + looseTablets;

    const newMed: Medicine = {
      id: initialMedicine?.id || `med-${Date.now()}`,
      name: name.trim(),
      generic: generic.trim(),
      strength: strength.trim(),
      dosageForm: dosageForm.trim(),
      company: company.trim(),
      schedule: {
        morning,
        morningDose: morning ? morningDose : 0,
        morningTiming,
        afternoon,
        afternoonDose: afternoon ? afternoonDose : 0,
        afternoonTiming,
        night,
        nightDose: night ? nightDose : 0,
        nightTiming
      },
      stock: {
        tabletsPerStrip: Math.max(1, tabletsPerStrip),
        stripsCount: Math.max(0, stripsCount),
        looseTablets: Math.max(0, looseTablets),
        totalUnits: Math.max(0, totalUnits),
        lowStockThreshold: Math.max(1, lowStockThreshold)
      },
      notes: notes.trim(),
      startDate: initialMedicine?.startDate || new Date().toISOString().split("T")[0],
      durationDays: Math.max(1, durationDays),
      color: "teal",
      createdAt: initialMedicine?.createdAt || Date.now()
    };

    onAddMedicine(newMed);
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh] transition-colors">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center shadow-xs">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {initialMedicine ? "ওষুধ এডিট করুন" : "নতুন ওষুধ যুক্ত করুন"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ওষুধের নাম, খাওয়ার সময় এবং পাতা/মজুত সেট করুন
              </p>
            </div>
          </div>

          <button
            id="close-add-medicine-modal"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* 1. Medicine Name & Live Search */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              ওষুধের নাম (ব্র্যান্ড বা জেনেরিক নাম লিখুন): <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="input-medicine-name"
                type="text"
                required
                placeholder="যেমন: Napa Extra, Pantonix 20, Ace, Sergel..."
                value={name}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowDropdown(true);
                }}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-teal-600 dark:focus:border-teal-500 focus:ring-1 focus:ring-teal-600 transition-all outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-teal-600 dark:text-teal-400 absolute right-3.5 top-3.5 animate-spin" />
              )}
            </div>

            {/* Live Autocomplete Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-20 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                {searchResults.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSearchResult(item)}
                    className="p-3 hover:bg-teal-50/70 dark:hover:bg-teal-950/60 transition-colors cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.brand_name}
                        </strong>
                        {item.strength && (
                          <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                            {item.strength}
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-medium">
                          {item.dosage_form || "ট্যাবলেট"}
                        </span>
                      </div>
                      {item.generic_name && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.generic_name}</p>
                      )}
                      {item.company_name && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" /> {item.company_name}
                        </p>
                      )}
                    </div>

                    <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 shrink-0">
                      সিলেক্ট করুন →
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Secondary Details: Generic & Strength & Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                জেনেরিক উপাদান:
              </label>
              <input
                type="text"
                placeholder="যেমন: Paracetamol"
                value={generic}
                onChange={(e) => setGeneric(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-teal-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                মাত্রা / স্ট্রেন্থ:
              </label>
              <input
                type="text"
                placeholder="যেমন: 500 mg / 20 mg"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-teal-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ওষুধের ধরন:
              </label>
              <select
                value={dosageForm}
                onChange={(e) => setDosageForm(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-teal-600 outline-none"
              >
                <option value="ট্যাবলেট" className="dark:bg-slate-800">ট্যাবলেট (Tablet)</option>
                <option value="ক্যাপসুল" className="dark:bg-slate-800">ক্যাপসুল (Capsule)</option>
                <option value="সিরাপ" className="dark:bg-slate-800">সিরাপ (Syrup)</option>
                <option value="ড্রপ" className="dark:bg-slate-800">চোখ/নাকের ড্রপ (Drop)</option>
                <option value="মলম" className="dark:bg-slate-800">মলম/ক্রিম (Ointment)</option>
                <option value="ইনজেকশন" className="dark:bg-slate-800">ইনজেকশন (Injection)</option>
              </select>
            </div>
          </div>

          {/* 2. Schedule: Morning, Afternoon, Night Settings */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-teal-50/30 dark:from-slate-800/80 dark:to-teal-950/20 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
              <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>খাওয়ার সময় ও সূচি নির্ধারণ (সকাল / দুপুর / রাত)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Morning */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  morning
                    ? "bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-700/80 shadow-2xs"
                    : "bg-slate-100/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-70"
                }`}
              >
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-amber-900 dark:text-amber-300">
                  <input
                    type="checkbox"
                    checked={morning}
                    onChange={(e) => setMorning(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 cursor-pointer"
                  />
                  <Sunrise className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>সকাল</span>
                </label>

                {morning && (
                  <div className="mt-2.5 space-y-2 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">ডোজ (সংখ্যা):</span>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={morningDose}
                        onChange={(e) => setMorningDose(parseFloat(e.target.value) || 1)}
                        className="w-full mt-0.5 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">খাওয়ার নিয়ম:</span>
                      <select
                        value={morningTiming}
                        onChange={(e) => setMorningTiming(e.target.value as MealTiming)}
                        className="w-full mt-0.5 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                      >
                        <option value="after_meal" className="dark:bg-slate-800">খাওয়ার পরে</option>
                        <option value="before_meal" className="dark:bg-slate-800">খাওয়ার আগে</option>
                        <option value="empty_stomach" className="dark:bg-slate-800">খালি পেটে</option>
                        <option value="anytime" className="dark:bg-slate-800">যেকোনো সময়</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Afternoon */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  afternoon
                    ? "bg-white dark:bg-slate-800 border-sky-300 dark:border-sky-700/80 shadow-2xs"
                    : "bg-slate-100/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-70"
                }`}
              >
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-sky-900 dark:text-sky-300">
                  <input
                    type="checkbox"
                    checked={afternoon}
                    onChange={(e) => setAfternoon(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 cursor-pointer"
                  />
                  <Sun className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>দুপুর</span>
                </label>

                {afternoon && (
                  <div className="mt-2.5 space-y-2 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">ডোজ (সংখ্যা):</span>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={afternoonDose}
                        onChange={(e) => setAfternoonDose(parseFloat(e.target.value) || 1)}
                        className="w-full mt-0.5 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">খাওয়ার নিয়ম:</span>
                      <select
                        value={afternoonTiming}
                        onChange={(e) => setAfternoonTiming(e.target.value as MealTiming)}
                        className="w-full mt-0.5 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                      >
                        <option value="after_meal" className="dark:bg-slate-800">খাওয়ার পরে</option>
                        <option value="before_meal" className="dark:bg-slate-800">খাওয়ার আগে</option>
                        <option value="empty_stomach" className="dark:bg-slate-800">খালি পেটে</option>
                        <option value="anytime" className="dark:bg-slate-800">যেকোনো সময়</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Night */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  night
                    ? "bg-white dark:bg-slate-800 border-indigo-300 dark:border-indigo-700/80 shadow-2xs"
                    : "bg-slate-100/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-70"
                }`}
              >
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-indigo-900 dark:text-indigo-300">
                  <input
                    type="checkbox"
                    checked={night}
                    onChange={(e) => setNight(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                  <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>রাত</span>
                </label>

                {night && (
                  <div className="mt-2.5 space-y-2 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">ডোজ (সংখ্যা):</span>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={nightDose}
                        onChange={(e) => setNightDose(parseFloat(e.target.value) || 1)}
                        className="w-full mt-0.5 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">খাওয়ার নিয়ম:</span>
                      <select
                        value={nightTiming}
                        onChange={(e) => setNightTiming(e.target.value as MealTiming)}
                        className="w-full mt-0.5 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                      >
                        <option value="after_meal" className="dark:bg-slate-800">খাওয়ার পরে</option>
                        <option value="before_meal" className="dark:bg-slate-800">খাওয়ার আগে</option>
                        <option value="empty_stomach" className="dark:bg-slate-800">খালি পেটে</option>
                        <option value="anytime" className="dark:bg-slate-800">যেকোনো সময়</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Stock & Strips Setup */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-750 dark:border-slate-700/80 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>পাতা ও মজুত হিসাব (Stock Configuration)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  প্রতি পাতায় কয়টি:
                </label>
                <input
                  type="number"
                  min="1"
                  value={tabletsPerStrip}
                  onChange={(e) => setTabletsPerStrip(Math.max(1, parseInt(e.target.value) || 10))}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  মোট কয় পাতা আছে:
                </label>
                <input
                  type="number"
                  min="0"
                  value={stripsCount}
                  onChange={(e) => setStripsCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  খুচরা ট্যাবলেট:
                </label>
                <input
                  type="number"
                  min="0"
                  value={looseTablets}
                  onChange={(e) => setLooseTablets(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  সতর্কবার্তা থ্রেশহোল্ড:
                </label>
                <input
                  type="number"
                  min="1"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(Math.max(1, parseInt(e.target.value) || 5))}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white text-center"
                />
              </div>
            </div>

            <p className="text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/60 p-2 rounded-lg font-medium">
              মোট ট্যাবলেট: <strong>{toBanglaNumber(stripsCount * tabletsPerStrip + looseTablets)} টি</strong> (
              {toBanglaNumber(stripsCount)} পাতা ও {toBanglaNumber(looseTablets)} টি খুচরা)
            </p>
          </div>

          {/* 4. Duration & Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                কত দিন খাবেন:
              </label>
              <input
                type="number"
                min="1"
                value={durationDays}
                onChange={(e) => setDurationDays(Math.max(1, parseInt(e.target.value) || 7))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                বিশেষ পরামর্শ / ডাক্তারের নির্দেশ:
              </label>
              <input
                type="text"
                placeholder="যেমন: খাবারের ২০ মিনিট আগে প্রচুর পানি দিয়ে খাবেন"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              বাতিল
            </button>

            <button
              id="submit-medicine-btn"
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{initialMedicine ? "আপডেট করুন" : "ওষুধ সংরক্ষণ করুন"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
