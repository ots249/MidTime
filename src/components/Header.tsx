import React, { useState, useEffect } from "react";
import {
  Pill,
  Calendar,
  Layers,
  FileText,
  Plus,
  Volume2,
  VolumeX,
  AlertTriangle,
  Clock,
  Sparkles,
  ListFilter
} from "lucide-react";
import { getBanglaDate, toBanglaNumber } from "../utils/banglaUtils";
import { soundManager } from "../utils/sound";

interface HeaderProps {
  activeTab: "schedule" | "medicines" | "stock" | "prescriptions";
  setActiveTab: (tab: "schedule" | "medicines" | "stock" | "prescriptions") => void;
  onOpenAddModal: () => void;
  lowStockCount: number;
  outOfStockCount: number;
  totalMedicines: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  lowStockCount,
  outOfStockCount,
  totalMedicines
}) => {
  const [soundOn, setSoundOn] = useState(true);
  const [currentTimeStr, setCurrentTimeStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const h12 = hours % 12 || 12;
      const formatted = `${toBanglaNumber(h12.toString().padStart(2, "0"))}:${toBanglaNumber(
        minutes.toString().padStart(2, "0")
      )} ${ampm}`;
      setCurrentTimeStr(formatted);
    };

    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundManager.setSoundEnabled(next);
    if (next) soundManager.playTakeMedicineSound();
  };

  const totalAlerts = lowStockCount + outOfStockCount;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      {/* Top Banner / Brand */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 pt-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20 shrink-0">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1">
                  মেডিসিন ট্র্যাকার
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  <Sparkles className="w-3 h-3 mr-1" /> স্মার্ট সূচি ও স্টক
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <span>{getBanglaDate()}</span>
                {currentTimeStr && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Clock className="w-3 h-3 text-slate-400" /> {currentTimeStr}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="toggle-sound-button"
              type="button"
              onClick={toggleSound}
              title={soundOn ? "সাউন্ড চালু আছে" : "সাউন্ড বন্ধ আছে"}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {soundOn ? (
                <Volume2 className="w-5 h-5 text-teal-600" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-400" />
              )}
            </button>

            <button
              id="add-new-medicine-button"
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ওষুধ যোগ</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-3 grid grid-cols-4 gap-1 bg-slate-100/90 p-1 rounded-xl">
          <button
            id="nav-tab-schedule"
            type="button"
            onClick={() => setActiveTab("schedule")}
            className={`flex items-center justify-center gap-1 py-2 px-1 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "schedule"
                ? "bg-white text-teal-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="truncate">দৈনিক সূচি</span>
          </button>

          <button
            id="nav-tab-medicines"
            type="button"
            onClick={() => setActiveTab("medicines")}
            className={`flex items-center justify-center gap-1 py-2 px-1 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "medicines"
                ? "bg-white text-teal-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Pill className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="truncate">ঔষধ লিস্ট</span>
            <span className="hidden sm:inline-block text-[11px] text-slate-400">
              ({toBanglaNumber(totalMedicines)})
            </span>
          </button>

          <button
            id="nav-tab-stock"
            type="button"
            onClick={() => setActiveTab("stock")}
            className={`relative flex items-center justify-center gap-1 py-2 px-1 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "stock"
                ? "bg-white text-teal-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="truncate">পাতা ও মজুত</span>
            {totalAlerts > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white shrink-0">
                {toBanglaNumber(totalAlerts)}
              </span>
            )}
          </button>

          <button
            id="nav-tab-prescriptions"
            type="button"
            onClick={() => setActiveTab("prescriptions")}
            className={`flex items-center justify-center gap-1 py-2 px-1 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "prescriptions"
                ? "bg-white text-teal-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">প্রেসক্রিপশন</span>
          </button>
        </div>
      </div>
    </header>
  );
};
