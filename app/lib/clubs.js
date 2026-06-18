// app/lib/clubs.js — localStorage 기반 동아리 데이터 관리
import { pushToCloud } from './sync';

const CLUBS_KEY = 'dongmu_clubs';

// 전체 동아리 목록 가져오기
export function getClubs() {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(CLUBS_KEY);
  return raw ? JSON.parse(raw) : [];
}

// 동아리 생성
export function createClub(name, startDate) {
  const clubs = getClubs();
  const nameTrimmed = name.trim();

  // 동아리 이름 중복 확인
  if (clubs.find(c => c.name.toLowerCase() === nameTrimmed.toLowerCase())) {
    return { success: false, error: '이미 존재하는 동아리 이름입니다.' };
  }

  const newClub = {
    id: Date.now().toString(),
    name: nameTrimmed,
    startDate: startDate,
    createdAt: new Date().toISOString(),
  };

  clubs.push(newClub);
  localStorage.setItem(CLUBS_KEY, JSON.stringify(clubs));
  pushToCloud(CLUBS_KEY);

  return { success: true, club: newClub };
}

// 동아리 검색
export function searchClubs(query) {
  const clubs = getClubs();
  if (!query.trim()) return clubs;
  const q = query.toLowerCase().trim();
  return clubs.filter(c => c.name.toLowerCase().includes(q));
}

// 동아리 ID로 조회
export function getClubById(id) {
  const clubs = getClubs();
  return clubs.find(c => c.id === id) || null;
}
