<template>
  <div class="login-container">
    <div class="login-card animate-fade-in">
      <div class="logo-container">
        <img src="/images/npblue.png" alt="Nusantara Power" class="login-logo text-black" />
      </div>
      
      <div class="login-header">
        <h2 class="app-title">Preventive Maintenance</h2>
        <p class="app-subtitle">PLTD Tahuna</p>
      </div>
      
      <div class="login-action">
        <p class="login-instruction">Sign in to access the dashboard</p>
        
        <a 
          href="http://localhost:3002/auth/google" 
          class="btn-google"
        >
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

<script setup>
import { onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

onMounted(() => {
    // Check if we have an error
    if (route.query.error) {
        alert('Login failed: ' + route.query.error);
    }
});
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: url('/images/bg.png');
  background-size: cover;
  background-position: center;
  position: relative;
}

/* Semi-transparent overlay to improve text contrast if needed */
.login-container::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1;
}

.login-card {
  position: relative;
  z-index: 2;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 3rem;
  border-radius: 1.5rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  text-align: center;
}

.logo-container {
  margin-bottom: 2rem;
  display: flex;
  justify-content: center;
}

.login-logo {
  height: 60px;
  object-fit: contain;
  /* If original image is white and card is white, we might need inversion or specific bg. 
     The user requested npwhite.png usually for dark headers. 
     If it's invisible on white card, let's invert it or add background. 
     Let's use a filter to make it visible on white card or just assume it has adequate contrast 
     (e.g. if it's the blue/orange logo but filename is npwhite?). 
     Actually if filename is npwhite, it's likely white text. 
     Let's add a blue background container for the logo or filter it.
  */
}

/* Wait, cleaner design usually implies simple. If logo is strictly white, maybe we place it on a colored header part?
   Let's keep it simple. If filter fails, we can adjust.
*/

.login-header {
  margin-bottom: 2.5rem;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1f2937;
  margin: 0;
  line-height: 1.2;
}

.app-subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

.login-action {
  margin-bottom: 2rem;
}

.login-instruction {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.btn-google {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s;
  text-decoration: none;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.btn-google:hover {
  background-color: #f9fafb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.icon-google {
  margin-right: 0.75rem;
  display: flex;
}

.login-footer {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 2rem;
}
</style>
