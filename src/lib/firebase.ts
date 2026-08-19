import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  deleteDoc,
  getDocs,
  getDocFromServer,
  onSnapshot,
  query,
  writeBatch
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";
import { Medicine, IntakeLog, PrescriptionRecord, AlertSettings } from "../types";

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write"
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email
        })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    return true;
  } catch (error: any) {
    if (error?.message?.includes("the client is offline")) {
      console.warn("Firestore client is offline, working with cached/local data.");
    }
    return false;
  }
}

// Authentication Helpers
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
}

export async function loginGuest(): Promise<User> {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error("Anonymous sign-in error:", error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Sign-out error:", error);
    throw error;
  }
}

export function subscribeAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Firestore CRUD operations for Medicines
export async function syncMedicineToCloud(userId: string, medicine: Medicine): Promise<void> {
  const path = `users/${userId}/medicines/${medicine.id}`;
  try {
    const docRef = doc(db, "users", userId, "medicines", medicine.id);
    const payload = {
      ...medicine,
      userId,
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeMedicineFromCloud(userId: string, medicineId: string): Promise<void> {
  const path = `users/${userId}/medicines/${medicineId}`;
  try {
    const docRef = doc(db, "users", userId, "medicines", medicineId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Firestore CRUD operations for Intake Logs
export async function syncLogToCloud(userId: string, log: IntakeLog): Promise<void> {
  const path = `users/${userId}/logs/${log.id}`;
  try {
    const docRef = doc(db, "users", userId, "logs", log.id);
    const payload = {
      ...log,
      userId,
      createdAt: log.createdAt || new Date().toISOString()
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Firestore CRUD operations for Prescriptions
export async function syncPrescriptionToCloud(
  userId: string,
  prescription: PrescriptionRecord
): Promise<void> {
  const path = `users/${userId}/prescriptions/${prescription.id}`;
  try {
    const docRef = doc(db, "users", userId, "prescriptions", prescription.id);
    const payload = {
      ...prescription,
      userId,
      createdAt: prescription.createdAt || new Date().toISOString()
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removePrescriptionFromCloud(
  userId: string,
  prescriptionId: string
): Promise<void> {
  const path = `users/${userId}/prescriptions/${prescriptionId}`;
  try {
    const docRef = doc(db, "users", userId, "prescriptions", prescriptionId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Firestore CRUD for User Settings
export async function syncSettingsToCloud(userId: string, settings: AlertSettings): Promise<void> {
  const path = `users/${userId}/settings/preferences`;
  try {
    const docRef = doc(db, "users", userId, "settings", "preferences");
    await setDoc(
      docRef,
      {
        ...settings,
        userId,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Full Backup from local to Cloud
export async function backupAllToCloud(
  userId: string,
  medicines: Medicine[],
  logs: IntakeLog[],
  prescriptions: PrescriptionRecord[],
  settings: AlertSettings
): Promise<void> {
  const batch = writeBatch(db);

  // Settings
  const settingsRef = doc(db, "users", userId, "settings", "preferences");
  batch.set(
    settingsRef,
    {
      ...settings,
      userId,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  // Medicines (up to batch limits)
  medicines.slice(0, 100).forEach((med) => {
    const medRef = doc(db, "users", userId, "medicines", med.id);
    batch.set(medRef, { ...med, userId, updatedAt: new Date().toISOString() }, { merge: true });
  });

  // Logs (recent 100)
  logs.slice(-100).forEach((log) => {
    const logRef = doc(db, "users", userId, "logs", log.id);
    batch.set(logRef, { ...log, userId, createdAt: log.createdAt || new Date().toISOString() }, { merge: true });
  });

  // Prescriptions
  prescriptions.slice(0, 50).forEach((p) => {
    const pRef = doc(db, "users", userId, "prescriptions", p.id);
    batch.set(pRef, { ...p, userId, createdAt: p.createdAt || new Date().toISOString() }, { merge: true });
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
  }
}

// Real-time Listeners
export function listenToUserMedicines(
  userId: string,
  onData: (medicines: Medicine[]) => void,
  onError?: (error: Error) => void
) {
  const path = `users/${userId}/medicines`;
  const q = query(collection(db, "users", userId, "medicines"));
  return onSnapshot(
    q,
    (snapshot) => {
      const meds: Medicine[] = [];
      snapshot.forEach((docSnap) => {
        meds.push(docSnap.data() as Medicine);
      });
      onData(meds);
    },
    (error) => {
      console.warn("Medicines listener sync warning:", error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function listenToUserLogs(
  userId: string,
  onData: (logs: IntakeLog[]) => void,
  onError?: (error: Error) => void
) {
  const path = `users/${userId}/logs`;
  const q = query(collection(db, "users", userId, "logs"));
  return onSnapshot(
    q,
    (snapshot) => {
      const logs: IntakeLog[] = [];
      snapshot.forEach((docSnap) => {
        logs.push(docSnap.data() as IntakeLog);
      });
      onData(logs);
    },
    (error) => {
      console.warn("Logs listener sync warning:", error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function listenToUserPrescriptions(
  userId: string,
  onData: (prescriptions: PrescriptionRecord[]) => void,
  onError?: (error: Error) => void
) {
  const path = `users/${userId}/prescriptions`;
  const q = query(collection(db, "users", userId, "prescriptions"));
  return onSnapshot(
    q,
    (snapshot) => {
      const prescriptions: PrescriptionRecord[] = [];
      snapshot.forEach((docSnap) => {
        prescriptions.push(docSnap.data() as PrescriptionRecord);
      });
      onData(prescriptions);
    },
    (error) => {
      console.warn("Prescriptions listener sync warning:", error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
