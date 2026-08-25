import React from "react";
import { AlertTriangle, Trash2, X, Pill, Layers, Calendar } from "lucide-react";
import { Medicine } from "../types";
import { toBanglaNumber, calculateRemainingStrips } from "../utils/banglaUtils";

interface DeleteConfirmModalProps {
  medicine: Medicine | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (medicineId: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  medicine,
  isOpen,
  onClose,
  onConfirm
}) => {
  if (!isOpen || !medicine) return null;

  const stockCalc = calculateRemainingStrips(medicine);

  return (
    <div
      id="delete-confirm-overlay"
      className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="delete-confirm-modal"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 transition-colors"
      >
        {/* Top Warning Accent Banner */}
        <div className="bg-rose-500 h-2 w-full" />

        <div className="p-5 sm:p-6 space-y-4">
          {/* Header Icon & Title */}
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900/60 shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  ওষুধ মুছে ফেলার নিশ্চিতকরণ
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                আপনি কি নিশ্চিত যে এই ওষুধটি স্থায়ীভাবে মুছে ফেলতে চান?
              </p>
            </div>
          </div>

          {/* Medicine Preview Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                {medicine.imageUrl ? (
                  <img
                    src={medicine.imageUrl}
                    alt={medicine.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain p-0.5"
                  />
                ) : (
                  <Pill className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {medicine.name}
                  </span>
                  {medicine.nameBn && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      ({medicine.nameBn})
                    </span>
                  )}
                  {medicine.strength && (
                    <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {medicine.strength}
                    </span>
                  )}
                </div>

                {medicine.generic && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {medicine.generic}
                  </p>
                )}
              </div>
            </div>

            {/* Meta info tags */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>মজুত: <strong className="text-slate-800 dark:text-slate-200">{stockCalc.formattedBangla}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>সূচি: {medicine.schedule.morning ? "সকাল " : ""}{medicine.schedule.afternoon ? "দুপুর " : ""}{medicine.schedule.night ? "রাত" : ""}</span>
              </div>
            </div>
          </div>

          {/* Alert Message Box */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p className="leading-relaxed">
              সতর্কতা: এটি মুছে ফেললে এর সমস্ত <strong>দৈনিক রিমাইন্ডার, সেবন লগ এবং স্টক ট্র্যাকিং তথ্য</strong> স্থায়ীভাবে ডিলিট হয়ে যাবে।
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              id="cancel-delete-med-btn"
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              বাতিল করুন
            </button>

            <button
              id="confirm-delete-med-btn"
              type="button"
              onClick={() => {
                onConfirm(medicine.id);
                onClose();
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>হ্যাঁ, মুছে ফেলুন</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
