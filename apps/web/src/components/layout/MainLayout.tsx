import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header title={title} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
