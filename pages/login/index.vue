<template>
  <div class="login-container">
    <div class="login-card animate-fade-in">
      <div class="logo-container">
        <img src="/images/npblue.png" alt="Nusantara Power" class="login-logo" />
      </div>
      
      <div class="login-header">
        <h2 class="app-title">Aplikasi Preventive Maintenance</h2>
        <p class="app-subtitle">PLTD Tahuna</p>
      </div>
      
      <div class="login-action">
        <p class="login-instruction">Sign in to access the dashboard</p>
        
        <a href="/auth/google" class="btn-google">
          <span class="icon-google">
            <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
              </g>
            </svg>
          </span>
          Sign in with Google
        </a>
      </div>
      
      <div class="login-footer">
        &copy; 2024 PLN Nusantara Power
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const route = useRoute()

onMounted(() => {
  if (route.query.error) {
    showAlert('Login failed: ' + route.query.error, 'error')
  }
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  min-height: 100dvh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-base);
  position: relative;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: 
    radial-gradient(ellipse at 20% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(34, 211, 238, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 80%, rgba(168, 85, 247, 0.08) 0%, transparent 50%);
  animation: bgPulse 8s ease-in-out infinite alternate;
  z-index: 0;
}

@keyframes bgPulse {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(-2%, 2%) scale(1.05); }
}

.login-container::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image: 
    radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.15) 0%, transparent 100%),
    radial-gradient(1px 1px at 40% 70%, rgba(255,255,255,0.1) 0%, transparent 100%),
    radial-gradient(1px 1px at 80% 30%, rgba(255,255,255,0.12) 0%, transparent 100%),
    radial-gradient(1px 1px at 60% 90%, rgba(255,255,255,0.08) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 25% 55%, rgba(99,102,241,0.2) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 75% 45%, rgba(34,211,238,0.15) 0%, transparent 100%);
  z-index: 0;
}

.login-card {
  position: relative;
  z-index: 2;
  background: rgba(30, 30, 48, 0.6);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 2.5rem;
  border-radius: 1.5rem;
  width: 100%;
  max-width: 400px;
  margin: 1rem;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.logo-container { margin-bottom: 1.5rem; display: flex; justify-content: center; }
.login-logo { height: 56px; object-fit: contain; filter: brightness(1.1); }
.login-header { margin-bottom: 2rem; }
.app-title { font-size: 1.5rem; font-weight: 800; color: #f1f5f9; margin: 0; line-height: 1.2; letter-spacing: -0.02em; }
.app-subtitle { font-size: 0.9rem; color: #94a3b8; margin-top: 0.4rem; font-weight: 400; }
.login-action { margin-bottom: 2rem; }
.login-instruction { font-size: 0.85rem; color: #64748b; margin-bottom: 1.25rem; }

.btn-google {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.85rem 1rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  cursor: pointer;
}

.btn-google:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.btn-google:active { transform: translateY(0) scale(0.98); }
.icon-google { margin-right: 0.75rem; display: flex; }
.login-footer { font-size: 0.7rem; color: #475569; margin-top: 2rem; letter-spacing: 0.02em; }

@keyframes loginFadeIn {
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (max-width: 480px) {
  .login-card { padding: 2rem 1.5rem; margin: 0.75rem; border-radius: 1.25rem; }
  .app-title { font-size: 1.35rem; }
}
</style>
