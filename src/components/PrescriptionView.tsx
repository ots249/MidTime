import React, { useState, useRef } from "react";
import {
  Upload,
  Camera,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  X,
  Clock,
  Calendar,
  Layers,
  ArrowRight,
  Loader2,
  FileCheck
} from "lucide-react";
import { Prescription, Medicine, MedicineSchedule } from "../types";
import { toBanglaNumber, formatMealTimingBangla } from "../utils/banglaUtils";

interface PrescriptionViewProps {
  prescriptions: Prescription[];
  onSavePrescription: (prescription: Prescription) => void;
  onDeletePrescription: (id: string) => void;
  onImportMedicinesFromPrescription: (
    prescription: Prescription,
    selectedMedicines: any[]
  ) => void;
}

export const PrescriptionView: React.FC<PrescriptionViewProps> = ({
  prescriptions,
  onSavePrescription,
  onDeletePrescription,
  onImportMedicinesFromPrescription
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [previewPrescription, setPreviewPrescription] = useState<Prescription | null>(null);

  // Selected extracted medicines for import
  const [selectedIndices, setSelectedIndices] = useState<Record<number, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setScanResult(null);
      setScanError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleScanWithAI = async () => {
    if (!selectedImage) return;

    setIsScanning(true);
    setScanError(null);

    try {
      const res = await fetch("/api/prescription/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType: mimeType
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "প্রেসক্রিপশন স্ক্যান ব্যর্থ হয়েছে");
      }

      setScanResult(json.data);

      // Select all extracted medicines by default
      const initialSelected: Record<number, boolean> = {};
      if (Array.isArray(json.data?.medicines)) {
        json.data.medicines.forEach((_: any, idx: number) => {
          initialSelected[idx] = true;
        });
      }
      setSelectedIndices(initialSelected);
    } catch (err: any) {
      console.error(err);
      setScanError(err.message || "প্রেসক্রিপশন স্ক্যান করতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ বা API Key পরীক্ষা করুন।");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveAndImport = () => {
    if (!selectedImage) return;

    const chosenMeds = (scanResult?.medicines || []).filter(
      (_: any, idx: number) => selectedIndices[idx]
    );

    const newPrescription: Prescription = {
      id: `pres-${Date.now()}`,
      title: scanResult?.doctorName
        ? `ডাঃ ${scanResult.doctorName} - প্রেসক্রিপশন`
        : `প্রেসক্রিপশন (${new Date().toLocaleDateString("bn-BD")})`,
      doctorName: scanResult?.doctorName || "চিকিৎসক",
      hospitalName: scanResult?.hospitalName || "",
      patientName: scanResult?.patientName || "",
      date: scanResult?.prescriptionDate || new Date().toISOString().split("T")[0],
      imageUrl: selectedImage,
      notes: scanResult?.summaryBangla || scanResult?.diagnosis || "",
      extractedMedicines: chosenMeds,
      createdAt: Date.now()
    };

    onSavePrescription(newPrescription);

    if (chosenMeds.length > 0) {
      onImportMedicinesFromPrescription(newPrescription, chosenMeds);
    }

    // Reset upload form
    setSelectedImage(null);
    setScanResult(null);
  };

  const toggleSelectMedicine = (index: number) => {
    setSelectedIndices((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* Top Banner / Upload Zone */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              <span>প্রেসক্রিপশন আপলোড ও এআই স্ক্যানার</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ডাক্তারের প্রেসক্রিপশনের ছবি আপলোড করলে এআই স্বয়ংক্রিয়ভাবে ওষুধের নাম, খাওয়ার নিয়ম ও ডোজ পড়ে সূচিতে যোগ করবে।
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Hidden file inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              id="btn-open-camera"
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200 transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4 text-teal-600" />
              <span>ক্যামেরা দিয়ে তুলুন</span>
            </button>

            <button
              id="btn-upload-gallery"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Upload className="w-4 h-4" />
              <span>ছবি সিলেক্ট করুন</span>
            </button>
          </div>
        </div>

        {/* Selected Image Preview & Action */}
        {selectedImage && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Image thumbnail */}
              <div className="relative w-full sm:w-48 h-48 rounded-xl overflow-hidden bg-slate-900 border border-slate-300 shrink-0 group">
                <img
                  src={selectedImage}
                  alt="Prescription"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition-colors cursor-pointer"
                  title="ছবি বাতিল করুন"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scan Prompt / Button */}
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">প্রেসক্রিপশনের ছবি প্রস্তুত!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    ছবিতে থাকা ওষুধের নাম, সকাল/দুপুর/রাতের সূচি এবং পাতার হিসাব অটোমেটিক বের করতে নিচের বাটনে চাপুন।
                  </p>
                </div>

                {scanError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                      <div>
                        <strong className="font-semibold block">স্ক্যান সম্পন্ন হতে সমস্যা হয়েছে:</strong>
                        <span>{scanError}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleScanWithAI}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>পুনরায় স্ক্যান করুন</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newPrescription: Prescription = {
                            id: `pres-${Date.now()}`,
                            title: `প্রেসক্রিপশন (${new Date().toLocaleDateString("bn-BD")})`,
                            doctorName: "চিকিৎসক",
                            date: new Date().toISOString().split("T")[0],
                            imageUrl: selectedImage,
                            notes: "ম্যানুয়ালি সংরক্ষিত প্রেসক্রিপশন",
                            extractedMedicines: [],
                            createdAt: Date.now()
                          };
                          onSavePrescription(newPrescription);
                          setSelectedImage(null);
                          setScanResult(null);
                          setScanError(null);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs cursor-pointer"
                      >
                        সরাসরি প্রেসক্রিপশন গ্যালারিতে সেভ করুন
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    id="btn-scan-ai"
                    type="button"
                    disabled={isScanning}
                    onClick={handleScanWithAI}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>এআই প্রেসক্রিপশন স্ক্যান করছে...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>এআই দিয়ে স্ক্যান করুন</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setScanResult(null);
                    }}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    বাতিল
                  </button>
                </div>
              </div>
            </div>

            {/* Extracted Medicines Preview */}
            {scanResult && (
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>প্রেসক্রিপশন থেকে সনাক্তকৃত তথ্য:</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      {scanResult.doctorName && `চিকিৎসক: ডাঃ ${scanResult.doctorName} • `}
                      {scanResult.prescriptionDate && `তারিখ: ${scanResult.prescriptionDate}`}
                    </p>
                  </div>

                  <span className="text-xs font-semibold text-teal-800 bg-teal-100 px-2.5 py-1 rounded-full">
                    {toBanglaNumber((scanResult.medicines || []).length)} টি ওষুধ পাওয়া গেছে
                  </span>
                </div>

                {/* Medicine List with Selection Checkboxes */}
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {(scanResult.medicines || []).map((med: any, idx: number) => {
                    const isChecked = !!selectedIndices[idx];

                    return (
                      <div
                        key={idx}
                        onClick={() => toggleSelectMedicine(idx)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isChecked
                            ? "bg-white border-teal-400 ring-1 ring-teal-200 shadow-2xs"
                            : "bg-slate-100/70 border-slate-200 opacity-60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectMedicine(idx)}
                          className="w-4 h-4 rounded text-teal-600 mt-0.5 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <strong className="text-sm font-bold text-slate-900">{med.name}</strong>
                            {med.strength && (
                              <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-100 font-semibold text-slate-700">
                                {med.strength}
                              </span>
                            )}
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                              {med.dosageForm || "ট্যাবলেট"}
                            </span>
                          </div>

                          {med.generic && (
                            <p className="text-xs text-slate-500 mt-0.5">{med.generic}</p>
                          )}

                          {/* Schedule breakdown */}
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-medium">
                            <span className="text-slate-700">
                              সূচি:
                              {med.schedule?.morning && ` সকাল (${toBanglaNumber(med.schedule.morningDose || 1)}টি)`}
                              {med.schedule?.afternoon && ` দুপুর (${toBanglaNumber(med.schedule.afternoonDose || 1)}টি)`}
                              {med.schedule?.night && ` রাত (${toBanglaNumber(med.schedule.nightDose || 1)}টি)`}
                            </span>
                            {med.instructionsBangla && (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {med.instructionsBangla}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Import All Button */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    id="btn-confirm-import-prescription"
                    type="button"
                    onClick={handleSaveAndImport}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>সিলেক্ট করা ওষুধগুলো সূচিতে যোগ করুন</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Prescription Archive / Gallery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" />
            <span>সংরক্ষিত প্রেসক্রিপশন সমূহ ({toBanglaNumber(prescriptions.length)})</span>
          </h3>
        </div>

        {prescriptions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400 text-xs">
            এখনো কোনো প্রেসক্রিপশন আপলোড করা হয়নি। ক্যামেরা বা গ্যালারি থেকে প্রেসক্রিপশন আপলোড করুন।
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {prescriptions.map((pres) => (
              <div
                key={pres.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Image Header Preview */}
                  <div
                    className="relative h-44 bg-slate-900 cursor-pointer group"
                    onClick={() => setPreviewPrescription(pres)}
                  >
                    <img
                      src={pres.imageUrl}
                      alt={pres.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3">
                      <p className="text-white text-xs font-semibold flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-teal-300" /> বড় করে দেখতে ক্লিক করুন
                      </p>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-2">
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{pres.title}</h4>

                    {pres.doctorName && (
                      <p className="text-xs text-slate-600 flex items-center gap-1.5">
                        <span>ডাঃ {pres.doctorName}</span>
                      </p>
                    )}

                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{pres.date}</span>
                    </p>

                    {pres.extractedMedicines && pres.extractedMedicines.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[11px] font-semibold text-slate-500">যুক্ত করা ওষুধ:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {pres.extractedMedicines.map((m, mIdx) => (
                            <span
                              key={mIdx}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-medium"
                            >
                              {m.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer / Delete */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPreviewPrescription(pres)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>বিস্তারিত দেখুন</span>
                  </button>

                  <button
                    id={`delete-prescription-${pres.id}`}
                    type="button"
                    onClick={() => onDeletePrescription(pres.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="প্রেসক্রিপশন ডিলিট করুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Preview Modal */}
      {previewPrescription && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {previewPrescription.title}
                </h3>
                <p className="text-xs text-slate-500">{previewPrescription.date}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPrescription(null)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center bg-slate-900">
              <img
                src={previewPrescription.imageUrl}
                alt={previewPrescription.title}
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
