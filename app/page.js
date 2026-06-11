'use client';

import { useState, useRef } from 'react';

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

const MOCK_IMPORTS = [
  { name: '김하늘', detail: '7기 · 구조 팀 · 010-1234-5678' },
  { name: '이준호', detail: '7기 · 전자 팀 · 010-2345-6789' },
  { name: '박서윤', detail: '7기 · 추진체 팀 · 010-3456-7890' },
];

export default function Home() {
  const [screen, setScreen] = useState('onboard');
  const [tab, setTab] = useState('form');
  const [toast, setToast] = useState('');
  const [logC, setLogC] = useState(12);
  const [rcptC, setRcptC] = useState(8);
  const [memC, setMemC] = useState(42);
  const [formLoaded, setFormLoaded] = useState(false);
  const [checks, setChecks] = useState([true, true, true]);
  const [pkgOpen, setPkgOpen] = useState(false);
  const [syncText, setSyncText] = useState('Google Forms · 마지막 동기화: 5분 전');
  const [syncing, setSyncing] = useState(false);
  const areaRef = useRef(null);

  const [fName, setFName] = useState('');
  const [fGen, setFGen] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fRole, setFRole] = useState('');
  const [fTeam, setFTeam] = useState('');
  const [fCat, setFCat] = useState('');
  const [fAmt, setFAmt] = useState('');
  const [fMemo, setFMemo] = useState('');

  function go(id) {
    setScreen(id);
    if (areaRef.current) areaRef.current.scrollTop = 0;
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  }

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

  function importMembers() {
    const count = checks.filter(Boolean).length;
    if (count === 0) { showToast('선택된 부원이 없습니다'); return; }
    setMemC(prev => prev + count);
    setLogC(prev => prev + count);
    showToast(`${count}명 일괄 등록 완료`);
    setTimeout(() => { setFormLoaded(false); go('home'); }, 1500);
  }

  function saveMem() {
    if (!fName) { showToast('이름을 입력해주세요'); return; }
    setMemC(prev => prev + 1);
    setLogC(prev => prev + 1);
    showToast(`${fName} 부원 등록 완료`);
    setFName(''); setFGen(''); setFPhone(''); setFRole(''); setFTeam('');
    setTimeout(() => go('home'), 1200);
  }

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

  const navMap = { home: 'home', input: 'input', report: 'report', my: 'my', drive: 'home' };
  const activeNav = navMap[screen] || screen;
  const showNav = screen !== 'onboard';

  return (
    <div className="shell">
      <div className="area" ref={areaRef}>

        {/* ONBOARDING */}
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
            <button className="btn btn-google" style={{ maxWidth: 300, marginBottom: 10 }} onClick={() => go('home')}>
              <GoogleIcon />Google 계정으로 시작
            </button>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>
              이미 동아리가 있나요? <span style={{ color: 'var(--blue)', cursor: 'pointer' }}>코드로 참여</span>
            </p>
          </div>
        </div>

        {/* HOME */}
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
            <div className="metric" onClick={() => { go('input'); setTab('form'); }}>
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

        {/* INPUT */}
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
              <div className="cap" style={{ marginBottom: 12 }}><i className="ti ti-info-circle" style={{ fontSize: 14, verticalAlign: -2 }}></i> Google Forms 연동 시 자동 등록됩니다. 수동 등록은 보조 수단입니다.</div>
              <div className="inp-g"><label className="inp-l">이름</label><input className="inp" placeholder="홍길동" value={fName} onChange={e => setFName(e.target.value)} /></div>
              <div className="inp-g"><label className="inp-l">기수</label><select className="inp" value={fGen} onChange={e => setFGen(e.target.value)}><option value="">선택</option><option>7기 (2026)</option><option>6기 (2025)</option><option>5기 (2024)</option></select></div>
              <div className="inp-g"><label className="inp-l">연락처</label><input className="inp" placeholder="010-0000-0000" value={fPhone} onChange={e => setFPhone(e.target.value)} /></div>
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

        {/* GOOGLE DRIVE */}
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

        {/* REPORT */}
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

        {/* MYPAGE */}
        <div className={`scr ${screen === 'my' ? 'on' : ''}`}>
          <div className="pro-row">
            <div className="avatar">O</div>
            <div><div className="pro-name">OOO</div><div className="pro-role">HELIOS 7기 · 총무</div></div>
          </div>
          <div className="stripe"></div>
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
            <div className="menu-i" onClick={() => go('onboard')}>
              <div className="menu-l"><i className="ti ti-logout" style={{ color: 'var(--warn)' }}></i> <span style={{ color: 'var(--warn)' }}>로그아웃</span></div>
              <i className="ti ti-chevron-right menu-r"></i>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM NAV */}
      {showNav && (
        <div className="nav">
          {[['home','홈','ti-home'],['input','기록','ti-plus'],['report','리포트','ti-chart-bar'],['my','내 정보','ti-user']].map(([key, label, icon]) => (
            <div key={key} className={`nav-i ${activeNav === key ? 'on' : ''}`} onClick={() => go(key)}>
              <i className={`ti ${icon}`}></i><span>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* TOAST */}
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}
