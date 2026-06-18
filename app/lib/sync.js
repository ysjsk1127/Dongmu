import { getFirebaseDB } from './firebase';
import { ref, set, onValue, get } from 'firebase/database';

const SYNC_KEYS = [
  'dongmu_users',
  'dongmu_clubs',
  'dongmu_members',
  'dongmu_schedule',
  'dongmu_documents',
  'dongmu_sponsors',
  'dongmu_alumni',
  'dongmu_expenses',
];

let listeners = [];
let onChange = null;

export function pushToCloud(key) {
  const db = getFirebaseDB();
  if (!db) return;
  if (!SYNC_KEYS.includes(key)) return;

  const raw = localStorage.getItem(key);
  const data = raw ? JSON.parse(raw) : [];
  set(ref(db, 'data/' + key), data).catch(() => {});
}

export async function pullFromCloud() {
  const db = getFirebaseDB();
  if (!db) return;

  for (const key of SYNC_KEYS) {
    try {
      const snap = await get(ref(db, 'data/' + key));
      if (snap.exists()) {
        localStorage.setItem(key, JSON.stringify(snap.val()));
      }
    } catch (_) {}
  }
}

export function initSync(onDataChange) {
  const db = getFirebaseDB();
  if (!db) return;

  onChange = onDataChange;
  stopSync();

  for (const key of SYNC_KEYS) {
    const unsub = onValue(ref(db, 'data/' + key), (snap) => {
      if (snap.exists()) {
        const cloud = JSON.stringify(snap.val());
        const local = localStorage.getItem(key);
        if (cloud !== local) {
          localStorage.setItem(key, cloud);
          if (onChange) onChange();
        }
      }
    });
    listeners.push(unsub);
  }
}

export function stopSync() {
  listeners.forEach(unsub => unsub());
  listeners = [];
}
