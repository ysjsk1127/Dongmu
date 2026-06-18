// app/lib/sponsors.js — localStorage 기반 후원자 관리

const SPONSORS_KEY = 'dongmu_sponsors';

export const SPONSOR_TYPES = ['기업', '개인', '동문', '학교/기관'];

// 전체 후원자 목록 (clubId 필터)
export function getSponsors(clubId) {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(SPONSORS_KEY);
  const all = raw ? JSON.parse(raw) : [];
  const list = clubId === undefined ? all : all.filter(s => s.clubId === clubId);
  return list.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
}

function saveSponsors(sponsors) {
  localStorage.setItem(SPONSORS_KEY, JSON.stringify(sponsors));
}

// 후원자 추가
export function addSponsor(data) {
  if (!data.name || !data.name.trim()) {
    return { success: false, error: '후원자/기관명을 입력해주세요.' };
  }
  const sponsors = getSponsors();
  const newSponsor = {
    id: Date.now().toString(),
    clubId: data.clubId || '',
    name: data.name.trim(),
    type: data.type || '기업',
    amount: Number(String(data.amount).replace(/[^\d]/g, '')) || 0,
    contact: data.contact || '',
    manager: data.manager || '',
    date: data.date || '',
    status: data.status || '완료', // 예정 / 완료
    memo: data.memo || '',
    createdAt: new Date().toISOString(),
  };
  sponsors.push(newSponsor);
  saveSponsors(sponsors);
  return { success: true, sponsor: newSponsor };
}

// 후원자 삭제
export function deleteSponsor(id) {
  const sponsors = getSponsors();
  const filtered = sponsors.filter(s => s.id !== id);
  if (filtered.length === sponsors.length) {
    return { success: false, error: '해당 후원자를 찾을 수 없습니다.' };
  }
  saveSponsors(filtered);
  return { success: true };
}

// 후원자 검색
export function searchSponsors(query, clubId) {
  const sponsors = getSponsors(clubId);
  if (!query.trim()) return sponsors;
  const q = query.toLowerCase().trim();
  return sponsors.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.type.includes(q) ||
    (s.manager && s.manager.toLowerCase().includes(q))
  );
}

// 누적 후원 총액 (완료 건만 합산)
export function getTotalSupport(clubId) {
  return getSponsors(clubId)
    .filter(s => s.status === '완료')
    .reduce((sum, s) => sum + (s.amount || 0), 0);
}

export function getSponsorCount(clubId) {
  return getSponsors(clubId).length;
}

// 금액 포맷 (1,000,000)
export function formatAmount(n) {
  return (n || 0).toLocaleString('ko-KR');
}
