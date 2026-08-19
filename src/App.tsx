import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { Header } from "./components/Header";
import { LowStockBanner } from "./components/LowStockBanner";
import { ScheduleView } from "./components/ScheduleView";
import { MedicineListView } from "./components/MedicineListView";
import { StockTrackerView } from "./components/StockTrackerView";
import { PrescriptionView } from "./components/PrescriptionView";
import { AddMedicineModal } from "./components/AddMedicineModal";
import { MedicineDetailModal } from "./components/MedicineDetailModal";
import { SettingsModal } from "./components/SettingsModal";
import {
  Medicine,
  Prescription,
  DailyLog,
  TimeSlot,
  BackupData,
  DEFAULT_SAMPLE_MEDICINES
} from "./types";
import { soundManager } from "./utils/sound";
import { calculateRemainingStrips } from "./utils/banglaUtils";

export default function App() {
  // Navigation: schedule, medicines, stock, prescriptions
  const [activeTab, setActiveTab] = useState<"schedule" | "medicines" | "stock" | "prescriptions">("schedule");

  // Theme state (Default to Dark mode as requested)
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const saved = localStorage.getItem("med_tracker_theme");
      if (saved === "dark" || saved === "light") return saved;
    } catch (e) {
      console.warn("Theme read error", e);
    }
    return "dark";
  });

  // Sound enabled state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Sync theme with HTML root class
  useEffect(() => {
    try {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("med_tracker_theme", theme);
    } catch (e) {
      console.warn("Theme save error", e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setSoundEnabled(next);
  };

  // State: Medicines (empty default if no previous user data)
  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    try {
      const saved = localStorage.getItem("med_tracker_medicines");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("Error reading medicines from localStorage", e);
    }
    return DEFAULT_SAMPLE_MEDICINES;
  });

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  // State: Daily Logs (Date -> MedicineId -> { morning, afternoon, night })
  const [dailyLogs, setDailyLogs] = useState<DailyLog>(() => {
    try {
      const saved = localStorage.getItem("med_tracker_logs");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Error reading logs from localStorage", e);
    }
    return {};
  });

  // State: Prescriptions
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => {
    try {
      const saved = localStorage.getItem("med_tracker_prescriptions");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Error reading prescriptions", e);
    }
    return [];
  });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [selectedDetailMed, setSelectedDetailMed] = useState<Medicine | null>(null);

  // Today's date string YYYY-MM-DD
  const todayKey = new Date().toISOString().split("T")[0];
  const todayLogs = dailyLogs[todayKey] || {};

  // Save changes to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem("med_tracker_medicines", JSON.stringify(medicines));
    } catch (e) {
      console.warn("LocalStorage save error", e);
    }
  }, [medicines]);

  useEffect(() => {
    try {
      localStorage.setItem("med_tracker_logs", JSON.stringify(dailyLogs));
    } catch (e) {
      console.warn("LocalStorage save error", e);
    }
  }, [dailyLogs]);

  useEffect(() => {
    try {
      localStorage.setItem("med_tracker_prescriptions", JSON.stringify(prescriptions));
    } catch (e) {
      console.warn("LocalStorage save error", e);
    }
  }, [prescriptions]);

  // Restore data from Backup JSON
  const handleRestoreBackup = (backup: BackupData, mode: "replace" | "merge") => {
    if (mode === "replace") {
      setMedicines(backup.medicines || []);
      setDailyLogs(backup.dailyLogs || {});
      setPrescriptions(backup.prescriptions || []);
      if (backup.theme) {
        setTheme(backup.theme);
      }
    } else {
      // Merge mode
      setMedicines((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMeds = (backup.medicines || []).filter((m) => !existingIds.has(m.id));
        return [...prev, ...newMeds];
      });
      setDailyLogs((prev) => ({
        ...prev,
        ...(backup.dailyLogs || {})
      }));
      setPrescriptions((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newPres = (backup.prescriptions || []).filter((p) => !existingIds.has(p.id));
        return [...prev, ...newPres];
      });
    }
  };

  // Clear all data
  const handleClearAllData = () => {
    setMedicines([]);
    setDailyLogs({});
    setPrescriptions([]);
    try {
      localStorage.removeItem("med_tracker_medicines");
      localStorage.removeItem("med_tracker_logs");
      localStorage.removeItem("med_tracker_prescriptions");
    } catch (e) {
      console.warn("Error clearing local storage", e);
    }
  };

  // Toggle Taken Status for a medicine and slot
  const handleToggleTaken = (medicineId: string, slot: TimeSlot) => {
    const med = medicines.find((m) => m.id === medicineId);
    if (!med) return;

    const currentlyTaken = !!todayLogs[medicineId]?.[slot];
    const willBeTaken = !currentlyTaken;

    // Calculate dosage amount
    let doseAmount = 1;
    if (slot === "morning") doseAmount = med.schedule.morningDose || 1;
    if (slot === "afternoon") doseAmount = med.schedule.afternoonDose || 1;
    if (slot === "night") doseAmount = med.schedule.nightDose || 1;

    // Update Daily Log
    setDailyLogs((prev) => {
      const currentDay = prev[todayKey] || {};
      const currentMedLogs = currentDay[medicineId] || {};

      return {
        ...prev,
        [todayKey]: {
          ...currentDay,
          [medicineId]: {
            ...currentMedLogs,
            [slot]: willBeTaken,
            takenAt: {
              ...currentMedLogs.takenAt,
              [slot]: willBeTaken ? new Date().toLocaleTimeString() : undefined
            }
          }
        }
      };
    });

    // Update Medicine Stock count
    setMedicines((prev) =>
      prev.map((item) => {
        if (item.id !== medicineId) return item;

        const currentTotal = item.stock.totalUnits || 0;
        const perStrip = item.stock.tabletsPerStrip || 10;

        // If taking, reduce total units; if untaking, restore total units
        let newTotal = willBeTaken
          ? Math.max(0, currentTotal - doseAmount)
          : currentTotal + doseAmount;

        const newStrips = Math.floor(newTotal / perStrip);
        const newLoose = newTotal % perStrip;

        return {
          ...item,
          stock: {
            ...item.stock,
            totalUnits: newTotal,
            stripsCount: newStrips,
            looseTablets: newLoose
          }
        };
      })
    );

    // Play Sound & Check for celebration
    if (willBeTaken) {
      soundManager.playTakeMedicineSound();

      // Check if this was the last pending medicine today
      setTimeout(() => {
        let allDone = true;
        medicines.forEach((m) => {
          if (m.schedule.morning) {
            if (m.id === medicineId && slot === "morning") {
              // counted as taken
            } else if (!todayLogs[m.id]?.morning) {
              allDone = false;
            }
          }
          if (m.schedule.afternoon) {
            if (m.id === medicineId && slot === "afternoon") {
              // counted
            } else if (!todayLogs[m.id]?.afternoon) {
              allDone = false;
            }
          }
          if (m.schedule.night) {
            if (m.id === medicineId && slot === "night") {
              // counted
            } else if (!todayLogs[m.id]?.night) {
              allDone = false;
            }
          }
        });

        if (allDone) {
          try {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 }
            });
          } catch (err) {
            // ignore
          }
        }
      }, 100);
    }
  };

  // Add or Update Medicine
  const handleSaveMedicine = (savedMed: Medicine) => {
    setMedicines((prev) => {
      const exists = prev.some((m) => m.id === savedMed.id);
      if (exists) {
        showToast(`"${savedMed.name}" সফলভাবে আপডেট হয়েছে!`);
        return prev.map((m) => (m.id === savedMed.id ? savedMed : m));
      }
      showToast(`"${savedMed.name}" নতুন ওষুধ হিসেবে যুক্ত হয়েছে!`);
      return [savedMed, ...prev];
    });
    setEditingMedicine(null);
    soundManager.playTakeMedicineSound();
  };

  // Delete Medicine
  const handleDeleteMedicine = (medicineId: string) => {
    const med = medicines.find((m) => m.id === medicineId);
    const medName = med?.name || "ওষুধ";
    setMedicines((prev) => prev.filter((m) => m.id !== medicineId));
    if (selectedDetailMed?.id === medicineId) {
      setSelectedDetailMed(null);
    }
    showToast(`"${medName}" তালিকা থেকে মুছে ফেলা হয়েছে।`);
  };

  // Update Stock from StockTrackerView
  const handleUpdateStock = (
    medicineId: string,
    newStock: {
      stripsCount: number;
      looseTablets: number;
      tabletsPerStrip: number;
      lowStockThreshold: number;
    }
  ) => {
    setMedicines((prev) =>
      prev.map((m) => {
        if (m.id !== medicineId) return m;
        const total = newStock.stripsCount * newStock.tabletsPerStrip + newStock.looseTablets;
        return {
          ...m,
          stock: {
            ...m.stock,
            ...newStock,
            totalUnits: total
          }
        };
      })
    );
    showToast("মজুত সফলভাবে আপডেট হয়েছে!");
  };

  // Quick Refill +X Strips
  const handleQuickAddStrips = (medicineId: string, stripsToAdd: number) => {
    const med = medicines.find((m) => m.id === medicineId);
    setMedicines((prev) =>
      prev.map((m) => {
        if (m.id !== medicineId) return m;
        const newStrips = (m.stock.stripsCount || 0) + stripsToAdd;
        const perStrip = m.stock.tabletsPerStrip || 10;
        const loose = m.stock.looseTablets || 0;
        const newTotal = newStrips * perStrip + loose;

        return {
          ...m,
          stock: {
            ...m.stock,
            stripsCount: newStrips,
            totalUnits: newTotal
          }
        };
      })
    );
    showToast(`"${med?.name || 'ওষুধ'}" এ +${stripsToAdd} পাতা যোগ করা হয়েছে!`);
    soundManager.playTakeMedicineSound();
  };

  // Import medicines from AI scan
  const handleImportMedicinesFromPrescription = (
    prescription: Prescription,
    selectedMeds: any[]
  ) => {
    const newMedicines: Medicine[] = selectedMeds.map((med, idx) => {
      const perStrip = med.tabletsPerStrip || 10;
      const strips = med.stripsCount || 1;
      const totalUnits = strips * perStrip;

      return {
        id: `med-${Date.now()}-${idx}`,
        name: med.name || "ওষুধ",
        generic: med.generic || "",
        strength: med.strength || "",
        dosageForm: med.dosageForm || "ট্যাবলেট",
        company: "",
        schedule: {
          morning: !!med.schedule?.morning,
          morningDose: med.schedule?.morningDose || 1,
          morningTiming: med.schedule?.morningTiming || "after_meal",
          afternoon: !!med.schedule?.afternoon,
          afternoonDose: med.schedule?.afternoonDose || 1,
          afternoonTiming: med.schedule?.afternoonTiming || "after_meal",
          night: !!med.schedule?.night,
          nightDose: med.schedule?.nightDose || 1,
          nightTiming: med.schedule?.nightTiming || "after_meal"
        },
        stock: {
          tabletsPerStrip: perStrip,
          stripsCount: strips,
          looseTablets: 0,
          totalUnits: totalUnits,
          lowStockThreshold: 5
        },
        notes: med.instructionsBangla || "",
        startDate: prescription.date || new Date().toISOString().split("T")[0],
        durationDays: med.durationDays || 7,
        prescriptionId: prescription.id,
        color: "teal",
        createdAt: Date.now()
      };
    });

    setMedicines((prev) => [...newMedicines, ...prev]);
    setActiveTab("medicines");
    showToast(`প্রেসক্রিপশন থেকে ${newMedicines.length} টি ওষুধ যুক্ত হয়েছে!`);
    soundManager.playTakeMedicineSound();
  };

  // Stock alerts calculation
  const stockCalculations = medicines.map((m) => calculateRemainingStrips(m));
  const lowStockCount = stockCalculations.filter((c) => c.isLowStock).length;
  const outOfStockCount = stockCalculations.filter((c) => c.isOutOfStock).length;

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16 font-sans antialiased transition-colors">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => {
          setEditingMedicine(null);
          setIsAddModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        lowStockCount={lowStockCount}
        outOfStockCount={outOfStockCount}
        totalMedicines={medicines.length}
      />

      {/* Global Low Stock Warning Banner */}
      <LowStockBanner
        medicines={medicines}
        onOpenStockTab={() => setActiveTab("stock")}
        onQuickRefill={handleQuickAddStrips}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 dark:border-slate-300 animate-fade-in backdrop-blur-xs">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Tabs Content */}
      <main className="transition-opacity duration-200">
        {activeTab === "schedule" && (
          <ScheduleView
            medicines={medicines}
            dateKey={todayKey}
            logs={todayLogs}
            onToggleTaken={handleToggleTaken}
            onOpenMedicineDetails={(med) => setSelectedDetailMed(med)}
            onOpenAddModal={() => {
              setEditingMedicine(null);
              setIsAddModalOpen(true);
            }}
            onOpenPrescriptionTab={() => setActiveTab("prescriptions")}
          />
        )}

        {activeTab === "medicines" && (
          <MedicineListView
            medicines={medicines}
            onOpenAddModal={() => {
              setEditingMedicine(null);
              setIsAddModalOpen(true);
            }}
            onEditMedicine={(med) => {
              setEditingMedicine(med);
              setIsAddModalOpen(true);
            }}
            onDeleteMedicine={handleDeleteMedicine}
            onOpenDetails={(med) => setSelectedDetailMed(med)}
            onQuickAddStrips={handleQuickAddStrips}
          />
        )}

        {activeTab === "stock" && (
          <StockTrackerView
            medicines={medicines}
            onUpdateStock={handleUpdateStock}
            onQuickAddStrips={handleQuickAddStrips}
            onOpenMedicineDetails={(med) => setSelectedDetailMed(med)}
            onOpenAddModal={() => {
              setEditingMedicine(null);
              setIsAddModalOpen(true);
            }}
          />
        )}

        {activeTab === "prescriptions" && (
          <PrescriptionView
            prescriptions={prescriptions}
            onSavePrescription={(pres) =>
              setPrescriptions((prev) => [pres, ...prev])
            }
            onDeletePrescription={(id) =>
              setPrescriptions((prev) => prev.filter((p) => p.id !== id))
            }
            onImportMedicinesFromPrescription={handleImportMedicinesFromPrescription}
          />
        )}
      </main>

      {/* Settings Modal (Theme, JSON Export/Import, Reset) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        medicines={medicines}
        dailyLogs={dailyLogs}
        prescriptions={prescriptions}
        onRestoreBackup={handleRestoreBackup}
        onClearAllData={handleClearAllData}
        onShowToast={showToast}
      />

      {/* Add / Edit Medicine Modal */}
      <AddMedicineModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingMedicine(null);
        }}
        onAddMedicine={handleSaveMedicine}
        initialMedicine={editingMedicine}
      />

      {/* Medicine Details Modal */}
      <MedicineDetailModal
        medicine={selectedDetailMed}
        isOpen={!!selectedDetailMed}
        onClose={() => setSelectedDetailMed(null)}
        onEdit={(med) => {
          setSelectedDetailMed(null);
          setEditingMedicine(med);
          setIsAddModalOpen(true);
        }}
        onDelete={handleDeleteMedicine}
        onQuickAddStrips={handleQuickAddStrips}
      />
    </div>
  );
}
