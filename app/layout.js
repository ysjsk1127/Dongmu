import './globals.css';

export const metadata = {
  title: '동무 — 동아리 총무',
  description: '동아리 운영의 모든 것을 하나의 앱으로 통합 관리',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="/fonts/tabler-icons.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
