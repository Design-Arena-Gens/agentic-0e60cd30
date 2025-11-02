import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DesignArena.ai ? AI vs AI Design Battle',
  description: 'Vote. Compare. Discover. Where AIs Compete, Creativity Wins.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
