import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { CloudSyncStatus } from "../types";
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
  ListFilter,
  Settings,
  Moon,
  Sun,
  Sunrise,
  DownloadCloud,
  CheckCircle2,
  Cloud,
  CloudCheck,
  CloudOff,
  Database,
  ArrowRight,
  BellRing
} from "lucide-react";
import { getBanglaDate, toBanglaNumber, CurrentTimeSlotInfo } from "../utils/banglaUtils";
import { soundManager } from "../utils/sound";
import { subscribeToInstallPrompt, promptPwaInstall, isRunningStandalone } from "../utils/pwa";

interface HeaderProps {
  activeTab: "schedule" | "medicines" | "stock" | "prescriptions";
  setActiveTab: (tab: "schedule" | "medicines" | "stock" | "prescriptions") => void;
  onOpenAddModal: () => void;
  onOpenSettings: () => void;
  onOpenCloudSync: () => void;
  user: User | null;
  syncStatus: CloudSyncStatus;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  lowStockCount: number;
  outOfStockCount: number;
  totalMedicines: number;
  currentSlotInfo: CurrentTimeSlotInfo;
  pendingSlotDoses: number;
  totalSlotDoses: number;
  onSelectCurrentSlot?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenSettings,
  onOpenCloudSync,
  user,
  syncStatus,
  theme,
  onToggleTheme,
  lowStockCount,
  outOfStockCount,
  totalMedicines,
  currentSlotInfo,
  pendingSlotDoses,
  totalSlotDoses,
  onSelectCurrentSlot
}) => {
  const [soundOn, setSoundOn] = useState(true);
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [canInstallPwa, setCanInstallPwa] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(isRunningStandalone());
    const unsubscribe = subscribeToInstallPrompt((canInstall) => {
      setCanInstallPwa(canInstall);
    });
    return () => unsubscribe();
  }, []);

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

  const handleInstallClick = async () => {
    const installed = await promptPwaInstall();
    if (installed) {
      soundManager.playTakeMedicineSound();
    }
  };

  const totalAlerts = lowStockCount + outOfStockCount;

  // Slot Icon helper
  const renderSlotIcon = (slot: string, className = "w-3.5 h-3.5") => {
    if (slot === "morning") return <Sunrise className={`${className} text-amber-500`} />;
    if (slot === "afternoon") return <Sun className={`${className} text-sky-500`} />;
    return <Moon className={`${className} text-indigo-400`} />;
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      {/* Top Banner / Brand */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 pt-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          {/* Logo & Title with MidTime branding */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden shadow-xs border border-teal-100 dark:border-teal-900/50 bg-white dark:bg-slate-800 shrink-0 flex items-center justify-center p-0.5">
              <img
                src="/icon.svg"
                alt="MidTime Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes("icon-192.png")) {
                    target.src = "/icon-192.png";
                  }
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                  <span className="text-teal-600 dark:text-teal-400">Mid</span>Time
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400 hidden xs:inline ml-1">
                    (মেডিসিন ট্র্যাকার)
                  </span>
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                  <Sparkles className="w-3 h-3 mr-1" /> স্মার্ট সূচি ও স্টক
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>{getBanglaDate()}</span>
                {currentTimeStr && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <Clock className="w-3 h-3 text-slate-400" /> {currentTimeStr}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* PWA Install Button if installable */}
            {canInstallPwa && (
              <button
                id="header-pwa-install-btn"
                type="button"
                onClick={handleInstallClick}
                title="ফোনে বা কম্পিউটারে MidTime অ্যাপ ইনস্টল করুন"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all cursor-pointer animate-pulse"
              >
                <DownloadCloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">অ্যাপ ইনস্টল</span>
              </button>
            )}

            {/* Cloud Database Sync Status / Profile Button */}
            <button
              id="header-cloud-sync-btn"
              type="button"
              onClick={onOpenCloudSync}
              title={
                user
                  ? `ক্লাউড ডাটাবেস কানেক্টেড (${user.displayName || user.email || "গেস্ট"})`
                  : "ক্লাউড ডাটাবেস ব্যাকআপ ও লগইন"
              }
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                user
                  ? "bg-teal-50 dark:bg-teal-950/70 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              {user ? (
                user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-5 h-5 rounded-full border border-teal-400"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                  </div>
                )
              ) : (
                <Database className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              )}
              <span className="hidden sm:inline">
                {user ? (syncStatus === "syncing" ? "সিঙ্ক হচ্ছে..." : "ক্লাউড সেভ ✓") : "ক্লাউড সেভ"}
              </span>
              {user && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse hidden sm:inline-block" />
              )}
            </button>

            {/* Quick Theme Toggle */}
            <button
              id="header-toggle-theme-btn"
              type="button"
              onClick={onToggleTheme}
              title={theme === "dark" ? "লাইট মোড চালু করুন" : "রাতের ডার্ক মোড চালু করুন"}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-600" />
              )}
            </button>

            {/* Sound Toggle */}
            <button
              id="toggle-sound-button"
              type="button"
              onClick={toggleSound}
              title={soundOn ? "সাউন্ড চালু আছে" : "সাউন্ড বন্ধ আছে"}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {soundOn ? (
                <Volume2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              )}
            </button>

            {/* Settings Button */}
            <button
              id="open-settings-button"
              type="button"
              onClick={onOpenSettings}
              title="অ্যাপ সেটিংস ও ব্যাকআপ"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Settings className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </button>

            {/* Add New Medicine Button */}
            <button
              id="add-new-medicine-button"
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/20 transition-all cursor-pointer ml-1"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">নতুন ওষুধ যোগ</span>
              <span className="sm:hidden">ওষুধ যোগ</span>
            </button>
          </div>
        </div>

        {/* Visual Indicator: Active Reminders / Current Time Slot Banner */}
        <div className="mt-2.5">
          {totalSlotDoses > 0 ? (
            pendingSlotDoses > 0 ? (
              <div
                id="header-active-reminder-pending"
                onClick={() => {
                  setActiveTab("schedule");
                  if (onSelectCurrentSlot) onSelectCurrentSlot();
                }}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-rose-50/95 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900/70 text-xs shadow-xs hover:border-rose-300 dark:hover:border-rose-700 transition-all cursor-pointer group"
                title="বর্তমান সময়ের বাকি ওষুধ দেখতে ক্লিক করুন"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Red Pulsing Dot Animation */}
                  <span className="relative flex h-3 w-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap truncate">
                    <span className="inline-flex items-center gap-1 font-bold text-rose-900 dark:text-rose-200">
                      <BellRing className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 animate-bounce" />
                      সক্রিয় রিমাইন্ডার:
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-rose-800 dark:text-rose-300">
                      {renderSlotIcon(currentSlotInfo.slot)}
                      <span>{currentSlotInfo.labelBn}বেলা ({currentSlotInfo.timeRangeBn})</span>
                    </span>
                    <span className="text-rose-300 dark:text-rose-700 hidden sm:inline">•</span>
                    <span className="font-extrabold text-rose-600 dark:text-rose-400 bg-rose-100/80 dark:bg-rose-900/60 px-2 py-0.5 rounded-md">
                      {toBanglaNumber(pendingSlotDoses)} টি ওষুধ গ্রহণ বাকি
                    </span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-600 group-hover:bg-rose-700 text-white text-[11px] font-bold shrink-0 transition-all shadow-xs active:scale-95">
                  <span>ওষুধ খান</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ) : (
              <div
                id="header-active-reminder-done"
                onClick={() => {
                  setActiveTab("schedule");
                  if (onSelectCurrentSlot) onSelectCurrentSlot();
                }}
                className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-900/60 text-xs shadow-2xs hover:bg-emerald-100/80 transition-all cursor-pointer"
                title="বর্তমান সময়ের সব ওষুধ সম্পন্ন হয়েছে"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-emerald-900 dark:text-emerald-200 font-semibold truncate flex items-center gap-1.5">
                    {renderSlotIcon(currentSlotInfo.slot)}
                    <span>বর্তমান সময় ({currentSlotInfo.labelBn}): আজকের এই সময়ের সব ওষুধ নেওয়া সম্পন্ন হয়েছে ✓</span>
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md shrink-0">
                  {toBanglaNumber(totalSlotDoses)} / {toBanglaNumber(totalSlotDoses)} সম্পন্ন
                </span>
              </div>
            )
          ) : (
            <div className="flex items-center justify-between gap-2 px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                {renderSlotIcon(currentSlotInfo.slot)}
                <span>বর্তমান সক্রিয় সময়: <strong className="text-slate-700 dark:text-slate-300">{currentSlotInfo.labelBn}বেলা ({currentSlotInfo.timeRangeBn})</strong></span>
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                এই সময়ে কোনো নির্ধারিত ওষুধ নেই
              </span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="mt-2.5 grid grid-cols-4 gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl">
          <button
            id="nav-tab-schedule"
            type="button"
            onClick={() => setActiveTab("schedule")}
            className={`relative flex items-center justify-center gap-1.5 py-2 px-1 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "schedule"
                ? "bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <div className="relative shrink-0">
              <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              {pendingSlotDoses > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                </span>
              )}
            </div>
            <span className="truncate">দৈনিক সূচি</span>
            {pendingSlotDoses > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-extrabold rounded-full bg-rose-500 text-white shrink-0 shadow-xs animate-pulse">
                {toBanglaNumber(pendingSlotDoses)} বাকি
              </span>
            )}
          </button>

          <button
            id="nav-tab-medicines"
            type="button"
            onClick={() => setActiveTab("medicines")}
            className={`flex items-center justify-center gap-1 py-2 px-1 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "medicines"
                ? "bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Pill className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="truncate">ঔষধ লিস্ট</span>
            <span className="hidden sm:inline-block text-[11px] text-slate-400 dark:text-slate-500">
              ({toBanglaNumber(totalMedicines)})
            </span>
          </button>

          <button
            id="nav-tab-stock"
            type="button"
            onClick={() => setActiveTab("stock")}
            className={`relative flex items-center justify-center gap-1 py-2 px-1 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "stock"
                ? "bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
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
                ? "bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">প্রেসক্রিপশন</span>
          </button>
        </div>
      </div>
    </header>
  );
};

