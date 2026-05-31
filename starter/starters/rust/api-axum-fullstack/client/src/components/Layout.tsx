import { useState } from 'react'
import { NavLink } from 'react-router-dom'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <a href="/" className="sidebar-logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
              <path d="M31.956 14.8C31.372 6.92 25.08.628 17.2.044V5.76a9.04 9.04 0 0 0 9.04 9.04h5.716ZM14.8 26.24v5.716C6.92 31.372.63 25.08.044 17.2H5.76a9.04 9.04 0 0 1 9.04 9.04Zm11.44-9.04h5.716c-.584 7.88-6.876 14.172-14.756 14.756V26.24a9.04 9.04 0 0 1 9.04-9.04ZM.044 14.8C.63 6.92 6.92.628 14.8.044V5.76a9.04 9.04 0 0 1-9.04 9.04H.044Z" />
            </svg>
            <span>Micropost</span>
          </a>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <NavLink to="/" onClick={() => setSidebarOpen(false)} end>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 .95 1 6.5V15h4.5V9.5h5V15H15V6.5L8 .95Z" />
                </svg>
                <span>トップ</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/microposts" onClick={() => setSidebarOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M2 1h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1Zm1 2v4h10V3H3Zm0 6v4h4V9H3Zm6 0v4h4V9H9Z" />
                </svg>
                <span>Microposts</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/about" onClick={() => setSidebarOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Zm0 3a1.25 1.25 0 1 1 0 2.5A1.25 1.25 0 0 1 8 3ZM6.5 6.5h2v6h1v1h-4v-1h1v-5h-1v-1h1Z" />
                </svg>
                <span>About</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/health" onClick={() => setSidebarOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Zm-.5 3h1v5.5l3.5 2.1-.5.9L7.5 9V3Z" />
                </svg>
                <span>ヘルスチェック</span>
              </NavLink>
            </li>
          </ul>
        </nav>
        <div className="sidebar-footer">
          <small>Rust + Axum + React</small>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-area">
        <header className="topbar">
          <button
            className="hamburger"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <h1 className="topbar-title">Starter</h1>
        </header>
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  )
}
