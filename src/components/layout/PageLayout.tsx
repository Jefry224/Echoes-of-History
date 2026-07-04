import type { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
}

export function PageLayout({ children, title }: PageLayoutProps) {
  return (
    <div className="page-layout">
      <header className="page-header">
        <nav className="nav-container">
          <a href="/" className="nav-logo">
            Echoes of History
          </a>
          <ul className="nav-links">
            <li><a href="/">Home</a></li>
          </ul>
        </nav>
      </header>

      <main className="page-main">
        {title && <h1 className="page-title">{title}</h1>}
        {children}
      </main>

      <footer className="page-footer">
        <p>© {new Date().getFullYear()} Echoes of History. All rights reserved.</p>
      </footer>
    </div>
  );
}
