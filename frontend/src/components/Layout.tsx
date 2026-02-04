import { Outlet, Link } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            📚 Quiz App
          </Link>
          <nav>
            <Link to="/admin" className="nav-link">
              Admin Panel
            </Link>
          </nav>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
