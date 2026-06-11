// app/lib/members.js — localStorage 기반 부원 데이터 관리

const MEMBERS_KEY = 'dongmu_members';

// 전체 부원 목록 가져오기
export function getMembers() {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(MEMBERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

// 부원 목록 저장
function saveMembers(members) {
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
}

// 부원 추가
export function addMember(memberData) {
  const members = getMembers();

  // 학번 중복 검사
  if (memberData.studentId && members.find(m => m.studentId === memberData.studentId)) {
    return { success: false, error: '이미 등록된 학번입니다.' };
  }

  const newMember = {
    id: Date.now().toString(),
    name: memberData.name,
    studentId: memberData.studentId || '',
    department: memberData.department || '',
    phone: memberData.phone || '',
    email: memberData.email || '',
    generation: memberData.generation || '',
    role: memberData.role || '부원',
    team: memberData.team || '',
    createdAt: new Date().toISOString(),
  };

  members.push(newMember);
  saveMembers(members);

  return { success: true, member: newMember };
}

// 부원 삭제
export function deleteMember(id) {
  const members = getMembers();
  const filtered = members.filter(m => m.id !== id);

  if (filtered.length === members.length) {
    return { success: false, error: '해당 부원을 찾을 수 없습니다.' };
  }

  saveMembers(filtered);
  return { success: true };
}

// 부원 수정
export function updateMember(id, updates) {
  const members = getMembers();
  const idx = members.findIndex(m => m.id === id);

  if (idx === -1) {
    return { success: false, error: '해당 부원을 찾을 수 없습니다.' };
  }

  members[idx] = { ...members[idx], ...updates };
  saveMembers(members);

  return { success: true, member: members[idx] };
}

// 부원 수 조회
export function getMemberCount() {
  return getMembers().length;
}

// 부원 검색 (이름, 학번, 학과로 필터링)
export function searchMembers(query) {
  const members = getMembers();
  if (!query.trim()) return members;

  const q = query.toLowerCase().trim();
  return members.filter(m =>
    m.name.toLowerCase().includes(q) ||
    m.studentId.includes(q) ||
    m.department.toLowerCase().includes(q) ||
    m.generation.includes(q)
  );
}
