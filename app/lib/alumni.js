// app/lib/alumni.js — localStorage 기반 졸업 선배(Alumni) 관리

const ALUMNI_KEY = 'dongmu_alumni';

// 전체 졸업 선배 목록 (clubId 필터)
export function getAlumni(clubId) {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(ALUMNI_KEY);
  const all = raw ? JSON.parse(raw) : [];
  const list = clubId === undefined ? all : all.filter(a => a.clubId === clubId);
  // 기수 오름차순 정렬 (숫자 추출)
  return list.sort((a, b) => {
    const ga = parseInt(a.generation) || 0;
    const gb = parseInt(b.generation) || 0;
    return ga - gb;
  });
}

function saveAlumni(list) {
  localStorage.setItem(ALUMNI_KEY, JSON.stringify(list));
}

// 졸업 선배 추가
export function addAlumnus(data) {
  if (!data.name || !data.name.trim()) {
    return { success: false, error: '이름을 입력해주세요.' };
  }
  const list = getAlumni();
  const newAlumnus = {
    id: Date.now().toString(),
    clubId: data.clubId || '',
    name: data.name.trim(),
    generation: data.generation || '',
    graduationYear: data.graduationYear || '',
    company: data.company || '',
    position: data.position || '',
    phone: data.phone || '',
    email: data.email || '',
    mentoring: data.mentoring || false, // 멘토링 참여 의향
    memo: data.memo || '',
    createdAt: new Date().toISOString(),
  };
  list.push(newAlumnus);
  saveAlumni(list);
  return { success: true, alumnus: newAlumnus };
}

// 졸업 선배 삭제
export function deleteAlumnus(id) {
  const list = getAlumni();
  const filtered = list.filter(a => a.id !== id);
  if (filtered.length === list.length) {
    return { success: false, error: '해당 선배를 찾을 수 없습니다.' };
  }
  saveAlumni(filtered);
  return { success: true };
}

// 졸업 선배 검색
export function searchAlumni(query, clubId) {
  const list = getAlumni(clubId);
  if (!query.trim()) return list;
  const q = query.toLowerCase().trim();
  return list.filter(a =>
    a.name.toLowerCase().includes(q) ||
    (a.company && a.company.toLowerCase().includes(q)) ||
    (a.generation && a.generation.includes(q))
  );
}

export function getAlumniCount(clubId) {
  return getAlumni(clubId).length;
}

// 멘토링 참여 가능 선배 수
export function getMentorCount(clubId) {
  return getAlumni(clubId).filter(a => a.mentoring).length;
}
