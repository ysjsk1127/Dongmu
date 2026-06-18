// app/lib/documents.js — localStorage 기반 자료 관리 (폴더 선택 + 파일 업로드)
import { pushToCloud } from './sync';

const DOCS_KEY = 'dongmu_documents';

export const DOC_CATEGORIES = [
  { key: '회의록', icon: 'ti-notes', color: 'var(--blue)' },
  { key: '회계', icon: 'ti-receipt', color: 'var(--ok)' },
  { key: '대외/공문', icon: 'ti-mail', color: 'var(--google)' },
  { key: '기술자료', icon: 'ti-rocket', color: 'var(--warn)' },
  { key: '사진/미디어', icon: 'ti-photo', color: 'var(--gdrive)' },
  { key: '기타', icon: 'ti-file', color: 'var(--muted)' },
];

export function categoryMeta(key) {
  return DOC_CATEGORIES.find(c => c.key === key) || DOC_CATEGORIES[DOC_CATEGORIES.length - 1];
}

export function getDocuments(clubId) {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(DOCS_KEY);
  const all = raw ? JSON.parse(raw) : [];
  const list = clubId === undefined ? all : all.filter(d => d.clubId === clubId);
  return list.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

function saveDocuments(docs) {
  localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
  pushToCloud(DOCS_KEY);
}

export function addDocument(data) {
  if (!data.fileData) {
    return { success: false, error: '파일을 선택해주세요.' };
  }
  const docs = getDocuments();
  const category = data.category || '기타';
  const newDoc = {
    id: Date.now().toString(),
    clubId: data.clubId || '',
    name: (data.name || data.fileName || '').trim() || '제목 없음',
    category,
    fileName: data.fileName || '',
    fileData: data.fileData || '',
    size: data.fileData ? `${Math.round(data.fileData.length * 0.75 / 1024)}KB` : '0KB',
    uploadedBy: data.uploadedBy || '',
    uploadedAt: new Date().toISOString(),
  };
  docs.push(newDoc);
  saveDocuments(docs);
  return { success: true, document: newDoc, category };
}

export function deleteDocument(id) {
  const docs = getDocuments();
  const filtered = docs.filter(d => d.id !== id);
  if (filtered.length === docs.length) {
    return { success: false, error: '해당 자료를 찾을 수 없습니다.' };
  }
  saveDocuments(filtered);
  return { success: true };
}

export function getDocStats(clubId) {
  const docs = getDocuments(clubId);
  return DOC_CATEGORIES.map(cat => ({
    ...cat,
    count: docs.filter(d => d.category === cat.key).length,
  }));
}

export function getDocumentCount(clubId) {
  return getDocuments(clubId).length;
}
