import React, { useState, useRef } from "react";
import {
  X,
  Moon,
  Sun,
  Download,
  Upload,
  Volume2,
  VolumeX,
  Trash2,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Info
} from "lucide-react";
import { Medicine, DailyLog, Prescription, BackupData } from "../types";
import { toBanglaNumber, getBanglaDate } from "../utils/banglaUtils";
import { soundManager } from "../utils/sound";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  medicines: Medicine[];
  dailyLogs: DailyLog;
  prescriptions: Prescription[];
  onRestoreBackup: (backup: BackupData, mode: "replace" | "merge") => void;
  onClearAllData: () => void;
  onShowToast: (msg: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  medicines,
  dailyLogs,
  prescriptions,
  onRestoreBackup,
  onClearAllData,
  onShowToast
}) => {
  const [confirmClear, setConfirmClear] = useState(false);
  const [importPreview, setImportPreview] = useState<BackupData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Export JSON file
  const handleExportJSON = () => {
    try {
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const backup: BackupData = {
        version: "1.0.0",
        exportedAt: now.toISOString(),
        medicines,
        dailyLogs,
        prescriptions,
        theme
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `medicine_tracker_backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      onShowToast("ডাটা ব্যাকআপ সফলভাবে ডাউনলোড হয়েছে!");
      if (soundEnabled) soundManager.playTakeMedicineSound();
    } catch (e) {
      console.error("Export error:", e);
      onShowToast("ব্যাকআপ ফাইলে সমস্যা হয়েছে, অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
    }
  };

  // Handle file select for Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImportError(null);
    setImportPreview(null);

    if (!file) return;

    if (!file.name.endsWith(".json") && file.type !== "application/json") {
      setImportError("অনুগ্রহ করে একটি বৈধ .json ব্যাকআপ ফাইল সিলেক্ট করুন।");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Validation check
        if (!parsed || (typeof parsed !== "object" && !Array.isArray(parsed))) {
          throw new Error("Invalid format");
        }

        // Normalize if it was just array of medicines or full backup
        let normalizedBackup: BackupData;
        if (Array.isArray(parsed)) {
          normalizedBackup = {
            version: "1.0.0",
            exportedAt: new Date().toISOString(),
            medicines: parsed,
            dailyLogs: {},
            prescriptions: []
          };
        } else {
          normalizedBackup = {
            version: parsed.version || "1.0.0",
            exportedAt: parsed.exportedAt || new Date().toISOString(),
            medicines: Array.isArray(parsed.medicines) ? parsed.medicines : [],
            dailyLogs: parsed.dailyLogs && typeof parsed.dailyLogs === "object" ? parsed.dailyLogs : {},
            prescriptions: Array.isArray(parsed.prescriptions) ? parsed.prescriptions : [],
            theme: parsed.theme
          };
        }

        setImportPreview(normalizedBackup);
      } catch (err) {
        console.error("Import parse error:", err);
        setImportError("ফাইলটি পড়া যায়নি বা ফাইলের ফরম্যাট সঠিক নয়।");
      }
    };

    reader.onerror = () => {
      setImportError("ফাইল পড়তে ত্রুটি হয়েছে।");
    };

    reader.readAsText(file);
    // Reset file input value so user can re-select same file if needed
    e.target.value = "";
  };

  // Confirm and Apply Import
  const applyImport = (mode: "replace" | "merge") => {
    if (!importPreview) return;
    onRestoreBackup(importPreview, mode);
    setImportPreview(null);
    onShowToast("ডাটা সফলভাবে রিস্টোর করা হয়েছে!");
    if (soundEnabled) soundManager.playTakeMedicineSound();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold">
              ⚙️
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                অ্যাপ সেটিংস ও ডাটা ব্যাকআপ
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                থিম, সাউন্ড ও JSON ব্যাকআপ পরিচালনা
              </p>
            </div>
          </div>
          <button
            id="close-settings-modal-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200">
          {/* Section 1: Appearance / Theme */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-indigo-950 text-indigo-400' : 'bg-amber-100 text-amber-600'}`}>
                  {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {theme === "dark" ? "ডার্ক মোড (Dark Theme)" : "লাইট মোড (Light Theme)"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {theme === "dark"
                      ? "রাতের বেলা চোখের সুরক্ষায় ডার্ক স্ক্রিন চালু আছে"
                      : "দিনের উজ্জ্বল আলোতে পরিষ্কারভাবে দেখার মোড"}
                  </p>
                </div>
              </div>

              <button
                id="toggle-theme-modal-btn"
                type="button"
                onClick={onToggleTheme}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors cursor-pointer ${
                  theme === "dark" ? "bg-teal-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    theme === "dark" ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section 2: Sound Notification */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${soundEnabled ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    সাউন্ড ইফেক্ট ও নোটিফিকেশন
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ওষুধ খাওয়ার পর বা বোতামে চাপ দিলে শব্দ হবে
                  </p>
                </div>
              </div>

              <button
                id="toggle-sound-settings-btn"
                type="button"
                onClick={onToggleSound}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors cursor-pointer ${
                  soundEnabled ? "bg-teal-600" : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    soundEnabled ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section 3: JSON Export & Backup */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-3 bg-white dark:bg-slate-800/40">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    ডাটা এক্সপোর্ট (JSON Export)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    সকল ওষুধ, স্টক এবং দৈনিক লগ ব্যাকআপ ফাইল আকারে সংরক্ষণ করুন
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span>মোট সংরক্ষিত ওষুধ: <strong className="text-slate-900 dark:text-white">{toBanglaNumber(medicines.length)}</strong> টি</span>
              <span>প্রেসক্রিপশন: <strong className="text-slate-900 dark:text-white">{toBanglaNumber(prescriptions.length)}</strong> টি</span>
            </div>

            <button
              id="export-json-backup-btn"
              type="button"
              onClick={handleExportJSON}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ব্যাকআপ JSON ফাইল ডাউনলোড করুন</span>
            </button>
          </div>

          {/* Section 4: JSON Import & Restore */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-3 bg-white dark:bg-slate-800/40">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    ডাটা ইম্পোর্ট ও রিস্টোর (JSON Restore)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    পূর্বে ডাউনলোড করা JSON ফাইল থেকে ডাটা ফিরিয়ে আনুন
                  </p>
                </div>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              id="select-json-file-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-sm transition-all cursor-pointer"
            >
              <FileJson className="w-4 h-4" />
              <span>ব্যাকআপ ফাইল নির্বাচন করুন (.json)</span>
            </button>

            {/* Import Error */}
            {importError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Import Preview Card */}
            {importPreview && (
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ফাইল সঠিকভাবে পাওয়া গেছে!</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900">
                    <span className="text-slate-500 dark:text-slate-400 block">ওষুধ পাওয়া গেছে</span>
                    <strong className="text-sm text-slate-800 dark:text-white">
                      {toBanglaNumber(importPreview.medicines.length)} টি
                    </strong>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900">
                    <span className="text-slate-500 dark:text-slate-400 block">প্রেসক্রিপশন</span>
                    <strong className="text-sm text-slate-800 dark:text-white">
                      {toBanglaNumber(importPreview.prescriptions.length)} টি
                    </strong>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => applyImport("replace")}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer text-center"
                  >
                    সম্পূর্ণ প্রতিস্থাপন করুন (Replace All)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyImport("merge")}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-700 transition-colors cursor-pointer text-center"
                  >
                    বর্তমান তালিকায় যুক্ত করুন (Merge)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Reset / Clear All Data */}
          <div className="border border-rose-200 dark:border-rose-900/60 rounded-2xl p-4 bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs sm:text-sm">
                <Trash2 className="w-4 h-4" />
                <span>সকল ডাটা মুছে নতুন করে শুরু করুন</span>
              </div>
            </div>

            {!confirmClear ? (
              <button
                id="clear-all-data-request-btn"
                type="button"
                onClick={() => setConfirmClear(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 hover:bg-rose-100/50 dark:hover:bg-rose-950 border border-rose-200 dark:border-rose-800 font-bold text-xs transition-colors cursor-pointer"
              >
                সকল ওষুধ ও হিস্ট্রি মুছুন
              </button>
            ) : (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-300 dark:border-rose-800 space-y-2 animate-fade-in">
                <p className="text-xs text-rose-700 dark:text-rose-300 font-semibold">
                  ⚠️ আপনি কি নিশ্চিত? এর ফলে আপনার সংরক্ষিত সব ওষুধ এবং দৈনিক হিস্ট্রি স্থায়ীভাবে মুছে যাবে।
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClearAllData();
                      setConfirmClear(false);
                      onShowToast("সকল ডাটা মুছে ফেলা হয়েছে।");
                    }}
                    className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
                  >
                    হ্যাঁ, সব মুছুন
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="flex-1 py-2 px-3 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
                  >
                    বাতিল
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-xs transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
