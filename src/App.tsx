import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { User } from "firebase/auth";
import { Header } from "./components/Header";
import { LowStockBanner } from "./components/LowStockBanner";
import { ScheduleView } from "./components/ScheduleView";
import { MedicineListView } from "./components/MedicineListView";
import { StockTrackerView } from "./components/StockTrackerView";
import { PrescriptionView } from "./components/PrescriptionView";
import { AddMedicineModal } from "./components/AddMedicineModal";
import { MedicineDetailModal } from "./components/MedicineDetailModal";
import { SettingsModal } from "./components/SettingsModal";
import { CloudSyncModal } from "./components/CloudSyncModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import {
  Medicine,
  Prescription,
  DailyLog,
  TimeSlot,
  BackupData,
  CloudSyncStatus,
  DEFAULT_SAMPLE_MEDICINES
} from "./types";
import { soundManager } from "./utils/sound";
import { calculateRemainingStrips, getCurrentTimeSlot } from "./utils/banglaUtils";
import {
  testConnection,
  subscribeAuth,
  syncMedicineToCloud,
  removeMedicineFromCloud,
  syncLogToCloud,
  syncPrescriptionToCloud,
  removePrescriptionFromCloud,
  syncSettingsToCloud,
  backupAllToCloud,
  listenToUserMedicines,
  listenToUserLogs,
  listenToUserPrescriptions
} from "./lib/firebase";

export default function App() {
  // Navigation: schedule, medicines, stock, prescriptions
  const [activeTab, setActiveTab] = useState<"schedule" | "medicines" | "stock" | "prescriptions">("schedule");

  // Firebase Auth & Cloud Sync State
  const [user, setUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>("offline");
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);

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
    }, 3500);
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
  const [medicineToDelete, setMedicineToDelete] = useState<Medicine | null>(null);

  // Today's date string YYYY-MM-DD
  const todayKey = new Date().toISOString().split("T")[0];
  const todayLogs = dailyLogs[todayKey] || {};

  // Verify Firestore connection on startup
  useEffect(() => {
    testConnection().then((connected) => {
      if (connected) {
        setSyncStatus(user ? "synced" : "connected");
      }
    });
  }, []);

  // Subscribe to Firebase Auth changes
  useEffect(() => {
    const unsubscribe = subscribeAuth((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setSyncStatus("synced");
        setLastSyncTime(new Date().toLocaleTimeString());
      } else {
        setSyncStatus("offline");
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore Listeners when authenticated
  useEffect(() => {
    if (!user) return;

    setSyncStatus("syncing");

    // Listen to medicines
    const unsubMeds = listenToUserMedicines(
      user.uid,
      (cloudMeds) => {
        if (cloudMeds && cloudMeds.length > 0) {
          setMedicines(cloudMeds);
        } else if (medicines.length > 0) {
          // If cloud has no medicines but local does, backup to cloud
          backupAllToCloud(user.uid, medicines, [], prescriptions, {
            soundEnabled,
            theme
          }).catch((err) => console.warn("Auto-sync initial backup error:", err));
        }
        setSyncStatus("synced");
        setLastSyncTime(new Date().toLocaleTimeString());
      },
      (err) => {
        console.warn("Meds listener error", err);
        setSyncStatus("error");
      }
    );

    // Listen to prescriptions
    const unsubPres = listenToUserPrescriptions(
      user.uid,
      (cloudPres) => {
        if (cloudPres && cloudPres.length > 0) {
          setPrescriptions(cloudPres);
        }
      },
      (err) => console.warn("Prescriptions listener warning", err)
    );

    return () => {
      unsubMeds();
      unsubPres();
    };
  }, [user?.uid]);

  // Save changes to LocalStorage as offline fallback
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

  // Manual Force Cloud Backup
  const handleManualSyncToCloud = async () => {
    if (!user) return;
    setSyncStatus("syncing");
    try {
      await backupAllToCloud(user.uid, medicines, [], prescriptions, {
        soundEnabled,
        theme
      });
      setSyncStatus("synced");
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (error) {
      setSyncStatus("error");
      throw error;
    }
  };

  // Restore data from Backup JSON
  const handleRestoreBackup = (backup: BackupData, mode: "replace" | "merge") => {
    if (mode === "replace") {
      const newMeds = backup.medicines || [];
      const newLogs = backup.dailyLogs || {};
      const newPres = backup.prescriptions || [];
      setMedicines(newMeds);
      setDailyLogs(newLogs);
      setPrescriptions(newPres);
      if (backup.theme) {
        setTheme(backup.theme);
      }
      if (user) {
        backupAllToCloud(user.uid, newMeds, [], newPres, {
          soundEnabled,
          theme: backup.theme || theme
        }).catch((e) => console.warn("Restore cloud sync warning:", e));
      }
    } else {
      // Merge mode
      let mergedMeds: Medicine[] = [];
      setMedicines((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMeds = (backup.medicines || []).filter((m) => !existingIds.has(m.id));
        mergedMeds = [...prev, ...newMeds];
        return mergedMeds;
      });
      setDailyLogs((prev) => ({
        ...prev,
        ...(backup.dailyLogs || {})
      }));
      let mergedPres: Prescription[] = [];
      setPrescriptions((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newPres = (backup.prescriptions || []).filter((p) => !existingIds.has(p.id));
        mergedPres = [...prev, ...newPres];
        return mergedPres;
      });

      if (user) {
        setTimeout(() => {
          backupAllToCloud(user.uid, mergedMeds, [], mergedPres, {
            soundEnabled,
            theme
          }).catch((e) => console.warn("Merge cloud sync warning:", e));
        }, 300);
      }
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
    if (user) {
      backupAllToCloud(user.uid, [], [], [], { soundEnabled, theme }).catch((e) =>
        console.warn("Cloud clear warning:", e)
      );
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
    let updatedMed: Medicine | null = null;
    setMedicines((prev) =>
      prev.map((item) => {
        if (item.id !== medicineId) return item;

        const currentTotal = item.stock.totalUnits || 0;
        const perStrip = item.stock.tabletsPerStrip || 10;

        // If taking, reduce total units; if untaking, restore total units
        const newTotal = willBeTaken
          ? Math.max(0, currentTotal - doseAmount)
          : currentTotal + doseAmount;

        const newStrips = Math.floor(newTotal / perStrip);
        const newLoose = newTotal % perStrip;

        updatedMed = {
          ...item,
          stock: {
            ...item.stock,
            totalUnits: newTotal,
            stripsCount: newStrips,
            looseTablets: newLoose
          }
        };
        return updatedMed;
      })
    );

    // Sync medicine stock to Cloud
    if (user && updatedMed) {
      syncMedicineToCloud(user.uid, updatedMed).catch((e) =>
        console.warn("Stock cloud sync warning:", e)
      );
      syncLogToCloud(user.uid, {
        id: `log-${todayKey}-${medicineId}-${slot}`,
        medicineId,
        medicineName: med.name,
        status: willBeTaken ? "taken" : "missed",
        date: todayKey,
        slot,
        unitsTaken: willBeTaken ? doseAmount : 0
      }).catch((e) => console.warn("Log cloud sync warning:", e));
    }

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

    if (user) {
      syncMedicineToCloud(user.uid, savedMed).catch((e) =>
        console.warn("Medicine cloud save warning:", e)
      );
    }

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

    if (user) {
      removeMedicineFromCloud(user.uid, medicineId).catch((e) =>
        console.warn("Medicine cloud delete warning:", e)
      );
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
    let updatedMed: Medicine | null = null;
    setMedicines((prev) =>
      prev.map((m) => {
        if (m.id !== medicineId) return m;
        const total = newStock.stripsCount * newStock.tabletsPerStrip + newStock.looseTablets;
        updatedMed = {
          ...m,
          stock: {
            ...m.stock,
            ...newStock,
            totalUnits: total
          }
        };
        return updatedMed;
      })
    );

    if (user && updatedMed) {
      syncMedicineToCloud(user.uid, updatedMed).catch((e) =>
        console.warn("Stock update cloud sync warning:", e)
      );
    }

    showToast("মজুত সফলভাবে আপডেট হয়েছে!");
  };

  // Quick Refill +X Strips
  const handleQuickAddStrips = (medicineId: string, stripsToAdd: number) => {
    const med = medicines.find((m) => m.id === medicineId);
    let updatedMed: Medicine | null = null;

    setMedicines((prev) =>
      prev.map((m) => {
        if (m.id !== medicineId) return m;
        const newStrips = (m.stock.stripsCount || 0) + stripsToAdd;
        const perStrip = m.stock.tabletsPerStrip || 10;
        const loose = m.stock.looseTablets || 0;
        const newTotal = newStrips * perStrip + loose;

        updatedMed = {
          ...m,
          stock: {
            ...m.stock,
            stripsCount: newStrips,
            totalUnits: newTotal
          }
        };
        return updatedMed;
      })
    );

    if (user && updatedMed) {
      syncMedicineToCloud(user.uid, updatedMed).catch((e) =>
        console.warn("Refill cloud sync warning:", e)
      );
    }

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

    if (user) {
      newMedicines.forEach((m) => {
        syncMedicineToCloud(user.uid, m).catch((e) =>
          console.warn("Import med cloud sync warning:", e)
        );
      });
    }

    setActiveTab("medicines");
    showToast(`প্রেসক্রিপশন থেকে ${newMedicines.length} টি ওষুধ যুক্ত হয়েছে!`);
    soundManager.playTakeMedicineSound();
  };

  // Auto-time tracking for active slots (updates every 10 seconds)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const currentSlotInfo = getCurrentTimeSlot(currentTime);
  const currentSlotMeds = medicines.filter((m) => !!m.schedule[currentSlotInfo.slot]);
  const currentSlotTakenCount = currentSlotMeds.filter(
    (m) => !!todayLogs[m.id]?.[currentSlotInfo.slot]
  ).length;
  const pendingSlotDoses = Math.max(0, currentSlotMeds.length - currentSlotTakenCount);
  const totalSlotDoses = currentSlotMeds.length;

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
        onOpenCloudSync={() => setIsCloudSyncOpen(true)}
        user={user}
        syncStatus={syncStatus}
        theme={theme}
        onToggleTheme={toggleTheme}
        lowStockCount={lowStockCount}
        outOfStockCount={outOfStockCount}
        totalMedicines={medicines.length}
        currentSlotInfo={currentSlotInfo}
        pendingSlotDoses={pendingSlotDoses}
        totalSlotDoses={totalSlotDoses}
        onSelectCurrentSlot={() => setActiveTab("schedule")}
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
            onRequestDelete={(med) => setMedicineToDelete(med)}
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
            onSavePrescription={(pres) => {
              setPrescriptions((prev) => [pres, ...prev]);
              if (user) {
                syncPrescriptionToCloud(user.uid, pres).catch((e) =>
                  console.warn("Prescription cloud save warning:", e)
                );
              }
            }}
            onDeletePrescription={(id) => {
              setPrescriptions((prev) => prev.filter((p) => p.id !== id));
              if (user) {
                removePrescriptionFromCloud(user.uid, id).catch((e) =>
                  console.warn("Prescription cloud delete warning:", e)
                );
              }
            }}
            onImportMedicinesFromPrescription={handleImportMedicinesFromPrescription}
          />
        )}
      </main>

      {/* Settings Modal (Theme, JSON Export/Import, Reset) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onOpenCloudSync={() => setIsCloudSyncOpen(true)}
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

      {/* Cloud Sync / Database Modal */}
      <CloudSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
        user={user}
        syncStatus={syncStatus}
        lastSyncTime={lastSyncTime}
        medicines={medicines}
        dailyLogs={dailyLogs}
        prescriptions={prescriptions}
        soundEnabled={soundEnabled}
        theme={theme}
        onShowToast={showToast}
        onManualSyncToCloud={handleManualSyncToCloud}
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
        onRequestDelete={(med) => {
          setSelectedDetailMed(null);
          setMedicineToDelete(med);
        }}
        onQuickAddStrips={handleQuickAddStrips}
      />

      {/* Global Delete Confirmation Dialog */}
      <DeleteConfirmModal
        medicine={medicineToDelete}
        isOpen={!!medicineToDelete}
        onClose={() => setMedicineToDelete(null)}
        onConfirm={(medicineId) => {
          handleDeleteMedicine(medicineId);
          setMedicineToDelete(null);
        }}
      />
    </div>
  );
}

