'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { signup, login, logout, getCurrentUser, updateProfile, validators, formatPhone, formatStudentId } from './lib/auth';
import { getMembers, addMember, deleteMember, searchMembers, getMemberCount } from './lib/members';

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
  const [tab, setTab] = useState('form');
  const [toast, setToast] = useState('');
  const areaRef = useRef(null);

  /* ── Auth state ── */
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState('');

  /* ── Login form ── */
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');

  /* ── Signup form ── */
  const [sName, setSName] = useState('');
  const [sStudentId, setSStudentId] = useState('');
  const [sDept, setSDept] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sGen, setSGen] = useState('');
  const [sPw, setSPw] = useState('');
  const [sPwConfirm, setSPwConfirm] = useState('');
  const [signupTouched, setSignupTouched] = useState({});

  /* ── Home/data state ── */
  const [memC, setMemC] = useState(0);
  const [logC, setLogC] = useState(0);
  const [rcptC, setRcptC] = useState(0);
  const [formLoaded, setFormLoaded] = useState(false);
  const [checks, setChecks] = useState([true, true, true]);
  const [pkgOpen, setPkgOpen] = useState(false);
  const [syncText, setSyncText] = useState('Google Forms · 마지막 동기화: 5분 전');
  const [syncing, setSyncing] = useState(false);

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

  /* ── Mock form imports ── */
  const MOCK_IMPORTS = [
    { name: '김하늘', studentId: '2024010001', department: '기계공학과', phone: '010-1234-5678', generation: '7기', detail: '7기 · 구조 팀 · 010-1234-5678' },
    { name: '이준호', studentId: '2024010002', department: '전자공학과', phone: '010-2345-6789', generation: '7기', detail: '7기 · 전자 팀 · 010-2345-6789' },
    { name: '박서윤', studentId: '2024010003', department: '항공우주공학과', phone: '010-3456-7890', generation: '7기', detail: '7기 · 추진체 팀 · 010-3456-7890' },
  ];

  /* ───── Effects ───── */
  const refreshData = useCallback(() => {
    setMemC(getMemberCount());
    setMembersList(searchQuery ? searchMembers(searchQuery) : getMembers());
  }, [searchQuery]);

  useEffect(() => {
    const u = getCurrentUser();
    if (u) {
      setUser(u);
      setScreen('home');
    }
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    refreshData();
  }, [searchQuery, refreshData]);

  /* ───── Helpers ───── */
  function go(id) {
    setScreen(id);
    setAuthError('');
    if (areaRef.current) areaRef.current.scrollTop = 0;
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  }

  function markTouched(field) {
    setSignupTouched(prev => ({ ...prev, [field]: true }));
  }

  /* ───── Auth Actions ───── */
  async function handleSignup() {
    // Mark all fields as touched
    setSignupTouched({ name: true, studentId: true, dept: true, phone: true, email: true, gen: true, pw: true, pwConfirm: true });

    // Validate all fields
    if (!validators.name(sName)) { setAuthError('이름을 2자 이상 입력해주세요.'); return; }
    if (!validators.studentId(sStudentId)) { setAuthError('학번을 20XXXXXXXX 형식으로 입력해주세요.'); return; }
    if (!sDept.trim()) { setAuthError('학과를 입력해주세요.'); return; }
    if (!validators.phone(sPhone)) { setAuthError('전화번호를 010-0000-0000 형식으로 입력해주세요.'); return; }
    if (!validators.email(sEmail)) { setAuthError('올바른 이메일 주소를 입력해주세요.'); return; }
    if (!sGen) { setAuthError('가입시기(기수)를 선택해주세요.'); return; }
    if (!validators.password(sPw)) { setAuthError('비밀번호는 최소 6자 이상이어야 합니다.'); return; }
    if (sPw !== sPwConfirm) { setAuthError('비밀번호가 일치하지 않습니다.'); return; }

    const result = await signup(sEmail, sPw, {
      name: sName,
      studentId: sStudentId,
      department: sDept,
      phone: sPhone,
      generation: sGen,
    });

    if (!result.success) {
      setAuthError(result.error);
      return;
    }

    setUser(result.user);
    showToast(`${result.user.name}님, 환영합니다!`);
    resetSignupForm();
    refreshData();
    go('home');
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
    go('home');
  }

  function handleLogout() {
    logout();
    setUser(null);
    go('onboard');
    showToast('로그아웃 되었습니다.');
  }

  function resetSignupForm() {
    setSName(''); setSStudentId(''); setSDept(''); setSPhone('');
    setSEmail(''); setSGen(''); setSPw(''); setSPwConfirm('');
    setSignupTouched({});
    setAuthError('');
  }

  /* ───── Member Actions ───── */
  function saveMem() {
    if (!fName) { showToast('이름을 입력해주세요'); return; }

    const result = addMember({
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

  function importMembers() {
    const count = checks.filter(Boolean).length;
    if (count === 0) { showToast('선택된 부원이 없습니다'); return; }

    let added = 0;
    MOCK_IMPORTS.forEach((m, i) => {
      if (checks[i]) {
        const result = addMember({
          name: m.name,
          studentId: m.studentId,
          department: m.department,
          phone: m.phone,
          generation: m.generation,
          role: '부원',
          team: '',
        });
        if (result.success) added++;
      }
    });

    showToast(`${added}명 일괄 등록 완료`);
    refreshData();
    setTimeout(() => { setFormLoaded(false); go('home'); }, 1500);
  }

  /* ───── Sync & Forms ───── */
  function syncForms() {
    setSyncing(true);
    setSyncText('동기화 중...');
    setTimeout(() => {
      setSyncing(false);
      setSyncText('Google Forms · 방금 동기화 완료');
      showToast('동기화 완료 — 새 응답 없음');
    }, 1500);
  }

  function loadForm() {
    setFormLoaded(true);
    setChecks([true, true, true]);
    showToast('3건의 새 응답을 불러왔습니다');
  }

  function toggleCheck(i) {
    const next = [...checks];
    next[i] = !next[i];
    setChecks(next);
  }

  /* ───── Expense ───── */
  function saveExp() {
    if (!fCat || !fAmt) { showToast('필수 항목을 입력해주세요'); return; }
    setRcptC(prev => prev + 1);
    setLogC(prev => prev + 1);
    showToast('증빙 등록 완료 → Drive 자동 저장');
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
  const navMap = { home: 'home', input: 'input', report: 'report', my: 'my', drive: 'home', members: 'home' };
  const activeNav = navMap[screen] || screen;
  const showNav = !['onboard', 'login', 'signup'].includes(screen);

  return (
    <div className="shell">
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
              {[['ti-users','부원'],['ti-receipt','회계'],['ti-brand-google','연동']].map(([icon, label]) => (
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
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 16 }}>
              이미 동아리가 있나요? <span style={{ color: 'var(--blue)', cursor: 'pointer' }}>코드로 참여</span>
            </p>
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
                <label className="inp-l">가입시기 (기수) *</label>
                <select
                  className={`inp ${signupTouched.gen ? (sGen ? 'valid' : 'invalid') : ''}`}
                  value={sGen}
                  onChange={e => setSGen(e.target.value)}
                  onBlur={() => markTouched('gen')}
                >
                  <option value="">선택</option>
                  {GENERATIONS.map(g => <option key={g}>{g}</option>)}
                </select>
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

        {/* ════════ HOME ════════ */}
        <div className={`scr ${screen === 'home' ? 'on' : ''}`}>
          <div className="up" style={{ marginBottom: 4 }}>한양대학교 로켓연구회</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <h1>HELIOS</h1>
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <i className="ti ti-bell" style={{ fontSize: 24, color: 'var(--muted)' }}></i>
              <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: 'var(--warn)', border: '2px solid var(--canvas)' }}></span>
            </div>
          </div>
          <div className="stripe"></div>

          <div className="sync-bar">
            <i className={`ti ti-refresh ${syncing ? 'pulse' : ''}`}></i>
            <span>{syncText}</span>
            <span style={{ marginLeft: 'auto', cursor: 'pointer' }} onClick={syncForms}>
              <i className="ti ti-refresh" style={{ fontSize: 14 }}></i>
            </span>
          </div>

          <div className="grid2" style={{ marginBottom: 12 }}>
            <div className="metric" onClick={() => go('members')}>
              <span className="up">총 부원</span>
              <div className="val">{memC}<span style={{ fontSize: 13, fontWeight: 300, color: 'var(--muted)' }}>명</span></div>
            </div>
            <div className="metric">
              <span className="up">회비 납부율</span>
              <div className="val" style={{ color: 'var(--blue)' }}>87<span style={{ fontSize: 13, fontWeight: 300 }}>%</span></div>
            </div>
            <div className="metric" onClick={() => { go('input'); setTab('exp'); }}>
              <span className="up">이번 달 지출</span>
              <div className="val">320<span style={{ fontSize: 13, fontWeight: 300, color: 'var(--muted)' }}>K</span></div>
            </div>
            <div className="metric" onClick={() => { go('input'); setTab('exp'); }}>
              <span className="up">미처리 증빙</span>
              <div className="val" style={{ color: 'var(--warn)' }}>3<span style={{ fontSize: 13, fontWeight: 300 }}>건</span></div>
            </div>
          </div>

          <div className="card" onClick={() => go('drive')} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ marginBottom: 0 }}><i className="ti ti-brand-google-drive" style={{ color: 'var(--gdrive)', fontSize: 16, verticalAlign: -2, marginRight: 6 }}></i>Google Drive</h3>
              <span className="badge badge-ok">연결됨</span>
            </div>
            <div className="file-i" style={{ padding: '8px 0', border: 'none' }}>
              <div className="file-icon" style={{ color: 'var(--blue)' }}><i className="ti ti-folder"></i></div>
              <div className="file-info"><div className="file-name">HELIOS 2026-1</div><div className="file-meta">파일 23개 · 1.2 GB</div></div>
              <i className="ti ti-chevron-right" style={{ color: 'var(--muted)', fontSize: 16 }}></i>
            </div>
          </div>

          <div className="card">
            <h3>다가오는 일정</h3>
            {[
              { color: 'var(--blue)', name: '정기회의', date: '06/02 18:00' },
              { color: 'var(--warn)', name: '로켓 발사 테스트', date: '06/10 14:00' },
              { color: 'var(--ok)', name: '신입 부원 OT', date: '06/15 10:00' },
            ].map((s, i) => (
              <div className="sch-i" key={i}>
                <div className="sch-dot" style={{ background: s.color }}></div>
                <div className="sch-t">{s.name}</div>
                <div className="sch-d">{s.date}</div>
              </div>
            ))}
          </div>
          <button className="btn btn-ghost" onClick={() => go('input')} style={{ marginTop: 4 }}>
            <i className="ti ti-plus" style={{ fontSize: 18 }}></i> 새 기록 추가
          </button>
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

        {/* ════════ INPUT ════════ */}
        <div className={`scr ${screen === 'input' ? 'on' : ''}`}>
          <h2>기록 관리</h2>
          <div className="tabs">
            {[['form','폼 연동','ti-forms'],['mem','부원 등록',''],['exp','지출 등록','']].map(([key, label, icon]) => (
              <button key={key} className={`tab ${tab === key ? 'on' : ''}`} onClick={() => setTab(key)}>
                {icon && <i className={`ti ${icon}`} style={{ fontSize: 14, verticalAlign: -2, marginRight: 2 }}></i>}
                {label}
              </button>
            ))}
          </div>

          {tab === 'form' && (
            <div>
              <div className="sync-bar"><i className="ti ti-brand-google" style={{ fontSize: 16 }}></i><span>Google Forms 연동</span></div>
              <div className="inp-g">
                <label className="inp-l">Google Form URL</label>
                <input className="inp" placeholder="https://docs.google.com/forms/..." defaultValue="https://docs.google.com/forms/d/1xH3..." />
              </div>
              <button className="btn btn-fill btn-sm" onClick={loadForm} style={{ width: '100%', marginBottom: 16 }}>
                <i className="ti ti-refresh" style={{ fontSize: 16 }}></i> 응답 불러오기
              </button>

              {formLoaded ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <h3 style={{ margin: 0 }}>신규 응답 <span style={{ color: 'var(--blue)' }}>{checks.filter(Boolean).length}</span>건</h3>
                    <span className="cap">2026.06.11 기준</span>
                  </div>
                  <div className="card" style={{ padding: '12px 16px' }}>
                    {MOCK_IMPORTS.map((m, i) => (
                      <div className="import-row" key={i}>
                        <div className={`check ${checks[i] ? 'on' : ''}`} onClick={() => toggleCheck(i)}>
                          {checks[i] && <i className="ti ti-check"></i>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 400 }}>{m.name}</div>
                          <div className="cap">{m.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-fill" onClick={importMembers} style={{ marginTop: 12 }}>
                    <i className="ti ti-download" style={{ fontSize: 16 }}></i> 선택 부원 일괄 등록
                  </button>
                  <div className="cap" style={{ textAlign: 'center', marginTop: 8 }}>자동 동기화는 1시간 간격으로 실행됩니다</div>
                </div>
              ) : (
                <div className="card" style={{ textAlign: 'center', padding: '32px 20px', borderStyle: 'dashed' }}>
                  <i className="ti ti-forms" style={{ fontSize: 32, color: 'var(--blue)', display: 'block', marginBottom: 8 }}></i>
                  <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Google Form 연결</div>
                  <div className="cap">신입부원 모집 폼 URL을 입력하고<br/>&quot;응답 불러오기&quot;를 눌러주세요</div>
                </div>
              )}
            </div>
          )}

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
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="inp" placeholder="파일을 선택하세요" style={{ flex: 1 }} disabled />
                  <button className="btn btn-drive btn-sm" onClick={() => showToast('Google Drive에서 선택...')}><i className="ti ti-brand-google-drive" style={{ fontSize: 16 }}></i></button>
                </div>
              </div>
              <button className="btn btn-fill" onClick={saveExp}>증빙 등록</button>
            </div>
          )}
        </div>

        {/* ════════ GOOGLE DRIVE ════════ */}
        <div className={`scr ${screen === 'drive' ? 'on' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0 }} onClick={() => go('home')}>
              <i className="ti ti-arrow-left" style={{ fontSize: 22 }}></i>
            </button>
            <h2 style={{ margin: 0 }}>Google Drive</h2>
          </div>
          <div className="up" style={{ marginBottom: 16 }}>HELIOS 2026-1 공유 드라이브</div>
          <div className="stripe"></div>
          <div className="sync-bar"><i className="ti ti-brand-google-drive" style={{ fontSize: 16, color: 'var(--gdrive)' }}></i><span style={{ color: 'var(--gdrive)' }}>동기화 완료 · 23개 파일 · 1.2 GB</span></div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button className="btn btn-fill btn-sm" style={{ flex: 1 }} onClick={() => showToast('Google Drive에 업로드...')}><i className="ti ti-upload" style={{ fontSize: 14 }}></i> 업로드</button>
            <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => showToast('새 폴더 생성...')}><i className="ti ti-folder-plus" style={{ fontSize: 14 }}></i> 새 폴더</button>
          </div>
          <div className="card" style={{ padding: '12px 16px' }}>
            <h3>폴더</h3>
            {[
              { name: '회의록', meta: '파일 8개', badge: null },
              { name: '회계 증빙', meta: '파일 12개 · 자동 분류', badge: '자동' },
              { name: '프로젝트 자료', meta: '파일 3개', badge: null },
            ].map((f, i) => (
              <div className="file-i" key={i}>
                <div className="file-icon" style={{ color: 'var(--blue)' }}><i className="ti ti-folder"></i></div>
                <div className="file-info"><div className="file-name">{f.name}</div><div className="file-meta">{f.meta}</div></div>
                {f.badge ? <span className="badge badge-g" style={{ fontSize: 9 }}>{f.badge}</span> : <i className="ti ti-chevron-right" style={{ color: 'var(--muted)', fontSize: 16 }}></i>}
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: '12px 16px' }}>
            <h3>최근 파일</h3>
            {[
              { icon: 'ti-file-spreadsheet', color: 'var(--ok)', name: '2026_1학기_예산.xlsx', meta: '340 KB · 2시간 전' },
              { icon: 'ti-file-text', color: 'var(--blue)', name: '정기회의_0528_회의록.docx', meta: '128 KB · 3일 전' },
              { icon: 'ti-photo', color: 'var(--warn)', name: '영수증_부품구매_0525.jpg', meta: '2.1 MB · 5일 전' },
              { icon: 'ti-file-text', color: 'var(--muted)', name: '발사테스트_체크리스트.pdf', meta: '89 KB · 1주 전' },
            ].map((f, i) => (
              <div className="file-i" key={i}>
                <div className="file-icon" style={{ color: f.color }}><i className={`ti ${f.icon}`}></i></div>
                <div className="file-info"><div className="file-name">{f.name}</div><div className="file-meta">{f.meta}</div></div>
              </div>
            ))}
          </div>
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
          <div className="cap" style={{ textAlign: 'center', marginBottom: 12 }}>상시 기록 + Google Drive 기반 자동 생성</div>

          {pkgOpen && (
            <div>
              <div className="stripe"></div>
              <div className="card">
                <h3>인수인계 패키지</h3>
                {[
                  { icon: 'ti-users', label: `부원 현황 (${memC}명)` },
                  { icon: 'ti-receipt', label: '회계 장부' },
                  { icon: 'ti-brand-google-drive', label: 'Drive 자료 (23개)', iconColor: 'var(--gdrive)' },
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
                <div><div className="pro-name">{user.name}</div><div className="pro-role">HELIOS {user.generation} · 총무</div></div>
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
                  <div className="pro-edit-label">학번</div>
                  <div className="pro-edit-value">{user.studentId}</div>
                </div>
                <div className="pro-edit-row">
                  <div className="pro-edit-label">학과</div>
                  <div className="pro-edit-value">{user.department}</div>
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
                  <div className="pro-edit-label">기수</div>
                  <div className="pro-edit-value">{user.generation}</div>
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
                <h3 style={{ paddingTop: 16 }}>연동 서비스</h3>
                {[['ti-brand-google','Google 계정','--google'],['ti-brand-google-drive','Google Drive','--gdrive'],['ti-forms','Google Forms','--google']].map(([icon, label, cv]) => (
                  <div className="menu-i" key={label}><div className="menu-l"><i className={`ti ${icon}`} style={{ color: `var(${cv})` }}></i> {label}</div><span className="badge badge-ok">연결됨</span></div>
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

      {/* ════════ TOAST ════════ */}
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}
