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

// Load initial data
if (!USE_FIRESTORE || admin.apps.length === 0) {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const data = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      inMemoryEntries = JSON.parse(data);
    }
  } catch (e) {
    console.warn('⚠️ Failed to load local db:', e);
  }
}

function saveLocalDB() {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(inMemoryEntries, null, 2));
  } catch (e) {
    console.error('❌ Failed to save local db:', e);
  }
}

export const dbRepository = {
  async saveEntry(entry: Entry): Promise<void> {
    if (USE_FIRESTORE && admin.apps.length > 0) {
      await admin.firestore().collection('entries').doc(entry.id).set(entry);
    } else {
      inMemoryEntries.push(entry);
      saveLocalDB();
    }
  },

  async getEntriesByDevice(deviceId: string): Promise<Entry[]> {
    if (USE_FIRESTORE && admin.apps.length > 0) {
      const snapshot = await admin
        .firestore()
        .collection('entries')
        .where('deviceId', '==', deviceId)
        .get();

      const entries = snapshot.docs.map((doc) => doc.data() as Entry);
      return entries.sort((a, b) => b.date.localeCompare(a.date));
    }

    return [...inMemoryEntries]
      .filter((e) => e.deviceId === deviceId)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  async deleteEntriesByDevice(deviceId: string): Promise<number> {
    if (USE_FIRESTORE && admin.apps.length > 0) {
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

    let count = 0;
    for (let i = inMemoryEntries.length - 1; i >= 0; i--) {
      if (inMemoryEntries[i].deviceId === deviceId) {
        inMemoryEntries.splice(i, 1);
        count++;
      }
    }
    if (count > 0) saveLocalDB();
    return count;
  },

  async deleteSingleEntry(deviceId: string, entryId: string): Promise<boolean> {
    if (USE_FIRESTORE && admin.apps.length > 0) {
      const docRef = admin.firestore().collection('entries').doc(entryId);
      const doc = await docRef.get();
      if (!doc.exists) return false;

      const data = doc.data() as Entry;
      if (data.deviceId !== deviceId) return false;

      await docRef.delete();
      return true;
    }

    const idx = inMemoryEntries.findIndex((e) => e.id === entryId && e.deviceId === deviceId);
    if (idx === -1) return false;
    inMemoryEntries.splice(idx, 1);
    saveLocalDB();
    return true;
  },
};
