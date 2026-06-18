'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { signup, login, logout, getCurrentUser, updateProfile, setUserClub, validators, formatPhone, formatStudentId } from './lib/auth';
import { getMembers, addMember, deleteMember, searchMembers, getMemberCount } from './lib/members';
import { createClub, getClubs, searchClubs, getClubById } from './lib/clubs';
import { getSchedules, addSchedule, deleteSchedule, getUpcoming, getScheduleCount, formatScheduleDate, SCHEDULE_CATEGORIES } from './lib/schedule';
import { getDocuments, addDocument, deleteDocument, getDocStats, getDocumentCount, classifyDocument, categoryMeta, DOC_CATEGORIES } from './lib/documents';
import { getSponsors, addSponsor, deleteSponsor, searchSponsors, getTotalSupport, getSponsorCount, formatAmount, SPONSOR_TYPES } from './lib/sponsors';
import { getAlumni, addAlumnus, deleteAlumnus, searchAlumni, getAlumniCount, getMentorCount } from './lib/alumni';
import { initSync, pullFromCloud } from './lib/sync';


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
  /* ── Navigation ── */
  const [screen, setScreen] = useState('onboard');
  const [tab, setTab] = useState('mem');
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
  const [logC, setLogC] = useState(0);
  const [rcptC, setRcptC] = useState(0);
  const [pkgOpen, setPkgOpen] = useState(false);

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
  const [schCat, setSchCat] = useState('회의');
  const [schLoc, setSchLoc] = useState('');

  /* ── Documents (자료) ── */
  const [docList, setDocList] = useState([]);
  const [docStats, setDocStats] = useState([]);
  const [docC, setDocC] = useState(0);
  const [docFilter, setDocFilter] = useState('전체');
  const [docName, setDocName] = useState('');
  const [docPreview, setDocPreview] = useState('');

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
  }, [searchQuery]);

  useEffect(() => {
    async function boot() {
      await pullFromCloud();
      const u = getCurrentUser();
      if (u) {
        setUser(u);
        if (u.clubId) {
          const club = getClubById(u.clubId);
          if (club) {
            setActiveClub(club);
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
      initSync(() => refreshData());
    }
    boot();
  }, [refreshData]);

  useEffect(() => {
    refreshData();
  }, [searchQuery, refreshData]);


  /* ───── Helpers ───── */
  function go(id) {
    setScreen(id);
    setAuthError('');
    setSearchQuery('');
    if (areaRef.current) areaRef.current.scrollTop = 0;
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
    const res = addSchedule({
      clubId: user ? user.clubId : '',
      title: schTitle,
      date: schDate,
      category: schCat,
      location: schLoc,
    });
    if (!res.success) { showToast(res.error); return; }
    showToast('일정이 등록되었습니다');
    setSchTitle(''); setSchDate(''); setSchCat('회의'); setSchLoc('');
    setSchAdd(false);
    refreshData();
  }

  /* ───── Document Actions ───── */
  function saveDocument() {
    if (!docName.trim()) { showToast('파일명을 입력해주세요'); return; }
    const res = addDocument({
      clubId: user ? user.clubId : '',
      name: docName,
      uploadedBy: user ? user.name : '',
    });
    if (!res.success) { showToast(res.error); return; }
    showToast(`"${res.category}" 폴더로 자동 분류되었습니다`);
    setDocName('');
    setDocPreview('');
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
    if (!fCat || !fAmt) { showToast('필수 항목을 입력해주세요'); return; }
    setRcptC(prev => prev + 1);
    setLogC(prev => prev + 1);
    showToast('증빙 등록 완료');
    setFCat(''); setFAmt(''); setFMemo('');
    setTimeout(() => go('report'), 1200);
  }

  function genPkg() {
    setPkgOpen(true);
    showToast('인수인계 패키지 생성 완료');
  }

  /* ───── Password strength ───── */
  function getPwStrength(pw) {
    if (!pw) return { width: '0%', color: 'transparent', label: '' };
    if (pw.length < 6) return { width: '33%', color: 'var(--warn)', label: '약함' };
    if (pw.length < 10) return { width: '66%', color: 'var(--blue)', label: '보통' };
    return { width: '100%', color: 'var(--ok)', label: '강함' };
  }

  /* ───── Nav state ───── */
  const navMap = { home: 'home', input: 'input', report: 'report', my: 'my', drive: 'home', members: 'home', schedule: 'home', sponsors: 'home', alumni: 'home' };
  const activeNav = navMap[screen] || screen;
  const showNav = !['onboard', 'login', 'signup', 'club-select'].includes(screen);

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

            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <i className="ti ti-bell" style={{ fontSize: 24, color: 'var(--muted)' }}></i>
              <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: 'var(--warn)', border: '2px solid var(--canvas)' }}></span>
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
                <div className="metric">
                  <span className="up">회비 납부율</span>
                  <div className="val" style={{ color: 'var(--blue)' }}>{memC > 0 ? Math.round((memC / (memC + 1)) * 100) : 0}<span style={{ fontSize: 13, fontWeight: 300 }}>%</span></div>
                </div>
                <div className="metric" onClick={() => { go('input'); setTab('exp'); }}>
                  <span className="up">이번 달 지출</span>
                  <div className="val">{rcptC > 0 ? rcptC * 50 : 0}<span style={{ fontSize: 13, fontWeight: 300, color: 'var(--muted)' }}>K</span></div>
                </div>
                <div className="metric" onClick={() => { go('input'); setTab('exp'); }}>
                  <span className="up">미처리 증빙</span>
                  <div className="val" style={{ color: rcptC > 0 ? 'var(--warn)' : 'var(--ink)' }}>{rcptC}<span style={{ fontSize: 13, fontWeight: 300 }}>건</span></div>
                </div>
              </div>

              <h3 style={{ marginTop: 8 }}>운영 관리</h3>
              <div className="hub-grid">
                {[
                  { id: 'members', icon: 'ti-users', label: '부원 관리', color: 'var(--blue)' },
                  { id: 'schedule', icon: 'ti-calendar', label: '일정 관리', color: 'var(--ok)' },
                  { id: 'drive', icon: 'ti-folder', label: '자료 관리', color: 'var(--gdrive)' },
                  { id: 'sponsors', icon: 'ti-heart-handshake', label: '후원자 관리', color: 'var(--warn)' },
                  { id: 'alumni', icon: 'ti-school', label: '졸업 선배', color: 'var(--google)' },
                  { id: 'report', icon: 'ti-chart-bar', label: '회계 리포트', color: 'var(--blue-l)' },
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>다가오는 일정</h3>
                  <span className="cap" style={{ cursor: 'pointer', color: 'var(--blue)' }} onClick={() => go('schedule')}>전체보기</span>
                </div>
                {(() => {
                  const now = new Date();
                  const upcoming = scheduleList.filter(s => new Date(s.date) >= now).slice(0, 4);
                  if (upcoming.length === 0) {
                    return (
                      <div className="cap" style={{ padding: '8px 0' }}>
                        등록된 일정이 없습니다. <span style={{ color: 'var(--blue)', cursor: 'pointer' }} onClick={() => go('schedule')}>일정 추가하기</span>
                      </div>
                    );
                  }
                  return upcoming.map(s => (
                    <div className="sch-i" key={s.id}>
                      <div className="sch-dot" style={{ background: s.color }}></div>
                      <div className="sch-t">{s.title}</div>
                      <div className="sch-d">{formatScheduleDate(s.date)}</div>
                    </div>
                  ));
                })()}
              </div>

              <div className="card" style={{ marginTop: 10 }}>
                <h3 style={{ margin: '0 0 12px' }}>빠른 요약</h3>
                <div className="sch-i"><div className="sch-dot" style={{ background: 'var(--blue)' }}></div><div className="sch-t">등록 부원</div><div className="sch-d" style={{ fontWeight: 700, color: 'var(--ink)' }}>{memC}명</div></div>
                <div className="sch-i"><div className="sch-dot" style={{ background: 'var(--ok)' }}></div><div className="sch-t">등록 일정</div><div className="sch-d" style={{ fontWeight: 700, color: 'var(--ink)' }}>{schC}건</div></div>
                <div className="sch-i"><div className="sch-dot" style={{ background: 'var(--gdrive)' }}></div><div className="sch-t">보관 자료</div><div className="sch-d" style={{ fontWeight: 700, color: 'var(--ink)' }}>{docC}건</div></div>
                <div className="sch-i"><div className="sch-dot" style={{ background: 'var(--warn)' }}></div><div className="sch-t">후원 내역</div><div className="sch-d" style={{ fontWeight: 700, color: 'var(--ink)' }}>{sponsorList.length}건</div></div>
              </div>

              <button className="btn btn-fill" onClick={() => go('input')} style={{ marginTop: 4 }}>
                <i className="ti ti-plus" style={{ fontSize: 18 }}></i> 새 기록 추가
              </button>
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
                <div className="member-card" key={m.id}>
                  <div className="member-avatar">{m.name.charAt(0)}</div>
                  <div className="member-info">
                    <div className="member-name">{m.name}</div>
                    <div className="member-detail">{m.generation} · {m.department} · {m.studentId}</div>
                    <div className="member-detail">{m.phone}{m.role ? ` · ${m.role}` : ''}</div>
                  </div>
                  <div className="member-actions">
                    <button className="member-del" onClick={() => setConfirmDelete(m)}>
                      <i className="ti ti-trash"></i>
                    </button>
                  </div>
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

          <div className="member-count-bar">
            <div className="member-count">전체 <strong>{schC}</strong>개의 일정</div>
            <button className="btn btn-fill btn-sm" onClick={() => setSchAdd(v => !v)}>
              <i className={`ti ${schAdd ? 'ti-x' : 'ti-plus'}`} style={{ fontSize: 14 }}></i> {schAdd ? '닫기' : '일정 추가'}
            </button>
          </div>

          {schAdd && (
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="inp-g"><label className="inp-l">일정 제목 *</label><input className="inp" placeholder="예: 정기회의, 로켓 발사 테스트" value={schTitle} onChange={e => setSchTitle(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">날짜 / 시간 *</label><input type="datetime-local" className="inp" value={schDate} onChange={e => setSchDate(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">분류</label><select className="inp" value={schCat} onChange={e => setSchCat(e.target.value)}>{SCHEDULE_CATEGORIES.map(c => <option key={c.key}>{c.key}</option>)}</select></div>
              <div className="inp-g"><label className="inp-l">장소</label><input className="inp" placeholder="예: 공학관 401호" value={schLoc} onChange={e => setSchLoc(e.target.value)} /></div>
              <button className="btn btn-fill" onClick={saveSchedule}>일정 저장</button>
            </div>
          )}

          <div className="card" style={{ padding: '4px 16px' }}>
            {scheduleList.length === 0 ? (
              <div className="empty-state">
                <i className="ti ti-calendar-off"></i>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>등록된 일정이 없습니다</div>
                <div className="cap">위 &quot;일정 추가&quot;로 첫 일정을 등록해보세요</div>
              </div>
            ) : (
              scheduleList.map(s => {
                const past = new Date(s.date) < new Date();
                return (
                  <div className="member-card" key={s.id} style={{ opacity: past ? 0.5 : 1 }}>
                    <div className="member-avatar" style={{ background: s.color, fontSize: 18 }}><i className="ti ti-calendar-event"></i></div>
                    <div className="member-info">
                      <div className="member-name">{s.title} {past && <span className="cap">· 종료</span>}</div>
                      <div className="member-detail">{formatScheduleDate(s.date)} · {s.category}</div>
                      {s.location && <div className="member-detail"><i className="ti ti-map-pin" style={{ fontSize: 11 }}></i> {s.location}</div>}
                    </div>
                    <div className="member-actions">
                      <button className="member-del" onClick={() => setConfirmDel2({ type: 'schedule', id: s.id, name: s.title })}><i className="ti ti-trash"></i></button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ════════ DRIVE (자료 관리 + 자동 분류) ════════ */}
        <div className={`scr ${screen === 'drive' ? 'on' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0 }} onClick={() => go('home')}>
              <i className="ti ti-arrow-left" style={{ fontSize: 22 }}></i>
            </button>
            <h2 style={{ margin: 0 }}>자료 관리</h2>
          </div>
          <div className="stripe"></div>

          <div className="sync-bar">
            <i className="ti ti-sparkles"></i>
            <span>업로드 시 파일명을 분석해 폴더로 자동 정리됩니다</span>
          </div>

          {/* 업로드 입력 */}
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="inp-g" style={{ marginBottom: 8 }}>
              <label className="inp-l">파일명 입력 (자동 분류)</label>
              <input className="inp" placeholder="예: 6월 정기회의록.pdf, 발사실험 보고서.docx" value={docName} onChange={e => { setDocName(e.target.value); setDocPreview(e.target.value.trim() ? classifyDocument(e.target.value) : ''); }} />
            </div>
            {docPreview && (
              <div className="cap" style={{ marginBottom: 10 }}>
                <i className="ti ti-arrow-right" style={{ fontSize: 12 }}></i> 분류 예측: <span style={{ color: categoryMeta(docPreview).color, fontWeight: 700 }}>{docPreview}</span> 폴더
              </div>
            )}
            <button className="btn btn-fill btn-sm" style={{ width: '100%' }} onClick={saveDocument}>
              <i className="ti ti-upload" style={{ fontSize: 16 }}></i> 자료 등록
            </button>
          </div>

          {/* 자동 정리된 폴더 통계 */}
          <h3>폴더 (자동 정리)</h3>
          <div className="folder-grid">
            <div className={`folder-chip ${docFilter === '전체' ? 'on' : ''}`} onClick={() => setDocFilter('전체')}>
              <i className="ti ti-folders"></i><span>전체</span><strong>{docC}</strong>
            </div>
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
                    <div className="cap">파일명을 입력해 자료를 등록해보세요</div>
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
                      <div className="file-meta">{d.category} · {d.size}{d.uploadedBy ? ` · ${d.uploadedBy}` : ''}</div>
                    </div>
                    <button className="member-del" onClick={() => setConfirmDel2({ type: 'document', id: d.id, name: d.name })}><i className="ti ti-trash"></i></button>
                  </div>
                );
              });
            })()}
          </div>
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
              <div className="inp-g"><label className="inp-l">연락처</label><input className="inp" placeholder="010-0000-0000 / 이메일" value={spnContact} onChange={e => setSpnContact(e.target.value)} /></div>
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
                <div className="member-card" key={s.id}>
                  <div className="member-avatar" style={{ background: s.status === '예정' ? 'var(--warn)' : 'var(--ok)' }}>{s.name.charAt(0)}</div>
                  <div className="member-info">
                    <div className="member-name">{s.name} <span className="badge badge-blue" style={{ height: 18, fontSize: 9, padding: '0 6px', verticalAlign: 1 }}>{s.type}</span></div>
                    <div className="member-detail">₩{formatAmount(s.amount)} · {s.status}{s.manager ? ` · ${s.manager}` : ''}</div>
                    {s.contact && <div className="member-detail">{s.contact}</div>}
                  </div>
                  <div className="member-actions">
                    <button className="member-del" onClick={() => setConfirmDel2({ type: 'sponsor', id: s.id, name: s.name })}><i className="ti ti-trash"></i></button>
                  </div>
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
          <div className="tabs">
            {[['mem','부원 등록','ti-users'],['exp','지출 등록','ti-receipt']].map(([key, label, icon]) => (
              <button key={key} className={`tab ${tab === key ? 'on' : ''}`} onClick={() => setTab(key)}>
                <i className={`ti ${icon}`} style={{ fontSize: 14, verticalAlign: -2, marginRight: 2 }}></i>
                {label}
              </button>
            ))}
          </div>

          {tab === 'mem' && (
            <div>
              <div className="cap" style={{ marginBottom: 12 }}><i className="ti ti-info-circle" style={{ fontSize: 14, verticalAlign: -2 }}></i> 부원을 수동으로 등록합니다. 필수 항목(*)을 입력해주세요.</div>
              <div className="inp-g"><label className="inp-l">이름 *</label><input className="inp" placeholder="홍길동" value={fName} onChange={e => setFName(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">학번</label><input className="inp" placeholder="20XXXXXXXX" value={fStudentId} onChange={e => setFStudentId(formatStudentId(e.target.value))} /></div>
              <div className="inp-g"><label className="inp-l">학과</label><input className="inp" placeholder="컴퓨터소프트웨어학부" value={fDept} onChange={e => setFDept(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">전화번호</label><input className="inp" placeholder="010-0000-0000" value={fPhone} onChange={e => setFPhone(formatPhone(e.target.value))} /></div>
              <div className="inp-g"><label className="inp-l">이메일</label><input className="inp" placeholder="example@email.com" value={fEmail} onChange={e => setFEmail(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">기수</label><select className="inp" value={fGen} onChange={e => setFGen(e.target.value)}><option value="">선택</option>{GENERATIONS.map(g => <option key={g}>{g}</option>)}</select></div>
              <div className="inp-g"><label className="inp-l">직책</label><select className="inp" value={fRole} onChange={e => setFRole(e.target.value)}><option value="">선택</option><option>회장</option><option>부회장</option><option>총무</option><option>팀장</option><option>부원</option></select></div>
              <div className="inp-g"><label className="inp-l">소속 팀</label><select className="inp" value={fTeam} onChange={e => setFTeam(e.target.value)}><option value="">선택</option><option>추진체 팀</option><option>전자 팀</option><option>구조 팀</option><option>운영 팀</option></select></div>
              <button className="btn btn-fill" onClick={saveMem}>저장하기</button>
            </div>
          )}

          {tab === 'exp' && (
            <div>
              <div className="cam-zone" onClick={() => showToast('OCR 인식 시작...')}>
                <i className="ti ti-camera"></i>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>영수증 촬영</div>
                <div className="cap" style={{ marginTop: 4 }}>OCR 자동 인식으로 입력</div>
              </div>
              <div className="inp-g"><label className="inp-l">지출 항목</label><select className="inp" value={fCat} onChange={e => setFCat(e.target.value)}><option value="">선택</option><option>부품 구매</option><option>행사비</option><option>인쇄비</option><option>식비</option><option>기타</option></select></div>
              <div className="inp-g"><label className="inp-l">금액</label><input className="inp" placeholder="₩ 0" value={fAmt} onChange={e => setFAmt(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">메모</label><input className="inp" placeholder="간단한 설명" value={fMemo} onChange={e => setFMemo(e.target.value)} /></div>
              <div className="inp-g">
                <label className="inp-l">영수증 파일</label>
                <input type="file" className="inp" style={{ padding: '12px 16px' }} onChange={() => showToast('파일이 선택되었습니다.')} />
              </div>
              <button className="btn btn-fill" onClick={saveExp}>증빙 등록</button>
            </div>
          )}
        </div>



        {/* ════════ REPORT ════════ */}
        <div className={`scr ${screen === 'report' ? 'on' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <h2 style={{ margin: 0 }}>회계 리포트</h2>
            <span className="badge badge-ok">6월</span>
          </div>
          <div className="up" style={{ marginBottom: 16 }}>2026년 1학기</div>
          <div className="stripe"></div>
          <div className="card">
            <div className="rpt-row"><span className="rpt-l">수입 (회비)</span><span className="rpt-v" style={{ color: 'var(--ok)' }}>+ ₩500,000</span></div>
            <div className="rpt-row"><span className="rpt-l">지출 합계</span><span className="rpt-v" style={{ color: 'var(--warn)' }}>- ₩320,000</span></div>
            <div className="rpt-row" style={{ borderTop: '2px solid var(--hair)' }}><span className="rpt-l" style={{ fontWeight: 700, color: 'var(--ink)' }}>잔액</span><span className="rpt-v" style={{ fontSize: 20 }}>₩180,000</span></div>
          </div>
          <div className="card">
            <h3>항목별 지출</h3>
            <div className="bars">
              {[
                { h: 72, color: 'var(--blue)', label: '부품' },
                { h: 45, color: 'var(--blue-l)', label: '행사' },
                { h: 28, color: 'var(--blue-e)', label: '인쇄' },
                { h: 38, color: 'var(--blue)', label: '식비' },
                { h: 12, color: 'var(--muted)', label: '기타' },
              ].map((b, i) => (
                <div className="bar-c" key={i}>
                  <div className="bar" style={{ height: b.h, background: b.color }}></div>
                  <div className="bar-lb">{b.label}</div>
                </div>
              ))}
            </div>
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
                  { icon: 'ti-receipt', label: '회계 장부' },
                  { icon: 'ti-calendar', label: '활동 일정' },
                ].map((item, i) => (
                  <div className="menu-i" key={i}>
                    <div className="menu-l"><i className={`ti ${item.icon}`} style={item.iconColor ? { color: item.iconColor } : {}}></i> {item.label}</div>
                    <span className="badge badge-blue">포함</span>
                  </div>
                ))}
              </div>
              <button className="btn btn-ok">후임자에게 전달</button>
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

              {/* 내 프로필 정보 */}
              <div className="card" style={{ padding: '4px 16px', marginBottom: 8 }}>
                <h3 style={{ paddingTop: 12 }}>내 프로필</h3>
                <div className="pro-edit-row">
                  <div className="pro-edit-label">이름</div>
                  <div className="pro-edit-value">{user.name}</div>
                </div>
                <div className="pro-edit-row">
                  <div className="pro-edit-label">학교</div>
                  <div className="pro-edit-value">{user.school || '-'}</div>
                </div>
                <div className="pro-edit-row">
                  <div className="pro-edit-label">학과</div>
                  <div className="pro-edit-value">{user.department}</div>
                </div>
                <div className="pro-edit-row">
                  <div className="pro-edit-label">학번</div>
                  <div className="pro-edit-value">{user.studentId}</div>
                </div>
                <div className="pro-edit-row">
                  <div className="pro-edit-label">전화번호</div>
                  <div className="pro-edit-value">{user.phone}</div>
                </div>
                <div className="pro-edit-row">
                  <div className="pro-edit-label">이메일</div>
                  <div className="pro-edit-value">{user.email}</div>
                </div>
                <div className="pro-edit-row">
                  <div className="pro-edit-label">가입일</div>
                  <div className="pro-edit-value">{user.joinedAt ? new Date(user.joinedAt).toLocaleDateString('ko-KR') : user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}</div>
                </div>
              </div>

              <div className="grid2" style={{ marginBottom: 12 }}>
                <div className="metric"><span className="up">활동 로그</span><div className="val">{logC}<span style={{ fontSize: 13, fontWeight: 300, color: 'var(--muted)' }}>건</span></div></div>
                <div className="metric"><span className="up">내 증빙</span><div className="val">{rcptC}<span style={{ fontSize: 13, fontWeight: 300, color: 'var(--muted)' }}>건</span></div></div>
              </div>
              <div className="card" style={{ padding: '0 16px' }}>
                {[['ti-history','나의 활동 이력'],['ti-receipt-2','내가 올린 증빙']].map(([icon, label]) => (
                  <div className="menu-i" key={label}><div className="menu-l"><i className={`ti ${icon}`}></i> {label}</div><i className="ti ti-chevron-right menu-r"></i></div>
                ))}
              </div>

              <div className="card" style={{ padding: '0 16px', marginTop: 8 }}>
                {[['ti-bell','알림 설정'],['ti-lock','개인정보 관리']].map(([icon, label]) => (
                  <div className="menu-i" key={label}><div className="menu-l"><i className={`ti ${icon}`}></i> {label}</div><i className="ti ti-chevron-right menu-r"></i></div>
                ))}
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

      {/* ════════ TOAST ════════ */}
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}
