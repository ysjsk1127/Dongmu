// app/lib/documents.js — localStorage 기반 자료 관리 + 자동 분류 시스템

const DOCS_KEY = 'dongmu_documents';

// 자동 분류 폴더 정의 (키워드 기반)
export const DOC_CATEGORIES = [
  { key: '회의록', icon: 'ti-notes', color: 'var(--blue)', keywords: ['회의', '미팅', 'meeting', '회의록', '안건'] },
  { key: '회계', icon: 'ti-receipt', color: 'var(--ok)', keywords: ['영수증', '회계', '예산', '정산', '지출', '결산', 'budget'] },
  { key: '대외/공문', icon: 'ti-mail', color: 'var(--google)', keywords: ['공문', '제안서', '후원', '대외', '협찬', '신청서'] },
  { key: '기술자료', icon: 'ti-rocket', color: 'var(--warn)', keywords: ['설계', '도면', '발사', '로켓', '실험', '기술', '보고서', 'cad'] },
  { key: '사진/미디어', icon: 'ti-photo', color: 'var(--gdrive)', keywords: ['사진', '이미지', 'img', 'photo', '영상', '포스터'] },
  { key: '기타', icon: 'ti-file', color: 'var(--muted)', keywords: [] },
];

// 파일명 + 확장자로 자동 분류
export function classifyDocument(fileName) {
  const lower = fileName.toLowerCase();
  // 확장자 기반 우선 분류 (이미지)
  if (/\.(jpg|jpeg|png|gif|heic|mp4|mov)$/i.test(lower)) return '사진/미디어';
  for (const cat of DOC_CATEGORIES) {
    if (cat.keywords.some(k => lower.includes(k))) return cat.key;
  }
  return '기타';
}

export function categoryMeta(key) {
  return DOC_CATEGORIES.find(c => c.key === key) || DOC_CATEGORIES[DOC_CATEGORIES.length - 1];
}

// 전체 자료 가져오기 (clubId 필터)
export function getDocuments(clubId) {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(DOCS_KEY);
  const all = raw ? JSON.parse(raw) : [];
  const list = clubId === undefined ? all : all.filter(d => d.clubId === clubId);
  return list.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

function saveDocuments(docs) {
  localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
}

// 자료 추가 (자동 분류 적용)
export function addDocument(data) {
  if (!data.name || !data.name.trim()) {
    return { success: false, error: '파일명을 입력해주세요.' };
  }
  const docs = getDocuments();
  const category = data.category || classifyDocument(data.name);
  const newDoc = {
    id: Date.now().toString(),
    clubId: data.clubId || '',
    name: data.name.trim(),
    category,
    size: data.size || `${(Math.floor((data.name.length * 37) % 4900) + 100)}KB`,
    uploadedBy: data.uploadedBy || '',
    uploadedAt: new Date().toISOString(),
  };
  docs.push(newDoc);
  saveDocuments(docs);
  return { success: true, document: newDoc, category };
}

// 자료 삭제
export function deleteDocument(id) {
  const docs = getDocuments();
  const filtered = docs.filter(d => d.id !== id);
  if (filtered.length === docs.length) {
    return { success: false, error: '해당 자료를 찾을 수 없습니다.' };
  }
  saveDocuments(filtered);
  return { success: true };
}

// 카테고리별 자료 개수 집계 (자동 정리된 폴더 뷰용)
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
