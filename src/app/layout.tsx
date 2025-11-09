import type { Metadata } from 'next';
import { MenuLayout } from './MenuLayout';
import { unauthenticated_currentSoldier } from './actions';
import './globals.css';
import { AntDesignRegistry } from './registry';

export const metadata: Metadata = {
  title: '9탄약창 상벌점 관리',
  description: '제9탄약창 상벌점 관리 시스템',
  authors: { name: '탄약 2소대장 임채환' },
};

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1.0,
    userScalable: 'no',
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await unauthenticated_currentSoldier();
  return (
    <html lang="ko">
      <body>
        <AntDesignRegistry>
          <MenuLayout data={data}>{children}</MenuLayout>
        </AntDesignRegistry>
      </body>
    </html>
  );
}
