// app/lib/schedule.js — localStorage 기반 일정 데이터 관리
import { pushToCloud } from './sync';

const SCHEDULE_KEY = 'dongmu_schedule';

// 일정 카테고리 → 색상 매핑
export const SCHEDULE_CATEGORIES = [
  { key: '회의', color: 'var(--blue)' },
  { key: '행사', color: 'var(--ok)' },
  { key: '테스트', color: 'var(--warn)' },
  { key: '대외', color: 'var(--google)' },
  { key: '기타', color: 'var(--muted)' },
];

function colorOf(category) {
  const found = SCHEDULE_CATEGORIES.find(c => c.key === category);
  return found ? found.color : 'var(--muted)';
}

// 전체 일정 가져오기 (clubId가 주어지면 해당 동아리만 필터링)
export function getSchedules(clubId) {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(SCHEDULE_KEY);
  const all = raw ? JSON.parse(raw) : [];
  const list = clubId === undefined ? all : all.filter(s => s.clubId === clubId);
  // 날짜 오름차순 정렬
  return list.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function saveSchedules(schedules) {
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedules));
  pushToCloud(SCHEDULE_KEY);
}

// 일정 추가
export function addSchedule(data) {
  if (!data.title || !data.title.trim()) {
    return { success: false, error: '일정 제목을 입력해주세요.' };
  }
  if (!data.date) {
    return { success: false, error: '날짜와 시간을 선택해주세요.' };
  }

  const schedules = getSchedules();
  const newSchedule = {
    id: Date.now().toString(),
    clubId: data.clubId || '',
    title: data.title.trim(),
    date: data.date,
    category: data.category || '기타',
    color: colorOf(data.category),
    location: data.location || '',
    memo: data.memo || '',
    allDay: data.allDay || false,
    createdAt: new Date().toISOString(),
  };

  schedules.push(newSchedule);
  saveSchedules(schedules);
  return { success: true, schedule: newSchedule };
}

// 일정 삭제
export function deleteSchedule(id) {
  const schedules = getSchedules();
  const filtered = schedules.filter(s => s.id !== id);
  if (filtered.length === schedules.length) {
    return { success: false, error: '해당 일정을 찾을 수 없습니다.' };
  }
  saveSchedules(filtered);
  return { success: true };
}

// 다가오는 일정만 (오늘 이후), 최대 limit개
export function getUpcoming(clubId, limit = 5) {
  const now = new Date();
  return getSchedules(clubId)
    .filter(s => new Date(s.date) >= now)
    .slice(0, limit);
}

// 일정 수 조회
export function getScheduleCount(clubId) {
  return getSchedules(clubId).length;
}

// 화면 표시용 날짜 포맷 (MM/DD HH:mm)
export function formatScheduleDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${mm}/${dd} ${hh}:${mi}`;
}
