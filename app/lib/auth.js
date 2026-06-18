// app/lib/auth.js — localStorage 기반 인증 유틸리티
import { pushToCloud } from './sync';

const USERS_KEY = 'dongmu_users';
const SESSION_KEY = 'dongmu_session';

// 간단한 해시 함수 (SHA-256)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 전체 유저 목록 가져오기
function getUsers() {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

// 유저 목록 저장
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  pushToCloud(USERS_KEY);
}

// 회원가입
export async function signup(email, password, profile) {
  const users = getUsers();

  // 이메일 중복 검사
  if (users.find(u => u.email === email)) {
    return { success: false, error: '이미 등록된 이메일입니다.' };
  }

  const hashed = await hashPassword(password);
  const newUser = {
    id: Date.now().toString(),
    email,
    password: hashed,
    name: profile.name,
    school: profile.school || '',
    studentId: profile.studentId,
    department: profile.department,
    phone: profile.phone,
    joinedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  // 자동 로그인
  const sessionUser = { ...newUser };
  delete sessionUser.password;
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));

  return { success: true, user: sessionUser };
}

// 로그인
export async function login(email, password) {
  const users = getUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    return { success: false, error: '등록되지 않은 이메일입니다.' };
  }

  const hashed = await hashPassword(password);
  if (user.password !== hashed) {
    return { success: false, error: '비밀번호가 일치하지 않습니다.' };
  }

  const sessionUser = { ...user };
  delete sessionUser.password;
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));

  return { success: true, user: sessionUser };
}

// 로그아웃
export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

// 현재 로그인된 사용자 정보
export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

// 프로필 업데이트
export function updateProfile(updates) {
  const session = getCurrentUser();
  if (!session) return { success: false, error: '로그인이 필요합니다.' };

  const users = getUsers();
  const idx = users.findIndex(u => u.id === session.id);
  if (idx === -1) return { success: false, error: '사용자를 찾을 수 없습니다.' };

  // 업데이트 가능 필드만 수정
  const allowed = ['name', 'phone', 'department', 'school'];
  allowed.forEach(key => {
    if (updates[key] !== undefined) {
      users[idx][key] = updates[key];
    }
  });

  saveUsers(users);

  // 세션도 갱신
  const sessionUser = { ...users[idx] };
  delete sessionUser.password;
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));

  return { success: true, user: sessionUser };
}

// 사용자 동아리 정보 등록/변경
export function setUserClub(userId, clubId) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return { success: false, error: '사용자를 찾을 수 없습니다.' };

  users[idx].clubId = clubId;
  saveUsers(users);

  // 현재 세션 유저와 동일하면 세션 정보도 갱신
  const session = getCurrentUser();
  if (session && session.id === userId) {
    session.clubId = clubId;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  return { success: true, user: users[idx] };
}


// 유효성 검증 헬퍼
export const validators = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  studentId: (v) => /^20\d{8}$/.test(v),
  phone: (v) => /^010-\d{4}-\d{4}$/.test(v),
  password: (v) => v.length >= 6,
  name: (v) => v.trim().length >= 2,
};

// 전화번호 자동 포맷
export function formatPhone(value) {
  const nums = value.replace(/\D/g, '').slice(0, 11);
  if (nums.length <= 3) return nums;
  if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
  return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7)}`;
}

// 학번 자동 포맷 (숫자만 허용, 최대 10자리)
export function formatStudentId(value) {
  return value.replace(/\D/g, '').slice(0, 10);
}
