import React, { useState } from "react";
import {
  X,
  Cloud,
  CloudCheck,
  CloudOff,
  RefreshCw,
  LogIn,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowUpCircle,
  ArrowDownCircle,
  Sparkles
} from "lucide-react";
import { User } from "firebase/auth";
import {
  loginWithGoogle,
  loginGuest,
  logoutUser,
  backupAllToCloud
} from "../lib/firebase";
import { Medicine, DailyLog, Prescription, AlertSettings, CloudSyncStatus } from "../types";
import { toBanglaNumber } from "../utils/banglaUtils";

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  syncStatus: CloudSyncStatus;
  lastSyncTime: string | null;
  medicines: Medicine[];
  dailyLogs: DailyLog;
  prescriptions: Prescription[];
  soundEnabled: boolean;
  theme: "light" | "dark";
  onShowToast: (msg: string) => void;
  onManualSyncToCloud: () => Promise<void>;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  user,
  syncStatus,
  lastSyncTime,
  medicines,
  dailyLogs,
  prescriptions,
  soundEnabled,
  theme,
  onShowToast,
  onManualSyncToCloud
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const loggedUser = await loginWithGoogle();
      onShowToast(`স্বাগতম ${loggedUser.displayName || loggedUser.email || ""}! ক্লাউড সিঙ্ক চালু হয়েছে।`);
    } catch (err: any) {
      console.error("Login failed:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setErrorMsg("লগইন উইন্ডো বন্ধ করা হয়েছে।");
      } else if (err.code === "auth/unauthorized-domain") {
        const currentHost = typeof window !== "undefined" ? window.location.hostname : "midtime.vercel.app";
        setErrorMsg(`এই ডোমেনটি (${currentHost}) Firebase-এ অনুমোদিত নয়। Firebase Console ➔ Authentication ➔ Settings ➔ Authorized domains-এ '${currentHost}' যোগ করুন।`);
      } else {
        setErrorMsg("গুগল লগইন করতে সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ ও সেটিংস চেক করুন।");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await loginGuest();
      onShowToast("গেস্ট হিসেবে ক্লাউড ডাটাবেসে কানেক্ট করা হয়েছে!");
    } catch (err: any) {
      console.error("Guest login failed:", err);
      setErrorMsg("গেস্ট কানেকশন ব্যর্থ হয়েছে।");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await logoutUser();
      onShowToast("লগআউট সম্পন্ন হয়েছে। ডাটা লোকাল স্টোরেজে নিরাপদে আছে।");
    } catch (err: any) {
      console.error("Logout failed:", err);
      setErrorMsg("লগআউট করতে সমস্যা হয়েছে।");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceCloudBackup = async () => {
    if (!user) {
      setErrorMsg("ক্লাউডে ব্যাকআপ নেওয়ার জন্য প্রথমে লগইন করুন।");
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await onManualSyncToCloud();
      onShowToast("সব ডাটা সফলভাবে ক্লাউড ডাটাবেসে সেভ হয়েছে!");
    } catch (err: any) {
      console.error("Manual backup error:", err);
      setErrorMsg("ক্লাউডে সেভ করতে সমস্যা হয়েছে।");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-cyan-500/10 dark:from-teal-950/40 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>ক্লাউড ডাটাবেস ব্যাকআপ</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300">
                  Firebase
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                যেকোনো ডিভাইস থেকে ডাটা নিরাপদ ও রিয়েল-টাইম সংরক্ষণ
              </p>
            </div>
          </div>
          <button
            id="close-cloud-sync-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* User Profile / Status Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                ইউজার অ্যাকাউন্ট স্ট্যাটাস
              </span>
              {user ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                  <CheckCircle2 className="w-3 h-3" /> কানেক্টেড
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                  <CloudOff className="w-3 h-3" /> অফলাইন / লোকাল মোড
                </span>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-3 pt-1">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-11 h-11 rounded-full border-2 border-teal-500 shadow-sm"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {user.displayName || (user.isAnonymous ? "গেস্ট অ্যাকাউন্ট" : "ইউজার")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.email || `ID: ${user.uid.slice(0, 12)}...`}
                  </p>
                </div>
                <button
                  id="cloud-logout-btn"
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>লগআউট</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  গুগল দিয়ে সাইন ইন করলে আপনার সকল ওষুধ ও প্রেসক্রিপশন ক্লাউড ডাটাবেসে স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকবে। ব্রাউজার ক্যাশ ক্লিয়ার হলেও কোনো তথ্য হারাবে না।
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    id="cloud-google-signin-btn"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>গুগল দিয়ে সাইন ইন করুন</span>
                  </button>
                  <button
                    id="cloud-guest-signin-btn"
                    onClick={handleGuestLogin}
                    disabled={isLoading}
                    className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>গেস্ট মোড</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Current Data Overview */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
            <div className="p-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/50">
              <p className="text-lg sm:text-xl font-black text-teal-700 dark:text-teal-400">
                {toBanglaNumber(medicines.length)}
              </p>
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-0.5">মোট ওষুধ</p>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
              <p className="text-lg sm:text-xl font-black text-indigo-700 dark:text-indigo-400">
                {toBanglaNumber(Object.keys(dailyLogs).length)}
              </p>
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-0.5">দিনের রেকর্ড</p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
              <p className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-400">
                {toBanglaNumber(prescriptions.length)}
              </p>
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-0.5">প্রেসক্রিপশন</p>
            </div>
          </div>

          {/* Manual Backup Action */}
          {user && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-slate-800/80 dark:to-slate-800/40 border border-teal-200 dark:border-teal-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ArrowUpCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>ক্লাউড ব্যাকআপ সিঙ্ক</span>
                </h4>
                {lastSyncTime && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    সর্বশেষ: {lastSyncTime}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                আপনার বর্তমান লোকাল ডিভাইসের সমস্ত ওষুধ ও রেকর্ড ফায়ারবেস ক্লাউডে সাথে সাথে সংরক্ষিত করুন।
              </p>
              <button
                id="force-cloud-backup-btn"
                onClick={handleForceCloudBackup}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                <span>ক্লাউডে সম্পূর্ণ ব্যাকআপ সেভ করুন</span>
              </button>
            </div>
          )}

          {/* Security & Safety Note */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5">
            <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>নিরাপত্তা ও গোপনীয়তা গ্যারান্টি:</span>
            </p>
            <p className="leading-relaxed">
              • আপনার স্বাস্থ্য ও ওষুধের ডাটা এন্ড-টু-এন্ড সুরক্ষিত এবং শুধুমাত্র আপনার অনুমোদিত অ্যাকাউন্টের অধীনেই ক্লাউডে এনক্রিপ্ট হয়ে সংরক্ষিত থাকে।
            </p>
            <p className="leading-relaxed">
              • ইন্টারনেট সংযোগ না থাকলেও অফলাইনে কাজ করবে এবং ইন্টারনেট পাওয়ার সাথে সাথে ক্লাউডে ব্যাকআপ হয়ে যাবে।
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
          <button
            id="close-cloud-sync-footer-btn"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
