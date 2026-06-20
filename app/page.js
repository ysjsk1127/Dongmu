'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { signup, login, logout, getCurrentUser, updateProfile, setUserClub, validators, formatPhone, formatStudentId } from './lib/auth';
import { getMembers, addMember, deleteMember, updateMember, searchMembers, getMemberCount } from './lib/members';
import { createClub, getClubs, searchClubs, getClubById } from './lib/clubs';
import { getSchedules, addSchedule, deleteSchedule, getUpcoming, getScheduleCount, formatScheduleDate, SCHEDULE_CATEGORIES } from './lib/schedule';
import { getDocuments, addDocument, deleteDocument, getDocStats, getDocumentCount, categoryMeta, DOC_CATEGORIES } from './lib/documents';
import { getSponsors, addSponsor, deleteSponsor, searchSponsors, getTotalSupport, getSponsorCount, formatAmount, SPONSOR_TYPES } from './lib/sponsors';
import { getAlumni, addAlumnus, deleteAlumnus, updateAlumnus, searchAlumni, getAlumniCount, getMentorCount } from './lib/alumni';
import { addExpense, deleteExpense, getExpenses, getExpenseCount, getTotalExpense, getTotalIncome, getBalance, getExpensesByCategory, getMonthlyExpense, formatAmount as formatExpAmount, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from './lib/expenses';
import { initSync, pullFromCloud } from './lib/sync';


const MEMBER_ROLES = ['회장', '부회장', '총무', '임원진', '부원', 'OB'];

/* ───── Google Icon SVG ───── */
function GoogleIcon() {
  return (
    <span className="g-icon">
      <svg viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    </span>
  );
}

/* ───── Generation Options ───── */
const GENERATIONS = Array.from({ length: 10 }, (_, i) => `${i + 1}기`);

export default function Home() {
  const [mounted, setMounted] = useState(false);

  /* ── Navigation ── */
  const [screen, setScreen] = useState('onboard');
  const [tab, setTab] = useState('sch');
  const [toast, setToast] = useState('');
  const areaRef = useRef(null);

  /* ── Auth state ── */
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [activeClub, setActiveClub] = useState(null);

  /* ── Club Select state ── */
  const [clubSelectMode, setClubSelectMode] = useState('choose'); // 'choose', 'create', 'join'
  const [newClubName, setNewClubName] = useState('');
  const [newClubDate, setNewClubDate] = useState('');
  const [clubSearchQuery, setClubSearchQuery] = useState('');
  const [foundClubs, setFoundClubs] = useState([]);
  const [clubError, setClubError] = useState('');


  /* ── Login form ── */
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');

  /* ── Signup form ── */
  const [sName, setSName] = useState('');
  const [sSchool, setSSchool] = useState('');
  const [sStudentId, setSStudentId] = useState('');
  const [sDept, setSDept] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sPw, setSPw] = useState('');
  const [sPwConfirm, setSPwConfirm] = useState('');
  const [signupTouched, setSignupTouched] = useState({});

  /* ── Home/data state ── */
  const [memC, setMemC] = useState(0);
  const [pkgOpen, setPkgOpen] = useState(false);
  const [nowMonth, setNowMonth] = useState(0);
  const [nowYear, setNowYear] = useState(2026);
  const [nowSemester, setNowSemester] = useState('1');

  /* ── Expense data state ── */
  const [expenseList, setExpenseList] = useState([]);
  const [expC, setExpC] = useState(0);
  const [expTotal, setExpTotal] = useState(0);
  const [expIncome, setExpIncome] = useState(0);
  const [expBalance, setExpBalance] = useState(0);
  const [expMonthly, setExpMonthly] = useState(0);
  const [expByCategory, setExpByCategory] = useState([]);
  const [finType, setFinType] = useState('expense');
  const [finAdd, setFinAdd] = useState(false);
  const [expandedFin, setExpandedFin] = useState(null);
  const [fReceipt, setFReceipt] = useState('');
  const [fDate, setFDate] = useState('');
  const [fSource, setFSource] = useState('');

  /* ── 증빙 이미지 뷰어 ── */
  const [viewerImg, setViewerImg] = useState(null);

  /* ── Member registration form ── */
  const [fName, setFName] = useState('');
  const [fStudentId, setFStudentId] = useState('');
  const [fDept, setFDept] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fGen, setFGen] = useState('');
  const [fRole, setFRole] = useState('');
  const [fTeam, setFTeam] = useState('');

  /* ── Expense form ── */
  const [fCat, setFCat] = useState('');
  const [fAmt, setFAmt] = useState('');
  const [fMemo, setFMemo] = useState('');

  /* ── Members list ── */
  const [membersList, setMembersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  /* ── Schedule (일정) ── */
  const [scheduleList, setScheduleList] = useState([]);
  const [schC, setSchC] = useState(0);
  const [schAdd, setSchAdd] = useState(false);
  const [schTitle, setSchTitle] = useState('');
  const [schDate, setSchDate] = useState('');
  const [schHasTime, setSchHasTime] = useState(true);
  const [schCat, setSchCat] = useState('회의');
  const [schLoc, setSchLoc] = useState('');
  const [schMemo, setSchMemo] = useState('');
  const [expandedSchedule, setExpandedSchedule] = useState(null);
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(0);
  const [calSelected, setCalSelected] = useState(null);
  const [schView, setSchView] = useState('calendar');

  /* ── Documents (자료) ── */
  const [docList, setDocList] = useState([]);
  const [docStats, setDocStats] = useState([]);
  const [docC, setDocC] = useState(0);
  const [docFilter, setDocFilter] = useState('전체');
  const [docName, setDocName] = useState('');
  const [docCat, setDocCat] = useState('기타');
  const [docFile, setDocFile] = useState('');
  const [docFileName, setDocFileName] = useState('');
  const [docMode, setDocMode] = useState('upload'); // 'upload' | 'search'
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docSearchFolder, setDocSearchFolder] = useState('전체');
  const [docSearchDate, setDocSearchDate] = useState('');

  /* ── Sponsors (후원자) ── */
  const [sponsorList, setSponsorList] = useState([]);
  const [sponsorTotal, setSponsorTotal] = useState(0);
  const [spnAdd, setSpnAdd] = useState(false);
  const [spnName, setSpnName] = useState('');
  const [spnType, setSpnType] = useState('기업');
  const [spnAmt, setSpnAmt] = useState('');
  const [spnManager, setSpnManager] = useState('');
  const [spnContact, setSpnContact] = useState('');
  const [spnStatus, setSpnStatus] = useState('완료');

  /* ── 펼치기 상태 ── */
  const [expandedMember, setExpandedMember] = useState(null);
  const [expandedSponsor, setExpandedSponsor] = useState(null);

  /* ── Alumni (졸업 선배) ── */
  const [alumniList, setAlumniList] = useState([]);
  const [mentorC, setMentorC] = useState(0);
  const [almAdd, setAlmAdd] = useState(false);
  const [almName, setAlmName] = useState('');
  const [almGen, setAlmGen] = useState('');
  const [almYear, setAlmYear] = useState('');
  const [almCompany, setAlmCompany] = useState('');
  const [almPosition, setAlmPosition] = useState('');
  const [almPhone, setAlmPhone] = useState('');
  const [almMentoring, setAlmMentoring] = useState(false);

  /* ── 달력 일정 펼치기 ── */
  const [expandedCalSch, setExpandedCalSch] = useState(null);

  /* ── 알림 설정 ── */
  const [notifySchedule, setNotifySchedule] = useState(true);
  const [notifyFinance, setNotifyFinance] = useState(true);
  const [notifyMember, setNotifyMember] = useState(false);

  /* ── 실제 알림 ── */
  const [alertList, setAlertList] = useState([]);
  const [readAlertIds, setReadAlertIds] = useState(() => {
    if (typeof window !== 'undefined') {
      try { return JSON.parse(localStorage.getItem('dongmu_read_alerts') || '[]'); } catch { return []; }
    }
    return [];
  });

  /* ── 개인정보 수정 ── */
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDept, setEditDept] = useState('');

  /* ── 화면 전환 로딩 ── */
  const [screenLoading, setScreenLoading] = useState(false);

  /* ── Generic delete dialog for new modules ── */
  const [confirmDel2, setConfirmDel2] = useState(null); // { type, id, name }


  /* ───── Effects ───── */
  const refreshData = useCallback(() => {
    const currentUser = getCurrentUser();
    const clubId = currentUser ? currentUser.clubId : null;
    setMemC(getMemberCount(clubId));
    setMembersList(searchQuery ? searchMembers(searchQuery, clubId) : getMembers(clubId));

    // 일정
    setScheduleList(getSchedules(clubId));
    setSchC(getScheduleCount(clubId));

    // 자료
    setDocList(getDocuments(clubId));
    setDocStats(getDocStats(clubId));
    setDocC(getDocumentCount(clubId));

    // 후원자
    setSponsorList(searchQuery ? searchSponsors(searchQuery, clubId) : getSponsors(clubId));
    setSponsorTotal(getTotalSupport(clubId));

    // 졸업 선배
    setAlumniList(searchQuery ? searchAlumni(searchQuery, clubId) : getAlumni(clubId));
    setMentorC(getMentorCount(clubId));

    // 지출
    setExpenseList(getExpenses(clubId));
    setExpC(getExpenseCount(clubId));
    setExpTotal(getTotalExpense(clubId));
    setExpIncome(getTotalIncome(clubId));
    setExpBalance(getBalance(clubId));
    setExpMonthly(getMonthlyExpense(clubId));
    setExpByCategory(getExpensesByCategory(clubId));

    // 실제 알림 생성
    const alerts = [];
    const now = new Date();
    // 다가오는 일정 알림 (3일 이내)
    getSchedules(clubId).forEach(s => {
      const d = new Date(s.date);
      const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
      if (diff >= 0 && diff <= 3) {
        alerts.push({ id: `sch-${s.id}`, type: 'schedule', icon: 'ti-calendar', color: 'var(--ok)', title: diff === 0 ? `오늘 일정: ${s.title}` : `D-${diff} 일정: ${s.title}`, desc: formatScheduleDate(s.date), time: s.date });
      }
    });
    // 최근 재무 알림 (7일 이내 등록)
    getExpenses(clubId).forEach(e => {
      const d = new Date(e.date);
      const diff = Math.ceil((now - d) / (1000 * 60 * 60 * 24));
      if (diff >= 0 && diff <= 7) {
        const isIncome = e.type === 'income';
        alerts.push({ id: `exp-${e.id}`, type: 'finance', icon: isIncome ? 'ti-arrow-down-left' : 'ti-arrow-up-right', color: isIncome ? 'var(--ok)' : 'var(--warn)', title: `${isIncome ? '수입' : '지출'}: ${e.description}`, desc: `${formatExpAmount(e.amount)}원`, time: e.date });
      }
    });
    // 최근 부원 알림 (7일 이내 가입)
    getMembers(clubId).forEach(m => {
      if (m.joinDate) {
        const d = new Date(m.joinDate);
        const diff = Math.ceil((now - d) / (1000 * 60 * 60 * 24));
        if (diff >= 0 && diff <= 7) {
          alerts.push({ id: `mem-${m.id}`, type: 'member', icon: 'ti-user-plus', color: 'var(--blue)', title: `새 부원: ${m.name}`, desc: m.department || '', time: m.joinDate });
        }
      }
    });
    alerts.sort((a, b) => new Date(b.time) - new Date(a.time));
    setAlertList(alerts);
  }, [searchQuery]);

  useEffect(() => {
    async function boot() {
      try { await pullFromCloud(); } catch (_) {}
      const u = getCurrentUser();
      if (u) {
        setUser(u);
        if (u.clubId) {
          const club = getClubById(u.clubId);
          if (club) {
            setActiveClub(club);
            autoRegisterMember(u, club.id, '부원');
            setScreen('home');
          } else {
            setUserClub(u.id, null);
            setActiveClub(null);
            setScreen('club-select');
          }
        } else {
          setScreen('club-select');
        }
      }
      refreshData();
      try { initSync(() => refreshData()); } catch (_) {}
    }
    boot();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refreshData();
  }, [searchQuery, refreshData]);

  useEffect(() => {
    const d = new Date();
    setNowMonth(d.getMonth() + 1);
    setNowYear(d.getFullYear());
    setNowSemester(d.getMonth() < 6 ? '1' : '2');
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
    document.fonts.ready.then(() => setMounted(true)).catch(() => setMounted(true));
  }, []);


  /* ───── Helpers ───── */
  const isManager = user && membersList.find(m => (m.email === user.email || m.studentId === user.studentId) && m.role === '회장');

  function go(id) {
    setScreenLoading(true);
    setScreen(id);
    setAuthError('');
    setSearchQuery('');
    if (areaRef.current) areaRef.current.scrollTop = 0;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setScreenLoading(false));
    });
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  }

  function markTouched(field) {
    setSignupTouched(prev => ({ ...prev, [field]: true }));
  }

  /* ───── Auth & Club Actions ───── */
  async function handleSignup() {
    // Mark all fields as touched
    setSignupTouched({ name: true, school: true, studentId: true, dept: true, phone: true, email: true, pw: true, pwConfirm: true });

    // Validate all fields
    if (!validators.name(sName)) { setAuthError('이름을 2자 이상 입력해주세요.'); return; }
    if (!sSchool.trim()) { setAuthError('학교를 입력해주세요.'); return; }
    if (!sDept.trim()) { setAuthError('학과를 입력해주세요.'); return; }
    if (!validators.studentId(sStudentId)) { setAuthError('학번을 20XXXXXXXX 형식으로 입력해주세요.'); return; }
    if (!validators.phone(sPhone)) { setAuthError('전화번호를 010-0000-0000 형식으로 입력해주세요.'); return; }
    if (!validators.email(sEmail)) { setAuthError('올바른 이메일 주소를 입력해주세요.'); return; }
    if (!validators.password(sPw)) { setAuthError('비밀번호는 최소 6자 이상이어야 합니다.'); return; }
    if (sPw !== sPwConfirm) { setAuthError('비밀번호가 일치하지 않습니다.'); return; }

    const result = await signup(sEmail, sPw, {
      name: sName,
      school: sSchool,
      studentId: sStudentId,
      department: sDept,
      phone: sPhone,
    });

    if (!result.success) {
      setAuthError(result.error);
      return;
    }

    setUser(result.user);
    showToast(`${result.user.name}님, 환영합니다!`);
    resetSignupForm();
    refreshData();
    setClubSelectMode('choose');
    setClubError('');
    go('club-select');
  }

  async function handleLogin() {
    if (!loginEmail || !loginPw) {
      setAuthError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    const result = await login(loginEmail, loginPw);
    if (!result.success) {
      setAuthError(result.error);
      return;
    }

    setUser(result.user);
    showToast(`${result.user.name}님, 환영합니다!`);
    setLoginEmail('');
    setLoginPw('');
    refreshData();

    if (result.user.clubId) {
      const club = getClubById(result.user.clubId);
      if (club) {
        setActiveClub(club);
        autoRegisterMember(result.user, club.id, '부원');
        go('home');
      } else {
        // Linked club was not found
        setUserClub(result.user.id, null);
        setActiveClub(null);
        setClubSelectMode('choose');
        setClubError('');
        go('club-select');
      }
    } else {
      setClubSelectMode('choose');
      setClubError('');
      go('club-select');
    }
  }

  function handleLogout() {
    logout();
    setUser(null);
    setActiveClub(null);
    go('onboard');
    showToast('로그아웃 되었습니다.');
  }

  function resetSignupForm() {
    setSName(''); setSSchool(''); setSStudentId(''); setSDept(''); setSPhone('');
    setSEmail(''); setSPw(''); setSPwConfirm('');
    setSignupTouched({});
    setAuthError('');
  }

  /* ───── Club Actions ───── */
  function handleCreateClub() {
    if (!newClubName.trim()) {
      setClubError('동아리 이름을 입력해주세요.');
      return;
    }
    if (!newClubDate) {
      setClubError('최초 시작한 날짜를 선택해주세요.');
      return;
    }

    const res = createClub(newClubName, newClubDate);
    if (!res.success) {
      setClubError(res.error);
      return;
    }

    const userRes = setUserClub(user.id, res.club.id);
    if (!userRes.success) {
      setClubError(userRes.error);
      return;
    }

    setUser(userRes.user);
    setActiveClub(res.club);
    autoRegisterMember(userRes.user, res.club.id, '회장');
    showToast(`"${res.club.name}" 동아리가 생성되었습니다.`);

    setNewClubName('');
    setNewClubDate('');
    setClubError('');
    setClubSelectMode('choose');

    refreshData();
    go('home');
  }

  function handleJoinClub(clubId) {
    if (!user) return;
    const club = getClubById(clubId);
    if (!club) {
      setClubError('해당 동아리를 찾을 수 없습니다.');
      return;
    }

    const userRes = setUserClub(user.id, clubId);
    if (!userRes.success) {
      setClubError(userRes.error);
      return;
    }

    setUser(userRes.user);
    setActiveClub(club);
    autoRegisterMember(userRes.user, clubId, '부원');
    showToast(`"${club.name}" 동아리에 가입되었습니다.`);

    setClubSearchQuery('');
    setFoundClubs([]);
    setClubError('');
    setClubSelectMode('choose');

    refreshData();
    go('home');
  }

  // 동아리 검색 목록 업데이트
  useEffect(() => {
    if (screen === 'club-select') {
      if (clubSearchQuery.trim()) {
        setFoundClubs(searchClubs(clubSearchQuery));
      } else {
        setFoundClubs(getClubs());
      }
    }
  }, [clubSearchQuery, screen]);


  function autoRegisterMember(userData, clubId, role) {
    const existing = getMembers(clubId);
    if (existing.find(m => m.email === userData.email || (m.studentId && m.studentId === userData.studentId))) return;
    addMember({
      clubId,
      name: userData.name,
      studentId: userData.studentId || '',
      department: userData.department || '',
      phone: userData.phone || '',
      email: userData.email || '',
      generation: '',
      role: role || '부원',
      team: '',
    });
  }

  /* ───── Member Actions ───── */
  function saveMem() {
    if (!fName) { showToast('이름을 입력해주세요'); return; }

    const result = addMember({
      clubId: user ? user.clubId : '',
      name: fName,
      studentId: fStudentId,
      department: fDept,
      phone: fPhone,
      email: fEmail,
      generation: fGen,
      role: fRole,
      team: fTeam,
    });

    if (!result.success) {
      showToast(result.error);
      return;
    }

    showToast(`${fName} 부원 등록 완료`);
    setFName(''); setFStudentId(''); setFDept(''); setFPhone('');
    setFEmail(''); setFGen(''); setFRole(''); setFTeam('');
    refreshData();
    setTimeout(() => go('home'), 1200);
  }

  function handleDeleteMember(id) {
    const result = deleteMember(id);
    if (result.success) {
      showToast('부원이 삭제되었습니다.');
      refreshData();
    }
    setConfirmDelete(null);
  }


  /* ───── Schedule Actions ───── */
  function saveSchedule() {
    const dateVal = schHasTime ? schDate : (schDate ? schDate + 'T00:00' : '');
    const res = addSchedule({
      clubId: user ? user.clubId : '',
      title: schTitle,
      date: dateVal,
      category: schCat,
      location: schLoc,
      memo: schMemo,
      allDay: !schHasTime,
    });
    if (!res.success) { showToast(res.error); return; }
    showToast('일정이 등록되었습니다');
    setSchTitle(''); setSchDate(''); setSchCat('회의'); setSchLoc(''); setSchMemo(''); setSchHasTime(true);
    setSchAdd(false);
    refreshData();
  }

  /* ───── Document Actions ───── */
  function saveDocument() {
    if (!docFile) { showToast('파일을 선택해주세요'); return; }
    const res = addDocument({
      clubId: user ? user.clubId : '',
      name: docName || docFileName,
      category: docCat,
      fileData: docFile,
      fileName: docFileName,
      uploadedBy: user ? user.name : '',
    });
    if (!res.success) { showToast(res.error); return; }
    showToast(`"${docCat}" 폴더에 저장되었습니다`);
    setDocName(''); setDocCat('기타'); setDocFile(''); setDocFileName('');
    refreshData();
  }

  /* ───── Sponsor Actions ───── */
  function saveSponsor() {
    const res = addSponsor({
      clubId: user ? user.clubId : '',
      name: spnName,
      type: spnType,
      amount: spnAmt,
      manager: spnManager,
      contact: spnContact,
      status: spnStatus,
    });
    if (!res.success) { showToast(res.error); return; }
    showToast('후원 내역이 등록되었습니다');
    setSpnName(''); setSpnType('기업'); setSpnAmt(''); setSpnManager(''); setSpnContact(''); setSpnStatus('완료');
    setSpnAdd(false);
    refreshData();
  }

  /* ───── Alumni Actions ───── */
  function saveAlumnus() {
    const res = addAlumnus({
      clubId: user ? user.clubId : '',
      name: almName,
      generation: almGen,
      graduationYear: almYear,
      company: almCompany,
      position: almPosition,
      phone: almPhone,
      mentoring: almMentoring,
    });
    if (!res.success) { showToast(res.error); return; }
    showToast('졸업 선배가 등록되었습니다');
    setAlmName(''); setAlmGen(''); setAlmYear(''); setAlmCompany(''); setAlmPosition(''); setAlmPhone(''); setAlmMentoring(false);
    setAlmAdd(false);
    refreshData();
  }

  /* ───── Generic delete for new modules ───── */
  function handleConfirmDel2() {
    if (!confirmDel2) return;
    const { type, id } = confirmDel2;
    let res = { success: false };
    if (type === 'schedule') res = deleteSchedule(id);
    else if (type === 'document') res = deleteDocument(id);
    else if (type === 'sponsor') res = deleteSponsor(id);
    else if (type === 'alumni') res = deleteAlumnus(id);
    if (res.success) { showToast('삭제되었습니다'); refreshData(); }
    setConfirmDel2(null);
  }


  /* ───── Expense ───── */
  function saveExp() {
    const res = addExpense({
      clubId: user ? user.clubId : '',
      type: finType,
      category: fCat,
      amount: fAmt,
      memo: fMemo,
      source: fSource,
      receiptFile: fReceipt,
      occurredAt: fDate || '',
    });
    if (!res.success) { showToast(res.error); return; }
    showToast(finType === 'income' ? '수입 등록 완료' : '지출 등록 완료');
    setFCat(''); setFAmt(''); setFMemo(''); setFSource(''); setFReceipt(''); setFDate(''); setFinType('expense'); setFinAdd(false);
    refreshData();
  }

  function changeMemberRole(memberId, newRole) {
    if (newRole === 'OB') {
      const member = membersList.find(m => m.id === memberId);
      if (member) {
        addAlumnus({
          clubId: user ? user.clubId : '',
          name: member.name,
          generation: member.generation || '',
          graduationYear: '',
          company: '',
          position: '',
          phone: member.phone || '',
          email: member.email || '',
          mentoring: false,
          fromMember: true,
        });
      }
    }
    updateMember(memberId, { role: newRole });
    refreshData();
    showToast('역할이 변경되었습니다');
  }

  function genPkg() {
    setPkgOpen(true);
    showToast('인수인계 패키지 생성 완료');
  }

  function downloadPkg() {
    const clubId = user ? user.clubId : null;
    const pkg = {
      exportedAt: new Date().toISOString(),
      clubName: activeClub ? activeClub.name : 'HELIOS',
      exportedBy: user ? user.name : '',
      members: getMembers(clubId),
      schedules: getSchedules(clubId),
      documents: getDocuments(clubId).map(d => ({ ...d, fileData: undefined })),
      sponsors: getSponsors(clubId),
      alumni: getAlumni(clubId),
      expenses: getExpenses(clubId).map(e => ({ ...e, receiptFile: undefined })),
    };
    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `인수인계_${pkg.clubName}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('인수인계 파일이 다운로드되었습니다');
  }

  /* ───── Password strength ───── */
  function getPwStrength(pw) {
    if (!pw) return { width: '0%', color: 'transparent', label: '' };
    if (pw.length < 6) return { width: '33%', color: 'var(--warn)', label: '약함' };
    if (pw.length < 10) return { width: '66%', color: 'var(--blue)', label: '보통' };
    return { width: '100%', color: 'var(--ok)', label: '강함' };
  }

  /* ───── Nav state ───── */
  const navMap = { home: 'home', input: 'input', report: 'report', my: 'my', drive: 'home', members: 'home', schedule: 'home', sponsors: 'home', alumni: 'home', 'my-activity': 'my', 'my-receipts': 'my', 'my-notify': 'my', 'my-privacy': 'my', 'my-alerts': 'home' };
  const activeNav = navMap[screen] || screen;
  const showNav = !['onboard', 'login', 'signup', 'club-select'].includes(screen);

  if (!mounted) return <div className="shell"><div className="area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div style={{ fontSize: 14, color: 'var(--muted)' }}>로딩중...</div></div></div>;

  return (
    <div className={`shell${showNav ? ' has-nav' : ''}`}>
      <div className="area" ref={areaRef}>

        {/* ════════ ONBOARDING ════════ */}
        <div className={`scr ${screen === 'onboard' ? 'on' : ''}`}>
          <div className="onb-center">
            <div className="logo-box"><i className="ti ti-rocket"></i></div>
            <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, letterSpacing: -1 }}>동무</div>
            <div className="stripe" style={{ width: 120, margin: '0 auto 12px' }}></div>
            <div style={{ fontSize: 14, fontWeight: 300, color: 'var(--body)', lineHeight: 1.6, marginBottom: 28, maxWidth: 260 }}>
              동아리 운영의 모든 것을<br/>하나의 앱으로 통합 관리
            </div>
            <div style={{ display: 'flex', gap: 32, marginBottom: 36 }}>
              {[['ti-users','부원'],['ti-receipt','회계']].map(([icon, label]) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <i className={`ti ${icon}`} style={{ fontSize: 22, color: 'var(--blue)' }}></i>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</span>
                </div>
              ))}
            </div>
            <button className="btn btn-fill" style={{ maxWidth: 300, marginBottom: 10 }} onClick={() => go('signup')}>
              회원가입
            </button>
            <button className="btn btn-ghost" style={{ maxWidth: 300 }} onClick={() => go('login')}>
              로그인
            </button>
          </div>
        </div>

        {/* ════════ SIGNUP ════════ */}
        <div className={`scr ${screen === 'signup' ? 'on' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0 }} onClick={() => { go('onboard'); resetSignupForm(); }}>
              <i className="ti ti-arrow-left" style={{ fontSize: 22 }}></i>
            </button>
            <h2 style={{ margin: 0 }}>회원가입</h2>
          </div>
          <div className="auth-sub">동아리를 시작하기 위해 기본 정보를 입력해주세요.</div>

          {authError && (
            <div className="auth-error-box">
              <i className="ti ti-alert-triangle"></i>
              <span>{authError}</span>
            </div>
          )}

          <div className="auth-form">
            {/* 개인정보 섹션 */}
            <div className="form-section">
              <div className="form-section-title">개인 정보</div>

              <div className="inp-g">
                <label className="inp-l">이름 *</label>
                <input
                  className={`inp ${signupTouched.name ? (validators.name(sName) ? 'valid' : 'invalid') : ''}`}
                  placeholder="홍길동"
                  value={sName}
                  onChange={e => setSName(e.target.value)}
                  onBlur={() => markTouched('name')}
                />
                {signupTouched.name && !validators.name(sName) && (
                  <div className="auth-err"><i className="ti ti-alert-circle"></i> 2자 이상 입력해주세요</div>
                )}
              </div>

              <div className="inp-g">
                <label className="inp-l">학교 *</label>
                <input
                  className={`inp ${signupTouched.school ? (sSchool.trim() ? 'valid' : 'invalid') : ''}`}
                  placeholder="한양대학교"
                  value={sSchool}
                  onChange={e => setSSchool(e.target.value)}
                  onBlur={() => markTouched('school')}
                />
              </div>

              <div className="inp-g">
                <label className="inp-l">학과 *</label>
                <input
                  className={`inp ${signupTouched.dept ? (sDept.trim() ? 'valid' : 'invalid') : ''}`}
                  placeholder="컴퓨터소프트웨어학부"
                  value={sDept}
                  onChange={e => setSDept(e.target.value)}
                  onBlur={() => markTouched('dept')}
                />
              </div>

              <div className="inp-g">
                <label className="inp-l">학번 *</label>
                <input
                  className={`inp ${signupTouched.studentId ? (validators.studentId(sStudentId) ? 'valid' : 'invalid') : ''}`}
                  placeholder="20XXXXXXXX"
                  value={sStudentId}
                  onChange={e => setSStudentId(formatStudentId(e.target.value))}
                  onBlur={() => markTouched('studentId')}
                />
                <div className="inp-hint">10자리 숫자 (예: 2024010001)</div>
                {signupTouched.studentId && !validators.studentId(sStudentId) && (
                  <div className="auth-err"><i className="ti ti-alert-circle"></i> 20으로 시작하는 10자리 숫자를 입력해주세요</div>
                )}
              </div>

              <div className="inp-g">
                <label className="inp-l">전화번호 *</label>
                <input
                  className={`inp ${signupTouched.phone ? (validators.phone(sPhone) ? 'valid' : 'invalid') : ''}`}
                  placeholder="010-0000-0000"
                  value={sPhone}
                  onChange={e => setSPhone(formatPhone(e.target.value))}
                  onBlur={() => markTouched('phone')}
                />
                {signupTouched.phone && !validators.phone(sPhone) && (
                  <div className="auth-err"><i className="ti ti-alert-circle"></i> 010-0000-0000 형식으로 입력해주세요</div>
                )}
              </div>
            </div>

            {/* 계정 정보 섹션 */}
            <div className="form-section">
              <div className="form-section-title">계정 정보</div>

              <div className="inp-g">
                <label className="inp-l">이메일 *</label>
                <input
                  className={`inp ${signupTouched.email ? (validators.email(sEmail) ? 'valid' : 'invalid') : ''}`}
                  placeholder="example@hanyang.ac.kr"
                  value={sEmail}
                  onChange={e => setSEmail(e.target.value)}
                  onBlur={() => markTouched('email')}
                  type="email"
                />
                {signupTouched.email && !validators.email(sEmail) && (
                  <div className="auth-err"><i className="ti ti-alert-circle"></i> 올바른 이메일 형식을 입력해주세요</div>
                )}
              </div>

              <div className="inp-g">
                <label className="inp-l">비밀번호 *</label>
                <input
                  className={`inp ${signupTouched.pw ? (validators.password(sPw) ? 'valid' : 'invalid') : ''}`}
                  type="password"
                  placeholder="최소 6자 이상"
                  value={sPw}
                  onChange={e => setSPw(e.target.value)}
                  onBlur={() => markTouched('pw')}
                />
                <div className="pw-strength">
                  <div className="pw-strength-bar" style={{ width: getPwStrength(sPw).width, background: getPwStrength(sPw).color }}></div>
                </div>
                {sPw && <div className="inp-hint">비밀번호 강도: {getPwStrength(sPw).label}</div>}
              </div>

              <div className="inp-g">
                <label className="inp-l">비밀번호 확인 *</label>
                <input
                  className={`inp ${signupTouched.pwConfirm ? (sPw === sPwConfirm && sPwConfirm ? 'valid' : 'invalid') : ''}`}
                  type="password"
                  placeholder="비밀번호를 다시 입력해주세요"
                  value={sPwConfirm}
                  onChange={e => setSPwConfirm(e.target.value)}
                  onBlur={() => markTouched('pwConfirm')}
                />
                {signupTouched.pwConfirm && sPw !== sPwConfirm && (
                  <div className="auth-err"><i className="ti ti-alert-circle"></i> 비밀번호가 일치하지 않습니다</div>
                )}
              </div>
            </div>

            <button className="btn btn-fill" onClick={handleSignup}>가입 완료</button>
            <div className="auth-link">
              이미 계정이 있으신가요? <span onClick={() => { go('login'); resetSignupForm(); }}>로그인</span>
            </div>
          </div>
        </div>

        {/* ════════ LOGIN ════════ */}
        <div className={`scr ${screen === 'login' ? 'on' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0 }} onClick={() => go('onboard')}>
              <i className="ti ti-arrow-left" style={{ fontSize: 22 }}></i>
            </button>
            <h2 style={{ margin: 0 }}>로그인</h2>
          </div>
          <div className="auth-sub">등록된 이메일과 비밀번호로 로그인해주세요.</div>

          {authError && (
            <div className="auth-error-box">
              <i className="ti ti-alert-triangle"></i>
              <span>{authError}</span>
            </div>
          )}

          <div className="auth-form">
            <div className="inp-g">
              <label className="inp-l">이메일</label>
              <input className="inp" placeholder="example@hanyang.ac.kr" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} type="email" />
            </div>
            <div className="inp-g">
              <label className="inp-l">비밀번호</label>
              <input className="inp" type="password" placeholder="비밀번호를 입력하세요" value={loginPw} onChange={e => setLoginPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
            <button className="btn btn-fill" onClick={handleLogin}>로그인</button>
            <div className="auth-link">
              계정이 없으신가요? <span onClick={() => { go('signup'); setAuthError(''); }}>회원가입</span>
            </div>
          </div>
        </div>

        {/* ════════ CLUB SELECT (CREATE / JOIN) ════════ */}
        <div className={`scr ${screen === 'club-select' ? 'on' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <button
              className="back-btn"
              onClick={() => {
                if (clubSelectMode !== 'choose') {
                  setClubSelectMode('choose');
                  setClubError('');
                } else {
                  handleLogout();
                }
              }}
            >
              <i className="ti ti-arrow-left" style={{ fontSize: 22 }}></i>
            </button>
            <h2 style={{ margin: 0 }}>
              {clubSelectMode === 'choose' && '동아리 연결'}
              {clubSelectMode === 'create' && '새로운 동아리 생성'}
              {clubSelectMode === 'join' && '기존 동아리 가입'}
            </h2>
          </div>
          
          <div className="auth-sub">
            {clubSelectMode === 'choose' && '동아리를 생성하거나 이미 생성된 동아리에 가입해 주세요.'}
            {clubSelectMode === 'create' && '새로 개설할 동아리의 정보와 설립일을 설정해 주세요.'}
            {clubSelectMode === 'join' && '가입하고자 하는 동아리의 이름을 검색해 주세요.'}
          </div>

          {clubError && (
            <div className="auth-error-box" style={{ marginBottom: 16 }}>
              <i className="ti ti-alert-triangle"></i>
              <span>{clubError}</span>
            </div>
          )}

          {/* CHOOSE MODE */}
          {clubSelectMode === 'choose' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
              <div 
                className="card" 
                style={{ cursor: 'pointer', transition: 'border-color 0.2s', borderColor: 'var(--hair)' }}
                onClick={() => { setClubSelectMode('create'); setClubError(''); }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--hair)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 44, height: 44, background: 'rgba(28,105,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, flexShrink: 0 }}>
                    <i className="ti ti-folder-plus" style={{ fontSize: 22, color: 'var(--blue)' }}></i>
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', textTransform: 'none', letterSpacing: 0, fontSize: 15, color: 'var(--ink)' }}>새로운 동아리 생성</h3>
                    <div className="cap">동아리 관리자 권한으로 새 동아리 페이지를 개설합니다.</div>
                  </div>
                </div>
              </div>

              <div 
                className="card" 
                style={{ cursor: 'pointer', transition: 'border-color 0.2s', borderColor: 'var(--hair)' }}
                onClick={() => { setClubSelectMode('join'); setClubError(''); }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--hair)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 44, height: 44, background: 'rgba(15,163,54,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, flexShrink: 0 }}>
                    <i className="ti ti-login" style={{ fontSize: 22, color: 'var(--ok)' }}></i>
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', textTransform: 'none', letterSpacing: 0, fontSize: 15, color: 'var(--ink)' }}>기존 동아리에 가입</h3>
                    <div className="cap">이미 생성되어 운영 중인 동아리를 검색하여 참여합니다.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CREATE MODE */}
          {clubSelectMode === 'create' && (
            <div className="auth-form">
              <div className="inp-g">
                <label className="inp-l">동아리 이름 *</label>
                <input 
                  className="inp" 
                  placeholder="예: HELIOS, 멋쟁이사자처럼" 
                  value={newClubName} 
                  onChange={e => setNewClubName(e.target.value)} 
                />
              </div>
              <div className="inp-g">
                <label className="inp-l">최초 시작한 날짜 (설립일) *</label>
                <input
                  type="date"
                  className="inp"
                  value={newClubDate}
                  onChange={e => setNewClubDate(e.target.value)}
                  onClick={e => e.target.showPicker && e.target.showPicker()}
                />
              </div>
              <button className="btn btn-fill" onClick={handleCreateClub} style={{ marginTop: 24 }}>
                동아리 생성 완료
              </button>
              <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => { setClubSelectMode('choose'); setClubError(''); }}>
                <i className="ti ti-arrow-left" style={{ fontSize: 16 }}></i> 돌아가기
              </button>
            </div>
          )}

          {/* JOIN MODE */}
          {clubSelectMode === 'join' && (
            <div>
              <div className="search-bar" style={{ marginBottom: 16 }}>
                <div className="search-wrap">
                  <i className="ti ti-search"></i>
                  <input 
                    className="inp" 
                    placeholder="동아리 이름 검색..." 
                    value={clubSearchQuery} 
                    onChange={e => setClubSearchQuery(e.target.value)} 
                  />
                </div>
              </div>

              <div className="card" style={{ padding: '8px 16px', maxHeight: 350, overflowY: 'auto' }}>
                {foundClubs.length === 0 ? (
                  <div className="empty-state" style={{ padding: '30px 10px' }}>
                    <i className="ti ti-folder-off" style={{ fontSize: 36, color: 'var(--hair)', marginBottom: 8, display: 'block', margin: '0 auto' }}></i>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginTop: 8 }}>
                      {clubSearchQuery.trim() ? '검색된 동아리가 없습니다.' : '생성된 동아리가 없습니다.'}
                    </div>
                    <div className="cap" style={{ marginTop: 4 }}>
                      직접 첫 동아리를 생성해 보시는 건 어떨까요?
                    </div>
                  </div>
                ) : (
                  foundClubs.map((club) => (
                    <div 
                      key={club.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        padding: '14px 0', 
                        borderBottom: '1px solid var(--hair)' 
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{club.name}</div>
                        <div className="cap" style={{ marginTop: 2 }}>설립일: {club.startDate}</div>
                      </div>
                      <button 
                        className="btn btn-fill btn-sm" 
                        style={{ height: 32, fontSize: 11, background: 'var(--ok)', borderColor: 'var(--ok)' }} 
                        onClick={() => handleJoinClub(club.id)}
                      >
                        가입하기
                      </button>
                    </div>
                  ))
                )}
              </div>
              <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => { setClubSelectMode('choose'); setClubError(''); setClubSearchQuery(''); }}>
                <i className="ti ti-arrow-left" style={{ fontSize: 16 }}></i> 돌아가기
              </button>
            </div>
          )}
        </div>

        {/* ════════ HOME ════════ */}
        <div className={`scr ${screen === 'home' ? 'on' : ''}`}>
          <div className="up" style={{ marginBottom: 4 }}>
            {activeClub ? `설립일: ${activeClub.startDate}` : '한양대학교 로켓연구회'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <h1>{activeClub ? activeClub.name : 'HELIOS'}</h1>

            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => { go('my-alerts'); }}>
              <i className="ti ti-bell" style={{ fontSize: 24, color: 'var(--muted)' }}></i>
              {alertList.filter(a => !readAlertIds.includes(a.id)).length > 0 && <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, background: 'var(--warn)', border: '2px solid var(--canvas)' }}></span>}
            </div>
          </div>
          <div className="stripe"></div>

          <div className="home-layout">
            <div>
              <div className="grid2" style={{ marginBottom: 12 }}>
                <div className="metric" onClick={() => go('members')}>
                  <span className="up">총 부원</span>
                  <div className="val">{memC}<span style={{ fontSize: 13, fontWeight: 300, color: 'var(--muted)' }}>명</span></div>
                </div>
                <div className="metric" onClick={() => go('expenses')}>
                  <span className="up">잔액</span>
                  <div className="val" style={{ color: expBalance >= 0 ? 'var(--ok)' : 'var(--warn)' }}>{expBalance >= 0 ? '+' : ''}{formatExpAmount(expBalance)}<span style={{ fontSize: 13, fontWeight: 300 }}>원</span></div>
                </div>
                <div className="metric" onClick={() => go('expenses')}>
                  <span className="up">총 지출</span>
                  <div className="val" style={{ color: 'var(--warn)' }}>{formatExpAmount(expTotal)}<span style={{ fontSize: 13, fontWeight: 300, color: 'var(--muted)' }}>원</span></div>
                </div>
                <div className="metric" onClick={() => go('expenses')}>
                  <span className="up">총 수입</span>
                  <div className="val" style={{ color: 'var(--ok)' }}>{formatExpAmount(expIncome)}<span style={{ fontSize: 13, fontWeight: 300 }}>원</span></div>
                </div>
              </div>

              <h3 style={{ marginTop: 8 }}>운영 관리</h3>
              <div className="hub-grid" style={{ marginBottom: 12 }}>
                {[
                  { id: 'members', icon: 'ti-users', label: '부원 관리', color: 'var(--blue)' },
                  { id: 'schedule', icon: 'ti-calendar', label: '일정 관리', color: 'var(--ok)' },
                  { id: 'drive', icon: 'ti-folder', label: '자료 관리', color: 'var(--gdrive)' },
                  { id: 'sponsors', icon: 'ti-heart-handshake', label: '후원자 관리', color: 'var(--warn)' },
                  { id: 'alumni', icon: 'ti-school', label: '졸업 선배', color: 'var(--google)' },
                  { id: 'expenses', icon: 'ti-wallet', label: '재무 관리', color: 'var(--blue-l)' },
                ].map(m => (
                  <div className="hub-card" key={m.id} onClick={() => go(m.id)}>
                    <i className={`ti ${m.icon}`} style={{ color: m.color }}></i>
                    <span>{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="card" style={{ marginTop: 0 }}>
                <h3 style={{ margin: '0 0 12px' }}>빠른 요약</h3>
                <div className="sch-i"><div className="sch-dot" style={{ background: 'var(--blue)' }}></div><div className="sch-t">등록 부원</div><div className="sch-d" style={{ fontWeight: 700, color: 'var(--ink)' }}>{memC}명</div></div>
                <div className="sch-i"><div className="sch-dot" style={{ background: 'var(--ok)' }}></div><div className="sch-t">등록 일정</div><div className="sch-d" style={{ fontWeight: 700, color: 'var(--ink)' }}>{schC}건</div></div>
                <div className="sch-i"><div className="sch-dot" style={{ background: 'var(--gdrive)' }}></div><div className="sch-t">보관 자료</div><div className="sch-d" style={{ fontWeight: 700, color: 'var(--ink)' }}>{docC}건</div></div>
                <div className="sch-i"><div className="sch-dot" style={{ background: 'var(--warn)' }}></div><div className="sch-t">후원 내역</div><div className="sch-d" style={{ fontWeight: 700, color: 'var(--ink)' }}>{sponsorList.length}건</div></div>
              </div>
            </div>
          </div>

          {/* ── 다가오는 일정 + 달력 ── */}
          <div className="home-calendar-section">
            <div className="home-cal-left">
              <div className="card" style={{ marginTop: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0 }}>다가오는 일정</h3>
                  <span className="cap" style={{ cursor: 'pointer', color: 'var(--blue)' }} onClick={() => go('schedule')}>전체보기</span>
                </div>
                {(() => {
                  const now = new Date();
                  const upcoming = scheduleList.filter(s => new Date(s.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
                  if (upcoming.length === 0) {
                    return (
                      <div className="cap" style={{ padding: '12px 0' }}>
                        등록된 일정이 없습니다. <span style={{ color: 'var(--blue)', cursor: 'pointer' }} onClick={() => go('schedule')}>일정 추가하기</span>
                      </div>
                    );
                  }
                  return upcoming.map(s => {
                    const diff = Math.ceil((new Date(s.date) - now) / (1000 * 60 * 60 * 24));
                    return (
                      <div className="sch-i" key={s.id}>
                        <div className="sch-dot" style={{ background: s.color }}></div>
                        <div className="sch-t">{s.title}</div>
                        <div className="sch-d" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {formatScheduleDate(s.date)}
                          {diff <= 3 && <span className="badge badge-warn" style={{ fontSize: 10, padding: '1px 5px' }}>D-{diff}</span>}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
            <div className="home-cal-right">
              <div className="card" style={{ marginTop: 0 }}>
                {(() => {
                  const today = new Date();
                  const calMonth = today.getMonth();
                  const calYear = today.getFullYear();
                  const firstDay = new Date(calYear, calMonth, 1).getDay();
                  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
                  const weeks = [];
                  let day = 1 - firstDay;
                  for (let w = 0; w < 6 && day <= daysInMonth; w++) {
                    const row = [];
                    for (let d = 0; d < 7; d++, day++) {
                      row.push(day);
                    }
                    weeks.push(row);
                  }
                  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
                  const scheduleDates = new Set(scheduleList.map(s => {
                    const d = new Date(s.date);
                    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                  }));
                  return (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <h3 style={{ margin: 0 }}>{calYear}년 {monthNames[calMonth]}</h3>
                      </div>
                      <table className="mini-cal">
                        <thead>
                          <tr>{['일','월','화','수','목','금','토'].map(d => <th key={d}>{d}</th>)}</tr>
                        </thead>
                        <tbody>
                          {weeks.map((row, wi) => (
                            <tr key={wi}>
                              {row.map((dd, di) => {
                                const isToday = dd === today.getDate();
                                const inMonth = dd >= 1 && dd <= daysInMonth;
                                const hasEvent = inMonth && scheduleDates.has(`${calYear}-${calMonth}-${dd}`);
                                return (
                                  <td key={di} className={`${!inMonth ? 'out' : ''} ${isToday ? 'today' : ''} ${di === 0 ? 'sun' : ''}`}>
                                    {inMonth ? dd : ''}
                                    {hasEvent && <span className="cal-dot"></span>}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* ════════ MEMBERS LIST ════════ */}
        <div className={`scr ${screen === 'members' ? 'on' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0 }} onClick={() => go('home')}>
              <i className="ti ti-arrow-left" style={{ fontSize: 22 }}></i>
            </button>
            <h2 style={{ margin: 0 }}>부원 목록</h2>
          </div>
          <div className="stripe"></div>

          <div className="search-bar">
            <div className="search-wrap">
              <i className="ti ti-search"></i>
              <input
                className="inp"
                placeholder="이름, 학번, 학과로 검색..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="btn btn-fill btn-sm" onClick={() => { go('input'); setTab('mem'); }}>
              <i className="ti ti-plus" style={{ fontSize: 14 }}></i>
            </button>
          </div>

          <div className="member-count-bar">
            <div className="member-count">전체 <strong>{membersList.length}</strong>명</div>
            {searchQuery && <div className="cap">검색 결과</div>}
          </div>

          <div className="card" style={{ padding: '4px 16px' }}>
            {membersList.length === 0 ? (
              <div className="empty-state">
                <i className="ti ti-users-minus"></i>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                  {searchQuery ? '검색 결과가 없습니다' : '등록된 부원이 없습니다'}
                </div>
                <div className="cap">
                  {searchQuery ? '다른 검색어로 시도해보세요' : '기록 관리에서 부원을 등록해주세요'}
                </div>
              </div>
            ) : (
              membersList.map(m => (
                <div key={m.id}>
                  <div className="member-card" onClick={() => setExpandedMember(expandedMember === m.id ? null : m.id)} style={{ cursor: 'pointer' }}>
                    <div className="member-avatar">{m.name.charAt(0)}</div>
                    <div className="member-info">
                      <div className="member-name">{m.name} {m.role && <span className="badge badge-blue" style={{ height: 18, fontSize: 9, padding: '0 6px', verticalAlign: 1 }}>{m.role}</span>}</div>
                      <div className="member-detail">{m.department}{m.studentId ? ` · ${m.studentId}` : ''}</div>
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: 16, transition: 'transform .2s', transform: expandedMember === m.id ? 'rotate(180deg)' : 'rotate(0)' }}>
                      <i className="ti ti-chevron-down"></i>
                    </div>
                  </div>
                  {expandedMember === m.id && (
                    <div style={{ padding: '8px 16px 12px', marginTop: -4, marginBottom: 8, background: 'var(--card)', borderRadius: '0 0 12px 12px', border: '1px solid var(--hair)', borderTop: 'none' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13 }}>
                        {m.name && <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>이름</span><div style={{ fontWeight: 600 }}>{m.name}</div></div>}
                        {m.studentId && <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>학번</span><div>{m.studentId}</div></div>}
                        {m.department && <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>학과</span><div>{m.department}</div></div>}
                        {m.phone && <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>전화번호</span><div>{m.phone}</div></div>}
                        {m.email && <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>이메일</span><div>{m.email}</div></div>}
                        {m.generation && <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>기수</span><div>{m.generation}</div></div>}
                        {m.team && <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>팀</span><div>{m.team}</div></div>}
                        <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>역할</span><div>{m.role || '부원'}</div></div>
                      </div>
                      {isManager && (
                        <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--bg)', borderRadius: 8 }}>
                          <span style={{ color: 'var(--muted)', fontSize: 11, display: 'block', marginBottom: 4 }}>역할 변경</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {MEMBER_ROLES.map(r => (
                              <button key={r} onClick={(e) => { e.stopPropagation(); changeMemberRole(m.id, r); }}
                                style={{ padding: '4px 10px', fontSize: 12, borderRadius: 6, border: '1px solid var(--hair)', background: m.role === r ? 'var(--blue)' : 'var(--card)', color: m.role === r ? '#fff' : 'var(--body)', cursor: 'pointer' }}>
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(m); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 14px', fontSize: 12, color: 'var(--warn)', background: 'none', border: '1px solid var(--warn)', borderRadius: 8, cursor: 'pointer' }}>
                          <i className="ti ti-trash"></i>삭제
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ════════ SCHEDULE (일정 관리) ════════ */}
        <div className={`scr ${screen === 'schedule' ? 'on' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0 }} onClick={() => go('home')}>
              <i className="ti ti-arrow-left" style={{ fontSize: 22 }}></i>
            </button>
            <h2 style={{ margin: 0 }}>일정 관리</h2>
          </div>
          <div className="stripe"></div>

          {/* 뷰 전환 + 추가 */}
          <div className="member-count-bar">
            <div style={{ display: 'flex', gap: 4 }}>
              <button className={`btn btn-sm ${schView === 'calendar' ? 'btn-fill' : 'btn-ghost'}`} onClick={() => setSchView('calendar')} style={{ padding: '6px 10px' }}>
                <i className="ti ti-calendar" style={{ fontSize: 14 }}></i> 달력
              </button>
              <button className={`btn btn-sm ${schView === 'list' ? 'btn-fill' : 'btn-ghost'}`} onClick={() => setSchView('list')} style={{ padding: '6px 10px' }}>
                <i className="ti ti-list" style={{ fontSize: 14 }}></i> 목록
              </button>
            </div>
            <button className="btn btn-fill btn-sm" onClick={() => setSchAdd(v => !v)}>
              <i className={`ti ${schAdd ? 'ti-x' : 'ti-plus'}`} style={{ fontSize: 14 }}></i> {schAdd ? '닫기' : '추가'}
            </button>
          </div>

          {schAdd && (
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="inp-g"><label className="inp-l">일정 제목 *</label><input className="inp" placeholder="예: 정기회의, 로켓 발사 테스트" value={schTitle} onChange={e => setSchTitle(e.target.value)} /></div>
              <div className="inp-g">
                <label className="inp-l">날짜{schHasTime ? ' / 시간' : ''} *</label>
                <input type={schHasTime ? 'datetime-local' : 'date'} className="inp" value={schDate} onChange={e => setSchDate(e.target.value)} onClick={e => e.target.showPicker && e.target.showPicker()} />
                <div className="check-row" onClick={() => { setSchHasTime(v => { if (v && schDate) setSchDate(schDate.split('T')[0]); return !v; }); }} style={{ marginTop: 6 }}>
                  <div className={`check ${!schHasTime ? 'on' : ''}`}>{!schHasTime && <i className="ti ti-check"></i>}</div>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>시간 지정 없이 날짜만 등록</span>
                </div>
              </div>
              <div className="inp-g"><label className="inp-l">분류</label><select className="inp" value={schCat} onChange={e => setSchCat(e.target.value)}>{SCHEDULE_CATEGORIES.map(c => <option key={c.key}>{c.key}</option>)}</select></div>
              <div className="inp-g"><label className="inp-l">장소</label><input className="inp" placeholder="예: 공학관 401호" value={schLoc} onChange={e => setSchLoc(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">메모</label><textarea className="inp" placeholder="일정에 대한 메모를 입력하세요" value={schMemo} onChange={e => setSchMemo(e.target.value)} rows={3} style={{ resize: 'vertical' }} /></div>
              <button className="btn btn-fill" onClick={saveSchedule}>일정 저장</button>
            </div>
          )}

          {/* ── 달력 뷰 ── */}
          {schView === 'calendar' && (() => {
            const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
            const firstDay = new Date(calYear, calMonth, 1).getDay();
            const today = new Date();
            const isToday = (d) => today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === d;
            const eventsOnDay = (d) => scheduleList.filter(s => {
              const sd = new Date(s.date);
              return sd.getFullYear() === calYear && sd.getMonth() === calMonth && sd.getDate() === d;
            });
            const days = [];
            for (let i = 0; i < firstDay; i++) days.push(null);
            for (let d = 1; d <= daysInMonth; d++) days.push(d);
            const selectedEvents = calSelected ? eventsOnDay(calSelected) : [];

            return (
              <div>
                <div className="card" style={{ padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }} onClick={() => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); setCalSelected(null); }}>
                      <i className="ti ti-chevron-left"></i>
                    </button>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{calYear}년 {calMonth + 1}월</div>
                    <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }} onClick={() => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); setCalSelected(null); }}>
                      <i className="ti ti-chevron-right"></i>
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', gap: 2 }}>
                    {['일','월','화','수','목','금','토'].map(d => (
                      <div key={d} style={{ fontSize: 11, fontWeight: 700, color: d === '일' ? 'var(--warn)' : d === '토' ? 'var(--blue)' : 'var(--muted)', padding: '4px 0' }}>{d}</div>
                    ))}
                    {days.map((d, i) => {
                      if (!d) return <div key={`e${i}`}></div>;
                      const evts = eventsOnDay(d);
                      const dayOfWeek = new Date(calYear, calMonth, d).getDay();
                      return (
                        <div key={d} onClick={() => setCalSelected(calSelected === d ? null : d)}
                          style={{
                            padding: '12px 0', minHeight: 52, borderRadius: 8, cursor: 'pointer', position: 'relative',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            background: calSelected === d ? 'var(--blue)' : isToday(d) ? 'rgba(28,105,212,0.12)' : 'transparent',
                            color: calSelected === d ? '#fff' : dayOfWeek === 0 ? 'var(--warn)' : dayOfWeek === 6 ? 'var(--blue)' : 'var(--ink)',
                            fontWeight: isToday(d) ? 700 : 400, fontSize: 13,
                          }}>
                          {d}
                          {evts.length > 0 && <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 2 }}>
                            {evts.slice(0, 3).map((e, j) => <div key={j} style={{ width: 4, height: 4, borderRadius: 2, background: calSelected === d ? '#fff' : (e.color || 'var(--blue)') }}></div>)}
                          </div>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 선택된 날짜의 일정 */}
                {calSelected && (
                  <div className="card" style={{ padding: '8px 16px', marginTop: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--muted)' }}>{calMonth + 1}월 {calSelected}일 일정</div>
                    {selectedEvents.length === 0 ? (
                      <div className="cap" style={{ padding: '8px 0' }}>등록된 일정이 없습니다.</div>
                    ) : selectedEvents.map(s => (
                      <div key={s.id}>
                        <div className="member-card" onClick={() => setExpandedCalSch(expandedCalSch === s.id ? null : s.id)} style={{ cursor: 'pointer' }}>
                          <div className="member-avatar" style={{ background: s.color, fontSize: 18 }}><i className="ti ti-calendar-event"></i></div>
                          <div className="member-info">
                            <div className="member-name">{s.title}</div>
                            <div className="member-detail">{formatScheduleDate(s.date)} · {s.category}</div>
                          </div>
                          <div style={{ color: 'var(--muted)', fontSize: 16, transition: 'transform .2s', transform: expandedCalSch === s.id ? 'rotate(180deg)' : 'rotate(0)' }}>
                            <i className="ti ti-chevron-down"></i>
                          </div>
                        </div>
                        {expandedCalSch === s.id && (
                          <div style={{ padding: '8px 16px 12px', marginTop: -4, marginBottom: 8, background: 'var(--card)', borderRadius: '0 0 12px 12px', border: '1px solid var(--hair)', borderTop: 'none' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13 }}>
                              <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>카테고리</span><div style={{ fontWeight: 600 }}>{s.category}</div></div>
                              <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>일시</span><div>{s.allDay ? new Date(s.date).toLocaleDateString('ko-KR') + ' (종일)' : formatScheduleDate(s.date)}</div></div>
                              {s.location && <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>장소</span><div>{s.location}</div></div>}
                              {s.memo && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--muted)', fontSize: 11 }}>메모</span><div>{s.memo}</div></div>}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                              <button onClick={(ev) => { ev.stopPropagation(); setConfirmDel2({ type: 'schedule', id: s.id, name: s.title }); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 14px', fontSize: 12, color: 'var(--warn)', background: 'none', border: '1px solid var(--warn)', borderRadius: 8, cursor: 'pointer' }}>
                                <i className="ti ti-trash"></i>삭제
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 다가오는 일정 리마인더 */}
                {(() => {
                  const now = new Date();
                  const upcoming = scheduleList.filter(s => {
                    const diff = new Date(s.date) - now;
                    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
                  }).sort((a, b) => new Date(a.date) - new Date(b.date));
                  if (upcoming.length === 0) return null;
                  return (
                    <div className="card" style={{ padding: '8px 16px', marginTop: 8, borderLeft: '3px solid var(--warn)' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="ti ti-bell-ringing" style={{ color: 'var(--warn)', fontSize: 16 }}></i> 7일 이내 일정
                      </div>
                      {upcoming.map(s => {
                        const diff = Math.ceil((new Date(s.date) - now) / (1000 * 60 * 60 * 24));
                        return (
                          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--hair)' }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>{s.title}</div>
                              <div className="cap">{formatScheduleDate(s.date)}{s.location ? ` · ${s.location}` : ''}</div>
                            </div>
                            <span className="badge badge-warn" style={{ flexShrink: 0 }}>D-{diff}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          {/* ── 목록 뷰 ── */}
          {schView === 'list' && (
            <div className="card" style={{ padding: '4px 16px' }}>
              {scheduleList.length === 0 ? (
                <div className="empty-state">
                  <i className="ti ti-calendar-off"></i>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>등록된 일정이 없습니다</div>
                  <div className="cap">위 &quot;추가&quot;로 첫 일정을 등록해보세요</div>
                </div>
              ) : (
                scheduleList.map(s => {
                  const past = new Date(s.date) < new Date();
                  return (
                    <div key={s.id}>
                      <div className="member-card" onClick={() => setExpandedSchedule(expandedSchedule === s.id ? null : s.id)} style={{ cursor: 'pointer', opacity: past ? 0.5 : 1 }}>
                        <div className="member-avatar" style={{ background: s.color, fontSize: 18 }}><i className="ti ti-calendar-event"></i></div>
                        <div className="member-info">
                          <div className="member-name">{s.title} {past && <span className="cap">· 종료</span>}</div>
                          <div className="member-detail">{s.allDay ? formatScheduleDate(s.date).split(' ')[0] : formatScheduleDate(s.date)} · {s.category}</div>
                        </div>
                        <div style={{ color: 'var(--muted)', fontSize: 16, transition: 'transform .2s', transform: expandedSchedule === s.id ? 'rotate(180deg)' : 'rotate(0)' }}>
                          <i className="ti ti-chevron-down"></i>
                        </div>
                      </div>
                      {expandedSchedule === s.id && (
                        <div style={{ padding: '8px 16px 12px', marginTop: -4, marginBottom: 8, background: 'var(--card)', borderRadius: '0 0 12px 12px', border: '1px solid var(--hair)', borderTop: 'none', opacity: past ? 0.5 : 1 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13 }}>
                            <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>일정</span><div style={{ fontWeight: 600 }}>{s.title}</div></div>
                            <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>분류</span><div>{s.category}</div></div>
                            <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>날짜</span><div>{s.allDay ? formatScheduleDate(s.date).split(' ')[0] : formatScheduleDate(s.date)}</div></div>
                            {s.location && <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>장소</span><div>{s.location}</div></div>}
                          </div>
                          {s.memo && (
                            <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--bg)', borderRadius: 8, fontSize: 13 }}>
                              <span style={{ color: 'var(--muted)', fontSize: 11, display: 'block', marginBottom: 2 }}>메모</span>
                              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{s.memo}</div>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                            <button onClick={(e) => { e.stopPropagation(); setConfirmDel2({ type: 'schedule', id: s.id, name: s.title }); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 14px', fontSize: 12, color: 'var(--warn)', background: 'none', border: '1px solid var(--warn)', borderRadius: 8, cursor: 'pointer' }}>
                              <i className="ti ti-trash"></i>삭제
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* ════════ DRIVE (자료 관리) ════════ */}
        <div className={`scr ${screen === 'drive' ? 'on' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0 }} onClick={() => go('home')}>
              <i className="ti ti-arrow-left" style={{ fontSize: 22 }}></i>
            </button>
            <h2 style={{ margin: 0 }}>자료 관리</h2>
          </div>
          <div className="stripe"></div>

          {/* 업로드 / 검색 탭 전환 */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            <button className={`btn btn-sm ${docMode === 'upload' ? 'btn-fill' : 'btn-ghost'}`} onClick={() => setDocMode('upload')} style={{ padding: '6px 14px' }}>
              <i className="ti ti-upload" style={{ fontSize: 14 }}></i> 자료 올리기
            </button>
            <button className={`btn btn-sm ${docMode === 'search' ? 'btn-fill' : 'btn-ghost'}`} onClick={() => setDocMode('search')} style={{ padding: '6px 14px' }}>
              <i className="ti ti-search" style={{ fontSize: 14 }}></i> 자료 찾기
            </button>
          </div>

          {/* ── 자료 올리기 ── */}
          {docMode === 'upload' && (
            <>
              <div className="card" style={{ marginBottom: 12 }}>
                <div className="inp-g" style={{ marginBottom: 8 }}>
                  <label className="inp-l">폴더 선택</label>
                  <select className="inp" value={docCat} onChange={e => setDocCat(e.target.value)}>
                    {DOC_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.key}</option>)}
                  </select>
                </div>
                <div className="inp-g" style={{ marginBottom: 8 }}>
                  <label className="inp-l">파일 업로드 (10MB 이하)</label>
                  <input type="file" className="inp" style={{ padding: '10px 16px', height: 'auto' }} onChange={e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > 10 * 1024 * 1024) { showToast('10MB 이하 파일만 업로드 가능합니다'); e.target.value = ''; return; }
                    setDocFileName(file.name);
                    if (!docName) setDocName(file.name);
                    const reader = new FileReader();
                    reader.onload = () => setDocFile(reader.result);
                    reader.readAsDataURL(file);
                  }} />
                  {docFile && <div className="cap" style={{ marginTop: 4, color: 'var(--ok)' }}><i className="ti ti-check" style={{ fontSize: 12 }}></i> {docFileName}</div>}
                </div>
                <div className="inp-g" style={{ marginBottom: 8 }}>
                  <label className="inp-l">자료명 (선택)</label>
                  <input className="inp" placeholder="미입력 시 파일명 사용" value={docName} onChange={e => setDocName(e.target.value)} />
                </div>
                <button className="btn btn-fill btn-sm" style={{ width: '100%' }} onClick={saveDocument}>
                  <i className="ti ti-upload" style={{ fontSize: 16 }}></i> 자료 등록
                </button>
              </div>

              <h3>폴더</h3>
              <div className={`folder-chip folder-chip-full ${docFilter === '전체' ? 'on' : ''}`} onClick={() => setDocFilter('전체')}>
                <i className="ti ti-folders"></i><span>전체</span><strong>{docC}</strong>
              </div>
              <div className="folder-grid" style={{ marginTop: 8 }}>
                {docStats.map(cat => (
                  <div className={`folder-chip ${docFilter === cat.key ? 'on' : ''}`} key={cat.key} onClick={() => setDocFilter(cat.key)}>
                    <i className={`ti ${cat.icon}`} style={{ color: cat.color }}></i><span>{cat.key}</span><strong>{cat.count}</strong>
                  </div>
                ))}
              </div>

              <div className="card" style={{ padding: '4px 16px', marginTop: 12 }}>
                {(() => {
                  const filtered = docFilter === '전체' ? docList : docList.filter(d => d.category === docFilter);
                  if (filtered.length === 0) {
                    return (
                      <div className="empty-state">
                        <i className="ti ti-folder-off"></i>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>자료가 없습니다</div>
                        <div className="cap">파일을 업로드해 자료를 등록해보세요</div>
                      </div>
                    );
                  }
                  return filtered.map(d => {
                    const meta = categoryMeta(d.category);
                    return (
                      <div className="file-i" key={d.id}>
                        <div className="file-icon"><i className={`ti ${meta.icon}`} style={{ color: meta.color }}></i></div>
                        <div className="file-info">
                          <div className="file-name">{d.name}</div>
                          <div className="file-meta">{d.category} · {d.size}{d.uploadedBy ? ` · ${d.uploadedBy}` : ''} · {d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString('ko-KR') : ''}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {d.fileData && (
                            <a href={d.fileData} download={d.fileName || d.name} style={{ color: 'var(--blue)', fontSize: 18, padding: 4, display: 'flex' }} title="다운로드">
                              <i className="ti ti-download"></i>
                            </a>
                          )}
                          <button className="member-del" onClick={() => setConfirmDel2({ type: 'document', id: d.id, name: d.name })}><i className="ti ti-trash"></i></button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </>
          )}

          {/* ── 자료 찾기 ── */}
          {docMode === 'search' && (
            <>
              <div className="search-bar" style={{ marginBottom: 8 }}>
                <div className="search-wrap">
                  <i className="ti ti-search"></i>
                  <input className="inp" placeholder="자료명 또는 작성자로 검색..." value={docSearchQuery} onChange={e => setDocSearchQuery(e.target.value)} />
                </div>
              </div>
              <div className="card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div className="inp-g" style={{ marginBottom: 0 }}>
                    <label className="inp-l">폴더</label>
                    <select className="inp" value={docSearchFolder} onChange={e => setDocSearchFolder(e.target.value)}>
                      <option value="전체">전체</option>
                      {DOC_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.key}</option>)}
                    </select>
                  </div>
                  <div className="inp-g" style={{ marginBottom: 0 }}>
                    <label className="inp-l">업로드 날짜</label>
                    <input type="date" className="inp" value={docSearchDate} onChange={e => setDocSearchDate(e.target.value)} onClick={e => e.target.showPicker && e.target.showPicker()} />
                  </div>
                </div>
                {(docSearchQuery || docSearchFolder !== '전체' || docSearchDate) && (
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, fontSize: 12 }} onClick={() => { setDocSearchQuery(''); setDocSearchFolder('전체'); setDocSearchDate(''); }}>
                    <i className="ti ti-x" style={{ fontSize: 12 }}></i> 검색 초기화
                  </button>
                )}
              </div>

              <div className="card" style={{ padding: '4px 16px' }}>
                {(() => {
                  let results = [...docList];
                  if (docSearchFolder !== '전체') results = results.filter(d => d.category === docSearchFolder);
                  if (docSearchDate) results = results.filter(d => d.uploadedAt && d.uploadedAt.startsWith(docSearchDate));
                  if (docSearchQuery.trim()) {
                    const q = docSearchQuery.trim().toLowerCase();
                    results = results.filter(d => (d.name && d.name.toLowerCase().includes(q)) || (d.uploadedBy && d.uploadedBy.toLowerCase().includes(q)) || (d.fileName && d.fileName.toLowerCase().includes(q)));
                  }
                  if (results.length === 0) {
                    return (
                      <div className="empty-state">
                        <i className="ti ti-search-off"></i>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>검색 결과가 없습니다</div>
                        <div className="cap">다른 조건으로 검색해보세요</div>
                      </div>
                    );
                  }
                  return results.map(d => {
                    const meta = categoryMeta(d.category);
                    return (
                      <div className="file-i" key={d.id}>
                        <div className="file-icon"><i className={`ti ${meta.icon}`} style={{ color: meta.color }}></i></div>
                        <div className="file-info">
                          <div className="file-name">{d.name}</div>
                          <div className="file-meta">{d.category} · {d.size}{d.uploadedBy ? ` · ${d.uploadedBy}` : ''} · {d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString('ko-KR') : ''}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {d.fileData && (
                            <a href={d.fileData} download={d.fileName || d.name} style={{ color: 'var(--blue)', fontSize: 18, padding: 4, display: 'flex' }} title="다운로드">
                              <i className="ti ti-download"></i>
                            </a>
                          )}
                          <button className="member-del" onClick={() => setConfirmDel2({ type: 'document', id: d.id, name: d.name })}><i className="ti ti-trash"></i></button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </>
          )}
        </div>

        {/* ════════ SPONSORS (후원자 관리) ════════ */}
        <div className={`scr ${screen === 'sponsors' ? 'on' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0 }} onClick={() => go('home')}>
              <i className="ti ti-arrow-left" style={{ fontSize: 22 }}></i>
            </button>
            <h2 style={{ margin: 0 }}>후원자 관리</h2>
          </div>
          <div className="stripe"></div>

          <div className="grid2" style={{ marginBottom: 12 }}>
            <div className="metric"><span className="up">누적 후원금</span><div className="val" style={{ color: 'var(--ok)' }}>₩{formatAmount(sponsorTotal)}</div></div>
            <div className="metric"><span className="up">후원처</span><div className="val">{sponsorList.length}<span style={{ fontSize: 13, fontWeight: 300, color: 'var(--muted)' }}>곳</span></div></div>
          </div>

          <div className="search-bar">
            <div className="search-wrap">
              <i className="ti ti-search"></i>
              <input className="inp" placeholder="기관명, 유형, 담당자로 검색..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <button className="btn btn-fill btn-sm" onClick={() => setSpnAdd(v => !v)}>
              <i className={`ti ${spnAdd ? 'ti-x' : 'ti-plus'}`} style={{ fontSize: 14 }}></i>
            </button>
          </div>

          {spnAdd && (
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="inp-g"><label className="inp-l">기관 / 후원자명 *</label><input className="inp" placeholder="예: (주)한화에어로스페이스" value={spnName} onChange={e => setSpnName(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">유형</label><select className="inp" value={spnType} onChange={e => setSpnType(e.target.value)}>{SPONSOR_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              <div className="inp-g"><label className="inp-l">후원 금액</label><input className="inp" placeholder="₩ 0" value={spnAmt} onChange={e => setSpnAmt(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">담당자</label><input className="inp" placeholder="담당자명" value={spnManager} onChange={e => setSpnManager(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">연락처</label><input className="inp" placeholder="010-0000-0000" value={spnContact} onChange={e => setSpnContact(formatPhone(e.target.value))} /></div>
              <div className="inp-g"><label className="inp-l">상태</label><select className="inp" value={spnStatus} onChange={e => setSpnStatus(e.target.value)}><option>완료</option><option>예정</option></select></div>
              <button className="btn btn-fill" onClick={saveSponsor}>후원 내역 저장</button>
            </div>
          )}

          <div className="card" style={{ padding: '4px 16px' }}>
            {sponsorList.length === 0 ? (
              <div className="empty-state">
                <i className="ti ti-heart-handshake"></i>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{searchQuery ? '검색 결과가 없습니다' : '등록된 후원자가 없습니다'}</div>
                <div className="cap">후원 기업·동문·기관을 기록해 관리하세요</div>
              </div>
            ) : (
              sponsorList.map(s => (
                <div key={s.id}>
                  <div className="member-card" onClick={() => setExpandedSponsor(expandedSponsor === s.id ? null : s.id)} style={{ cursor: 'pointer' }}>
                    <div className="member-avatar" style={{ background: s.status === '예정' ? 'var(--warn)' : 'var(--ok)' }}>{s.name.charAt(0)}</div>
                    <div className="member-info">
                      <div className="member-name">{s.name} <span className="badge badge-blue" style={{ height: 18, fontSize: 9, padding: '0 6px', verticalAlign: 1 }}>{s.type}</span></div>
                      <div className="member-detail">₩{formatAmount(s.amount)} · {s.status}</div>
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: 16, transition: 'transform .2s', transform: expandedSponsor === s.id ? 'rotate(180deg)' : 'rotate(0)' }}>
                      <i className="ti ti-chevron-down"></i>
                    </div>
                  </div>
                  {expandedSponsor === s.id && (
                    <div style={{ padding: '8px 16px 12px', marginTop: -4, marginBottom: 8, background: 'var(--card)', borderRadius: '0 0 12px 12px', border: '1px solid var(--hair)', borderTop: 'none' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13 }}>
                        <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>기관/후원자명</span><div style={{ fontWeight: 600 }}>{s.name}</div></div>
                        <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>유형</span><div>{s.type}</div></div>
                        <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>후원 금액</span><div>₩{formatAmount(s.amount)}</div></div>
                        <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>상태</span><div>{s.status}</div></div>
                        {s.manager && <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>담당자</span><div>{s.manager}</div></div>}
                        {s.contact && <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>연락처</span><div>{s.contact}</div></div>}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDel2({ type: 'sponsor', id: s.id, name: s.name }); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 14px', fontSize: 12, color: 'var(--warn)', background: 'none', border: '1px solid var(--warn)', borderRadius: 8, cursor: 'pointer' }}>
                          <i className="ti ti-trash"></i>삭제
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ════════ ALUMNI (졸업 선배) ════════ */}
        <div className={`scr ${screen === 'alumni' ? 'on' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0 }} onClick={() => go('home')}>
              <i className="ti ti-arrow-left" style={{ fontSize: 22 }}></i>
            </button>
            <h2 style={{ margin: 0 }}>졸업 선배</h2>
          </div>
          <div className="stripe"></div>

          <div className="grid2" style={{ marginBottom: 12 }}>
            <div className="metric"><span className="up">등록 선배</span><div className="val">{alumniList.length}<span style={{ fontSize: 13, fontWeight: 300, color: 'var(--muted)' }}>명</span></div></div>
            <div className="metric"><span className="up">멘토링 가능</span><div className="val" style={{ color: 'var(--blue)' }}>{mentorC}<span style={{ fontSize: 13, fontWeight: 300, color: 'var(--muted)' }}>명</span></div></div>
          </div>

          <div className="search-bar">
            <div className="search-wrap">
              <i className="ti ti-search"></i>
              <input className="inp" placeholder="이름, 회사, 기수로 검색..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <button className="btn btn-fill btn-sm" onClick={() => setAlmAdd(v => !v)}>
              <i className={`ti ${almAdd ? 'ti-x' : 'ti-plus'}`} style={{ fontSize: 14 }}></i>
            </button>
          </div>

          {almAdd && (
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="inp-g"><label className="inp-l">이름 *</label><input className="inp" placeholder="홍길동" value={almName} onChange={e => setAlmName(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">기수</label><select className="inp" value={almGen} onChange={e => setAlmGen(e.target.value)}><option value="">선택</option>{GENERATIONS.map(g => <option key={g}>{g}</option>)}</select></div>
              <div className="inp-g"><label className="inp-l">졸업 연도</label><input className="inp" placeholder="예: 2023" value={almYear} onChange={e => setAlmYear(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">회사 / 소속</label><input className="inp" placeholder="예: 한국항공우주연구원" value={almCompany} onChange={e => setAlmCompany(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">직책</label><input className="inp" placeholder="예: 선임연구원" value={almPosition} onChange={e => setAlmPosition(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">전화번호</label><input className="inp" placeholder="010-0000-0000" value={almPhone} onChange={e => setAlmPhone(formatPhone(e.target.value))} /></div>
              <div className="inp-g">
                <label className="inp-l">멘토링 / 후원 의향</label>
                <div className="check-row" onClick={() => setAlmMentoring(v => !v)}>
                  <div className={`check ${almMentoring ? 'on' : ''}`}>{almMentoring && <i className="ti ti-check"></i>}</div>
                  <span style={{ fontSize: 13, color: 'var(--body)' }}>후배 멘토링·특강·후원에 참여 의향 있음</span>
                </div>
              </div>
              <button className="btn btn-fill" onClick={saveAlumnus}>선배 정보 저장</button>
            </div>
          )}

          <div className="card" style={{ padding: '4px 16px' }}>
            {alumniList.length === 0 ? (
              <div className="empty-state">
                <i className="ti ti-school"></i>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{searchQuery ? '검색 결과가 없습니다' : '등록된 졸업 선배가 없습니다'}</div>
                <div className="cap">동문 네트워크를 기록해 멘토링·후원으로 연결하세요</div>
              </div>
            ) : (
              alumniList.map(a => (
                <div className="member-card" key={a.id}>
                  <div className="member-avatar" style={{ background: 'var(--google)' }}>{a.name.charAt(0)}</div>
                  <div className="member-info">
                    <div className="member-name">{a.name} {a.mentoring && <span className="badge badge-blue" style={{ height: 18, fontSize: 9, padding: '0 6px', verticalAlign: 1 }}>멘토</span>}</div>
                    <div className="member-detail">{a.generation}{a.graduationYear ? ` · ${a.graduationYear} 졸업` : ''}</div>
                    <div className="member-detail">{a.company}{a.position ? ` · ${a.position}` : ''}</div>
                  </div>
                  <div className="member-actions">
                    <button className="member-del" onClick={() => setConfirmDel2({ type: 'alumni', id: a.id, name: a.name })}><i className="ti ti-trash"></i></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ════════ INPUT ════════ */}
        <div className={`scr ${screen === 'input' ? 'on' : ''}`}>
          <h2>기록 관리</h2>
          <div className="tabs" style={{ flexWrap: 'wrap' }}>
            {[['sch','일정','ti-calendar'],['doc','자료','ti-folder'],['exp','재무','ti-wallet'],['spn','후원','ti-heart-handshake'],['alm','선배','ti-school']].map(([key, label, icon]) => (
              <button key={key} className={`tab ${tab === key ? 'on' : ''}`} onClick={() => setTab(key)}>
                <i className={`ti ${icon}`} style={{ fontSize: 14, verticalAlign: -2, marginRight: 2 }}></i>
                {label}
              </button>
            ))}
          </div>

          {tab === 'sch' && (
            <div>
              <div className="cap" style={{ marginBottom: 12 }}><i className="ti ti-info-circle" style={{ fontSize: 14, verticalAlign: -2 }}></i> 동아리 일정을 등록합니다.</div>
              <div className="inp-g"><label className="inp-l">일정 제목 *</label><input className="inp" placeholder="예: 정기회의, MT" value={schTitle} onChange={e => setSchTitle(e.target.value)} /></div>
              <div className="inp-g">
                <label className="inp-l">날짜{schHasTime ? ' / 시간' : ''} *</label>
                <input type={schHasTime ? 'datetime-local' : 'date'} className="inp" value={schDate} onChange={e => setSchDate(e.target.value)} onClick={e => e.target.showPicker && e.target.showPicker()} />
                <div className="check-row" onClick={() => { setSchHasTime(v => { if (v && schDate) setSchDate(schDate.split('T')[0]); return !v; }); }} style={{ marginTop: 6 }}>
                  <div className={`check ${!schHasTime ? 'on' : ''}`}>{!schHasTime && <i className="ti ti-check"></i>}</div>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>시간 지정 없이 날짜만 등록</span>
                </div>
              </div>
              <div className="inp-g"><label className="inp-l">분류</label><select className="inp" value={schCat} onChange={e => setSchCat(e.target.value)}>{SCHEDULE_CATEGORIES.map(c => <option key={c.key}>{c.key}</option>)}</select></div>
              <div className="inp-g"><label className="inp-l">장소</label><input className="inp" placeholder="예: 공학관 401호" value={schLoc} onChange={e => setSchLoc(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">메모</label><textarea className="inp" placeholder="일정에 대한 메모를 입력하세요" value={schMemo} onChange={e => setSchMemo(e.target.value)} rows={3} style={{ resize: 'vertical' }} /></div>
              <button className="btn btn-fill" onClick={saveSchedule}>일정 저장</button>
            </div>
          )}

          {tab === 'doc' && (
            <div>
              <div className="inp-g">
                <label className="inp-l">폴더 선택</label>
                <select className="inp" value={docCat} onChange={e => setDocCat(e.target.value)}>
                  {DOC_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.key}</option>)}
                </select>
              </div>
              <div className="inp-g">
                <label className="inp-l">파일 업로드 (10MB 이하)</label>
                <input type="file" className="inp" style={{ padding: '10px 16px' }} onChange={e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  if (file.size > 10 * 1024 * 1024) { showToast('10MB 이하 파일만 업로드 가능합니다'); e.target.value = ''; return; }
                  setDocFileName(file.name);
                  if (!docName) setDocName(file.name);
                  const reader = new FileReader();
                  reader.onload = () => setDocFile(reader.result);
                  reader.readAsDataURL(file);
                }} />
                {docFile && <div className="cap" style={{ marginTop: 4, color: 'var(--ok)' }}><i className="ti ti-check" style={{ fontSize: 12 }}></i> {docFileName}</div>}
              </div>
              <div className="inp-g">
                <label className="inp-l">자료명 (선택)</label>
                <input className="inp" placeholder="미입력 시 파일명 사용" value={docName} onChange={e => setDocName(e.target.value)} />
              </div>
              <button className="btn btn-fill" onClick={saveDocument}>자료 등록</button>
            </div>
          )}

          {tab === 'exp' && (
            <div>
              <div className="cap" style={{ marginBottom: 12 }}><i className="ti ti-info-circle" style={{ fontSize: 14, verticalAlign: -2 }}></i> 수입/지출 내역을 등록합니다.</div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                <button className={`btn btn-sm ${finType === 'income' ? 'btn-fill' : 'btn-ghost'}`} onClick={() => { setFinType('income'); setFCat(''); }} style={{ flex: 1 }}>수입</button>
                <button className={`btn btn-sm ${finType === 'expense' ? 'btn-fill' : 'btn-ghost'}`} onClick={() => { setFinType('expense'); setFCat(''); }} style={{ flex: 1 }}>지출</button>
              </div>
              <div className="inp-g"><label className="inp-l">{finType === 'income' ? '수입 항목' : '지출 항목'}</label><select className="inp" value={fCat} onChange={e => setFCat(e.target.value)}><option value="">선택</option>{(finType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => <option key={c}>{c}</option>)}</select></div>
              <div className="inp-g"><label className="inp-l">금액</label><input className="inp" placeholder="₩ 0" value={fAmt} onChange={e => setFAmt(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">{finType === 'income' ? '수입처' : '지출처'}</label><input className="inp" placeholder={finType === 'income' ? '예: 학생회, 후원기업' : '예: 다이소, 쿠팡'} value={fSource} onChange={e => setFSource(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">발생일</label><input type="date" className="inp" value={fDate} onChange={e => setFDate(e.target.value)} onClick={e => e.target.showPicker && e.target.showPicker()} /></div>
              <div className="inp-g"><label className="inp-l">메모</label><input className="inp" placeholder="간단한 설명" value={fMemo} onChange={e => setFMemo(e.target.value)} /></div>
              <div className="inp-g">
                <label className="inp-l">증빙 자료</label>
                <input type="file" accept="image/*,.pdf" className="inp" style={{ padding: '10px 16px' }} onChange={e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) { showToast('5MB 이하 파일만 업로드 가능합니다'); e.target.value = ''; return; }
                  const reader = new FileReader();
                  reader.onload = () => setFReceipt(reader.result);
                  reader.readAsDataURL(file);
                }} />
                {fReceipt && <div className="cap" style={{ marginTop: 4, color: 'var(--ok)' }}><i className="ti ti-check" style={{ fontSize: 12 }}></i> 파일 첨부됨</div>}
              </div>
              <button className="btn btn-fill" onClick={saveExp}>{finType === 'income' ? '수입 등록' : '지출 등록'}</button>
            </div>
          )}

          {tab === 'spn' && (
            <div>
              <div className="cap" style={{ marginBottom: 12 }}><i className="ti ti-info-circle" style={{ fontSize: 14, verticalAlign: -2 }}></i> 후원 기업·동문·기관을 등록합니다.</div>
              <div className="inp-g"><label className="inp-l">기관 / 후원자명 *</label><input className="inp" placeholder="예: (주)한화에어로스페이스" value={spnName} onChange={e => setSpnName(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">유형</label><select className="inp" value={spnType} onChange={e => setSpnType(e.target.value)}>{SPONSOR_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              <div className="inp-g"><label className="inp-l">후원 금액</label><input className="inp" placeholder="₩ 0" value={spnAmt} onChange={e => setSpnAmt(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">담당자</label><input className="inp" placeholder="담당자명" value={spnManager} onChange={e => setSpnManager(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">연락처</label><input className="inp" placeholder="010-0000-0000" value={spnContact} onChange={e => setSpnContact(formatPhone(e.target.value))} /></div>
              <div className="inp-g"><label className="inp-l">상태</label><select className="inp" value={spnStatus} onChange={e => setSpnStatus(e.target.value)}><option>완료</option><option>예정</option></select></div>
              <button className="btn btn-fill" onClick={saveSponsor}>후원 내역 저장</button>
            </div>
          )}

          {tab === 'alm' && (
            <div>
              <div className="cap" style={{ marginBottom: 12 }}><i className="ti ti-info-circle" style={{ fontSize: 14, verticalAlign: -2 }}></i> 졸업 선배 정보를 등록합니다.</div>
              <div className="inp-g"><label className="inp-l">이름 *</label><input className="inp" placeholder="홍길동" value={almName} onChange={e => setAlmName(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">기수</label><select className="inp" value={almGen} onChange={e => setAlmGen(e.target.value)}><option value="">선택</option>{GENERATIONS.map(g => <option key={g}>{g}</option>)}</select></div>
              <div className="inp-g"><label className="inp-l">졸업 연도</label><input className="inp" placeholder="예: 2023" value={almYear} onChange={e => setAlmYear(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">회사 / 소속</label><input className="inp" placeholder="예: 한국항공우주연구원" value={almCompany} onChange={e => setAlmCompany(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">직책</label><input className="inp" placeholder="예: 선임연구원" value={almPosition} onChange={e => setAlmPosition(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">전화번호</label><input className="inp" placeholder="010-0000-0000" value={almPhone} onChange={e => setAlmPhone(formatPhone(e.target.value))} /></div>
              <div className="inp-g">
                <label className="inp-l">멘토링 / 후원 의향</label>
                <div className="check-row" onClick={() => setAlmMentoring(v => !v)}>
                  <div className={`check ${almMentoring ? 'on' : ''}`}>{almMentoring && <i className="ti ti-check"></i>}</div>
                  <span style={{ fontSize: 13, color: 'var(--body)' }}>후배 멘토링·특강·후원에 참여 의향 있음</span>
                </div>
              </div>
              <button className="btn btn-fill" onClick={saveAlumnus}>선배 정보 저장</button>
            </div>
          )}
        </div>



        {/* ════════ EXPENSES (재무 관리) ════════ */}
        <div className={`scr ${screen === 'expenses' ? 'on' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0 }} onClick={() => go('home')}>
              <i className="ti ti-arrow-left" style={{ fontSize: 22 }}></i>
            </button>
            <h2 style={{ margin: 0 }}>재무 관리</h2>
          </div>
          <div className="stripe"></div>

          <div className="grid2" style={{ marginBottom: 12 }}>
            <div className="metric"><span className="up">총 수입</span><div className="val" style={{ color: 'var(--ok)' }}>{formatExpAmount(expIncome)}<span style={{ fontSize: 13, fontWeight: 300, color: 'var(--muted)' }}>원</span></div></div>
            <div className="metric"><span className="up">총 지출</span><div className="val" style={{ color: 'var(--warn)' }}>{formatExpAmount(expTotal)}<span style={{ fontSize: 13, fontWeight: 300, color: 'var(--muted)' }}>원</span></div></div>
          </div>
          <div className="metric" style={{ marginBottom: 12 }}><span className="up">잔액</span><div className="val" style={{ color: expBalance >= 0 ? 'var(--blue)' : 'var(--warn)' }}>{expBalance >= 0 ? '+' : ''}{formatExpAmount(expBalance)}<span style={{ fontSize: 13, fontWeight: 300, color: 'var(--muted)' }}>원</span></div></div>

          <button className="btn btn-fill btn-sm" onClick={() => setFinAdd(v => !v)} style={{ marginBottom: 12 }}>
            <i className={`ti ${finAdd ? 'ti-x' : 'ti-plus'}`} style={{ fontSize: 14 }}></i> {finAdd ? '닫기' : '내역 추가'}
          </button>

          {finAdd && (
            <div className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                <button className={`btn btn-sm ${finType === 'income' ? 'btn-fill' : 'btn-ghost'}`} onClick={() => { setFinType('income'); setFCat(''); }} style={{ flex: 1 }}>수입</button>
                <button className={`btn btn-sm ${finType === 'expense' ? 'btn-fill' : 'btn-ghost'}`} onClick={() => { setFinType('expense'); setFCat(''); }} style={{ flex: 1 }}>지출</button>
              </div>
              <div className="inp-g"><label className="inp-l">{finType === 'income' ? '수입 항목' : '지출 항목'}</label><select className="inp" value={fCat} onChange={e => setFCat(e.target.value)}><option value="">선택</option>{(finType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => <option key={c}>{c}</option>)}</select></div>
              <div className="inp-g"><label className="inp-l">금액</label><input className="inp" placeholder="₩ 0" value={fAmt} onChange={e => setFAmt(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">{finType === 'income' ? '수입처' : '지출처'}</label><input className="inp" placeholder={finType === 'income' ? '예: 학생회, 후원기업' : '예: 다이소, 쿠팡'} value={fSource} onChange={e => setFSource(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">발생일</label><input type="date" className="inp" value={fDate} onChange={e => setFDate(e.target.value)} onClick={e => e.target.showPicker && e.target.showPicker()} /></div>
              <div className="inp-g"><label className="inp-l">메모</label><input className="inp" placeholder="간단한 설명" value={fMemo} onChange={e => setFMemo(e.target.value)} /></div>
              <div className="inp-g">
                <label className="inp-l">증빙 자료</label>
                <input type="file" accept="image/*,.pdf" className="inp" style={{ padding: '10px 16px' }} onChange={e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) { showToast('5MB 이하 파일만 업로드 가능합니다'); e.target.value = ''; return; }
                  const reader = new FileReader();
                  reader.onload = () => setFReceipt(reader.result);
                  reader.readAsDataURL(file);
                }} />
                {fReceipt && <div className="cap" style={{ marginTop: 4, color: 'var(--ok)' }}><i className="ti ti-check" style={{ fontSize: 12 }}></i> 파일 첨부됨</div>}
              </div>
              <button className="btn btn-fill" onClick={saveExp}>{finType === 'income' ? '수입 등록' : '지출 등록'}</button>
            </div>
          )}

          <div className="card" style={{ padding: '4px 16px' }}>
            {expenseList.length === 0 ? (
              <div className="empty-state">
                <i className="ti ti-wallet"></i>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>등록된 내역이 없습니다</div>
                <div className="cap">위 &quot;내역 추가&quot;로 수입/지출을 등록해보세요</div>
              </div>
            ) : (
              expenseList.map(e => (
                <div key={e.id}>
                  <div className="member-card" onClick={() => setExpandedFin(expandedFin === e.id ? null : e.id)} style={{ cursor: 'pointer' }}>
                    <div className="member-avatar" style={{ background: e.type === 'income' ? 'var(--ok)' : 'var(--warn)', fontSize: 18 }}>
                      <i className={`ti ${e.type === 'income' ? 'ti-plus' : 'ti-minus'}`}></i>
                    </div>
                    <div className="member-info">
                      <div className="member-name">{e.category} <span className={`badge ${e.type === 'income' ? 'badge-ok' : 'badge-warn'}`} style={{ height: 18, fontSize: 9, padding: '0 6px', verticalAlign: 1 }}>{e.type === 'income' ? '수입' : '지출'}</span></div>
                      <div className="member-detail">₩{formatExpAmount(e.amount)}{e.source ? ` · ${e.source}` : ''}{e.occurredAt ? ` · ${new Date(e.occurredAt).toLocaleDateString('ko-KR')}` : ''}</div>
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: 16, transition: 'transform .2s', transform: expandedFin === e.id ? 'rotate(180deg)' : 'rotate(0)' }}>
                      <i className="ti ti-chevron-down"></i>
                    </div>
                  </div>
                  {expandedFin === e.id && (
                    <div style={{ padding: '8px 16px 12px', marginTop: -4, marginBottom: 8, background: 'var(--card)', borderRadius: '0 0 12px 12px', border: '1px solid var(--hair)', borderTop: 'none' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13 }}>
                        <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>유형</span><div style={{ fontWeight: 600 }}>{e.type === 'income' ? '수입' : '지출'}</div></div>
                        <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>항목</span><div>{e.category}</div></div>
                        <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>금액</span><div>₩{formatExpAmount(e.amount)}</div></div>
                        <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>{e.type === 'income' ? '수입처' : '지출처'}</span><div>{e.source || '-'}</div></div>
                        <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>발생일</span><div>{e.occurredAt ? new Date(e.occurredAt).toLocaleDateString('ko-KR') : '-'}</div></div>
                        <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>등록일</span><div>{new Date(e.createdAt).toLocaleDateString('ko-KR')}</div></div>
                        {e.memo && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--muted)', fontSize: 11 }}>메모</span><div>{e.memo}</div></div>}
                        {e.receiptFile && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--muted)', fontSize: 11 }}>증빙 자료</span><div style={{ marginTop: 4, cursor: 'pointer' }} onClick={(ev) => { ev.stopPropagation(); setViewerImg(e.receiptFile); }}><img src={e.receiptFile} alt="증빙" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: '1px solid var(--hair)' }} /><div style={{ fontSize: 11, color: 'var(--blue)', marginTop: 4 }}><i className="ti ti-zoom-in" style={{ fontSize: 12, verticalAlign: -1 }}></i> 클릭하여 확대 / 다운로드</div></div></div>}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                        <button onClick={(ev) => { ev.stopPropagation(); deleteExpense(e.id); refreshData(); showToast('삭제되었습니다'); setExpandedFin(null); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 14px', fontSize: 12, color: 'var(--warn)', background: 'none', border: '1px solid var(--warn)', borderRadius: 8, cursor: 'pointer' }}>
                          <i className="ti ti-trash"></i>삭제
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ════════ REPORT ════════ */}
        <div className={`scr ${screen === 'report' ? 'on' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <h2 style={{ margin: 0 }}>종합 리포트</h2>
            <span className="badge badge-ok">{nowMonth}월</span>
          </div>
          <div className="up" style={{ marginBottom: 16 }}>{nowYear}년 {nowSemester}학기</div>

          {/* 운영 현황 요약 */}
          <div className="stripe"></div>
          <div className="card">
            <h3>운영 현황</h3>
            {[
              { icon: 'ti-users', label: '등록 부원', value: `${memC}명`, color: 'var(--blue)' },
              { icon: 'ti-calendar', label: '등록 일정', value: `${schC}건`, color: 'var(--ok)' },
              { icon: 'ti-folder', label: '자료', value: `${docC}건`, color: 'var(--warn)' },
              { icon: 'ti-heart-handshake', label: '후원', value: `₩${formatAmount(sponsorTotal)}`, color: 'var(--danger, #e74c3c)' },
              { icon: 'ti-school', label: '졸업 선배', value: `${alumniList.length}명 (멘토 ${mentorC}명)`, color: 'var(--blue-l)' },
            ].map((item, i) => (
              <div className="rpt-row" key={i}>
                <span className="rpt-l"><i className={`ti ${item.icon}`} style={{ fontSize: 14, verticalAlign: -2, marginRight: 4, color: item.color }}></i>{item.label}</span>
                <span className="rpt-v">{item.value}</span>
              </div>
            ))}
          </div>

          {/* 재무 현황 */}
          <div className="stripe"></div>
          <div className="card">
            <h3>재무 현황</h3>
            <div className="rpt-row"><span className="rpt-l">총 수입</span><span className="rpt-v" style={{ color: 'var(--ok)' }}>₩{formatExpAmount(expIncome)}</span></div>
            <div className="rpt-row"><span className="rpt-l">총 지출</span><span className="rpt-v" style={{ color: 'var(--warn)' }}>₩{formatExpAmount(expTotal)}</span></div>
            <div className="rpt-row"><span className="rpt-l">잔액</span><span className="rpt-v" style={{ color: expBalance >= 0 ? 'var(--blue)' : 'var(--warn)' }}>{expBalance >= 0 ? '+' : ''}₩{formatExpAmount(Math.abs(expBalance))}</span></div>
            <div className="rpt-row"><span className="rpt-l">거래 건수</span><span className="rpt-v">{expC}건</span></div>
          </div>

          {/* 항목별 지출 차트 */}
          <div className="card">
            <h3>항목별 지출</h3>
            {expTotal > 0 ? (
              <div className="bars">
                {expByCategory.map((c, i) => {
                  const maxAmt = Math.max(...expByCategory.map(x => x.total), 1);
                  const h = Math.max(Math.round((c.total / maxAmt) * 80), c.total > 0 ? 8 : 2);
                  const colors = ['var(--blue)', 'var(--blue-l)', 'var(--blue-e)', 'var(--blue)', 'var(--muted)'];
                  return (
                    <div className="bar-c" key={i}>
                      <div className="bar" style={{ height: h, background: colors[i % colors.length] }}></div>
                      <div className="bar-lb">{c.category.replace(' 구매', '')}</div>
                      <div className="cap" style={{ fontSize: 10, marginTop: 2 }}>₩{formatExpAmount(c.total)}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="cap" style={{ textAlign: 'center', padding: 20 }}>지출 데이터가 없습니다. 재무 관리에서 등록해주세요.</div>
            )}
          </div>

          <button className="btn btn-fill" onClick={genPkg} style={{ marginBottom: 4 }}>
            <i className="ti ti-package" style={{ fontSize: 18 }}></i> 인수인계 패키지 생성
          </button>
          <div className="cap" style={{ textAlign: 'center', marginBottom: 12 }}>상시 기록 기반 자동 생성</div>

          {pkgOpen && (
            <div>
              <div className="stripe"></div>
              <div className="card">
                <h3>인수인계 패키지</h3>
                {[
                  { icon: 'ti-users', label: `부원 현황 (${memC}명)` },
                  { icon: 'ti-wallet', label: `재무 내역 (${expC}건, 잔액 ₩${formatExpAmount(Math.abs(expBalance))})` },
                  { icon: 'ti-calendar', label: `활동 일정 (${schC}건)` },
                  { icon: 'ti-folder', label: `자료 (${docC}건)` },
                  { icon: 'ti-heart-handshake', label: `후원 내역 (₩${formatAmount(sponsorTotal)})` },
                  { icon: 'ti-school', label: `졸업 선배 (${alumniList.length}명)` },
                ].map((item, i) => (
                  <div className="menu-i" key={i}>
                    <div className="menu-l"><i className={`ti ${item.icon}`}></i> {item.label}</div>
                    <span className="badge badge-blue">포함</span>
                  </div>
                ))}
              </div>
              <button className="btn btn-ok" onClick={downloadPkg}>
                <i className="ti ti-download" style={{ fontSize: 18 }}></i> 인수인계 파일 다운로드
              </button>
            </div>
          )}
        </div>

        {/* ════════ MY PAGE ════════ */}
        <div className={`scr ${screen === 'my' ? 'on' : ''}`}>
          {user ? (
            <>
              <div className="pro-row">
                <div className="avatar">{user.name.charAt(0)}</div>
                <div><div className="pro-name">{user.name}</div><div className="pro-role">{activeClub ? activeClub.name : 'HELIOS'} · {user.school || ''}</div></div>
              </div>
              <div className="stripe"></div>

              <div className="card" style={{ padding: '4px 16px', marginBottom: 8 }}>
                <h3 style={{ paddingTop: 12 }}>내 프로필</h3>
                <div className="pro-edit-row"><div className="pro-edit-label">이름</div><div className="pro-edit-value">{user.name}</div></div>
                <div className="pro-edit-row"><div className="pro-edit-label">역할</div><div className="pro-edit-value">{(() => { const me = membersList.find(m => m.email === user.email || m.studentId === user.studentId); return me ? me.role : '부원'; })()}</div></div>
                <div className="pro-edit-row"><div className="pro-edit-label">학교</div><div className="pro-edit-value">{user.school || '-'}</div></div>
                <div className="pro-edit-row"><div className="pro-edit-label">학과</div><div className="pro-edit-value">{user.department}</div></div>
                <div className="pro-edit-row"><div className="pro-edit-label">학번</div><div className="pro-edit-value">{user.studentId}</div></div>
                <div className="pro-edit-row"><div className="pro-edit-label">전화번호</div><div className="pro-edit-value">{user.phone}</div></div>
                <div className="pro-edit-row"><div className="pro-edit-label">이메일</div><div className="pro-edit-value">{user.email}</div></div>
                <div className="pro-edit-row"><div className="pro-edit-label">가입일</div><div className="pro-edit-value">{user.joinedAt ? new Date(user.joinedAt).toLocaleDateString('ko-KR') : user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}</div></div>
              </div>

              <div className="grid2" style={{ marginBottom: 12 }}>
                <div className="metric"><span className="up">등록 일정</span><div className="val">{schC}<span style={{ fontSize: 13, fontWeight: 300, color: 'var(--muted)' }}>건</span></div></div>
                <div className="metric"><span className="up">재무 건수</span><div className="val">{expC}<span style={{ fontSize: 13, fontWeight: 300, color: 'var(--muted)' }}>건</span></div></div>
              </div>
              <div className="card" style={{ padding: '0 16px' }}>
                <div className="menu-i" onClick={() => go('my-activity')}><div className="menu-l"><i className="ti ti-history"></i> 나의 활동 이력</div><i className="ti ti-chevron-right menu-r"></i></div>
                <div className="menu-i" onClick={() => go('my-receipts')}><div className="menu-l"><i className="ti ti-receipt-2"></i> 내가 올린 증빙</div><i className="ti ti-chevron-right menu-r"></i></div>
              </div>

              <div className="card" style={{ padding: '0 16px', marginTop: 8 }}>
                <div className="menu-i" onClick={() => go('my-notify')}><div className="menu-l"><i className="ti ti-bell"></i> 알림 설정</div><i className="ti ti-chevron-right menu-r"></i></div>
                <div className="menu-i" onClick={() => { setEditName(user.name); setEditPhone(user.phone); setEditDept(user.department); go('my-privacy'); }}><div className="menu-l"><i className="ti ti-lock"></i> 개인정보 관리</div><i className="ti ti-chevron-right menu-r"></i></div>
                <div className="menu-i" onClick={handleLogout}>
                  <div className="menu-l"><i className="ti ti-logout" style={{ color: 'var(--warn)' }}></i> <span style={{ color: 'var(--warn)' }}>로그아웃</span></div>
                  <i className="ti ti-chevron-right menu-r"></i>
                </div>
              </div>
            </>
          ) : (
            <div className="onb-center">
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>로그인이 필요합니다</div>
              <button className="btn btn-fill" onClick={() => go('login')}>로그인</button>
            </div>
          )}
        </div>

        {/* ════════ MY - 활동 이력 ════════ */}
        <div className={`scr ${screen === 'my-activity' ? 'on' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0 }} onClick={() => go('my')}><i className="ti ti-arrow-left" style={{ fontSize: 22 }}></i></button>
            <h2 style={{ margin: 0 }}>나의 활동 이력</h2>
          </div>
          <div className="stripe"></div>
          <div className="card" style={{ padding: '4px 16px' }}>
            {(() => {
              const activities = [
                ...scheduleList.map(s => ({ type: 'schedule', label: `일정 등록: ${s.title}`, detail: s.category, date: s.createdAt, icon: 'ti-calendar-event', color: 'var(--blue)' })),
                ...expenseList.map(e => ({ type: 'expense', label: `${e.type === 'income' ? '수입' : '지출'}: ${e.category}`, detail: `₩${formatExpAmount(e.amount)}${e.source ? ' · ' + e.source : ''}`, date: e.createdAt, icon: e.type === 'income' ? 'ti-plus' : 'ti-minus', color: e.type === 'income' ? 'var(--ok)' : 'var(--warn)' })),
                ...docList.map(d => ({ type: 'document', label: `자료 업로드: ${d.name}`, detail: d.category, date: d.uploadedAt, icon: 'ti-file-upload', color: 'var(--gdrive)' })),
                ...sponsorList.map(sp => ({ type: 'sponsor', label: `후원 등록: ${sp.name}`, detail: sp.type, date: sp.createdAt, icon: 'ti-heart-handshake', color: 'var(--google)' })),
              ].sort((a, b) => new Date(b.date) - new Date(a.date));
              if (activities.length === 0) return <div className="empty-state"><i className="ti ti-history-off"></i><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>활동 이력이 없습니다</div></div>;
              return activities.map((a, i) => (
                <div className="member-card" key={i}>
                  <div className="member-avatar" style={{ background: a.color, fontSize: 18 }}><i className={`ti ${a.icon}`}></i></div>
                  <div className="member-info">
                    <div className="member-name">{a.label}</div>
                    <div className="member-detail">{a.detail} · {new Date(a.date).toLocaleDateString('ko-KR')}</div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* ════════ MY - 내가 올린 증빙 ════════ */}
        <div className={`scr ${screen === 'my-receipts' ? 'on' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0 }} onClick={() => go('my')}><i className="ti ti-arrow-left" style={{ fontSize: 22 }}></i></button>
            <h2 style={{ margin: 0 }}>내가 올린 증빙</h2>
          </div>
          <div className="stripe"></div>
          <div className="card" style={{ padding: '4px 16px' }}>
            {(() => {
              const receipts = expenseList.filter(e => e.receiptFile);
              if (receipts.length === 0) return <div className="empty-state"><i className="ti ti-receipt-off"></i><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>올린 증빙이 없습니다</div><div className="cap">재무 관리에서 증빙 자료를 첨부해보세요</div></div>;
              return receipts.map(e => (
                <div key={e.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--hair)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{e.category} <span className={`badge ${e.type === 'income' ? 'badge-ok' : 'badge-warn'}`} style={{ height: 18, fontSize: 9, padding: '0 6px' }}>{e.type === 'income' ? '수입' : '지출'}</span></div>
                      <div className="cap">₩{formatExpAmount(e.amount)} · {new Date(e.createdAt).toLocaleDateString('ko-KR')}</div>
                    </div>
                    <a href={e.receiptFile} download="증빙자료.png" style={{ color: 'var(--blue)', fontSize: 18, padding: 4, display: 'flex' }}><i className="ti ti-download"></i></a>
                  </div>
                  <div style={{ cursor: 'pointer' }} onClick={() => setViewerImg(e.receiptFile)}>
                    <img src={e.receiptFile} alt="증빙" style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 8, border: '1px solid var(--hair)' }} />
                    <div style={{ fontSize: 11, color: 'var(--blue)', marginTop: 4 }}><i className="ti ti-zoom-in" style={{ fontSize: 12, verticalAlign: -1 }}></i> 클릭하여 확대</div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* ════════ 알림 목록 ════════ */}
        <div className={`scr ${screen === 'my-alerts' ? 'on' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0 }} onClick={() => go('home')}><i className="ti ti-arrow-left" style={{ fontSize: 22 }}></i></button>
            <h2 style={{ margin: 0 }}>알림</h2>
            <div style={{ flex: 1 }}></div>
            {alertList.length > 0 && alertList.some(a => !readAlertIds.includes(a.id)) && (
              <button className="btn btn-sm" style={{ fontSize: 11, padding: '4px 10px', height: 'auto' }} onClick={() => {
                const allIds = alertList.map(a => a.id);
                setReadAlertIds(allIds);
                localStorage.setItem('dongmu_read_alerts', JSON.stringify(allIds));
                showToast('모두 읽음 처리됨');
              }}>모두 읽음</button>
            )}
          </div>
          <div className="stripe"></div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <span className="cap" style={{ cursor: 'pointer', color: 'var(--blue)' }} onClick={() => go('my-notify')}>
              <i className="ti ti-settings" style={{ fontSize: 13, verticalAlign: -1 }}></i> 알림 설정
            </span>
          </div>

          {alertList.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 16px' }}>
              <i className="ti ti-bell-off" style={{ fontSize: 40, color: 'var(--muted)', marginBottom: 8, display: 'block' }}></i>
              <div className="cap">새로운 알림이 없습니다</div>
            </div>
          ) : (
            <div className="card" style={{ padding: '0 16px' }}>
              {alertList.map(a => {
                const isRead = readAlertIds.includes(a.id);
                return (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--hair)', opacity: isRead ? 0.5 : 1 }}
                    onClick={() => {
                      if (!isRead) {
                        const next = [...readAlertIds, a.id];
                        setReadAlertIds(next);
                        localStorage.setItem('dongmu_read_alerts', JSON.stringify(next));
                      }
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`ti ${a.icon}`} style={{ fontSize: 18, color: a.color }}></i>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: isRead ? 400 : 600, marginBottom: 2 }}>{a.title}</div>
                      <div className="cap">{a.desc}</div>
                    </div>
                    {!isRead && <span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--blue)', flexShrink: 0, marginTop: 6 }}></span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ════════ MY - 알림 설정 ════════ */}
        <div className={`scr ${screen === 'my-notify' ? 'on' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0 }} onClick={() => go('my')}><i className="ti ti-arrow-left" style={{ fontSize: 22 }}></i></button>
            <h2 style={{ margin: 0 }}>알림 설정</h2>
          </div>
          <div className="stripe"></div>
          <div className="card" style={{ padding: '4px 16px' }}>
            {[
              { key: 'schedule', label: '일정 알림', desc: '일정 등록·변경 시 알림을 받습니다', value: notifySchedule, setter: setNotifySchedule },
              { key: 'finance', label: '재무 알림', desc: '수입·지출 등록 시 알림을 받습니다', value: notifyFinance, setter: setNotifyFinance },
              { key: 'member', label: '부원 알림', desc: '신규 부원 가입 시 알림을 받습니다', value: notifyMember, setter: setNotifyMember },
            ].map(n => (
              <div key={n.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--hair)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{n.label}</div>
                  <div className="cap">{n.desc}</div>
                </div>
                <div onClick={() => { n.setter(v => !v); showToast(n.value ? '알림 해제' : '알림 설정됨'); }} style={{ width: 44, height: 24, borderRadius: 12, background: n.value ? 'var(--blue)' : 'var(--hair)', cursor: 'pointer', position: 'relative', transition: 'background .2s' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 10, background: '#fff', position: 'absolute', top: 2, left: n.value ? 22 : 2, transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.3)' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ════════ MY - 개인정보 관리 ════════ */}
        <div className={`scr ${screen === 'my-privacy' ? 'on' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0 }} onClick={() => go('my')}><i className="ti ti-arrow-left" style={{ fontSize: 22 }}></i></button>
            <h2 style={{ margin: 0 }}>개인정보 관리</h2>
          </div>
          <div className="stripe"></div>
          {user && (
            <div className="card" style={{ padding: '16px', marginBottom: 12 }}>
              <div className="inp-g"><label className="inp-l">이름</label><input className="inp" value={editName} onChange={e => setEditName(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">전화번호</label><input className="inp" value={editPhone} onChange={e => setEditPhone(formatPhone(e.target.value))} /></div>
              <div className="inp-g"><label className="inp-l">학과</label><input className="inp" value={editDept} onChange={e => setEditDept(e.target.value)} /></div>
              <button className="btn btn-fill" style={{ marginTop: 8 }} onClick={() => {
                if (!editName.trim()) { showToast('이름을 입력해주세요'); return; }
                updateProfile({ name: editName.trim(), phone: editPhone, department: editDept.trim() });
                setUser({ ...user, name: editName.trim(), phone: editPhone, department: editDept.trim() });
                showToast('개인정보가 수정되었습니다');
                refreshData();
              }}>저장</button>
            </div>
          )}
          <div className="card" style={{ padding: '16px' }}>
            <h3 style={{ marginBottom: 8, color: 'var(--warn)' }}>계정</h3>
            <div className="cap" style={{ marginBottom: 12 }}>로그아웃하면 이 기기에서 로그아웃됩니다.</div>
            <button className="btn btn-ghost" style={{ color: 'var(--warn)', borderColor: 'var(--warn)', marginBottom: 8 }} onClick={handleLogout}>로그아웃</button>
          </div>
        </div>
      </div>

      {/* ════════ BOTTOM NAV ════════ */}
      {showNav && (
        <div className="nav">
          <div className="nav-brand">
            <div className="nav-logo"><i className="ti ti-rocket"></i></div>
            <div className="nav-brand-text">
              <span className="nav-brand-name">동무</span>
              <span className="nav-brand-sub">동아리 총무</span>
            </div>
          </div>
          {[['home','홈','ti-home'],['input','기록','ti-plus'],['report','리포트','ti-chart-bar'],['my','내 정보','ti-user']].map(([key, label, icon]) => (
            <div key={key} className={`nav-i ${activeNav === key ? 'on' : ''}`} onClick={() => go(key)}>
              <i className={`ti ${icon}`}></i><span>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ════════ CONFIRM DELETE DIALOG ════════ */}
      {confirmDelete && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <h3>부원 삭제</h3>
            <div className="cap">{confirmDelete.name}({confirmDelete.studentId}) 부원을 삭제하시겠습니까?<br/>이 작업은 되돌릴 수 없습니다.</div>
            <div className="confirm-btns">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>취소</button>
              <button className="btn btn-fill" style={{ background: 'var(--warn)', borderColor: 'var(--warn)' }} onClick={() => handleDeleteMember(confirmDelete.id)}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ CONFIRM DELETE (MODULES) ════════ */}
      {confirmDel2 && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <h3>삭제 확인</h3>
            <div className="cap">&quot;{confirmDel2.name}&quot; 항목을 삭제하시겠습니까?<br/>이 작업은 되돌릴 수 없습니다.</div>
            <div className="confirm-btns">
              <button className="btn btn-ghost" onClick={() => setConfirmDel2(null)}>취소</button>
              <button className="btn btn-fill" style={{ background: 'var(--warn)', borderColor: 'var(--warn)' }} onClick={handleConfirmDel2}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ SCREEN LOADING ════════ */}
      {screenLoading && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 8888, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 14, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="spin-dot"></span> 로딩중...
          </div>
        </div>
      )}

      {/* ════════ IMAGE VIEWER ════════ */}
      {viewerImg && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewerImg(null)}>
          <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
            <a href={viewerImg} download="증빙자료.png" onClick={e => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#fff', background: 'var(--blue)', borderRadius: 8, textDecoration: 'none', cursor: 'pointer' }}>
              <i className="ti ti-download" style={{ fontSize: 16 }}></i> 다운로드
            </a>
            <button onClick={() => setViewerImg(null)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, fontSize: 20, color: '#fff', background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              <i className="ti ti-x"></i>
            </button>
          </div>
          <img src={viewerImg} alt="증빙 자료" onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 12, objectFit: 'contain' }} />
        </div>
      )}

      {/* ════════ TOAST ════════ */}
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}
