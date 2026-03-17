import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Calculator',
  description: 'A fully functional calculator with history',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 min-h-screen">{children}</body>
    </html>
  );
}
