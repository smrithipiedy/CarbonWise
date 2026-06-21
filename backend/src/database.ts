import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { USE_FIRESTORE, PROJECT_ID } from './config';
import type { FootprintInputs } from './carbon/engine';

export interface Entry {
  id: string;
  deviceId: string;
  breakdown: Record<string, number>;
  totalEmission: number;
  inputs: FootprintInputs;
  date: string;
}

const LOCAL_DB_PATH = path.join(process.cwd(), 'local_db.json');
let inMemoryEntries: Entry[] = [];
let localDBLoaded = false;

/**
 * Checks if Google Cloud Firestore is configured and active.
 * @returns {boolean} True if Firestore should be used, false otherwise.
 */
function isFirestoreActive(): boolean {
  return USE_FIRESTORE && admin.apps.length > 0;
}

if (USE_FIRESTORE) {
  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        projectId: PROJECT_ID,
      });
    }
    console.log('🟢 Connecting to Google Cloud Firestore in native mode (firebase-admin)');
  } catch (e) {
    console.warn(`⚠️ Firestore initialization failed: ${e}. Falling back to local file mode.`);
  }
} else {
  console.log('🟢 Offline Mode: Initializing local file storage');
}

/**
 * Ensures the local JSON database file is loaded into memory.
 * Does nothing if Firestore is active or if already loaded.
 */
async function ensureLocalDBLoaded() {
  if (isFirestoreActive() || localDBLoaded) return;
  try {
    const data = await fs.promises.readFile(LOCAL_DB_PATH, 'utf-8');
    inMemoryEntries = JSON.parse(data);
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code?: string }).code !== 'ENOENT') {
      console.warn('⚠️ Failed to load local db:', e);
    }
  }
  localDBLoaded = true;
}

/**
 * Atomically saves the in-memory local database to the JSON file.
 */
async function saveLocalDB() {
  const tmpPath = `${LOCAL_DB_PATH}.tmp`;
  await fs.promises.writeFile(tmpPath, JSON.stringify(inMemoryEntries, null, 2));
  await fs.promises.rename(tmpPath, LOCAL_DB_PATH);
}

export const dbRepository = {
  /**
   * Saves a single footprint entry to either Firestore or the local JSON file.
   * @param entry The footprint entry to save.
   */
  async saveEntry(entry: Entry): Promise<void> {
    if (isFirestoreActive()) {
      await admin.firestore().collection('entries').doc(entry.id).set(entry);
    } else {
      await ensureLocalDBLoaded();
      inMemoryEntries.push(entry);
      await saveLocalDB();
    }
  },

  /**
   * Retrieves all footprint entries for a specific device.
   * @param deviceId The unique device identifier.
   * @returns An array of entries sorted by date descending.
   */
  async getEntriesByDevice(deviceId: string): Promise<Entry[]> {
    if (isFirestoreActive()) {
      const snapshot = await admin
        .firestore()
        .collection('entries')
        .where('deviceId', '==', deviceId)
        .get();

      const entries = snapshot.docs.map((doc) => doc.data() as Entry);
      return entries.sort((a, b) => b.date.localeCompare(a.date));
    }

    await ensureLocalDBLoaded();
    return [...inMemoryEntries]
      .filter((e) => e.deviceId === deviceId)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  /**
   * Deletes all footprint entries for a specific device.
   * @param deviceId The unique device identifier.
   * @returns The number of entries deleted.
   */
  async deleteEntriesByDevice(deviceId: string): Promise<number> {
    if (isFirestoreActive()) {
      const snapshot = await admin
        .firestore()
        .collection('entries')
        .where('deviceId', '==', deviceId)
        .get();

      if (snapshot.empty) return 0;

      const batch = admin.firestore().batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      return snapshot.size;
    }

    await ensureLocalDBLoaded();
    let count = 0;
    for (let i = inMemoryEntries.length - 1; i >= 0; i--) {
      if (inMemoryEntries[i].deviceId === deviceId) {
        inMemoryEntries.splice(i, 1);
        count++;
      }
    }
    if (count > 0) await saveLocalDB();
    return count;
  },

  /**
   * Deletes a single footprint entry by ID for a specific device.
   * @param deviceId The unique device identifier.
   * @param entryId The unique entry identifier.
   * @returns True if deleted successfully, false otherwise.
   */
  async deleteSingleEntry(deviceId: string, entryId: string): Promise<boolean> {
    if (isFirestoreActive()) {
      const docRef = admin.firestore().collection('entries').doc(entryId);
      const doc = await docRef.get();
      if (!doc.exists) return false;

      const data = doc.data() as Entry;
      if (data.deviceId !== deviceId) return false;

      await docRef.delete();
      return true;
    }

    await ensureLocalDBLoaded();
    const idx = inMemoryEntries.findIndex((e) => e.id === entryId && e.deviceId === deviceId);
    if (idx === -1) return false;
    inMemoryEntries.splice(idx, 1);
    await saveLocalDB();
    return true;
  },
};
