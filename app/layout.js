import './globals.css';

export const metadata = {
  title: '동무 — 동아리 총무',
  description: '동아리 운영의 모든 것을 하나의 앱으로 통합 관리',
};

export default function RootLayout({ children }) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return (
    <html lang="ko">
      <head>
        <link rel="preload" href={`${base}/fonts/tabler-icons.woff2?v3.6.0`} as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="stylesheet" href={`${base}/fonts/tabler-icons.css`} />
      </head>
      <body>{children}</body>
    </html>
  );
}
