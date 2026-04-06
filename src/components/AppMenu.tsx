import { A, useLocation } from "@solidjs/router";
import "./AppMenu.css";

export default function AppMenu() {
  const location = useLocation();

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div class="app-menu">
      <div class="menu-content">
        <A 
          href="/" 
          class="menu-item" 
          classList={{ active: isActive('/', true) }}
        >
          <span class="menu-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </span>
          <span class="menu-item-label">Jadwal</span>
        </A>
        
        <A 
          href="/realisasi" 
          class="menu-item"
          classList={{ active: isActive('/realisasi') }}
        >
          <span class="menu-item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </span>
          <span class="menu-item-label">Realisasi</span>
        </A>
      </div>
    </div>
  );
}
