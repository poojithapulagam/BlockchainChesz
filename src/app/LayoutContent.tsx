'use client';

import { usePathname } from 'next/navigation';
import Header from "../components/Header";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isRoomPage = pathname?.startsWith('/room');

  return (
    <div className="min-h-screen">
      {!isRoomPage && (
        <>
          <Header />
        </>
      )}
      {children}
    </div>
  );
} 