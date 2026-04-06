import { onMount } from "solid-js";
import { useNavigate, useSearchParams } from "@solidjs/router";
import Cookies from "js-cookie";

export default function LoginSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  onMount(() => {
    const token = searchParams.token;
    if (token) {
        Cookies.set('auth_token', typeof token === 'string' ? token : token[0], { expires: 1 });
        navigate('/', { replace: true });
    } else {
        navigate('/login', { replace: true });
    }
  });

  return (
    <div class="auth-container" style="background: var(--gray-100); flex-direction: column;">
      <div class="spinner spinner-lg mb-4"></div>
      <h2 class="text-gray-800">Completing login...</h2>
      <p class="text-gray-500">Please wait while we redirect you.</p>
    </div>
  );
}
