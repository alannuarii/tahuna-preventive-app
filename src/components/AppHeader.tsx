import { A, useLocation } from "@solidjs/router";
import { createSignal, onMount } from "solid-js";
import { getUser, logout } from "~/lib/auth";
import "./AppHeader.css";

export default function AppHeader() {
  const location = useLocation();
  const [user, setUser] = createSignal<any>({});
  const [imgError, setImgError] = createSignal(false);

  onMount(() => {
    const u = getUser();
    if (u) setUser(u);
  });

  const UserContent = () => (
    <>
      <div class="user-info">
        <div class="header-user-avatar">
          {user().picture && !imgError() ? (
            <img 
              src={user().picture} 
              alt="User" 
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            <span>{(user().name || 'U').charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div class="user-details">
          <span class="header-user-name">{user().name || 'User'}</span>
          <span class="header-user-role">Preventive Maintenance</span>
        </div>
      </div>
      <button class="btn-logout" onClick={() => logout()} title="Sign Out">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </>
  );

  return (
    <>
      <header class="app-header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-brand">
            <img src="/images/npwhite.png" alt="PLTD Tahuna" class="logo-img" />
          </div>
          <div class="header-title">
            <span class="header-app-name">Aplikasi Preventive Maintenance PLTD Tahuna</span>
          </div>
        </div>
        
        <div class="header-user mobile-header-user">
          <UserContent />
        </div>
      </div>
    </header>

    <div class="header-user desktop-header-user">
      <UserContent />
    </div>
  </>
  );
}
